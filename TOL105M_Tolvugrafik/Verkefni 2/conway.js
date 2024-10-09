var canvas;
var gl;

var points = [];
var colors = [];
var NumVertices = 36;

// For user camera controls, rotation
var movement = false;
var spinX = 30;
var spinY = -130;
var spinZ = 0;
var origX;
var origY;
// Universal scale, for zooming
var scaleXYZ = 1;

// Key codes
var KEY_CODES = {
    A: 65,
    D: 68,
    E: 69,
    Q: 81,
    S: 83,
    W: 87,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

// Hashmap of keycode to boolean keydown state
var keys = [];

// Variables for uniform variables
var viewMatrixLoc;
var posOffsetLoc;
var scaleLoc;
var rowLoc;

// Grid will be (R x R x R) where R=numRows
var numRows = 10;
var grid;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.15, 0.15, 0.15, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CW);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Fetch uniform locations
    viewMatrixLoc = gl.getUniformLocation(program, "view_matrix");
    posOffsetLoc = gl.getUniformLocation(program, "pos_offset");
    scaleLoc = gl.getUniformLocation(program, "scale");
    rowLoc = gl.getUniformLocation(program, "rows");

    // Create grid manager
    grid = Grid(numRows);
    grid.init();

    createKeyboardMouseListeners();

    // Set-up slider for grid-size
    document.getElementById("slider").onchange = function (event) {
        numRows = event.target.value;
        document.getElementById("slider-value").textContent = numRows;
        grid = Grid(numRows);
        grid.init();
    };

    // Attach Repopulate button
    document.getElementById("repopulate-button").onclick = function (event) {
        grid.Repopulate();
    };

    render();
};

function Timer() {
    const T_MIN = 0.0;
    const T_MAX = 1.0;
    const dt = 0.0004;
    var t = T_MAX;

    const COOLDOWN_MAX = 1.0;
    const dcd = 0.0005;
    var t_cooldown = 0.0;

    var now = window.performance.now();
    var last = now;

    var frameHistory = new Array(40);
    var fhStart = 0;
    var fhEnd = 99;
    var fpsElement = document.getElementById('fps-counter');

    function tick() {
        now = window.performance.now();
        var delta = (now - last);

        if (t_cooldown > 0) {
            t_cooldown -= delta * dcd;
        } else {
            t -= delta * dt;
        }
        t = t < 0 ? 0 : t;
        last = now;

        fhStart = (fhStart + 1) % 100;
        fhEnd = (fhEnd + 1) % 100;
        frameHistory[fhEnd] = now;
        fpsElement.textContent = Math.ceil(1000.0 * frameHistory.length / (now - frameHistory[fhStart]));
    }

    function done() {
        return t <= T_MIN;
    }

    function cooldown() {
        t = T_MAX;
        t_cooldown = COOLDOWN_MAX;
    }

    return {
        t: function () { return t; },
        cooldown: cooldown,
        tick: tick,
        done: done
    };
}

function Grid(numRows) {
    var rows = numRows;
    var grid = [];
    var grid_secondary = [];

    var cubeFill = 0.88;
    var timer = Timer();

    const ENV_MIN = 5;
    const ENV_MAX = 7;
    const FERT_MIN = 6;
    const FERT_MAX = 6;

    const state = {
        DEAD: 0,
        DYING: 1,
        GROWING: 2,
        ADULT: 3
    };

    var stacks = {};
    stacks[state.DYING] = [];
    stacks[state.GROWING] = [];
    stacks[state.ADULT] = [];

    function init() {
        for (var i = 0; i < rows; i++) {
            grid[i] = [];
            grid_secondary[i] = [];
            for (var j = 0; j < rows; j++) {
                grid[i][j] = [];
                grid_secondary[i][j] = [];
                for (var k = 0; k < rows; k++) {
                    var isAlive = Math.random() > 0.78;
                    grid[i][j][k] = isAlive ? state.GROWING : state.DEAD;
                    if (isAlive)
                        stacks[state.GROWING].push([i, j, k]);
                    grid_secondary[i][j][k] = state.DEAD;
                }
            }
        }
        gl.uniform1f(rowLoc, numRows);
    }

    function Repopulate() {
        grid = [];
        grid_secondary = [];
        stacks[state.DYING] = [];
        stacks[state.GROWING] = [];
        stacks[state.ADULT] = [];
        init();
    }

    function calculateNeighbours() {
        var neighbours = grid_secondary;
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < rows; j++) {
                for (var k = 0; k < rows; k++) {
                    neighbours[i][j][k] = 0;

                    if (grid[i][j][k] == state.GROWING) grid[i][j][k] = state.ADULT;
                    if (grid[i][j][k] == state.DYING) grid[i][j][k] = state.DEAD;

                    for (var di = -1; di <= 1; di++) {
                        for (var dj = -1; dj <= 1; dj++) {
                            for (var dk = -1; dk <= 1; dk++) {
                                if (i + di < 0 || j + dj < 0 || k + dk < 0) continue;
                                if (i + di >= rows || j + dj >= rows || k + dk >= rows) continue;
                                if (di == 0 && dj == 0 && dk == 0) continue;

                                var neighbour = grid[i + di][j + dj][k + dk];
                                if (neighbour == state.ADULT || neighbour == state.GROWING)
                                    neighbours[i][j][k] += 1;
                            }
                        }
                    }
                }
            }
        }
    }

    function calculateCellStates() {
        stacks[state.ADULT] = [];
        stacks[state.DYING] = [];
        stacks[state.GROWING] = [];
        var nextGrid = grid_secondary;

        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < rows; j++) {
                for (var k = 0; k < rows; k++) {
                    var n = nextGrid[i][j][k];
                    var prev = grid[i][j][k];

                    if (prev == state.ADULT) {
                        if (n < ENV_MIN || ENV_MAX < n) {
                            nextGrid[i][j][k] = state.DYING;
                            stacks[state.DYING].push([i, j, k]);
                        } else {
                            nextGrid[i][j][k] = state.ADULT;
                            stacks[state.ADULT].push([i, j, k]);
                        }
                    } else if (prev == state.DEAD) {
                        if (FERT_MIN <= n && n <= FERT_MAX) {
                            nextGrid[i][j][k] = state.GROWING;
                            stacks[state.GROWING].push([i, j, k]);
                        } else {
                            nextGrid[i][j][k] = state.DEAD;
                        }
                    }
                }
            }
        }
    }

    function update() {
        timer.tick();
        if (timer.done()) {
            calculateNeighbours();
            calculateCellStates();
            timer.cooldown();
            grid_secondary = grid;
            grid = grid_secondary;
        }
    }

    function render(wtm) {
        gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(wtm));
        var s = cubeFill / rows;
        var t = timer.t();

        gl.uniform1f(scaleLoc, s * t);
        for (var i = 0; i < stacks[state.DYING].length; i++) {
            gl.uniform3fv(posOffsetLoc, flatten(stacks[state.DYING][i]));
            gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
        }

        gl.uniform1f(scaleLoc, s * (1 - t));
        for (var i = 0; i < stacks[state.GROWING].length; i++) {
            gl.uniform3fv(posOffsetLoc, flatten(stacks[state.GROWING][i]));
            gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
        }

        gl.uniform1f(scaleLoc, s);
        for (var i = 0; i < stacks[state.ADULT].length; i++) {
            gl.uniform3fv(posOffsetLoc, flatten(stacks[state.ADULT][i]));
            gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
        }
    }

    return {
        init: init,
        update: update,
        render: render,
        Repopulate: Repopulate
    };
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    checkKeys();

    var viewMatrix = mat4();
    viewMatrix = mult(viewMatrix, scalem(scaleXYZ, scaleXYZ, scaleXYZ));
    viewMatrix = mult(viewMatrix, rotateX(spinX));
    viewMatrix = mult(viewMatrix, rotateY(spinY));
    viewMatrix = mult(viewMatrix, rotateZ(spinZ));

    grid.update();
    grid.render(viewMatrix);

    requestAnimFrame(render);
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
    var vertices = [
        vec4(-0.5, -0.5, 0.5, 1),
        vec4(-0.5, 0.5, 0.5, 1),
        vec4(0.5, 0.5, 0.5, 1),
        vec4(0.5, -0.5, 0.5, 1),
        vec4(-0.5, -0.5, -0.5, 1),
        vec4(-0.5, 0.5, -0.5, 1),
        vec4(0.5, 0.5, -0.5, 1),
        vec4(0.5, -0.5, -0.5, 1)
    ];

    var vertexColors = [
        [0.0, 0.0, 0.0, 1.0],
        [0.9, 0.0, 0.0, 1.0],
        [0.9, 0.9, 0.0, 1.0],
        [0.0, 0.9, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [0.5, 0.0, 0.5, 1.0],
        [0.0, 0.9, 0.9, 1.0],
        [0.9, 0.9, 0.9, 1.0]
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push(vertexColors[a]);
    }
}

var createKeyboardMouseListeners = function () {
    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            spinY = (spinY + (e.offsetX - origX)) % 360;
            spinX = (spinX + (e.offsetY - origY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });

    canvas.addEventListener("mousewheel", function (e) {
        if (e.deltaY > 0) {
            scaleXYZ *= 0.85;
        } else if (e.deltaY < 0) {
            scaleXYZ *= 1.15;
        }
        e.preventDefault();
    });

    window.addEventListener("keydown", function (e) {
        keys[e.keyCode] = true;
    });
    window.addEventListener("keyup", function (e) {
        keys[e.keyCode] = false;
    });
};

var checkKeys = function () {
    var d = 2;
    if (keys[KEY_CODES.A] || keys[KEY_CODES.LEFT]) {
        spinY = (spinY + d) % 360;
    }
    if (keys[KEY_CODES.D] || keys[KEY_CODES.RIGHT]) {
        spinY = (spinY - d) % 360;
    }
    if (keys[KEY_CODES.W] || keys[KEY_CODES.UP]) {
        spinX = (spinX + d) % 360;
    }
    if (keys[KEY_CODES.S] || keys[KEY_CODES.DOWN]) {
        spinX = (spinX - d) % 360;
    }
    if (keys[KEY_CODES.Q]) {
        spinZ = (spinZ - d) % 360;
    }
    if (keys[KEY_CODES.E]) {
        spinZ = (spinZ + d) % 360;
    }
};
