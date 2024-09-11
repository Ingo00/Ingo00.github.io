//////////////////////////////////////////////////////////////////////
//    Sýnisforrit í Tölvugrafík
//     L-laga form teiknað með TRIANGLE-STRIP
//
//    Ingólfur Bjarni Elíasson, ágúst 2024
//////////////////////////////////////////////////////////////////////
var gl;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Vertices for creating the L-shape with exactly 4 triangles
    var vertices = new Float32Array([
      -0.75,  0.75,  // 0: Top-left of vertical bar
      -0.35,  0.75,  // 2: Top-right of vertical bar
      -0.75, -0.75,  // 1: Bottom-left of vertical bar
      -0.35, -0.35,  // 3: Bottom-right of vertical bar
       0.45, -0.75,  // 4: Bottom-right of horizontal bar
       0.45, -0.35   // 5: Bottom-left of horizontal bar
    ]);

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
}
