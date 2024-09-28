/////////////////////////////////////////////////////////////////
//    Lausn fyrir dæmi 5 - Continue Time Klukka
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices = 36;

var points = [];
var colors = [];

var spinX = 0;
var spinY = 0;
var origX;
var origY;

var matrixLoc;

var secAngle = 0.0;
var minAngle = 0.0;
var hourAngle = 0.0;
var lastTime = Date.now();
var movement = false; // Controls when movement should happen

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Initialize shader program
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Set up color buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Set up position buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    matrixLoc = gl.getUniformLocation(program, "transform");

    // Mouse event listeners for view rotation
    canvas.addEventListener("mousedown", function (e) {
        movement = true;  // Allow rotation when mouse is clicked
        origX = e.offsetX;
        origY = e.offsetY;
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;  // Stop rotation when mouse button is released
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {  // Only rotate when the mouse is clicked
            spinY = (spinY + (origX - e.offsetX)) % 360;
            spinX = (spinX + (origY - e.offsetY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });

    render();
}

function initShaders(gl, vertexShaderId, fragmentShaderId) {
  var vertShdr;
  var fragShdr;

  // Load vertex shader
  var vertElem = document.getElementById(vertexShaderId);
  if (!vertElem) {
      console.error("Unable to load vertex shader with id: " + vertexShaderId);
      return null;
  }
  vertShdr = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShdr, vertElem.text);
  gl.compileShader(vertShdr);

  // Check for vertex shader compilation errors
  if (!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS)) {
      console.error("Vertex shader compilation failed: " + gl.getShaderInfoLog(vertShdr));
      return null;
  }

  // Load fragment shader
  var fragElem = document.getElementById(fragmentShaderId);
  if (!fragElem) {
      console.error("Unable to load fragment shader with id: " + fragmentShaderId);
      return null;
  }
  fragShdr = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShdr, fragElem.text);
  gl.compileShader(fragShdr);

  // Check for fragment shader compilation errors
  if (!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS)) {
      console.error("Fragment shader compilation failed: " + gl.getShaderInfoLog(fragShdr));
      return null;
  }

  // Create and link the program
  var program = gl.createProgram();
  gl.attachShader(program, vertShdr);
  gl.attachShader(program, fragShdr);
  gl.linkProgram(program);

  // Check for linking errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Shader program linking failed: " + gl.getProgramInfoLog(program));
      return null;
  }

  return program;
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
        vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5)
    ];

    var vertexColors = [
        [0.0, 0.0, 0.0, 1.0],  // black
        [1.0, 0.0, 0.0, 1.0],  // red
        [1.0, 1.0, 0.0, 1.0],  // yellow
        [0.0, 1.0, 0.0, 1.0],  // green
        [0.0, 0.0, 1.0, 1.0],  // blue
        [1.0, 0.0, 1.0, 1.0],  // magenta
        [0.0, 1.0, 1.0, 1.0],  // cyan
        [1.0, 1.0, 1.0, 1.0]   // white
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push(vertexColors[a]);
    }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var now = Date.now();
  var deltaTime = (now - lastTime) / 1000; // Time difference in seconds
  lastTime = now;

  // Update the second hand angle (6 degrees per second)
  secAngle -= deltaTime * 6.0;
  if (secAngle <= -360) secAngle += 360;  // Reset every 60 seconds

  // Update the minute hand angle (6 degrees per minute)
  minAngle -= deltaTime * 6.0 / 60.0; // Each second rotates the minute hand 0.1 degrees
  if (minAngle <= -360) minAngle += 360;  // Reset every 60 minutes

  // Update the hour hand angle (6 degrees per hour)
  hourAngle -= deltaTime * 6.0 / (60.0 * 60.0); // Each second rotates the hour hand 0.00167 degrees
  if (hourAngle <= -360) hourAngle += 360;  // Reset every 12 hours

  var mv = mat4();
  mv = mult(mv, rotateX(spinX));
  mv = mult(mv, rotateY(spinY));

  // 1. Draw the hour hand - Rotate around the center (origin)
  var mv1 = mult(mv, rotateZ(hourAngle)); // Rotate hour hand (counterclockwise)
  mv1 = mult(mv1, translate(0.0, 0.125, 0.0)); // Translate so one end is at the center
  mv1 = mult(mv1, scalem(0.025, 0.25, 0.025)); // Scale the hour hand to extend upwards
  gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
  gl.drawArrays(gl.TRIANGLES, 0, numVertices);

  // 2. Draw the minute hand - Attach to the end of the hour hand
  mv1 = mult(mv, rotateZ(hourAngle)); // Rotate with the hour hand
  mv1 = mult(mv1, translate(0.0, 0.25, 0.0)); // Move to the end of the hour hand
  mv1 = mult(mv1, rotateZ(minAngle)); // Rotate the minute hand around its attachment point
  mv1 = mult(mv1, translate(0.0, 0.125, 0.0)); // Move the minute hand up from the hour hand
  mv1 = mult(mv1, scalem(0.015, 0.25, 0.015)); // Scale the minute hand
  gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
  gl.drawArrays(gl.TRIANGLES, 0, numVertices);

  // 3. Draw the second hand - Attach to the end of the minute hand
  mv1 = mult(mv, rotateZ(hourAngle)); // Rotate with the hour hand
  mv1 = mult(mv1, translate(0.0, 0.25, 0.0)); // Move to the end of the hour hand
  mv1 = mult(mv1, rotateZ(minAngle)); // Rotate with the minute hand
  mv1 = mult(mv1, translate(0.0, 0.25, 0.0)); // Move to the end of the minute hand
  mv1 = mult(mv1, rotateZ(secAngle)); // Rotate the second hand around its attachment point
  mv1 = mult(mv1, translate(0.0, 0.125, 0.0)); // Move the second hand up from the minute hand
  mv1 = mult(mv1, scalem(0.01, 0.25, 0.01)); // Scale the second hand
  gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
  gl.drawArrays(gl.TRIANGLES, 0, numVertices);

  requestAnimFrame(render);
}
