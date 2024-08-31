"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // Upphafs hornpunktar fyrir ferninginn
    var vertices = [
        vec2(-1, -1),  // Neðri vinstri
        vec2(-1,  1),  // Efra vinstri
        vec2( 1,  1),  // Efra hægri
        vec2( 1, -1)   // Neðri hægri
    ];

    divideSquare(vertices[0], vertices[1], vertices[2], vertices[3], NumTimesToSubdivide);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
};

function square(a, b, c, d) {
    points.push(a, b, c);
    points.push(a, c, d);
}

function divideSquare(a, b, c, d, count) {
    if (count === 0) {
        square(a, b, c, d);
    } else {
        // Búa til 12 nýja punkta
        var ab = mix(a, b, 1/3);  // 1/3 á milli a og b
        var ab2 = mix(a, b, 2/3); // 2/3 á milli a og b
        var bc = mix(b, c, 1/3);  // 1/3 á milli b og c
        var bc2 = mix(b, c, 2/3); // 2/3 á milli b og c
        var cd = mix(c, d, 1/3);  // 1/3 á milli c og d
        var cd2 = mix(c, d, 2/3); // 2/3 á milli c og d
        var da = mix(d, a, 1/3);  // 1/3 á milli d og a
        var da2 = mix(d, a, 2/3); // 2/3 á milli d og a

        var center = mix(ab, cd, 0.5);  // Miðpunktur ferningsins

        --count;

        // Endurkvæm köll fyrir 8 utanverðu ferningana (sleppa miðjunni)
        divideSquare(a, ab, center, da, count);   // Neðri vinstri
        divideSquare(ab, ab2, bc, center, count); // Efra vinstri
        divideSquare(ab2, b, bc2, center, count); // Efra miðja
        divideSquare(center, bc, c, cd2, count);  // Efra hægri
        divideSquare(da, center, cd, d, count);   // Neðri miðja
        divideSquare(center, cd2, c, cd, count);  // Neðri hægri
        divideSquare(center, da2, ab2, ab, count);// Vinstri miðja
        divideSquare(center, bc2, cd2, cd, count);// Hægri miðja
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}
