"use strict";

// Shader initialization functions
function initShaders(gl, vertexShaderId, fragmentShaderId) {
    var vertShdr = compileShader(gl, vertexShaderId, gl.VERTEX_SHADER);
    var fragShdr = compileShader(gl, fragmentShaderId, gl.FRAGMENT_SHADER);

    var program = gl.createProgram();
    gl.attachShader(program, vertShdr);
    gl.attachShader(program, fragShdr);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var error = gl.getProgramInfoLog(program);
        console.error("Failed to link program: " + error);
        return null;
    }

    return program;
}

function compileShader(gl, shaderId, shaderType) {
    var shaderScript = document.getElementById(shaderId);
    if (!shaderScript) {
        throw new Error("Shader script not found: " + shaderId);
    }

    var shaderSource = shaderScript.text;
    var shader = gl.createShader(shaderType);

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var error = gl.getShaderInfoLog(shader);
        console.error("Failed to compile shader: " + error);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// Simple vec2 helper function
function vec2(x, y) {
    return [x, y];
}

// Game setup
var gl;
var program;

var gunPosition = 0.0;
var bullets = []; // Array to hold multiple bullets
var birds = []; // Array to hold multiple birds
var maxBirds = 3; // Number of birds in the game
var score = 0;
var maxScore = 5; // Game ends when 5 birds are shot
var gameOver = false;

var gunBuffer, birdBuffer, bulletBuffer, scoreBuffer;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    // Direct WebGL initialization
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("WebGL isn't available in your browser!");
        return;
    }

    // Configure WebGL viewport and background color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);

    // Set up gun, bird, bullet, and score buffers
    gunBuffer = gl.createBuffer();
    birdBuffer = gl.createBuffer();
    bulletBuffer = gl.createBuffer();
    scoreBuffer = gl.createBuffer(); // Buffer for drawing score "lines"

    // Initialize birds
    for (let i = 0; i < maxBirds; i++) {
        birds.push({
            x: -1.0,
            y: (Math.random() * 0.5) + 0.3, // Random height between 0.3 and 0.8
            speed: (Math.random() * 0.005) + 0.001 // Random speed
        });
    }

    // Mouse event for gun movement
    canvas.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        var x = (e.clientX - rect.left) / canvas.width * 2 - 1; // Normalize to [-1, 1]
        gunPosition = x;
    });

    // Click event for firing bullets
    canvas.addEventListener("click", function () {
        if (!gameOver) {
            // Allow multiple bullets to be fired
            bullets.push({ x: gunPosition, y: -0.8 }); // Add new bullet with current gun position
        }
    });

    render();
};

function render() {
    if (gameOver) {
        // If the game is over, display a message and stop rendering
        console.log("Game Over! Final score: " + score);
        return;
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw gun
    drawGun();

    // Move and draw all birds
    for (let i = 0; i < birds.length; i++) {
        let bird = birds[i];
        bird.x += bird.speed;
        if (bird.x > 1.0) {
            bird.x = -1.0;
            bird.speed = (Math.random() * 0.005) + 0.001; // Change speed when resetting
            bird.y = (Math.random() * 0.5) + 0.3; // Change height when resetting
        }
        drawBird(bird);
    }

    // Handle all bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.y += 0.02; // Bullet speed

        // Remove bullets that go off-screen
        if (bullet.y > 1.0) {
            bullets.splice(i, 1);
            continue;
        }

        // Check if bullet hits any bird
        for (let j = 0; j < birds.length; j++) {
            if (bulletHitBird(bullet, birds[j])) {
                bullets.splice(i, 1); // Remove the bullet
                birds[j].x = -1.0; // Reset bird after hit
                birds[j].speed = (Math.random() * 0.005) + 0.001; // Change bird speed after hit
                birds[j].y = (Math.random() * 0.5) + 0.3; // Random height for the bird
                score++;
                console.log("Score: " + score);

                if (score >= maxScore) {
                    gameOver = true;
                }
                break; // Stop checking other birds since the bullet is removed
            }
        }

        drawBullet(bullet);
    }

    // Draw score lines at the top of the screen
    drawScore();

    requestAnimFrame(render);
}

function drawGun() {
    var gunVertices = [
        vec2(gunPosition - 0.05, -0.9),
        vec2(gunPosition + 0.05, -0.9),
        vec2(gunPosition, -0.8)
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, gunBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gunVertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "vPosition"), 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function drawBird(bird) {
    var birdVertices = [
        vec2(bird.x - 0.05, bird.y), // Bird bottom left
        vec2(bird.x + 0.05, bird.y), // Bird bottom right
        vec2(bird.x + 0.05, bird.y + 0.1), // Bird top right
        vec2(bird.x - 0.05, bird.y + 0.1)  // Bird top left
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, birdBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(birdVertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "vPosition"), 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function drawBullet(bullet) {
    var bulletVertices = [
        vec2(bullet.x - 0.01, bullet.y), // Use bullet's own x and y position
        vec2(bullet.x + 0.01, bullet.y),
        vec2(bullet.x + 0.01, bullet.y + 0.05),
        vec2(bullet.x - 0.01, bullet.y + 0.05)
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, bulletBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bulletVertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "vPosition"), 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function drawScore() {
    // Draw a "line" made of two triangles for each score at the top of the screen
    for (let i = 0; i < score; i++) {
        let xPos = -0.9 + (i * 0.05); // Position each line from left to right

        var lineVertices = [
            vec2(xPos, 0.80),       // Bottom left of the first triangle
            vec2(xPos + 0.025, 0.95), // Bottom right of the first triangle
            vec2(xPos + 0.025, 0.80), // Top of the first triangle

            vec2(xPos, 0.8),        // Bottom left of the second triangle
            vec2(xPos + 0.025, 0.95), // Bottom right of the second triangle
            vec2(xPos, 0.95) // Top of the second triangle
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, scoreBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(lineVertices), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(gl.getAttribLocation(program, "vPosition"), 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6); // Draw two triangles
    }
}

function bulletHitBird(bullet, bird) {
    if (bullet.y > bird.y && bullet.y < bird.y + 0.1 && bullet.x > bird.x - 0.05 && bullet.x < bird.x + 0.05) {
        bird.speed = (Math.random() * 0.005) + 0.001; // Change bird speed when hit
        return true;
    }
    return false;
}

// Helper function to flatten arrays
function flatten(arr) {
    return new Float32Array(arr.reduce((acc, val) => acc.concat(val), []));
}
