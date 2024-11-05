// Game variables
let scene, camera, renderer;
let frog, lanes = [];
let laneWidth = 10;
let roadLaneCount = 3; // 3 lanes for cars
let riverLaneCount = 3; // 3 lanes for river logs and turtles
let clock = new THREE.Clock();
let gameOver = false;
let score = 0;
let onLog = false;
let logSpeed = 0;
const boardWidth = 15; // Width limit for frog movement
let fly;
let flyVisible = false;
let flyCollected = false;
const flyBlinkInterval = 1000; // Fly visible for 1 second
let flyTimeout;

// Initialize the game board
window.onload = function () {
    init();
};

function init() {
    // Set up scene and background color
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, -30);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    // Create frog, lanes, and spawn a fly
    createFrog();
    createRoadLanes();
    createFlyLane(); // Add the fly lane between road and river
    createRiverLanes();
    spawnFly();

    // Event listener for controls
    window.addEventListener('keydown', onKeyPress);

    animate();
}

// Update score display
function updateScoreDisplay() {
    document.getElementById("scoreDisplay").textContent = `Score: ${score}`;
}

// Create the frog player
function createFrog() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    frog = new THREE.Mesh(geometry, material);
    frog.position.set(0, 0.5, 0); // Place frog in starting position
    scene.add(frog);
}

// Create road lanes with cars
function createRoadLanes() {
    for (let i = 1; i <= roadLaneCount; i++) {
        const lane = new THREE.Group();
        let obstacleCount = 0;

        // Dark gray plane for each road lane
        const roadGeometry = new THREE.PlaneGeometry(boardWidth * 2, laneWidth);
        const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
        const roadPlane = new THREE.Mesh(roadGeometry, roadMaterial);
        roadPlane.position.set(0, -0.01, i * laneWidth); // Slightly below the car level
        roadPlane.rotation.x = -Math.PI / 2;
        scene.add(roadPlane);

        for (let j = -2; j <= 2; j++) {
            if (Math.random() < 0.4 || obstacleCount === 0) {
                const geometry = new THREE.BoxGeometry(2, 1, 2);
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const car = new THREE.Mesh(geometry, material);
                car.position.set(j * 3, 0.5, i * laneWidth);
                lane.add(car);
                obstacleCount++;
            }
        }

        lanes.push({ lane, type: 'road', speed: (i % 2 === 0 ? 1 : -1) * 5 });
        scene.add(lane);
    }
}

// Create a lane for flies
function createFlyLane() {
    const lane = new THREE.Group();
    lanes.push({ lane, type: 'fly' });
    scene.add(lane);
}

// Create river lanes with logs and turtles, ensuring random placement and at least one log per lane
function createRiverLanes() {
    for (let i = roadLaneCount + 2; i <= roadLaneCount + riverLaneCount + 1; i++) {
        const lane = new THREE.Group();
        let logCount = 0;
        let turtleCount = 0;

        for (let j = -2; j <= 2; j++) {
            const isTurtle = Math.random() < 0.4 && turtleCount < 4;
            let geometry, material;

            if (isTurtle) {
                geometry = new THREE.BoxGeometry(1, 0.5, 1);
                material = new THREE.MeshBasicMaterial({ color: 0x006400 }); // Dark green turtles
                turtleCount++;
            } else {
                geometry = new THREE.BoxGeometry(Math.random() * 2 + 2, 0.5, 1);
                material = new THREE.MeshBasicMaterial({ color: 0x964B00 }); // Logs
                logCount++;
            }

            const logOrTurtle = new THREE.Mesh(geometry, material);
            logOrTurtle.position.set(j * 3, 0.25, i * laneWidth);
            logOrTurtle.isTurtle = isTurtle; // Custom property to track turtles
            lane.add(logOrTurtle);
        }

        lanes.push({ lane, type: 'river', speed: (i % 2 === 0 ? 1 : -1) * 2 });
        scene.add(lane);

        // Add blue river background
        const riverGeometry = new THREE.PlaneGeometry(boardWidth * 2, laneWidth);
        const riverMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide });
        const river = new THREE.Mesh(riverGeometry, riverMaterial);
        river.position.set(0, -0.01, i * laneWidth);
        river.rotation.x = -Math.PI / 2;
        scene.add(river);
    }
}

// Spawn a fly at one of the 7 possible positions in the middle lane for 1 second
function spawnFly() {
    if (fly) {
        scene.remove(fly);
        fly = null;
    }

    if (!flyCollected) {
        const flyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const flyMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        fly = new THREE.Mesh(flyGeometry, flyMaterial);

        const flyLane = roadLaneCount + 1;
        const flyPositionIndex = Math.floor(Math.random() * 7) - 3; // Choose one of 7 positions
        fly.position.set(flyPositionIndex * (laneWidth / 2), 0.5, flyLane * laneWidth);
        scene.add(fly);

        flyVisible = true;

        // Hide the fly after 1 second and respawn after 3-5 seconds
        setTimeout(() => {
            scene.remove(fly);
            flyVisible = false;
            fly = null;
            setTimeout(spawnFly, Math.random() * 2000 + 3000); // Respawn in 3-5 seconds
        }, 1000);
    }
}

// Event handler for key controls
function onKeyPress(event) {
    if (gameOver) return;

    switch (event.key) {
        case 'ArrowUp':
            frog.position.z += laneWidth;
            onLog = false;
            logSpeed = 0;
            break;
        case 'ArrowDown':
            if (frog.position.z > 0) frog.position.z -= laneWidth;
            onLog = false;
            logSpeed = 0;
            break;
        case 'ArrowLeft':
            if (frog.position.x < boardWidth) { // Allow one more jump to the left
                frog.position.x += laneWidth / 2;
            }
            break;
        case 'ArrowRight':
            if (frog.position.x > -boardWidth) { // Allow one more jump to the right
                frog.position.x -= laneWidth / 2;
            }
            break;
    }

    checkWinCondition();
}

function animate() {
    if (!gameOver) {
        requestAnimationFrame(animate);
        updateObstacles();
        updateCamera();
        checkCollisions();
        updateScoreDisplay();
    }

    renderer.render(scene, camera);
}

// Update positions of obstacles
function updateObstacles() {
    const delta = clock.getDelta();
    lanes.forEach(({ lane, type, speed }) => {
        lane.children.forEach(obstacle => {
            obstacle.position.x += speed * delta;

            if (type === 'road') {
                if (obstacle.position.x > boardWidth) obstacle.position.x = -boardWidth;
                if (obstacle.position.x < -boardWidth) obstacle.position.x = boardWidth;
            } else if (type === 'river') {
                if (obstacle.position.x > boardWidth) obstacle.position.x = -boardWidth;
                if (obstacle.position.x < -boardWidth) obstacle.position.x = boardWidth;

                // Handle sinking turtles
                if (obstacle.isTurtle) {
                    obstacle.position.y = Math.sin(clock.elapsedTime * 2) < 0 ? -1 : 0.25;
                }
            }
        });
    });

    // Move frog with the log if on log
    if (onLog) {
        frog.position.x += logSpeed * delta;
        if (frog.position.x < -boardWidth || frog.position.x > boardWidth) {
            gameOver = true;
            alert("Game Over! The frog fell off the screen.");
        }
    }
}

// Camera follows the frog on the z-axis
function updateCamera() {
    camera.position.lerp(new THREE.Vector3(0, 20, frog.position.z - 30), 0.1);
    camera.lookAt(new THREE.Vector3(0, frog.position.y + 5, frog.position.z + 20));
}

// Collision checks with cars, logs, turtles, and flies
function checkCollisions() {
    const frogLaneIndex = Math.floor(frog.position.z / laneWidth);

    if (frogLaneIndex >= 1 && frogLaneIndex <= roadLaneCount) {
        // Check for collisions with cars in road lanes
        lanes[frogLaneIndex - 1].lane.children.forEach(car => {
            if (frog.position.distanceTo(car.position) < 1) {
                gameOver = true;
                alert("Game Over! The frog was hit by a car.");
            }
        });
    } else if (frogLaneIndex === roadLaneCount + 1) {
        // This is the middle lane with the fly, no drowning or obstacles here
        if (fly && frog.position.distanceTo(fly.position) < 1 && flyVisible) {
            score += 10;
            flyCollected = true;
            scene.remove(fly);
            fly = null;
            flyVisible = false;
        }
    } else if (frogLaneIndex > roadLaneCount + 1 && frogLaneIndex <= roadLaneCount + riverLaneCount + 1) {
        // Check for logs and turtles in river lanes
        const lane = lanes[frogLaneIndex - 1];
        onLog = false;
        lane.lane.children.forEach(log => {
            if (frog.position.distanceTo(log.position) < 2) {
                onLog = true;
                logSpeed = lane.speed;
                if (log.isTurtle && log.position.y < 0) {
                    gameOver = true;
                    alert("Game Over! The turtle sank with the frog.");
                }
            }
        });
        if (!onLog) {
            gameOver = true;
            alert("Game Over! The frog drowned.");
        }
    }
}

// Check if frog has reached the end
function checkWinCondition() {
    if (frog.position.z > (roadLaneCount + riverLaneCount + 1) * laneWidth) {
        alert("Congratulations! You've won the game!");
        roundWon = true; // Mark this round as won
        resetGame();
    }
}

// Reset the game
function resetGame() {
    frog.position.set(0, 0.5, 0);
    gameOver = false;
    onLog = false;
    logSpeed = 0;
    flyCollected = false;
    if (!roundWon) {
        score = 0;
    }
    spawnFly();
    updateScoreDisplay();
    animate();
}