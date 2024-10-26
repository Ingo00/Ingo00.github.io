var canvas;
var gl;

var numVertices = 36;

var pointsArray = [];
var normalsArray = [];

var spinX = 0;
var spinY = 0;
var origX;
var origY;

var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.8, 0.8, 0.8, 1.0);
var materialDiffuse = vec4(0.8, 0.8, 0.8, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 100.0;

var movement = false;
var zDist = -8.0;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Búðu til þríhyrningapunkta og normala fyrir kubbinn
    normalCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(mult(lightAmbient, materialAmbient)));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(mult(lightDiffuse, materialDiffuse)));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(mult(lightSpecular, materialSpecular)));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    // Event listeners for mouse
    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            spinY = (spinY + (origX - e.offsetX)) % 360;
            spinX = (spinX + (origY - e.offsetY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });

    render();
}

function normalCube() {
    quad(1, 0, 3, 2, vec3(0, 0, 1)); // Front face normal
    quad(2, 3, 7, 6, vec3(1, 0, 0)); // Right face normal
    quad(3, 0, 4, 7, vec3(0, -1, 0)); // Bottom face normal
    quad(6, 5, 1, 2, vec3(0, 1, 0)); // Top face normal
    quad(4, 5, 6, 7, vec3(0, 0, -1)); // Back face normal
    quad(5, 4, 0, 1, vec3(-1, 0, 0)); // Left face normal
}

function quad(a, b, c, d, normal) {
    var vertices = [
        vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5)
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        pointsArray.push(vertices[indices[i]]);
        normalsArray.push(normal);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = lookAt(vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    var p = perspective(45.0, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(p));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv));

    var normalMatrix = [
        vec3(mv[0][0], mv[0][1], mv[0][2]),
        vec3(mv[1][0], mv[1][1], mv[1][2]),
        vec3(mv[2][0], mv[2][1], mv[2][2])
    ];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

    // Render the BILLY bookshelf exactly as it was before:
    // Sides
    var parts = [
        { translate: [-0.75, 0.0, 0.0], scale: [0.1, 1.8, 0.5] }, // Left side
        { translate: [0.75, 0.0, 0.0], scale: [0.1, 1.8, 0.5] }, // Right side
        { translate: [0.0, -0.9, 0.0], scale: [1.6, 0.1, 0.5] }, // Bottom
        { translate: [0.0, 0.9, 0.0], scale: [1.6, 0.1, 0.5] }, // Top
        { translate: [0.0, 0.0, -0.25], scale: [1.6, 1.9, 0.1] }, // Back
        { translate: [0.0, 0.3, 0.0], scale: [1.6, 0.1, 0.5] }, // Middle Shelf 1
        { translate: [0.0, -0.3, 0.0], scale: [1.6, 0.1, 0.5] }, // Middle Shelf 2
    ];

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var mv1 = mult(mv, translate(part.translate[0], part.translate[1], part.translate[2]));
        mv1 = mult(mv1, scalem(part.scale[0], part.scale[1], part.scale[2]));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mv1));
        gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    }

    requestAnimFrame(render);
}
