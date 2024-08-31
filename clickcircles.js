/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Teiknar hring með slembinni stærð á strigann þar sem
//     notandinn smellir með músinni
//
//    Ingólfur Bjarni Elíasson, ágúst 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// Maximum number of points (circles)
var maxNumCircles = 200;
var index = 0;

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 1.0, 1.0, 1.0);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumCircles * 50, gl.DYNAMIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("mousedown", function(e){
        // Calculate coordinates of new point
        var t = vec2(2 * e.offsetX / canvas.width - 1, 2 * (canvas.height - e.offsetY) / canvas.height - 1);

        // Generate random radius
        var radius = Math.random() * 0.3 + 0.02; // Radius will vary between 0.02 and 0.32

        // Create the circle points and add them to the buffer
        createCircle(t, radius);

        index++;
    });

    render();
}

// Function to create a circle
function createCircle(center, radius) {
    var numCirclePoints = 50; // Number of points used to approximate the circle
    var points = [center];

    for (var i = 0; i <= numCirclePoints; i++) {
        var angle = i * 2 * Math.PI / numCirclePoints;
        var x = center[0] + radius * Math.cos(angle);
        var y = center[1] + radius * Math.sin(angle);
        points.push(vec2(x, y));
    }

    // Flatten the points array and send it to the GPU
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index * (numCirclePoints + 2), flatten(points));
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (var i = 0; i < index; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i * 52, 52); // Each circle uses 50 + 2 points (50 for the circle, 1 center, 1 repeated point to close)
    }
    window.requestAnimFrame(render);
}
