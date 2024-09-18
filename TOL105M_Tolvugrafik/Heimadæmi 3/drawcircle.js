var gl;
var locTime;
var iniTime;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Define the vertices of a square filling the entire canvas
    var vertices = [
        vec2(-1, -1), vec2(1, -1), vec2(1, 1),
        vec2(-1, -1), vec2(1, 1), vec2(-1, 1)
    ];

    // Load vertex data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate shader variables with vertex data
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Get uniform locations for time and resolution
    locTime = gl.getUniformLocation(program, "time");

    // Set initial time for animation
    iniTime = Date.now();

    // Pass canvas resolution to the shader
    var canvasRes = vec2(canvas.width, canvas.height);
    gl.uniform2fv(gl.getUniformLocation(program, "resolution"), flatten(canvasRes));

    // Start rendering loop
    render();
};

function render() {
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Calculate elapsed time and pass it to the shader
    var elapsedTime = Date.now() - iniTime;
    gl.uniform1f(locTime, elapsedTime);

    // Draw the square (the fragment shader will draw the circle)
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Request the next frame for animation
    window.requestAnimFrame(render);
}
