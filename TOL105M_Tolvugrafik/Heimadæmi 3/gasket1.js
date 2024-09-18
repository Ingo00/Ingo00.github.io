"use strict";

var gl, points, program;
var NumPoints = 5000;  // Adjust as needed

var offset = [0.0, 0.0];  // Initial offset for movement
var scaleFactor = 1.0;  // Initial zoom scale
var color = [1.0, 0.0, 0.0];  // Starting color is red

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Initial triangle vertices
    var vertices = [
        vec2(-1, -1),
        vec2(0, 1),
        vec2(1, -1)
    ];

    var u = add(vertices[0], vertices[1]);
    var v = add(vertices[0], vertices[2]);
    var p = scale(0.25, add(u, v));

    points = [p];

    // Generate more points
    for (var i = 0; points.length < NumPoints; ++i) {
        var j = Math.floor(Math.random() * 3);
        p = add(points[i], vertices[j]);
        p = scale(0.5, p);
        points.push(p);
    }

    console.log("Number of points:", points.length);  // Debugging step: Check the number of points
    console.log("Flattened points length:", flatten(points).length);  // Debugging step: Check the length of flattened points array

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Load the shaders and initialize the program
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Check if the vertex shader compiled correctly
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, document.getElementById("vertex-shader").text);
    gl.compileShader(vertexShader);
    var vertexShaderLog = gl.getShaderInfoLog(vertexShader);
    console.log("Vertex Shader Log: ", vertexShaderLog);

    // Check if the fragment shader compiled correctly
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, document.getElementById("fragment-shader").text);
    gl.compileShader(fragmentShader);
    var fragmentShaderLog = gl.getShaderInfoLog(fragmentShader);
    console.log("Fragment Shader Log: ", fragmentShaderLog);

    // Check if the program linked correctly
    var programLog = gl.getProgramInfoLog(program);
    console.log("Program Linking Log: ", programLog);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    // Use Float32Array for buffer data
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(points)), gl.STATIC_DRAW);

    // Attribute pointer setup
    var vPosition = gl.getAttribLocation(program, "vPosition");
    console.log("vPosition attribute location:", vPosition);  // Debugging step: Check vPosition attribute location
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Get the uniform locations
    var offsetLoc = gl.getUniformLocation(program, "uOffset");
    var scaleLoc = gl.getUniformLocation(program, "uScale");
    var colorLoc = gl.getUniformLocation(program, "uColor");

    // Log the uniform locations to make sure they are valid
    console.log("Uniform locations - uOffset:", offsetLoc, " uScale:", scaleLoc, " uColor:", colorLoc);

    // Set initial uniform variables
    gl.uniform2fv(offsetLoc, offset);
    gl.uniform1f(scaleLoc, scaleFactor);
    gl.uniform3fv(colorLoc, color);

    // Mouse and keyboard event listeners
    canvas.addEventListener("mousedown", startDrag);
    canvas.addEventListener("mouseup", stopDrag);
    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("wheel", zoom);
    window.addEventListener("keydown", changeColor);

    render();
};

// Mouse dragging for movement
var dragging = false;
var lastX, lastY;

function startDrag(event) {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
}

function stopDrag() {
    dragging = false;
}

function mouseMove(event) {
    if (dragging) {
        var dx = (event.clientX - lastX) / 500;
        var dy = (lastY - event.clientY) / 500;
        offset[0] += dx;
        offset[1] += dy;
        lastX = event.clientX;
        lastY = event.clientY;

        // Update uniforms here
        gl.uniform2fv(gl.getUniformLocation(program, "uOffset"), offset);
        render();
    }
}

// Zoom with the scroll wheel
function zoom(event) {
    var zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    scaleFactor *= zoomFactor;

    // Update uniform here
    gl.uniform1f(gl.getUniformLocation(program, "uScale"), scaleFactor);
    render();
}

// Change color with the spacebar
function changeColor(event) {
    if (event.key === " ") {
        color = [Math.random(), Math.random(), Math.random()];
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), color);
        render();
    }
}

function render() {
    console.log("Rendering...");
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, points.length);
}

// Helper functions for vector math
function scale(scalar, vector) {
    return [scalar * vector[0], scalar * vector[1]];
}

function add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]];
}

function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(toFlatten);
    }, []);
}
