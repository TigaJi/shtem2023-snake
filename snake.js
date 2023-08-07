// get canvas and button
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const restartBtn = document.getElementById("restart-btn");

// init
let score = 0;

// init snake and fruit
let snake = [
  { x: 200, y: 200 },
  { x: 190, y: 200 },
  { x: 180, y: 200 },
  { x: 170, y: 200 },
  { x: 160, y: 200 },
];
let fruit = { x: 0, y: 0 };

fruit.x = Math.floor(Math.random() * (canvas.width / 10)) * 10;
fruit.y = Math.floor(Math.random() * (canvas.height / 10)) * 10;
// init direction and action
let direction = "right";
let changingDirection = false;

// init game loop and gameover flag
let gameLoopIntervalId = 0;
let gameOver = false;
let paused = false;

// record states
const snapshots = [];

let agent = true;
let pathToFruit = [];
let it = -1;
// Return
document.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    if (paused) {
      resumeGame();
    } else {
      pauseGame();
    }

    return;
  }

  if (changingDirection) {
    return;
  }

  changingDirection = true;

  if (event.key === "ArrowLeft" && direction !== "right") {
    direction = "left";
  } else if (event.key === "ArrowUp" && direction !== "down") {
    direction = "up";
  } else if (event.key === "ArrowRight" && direction !== "left") {
    direction = "right";
  } else if (event.key === "ArrowDown" && direction !== "up") {
    direction = "down";
  }
});

// game loop
function gameLoop() {
  const fps = document.querySelector("#fps-input").value;

  gameLoopIntervalId = setTimeout(function () {
    if (gameOver) {
      return;
    }

    requestAnimationFrame(gameLoop);

    if (paused) {
      return;
    }

    drawCanvas(); // draw canvas
    moveSnake(); // move the snake
    checkCollision(); // check for game ending condition
    drawScore();
    snapshots.push(getCanvasSnapshot()); // record state
  }, 1000 / fps);
}

function gameLoopNoGUI() {
  try {
    let frame = 0;
    while (!gameOver) {
      frame++;
      if (paused) {
        return;
      }
      console.log("frame:", frame, "; score:", score);

      moveSnake(); // move the snake
      checkCollision(); // check for game ending condition
      drawCanvas(); // draw canvas
      snapshots.push(getCanvasSnapshot()); // record state
    }
  } catch (error) {
    console.log("Game ended with an error", error);
    endGame();
  }
  requestAnimationFrame(gameLoopNoGUI);
  drawCanvas(); // draw canvas
  drawScore();
  return;
}

function drawCanvas() {
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "black";
  context.strokeRect(0, 0, canvas.width, canvas.height);
  drawSnake();
  drawFruit();
}

function drawSnake() {
  context.fillStyle = "green";
  context.strokeStyle = "darkgreen";
  for (let i = 0; i < snake.length; i++) {
    context.fillStyle = i === 0 ? "green" : "lightgreen";
    context.fillRect(snake[i].x, snake[i].y, 10, 10);
    context.strokeRect(snake[i].x, snake[i].y, 10, 10);
  }
}

function drawPath() {
  context.fillStyle = "yellow";
  for (let i = 0; i < pathToFruit.length; i++) {
    context.fillRect(pathToFruit[i].x, pathToFruit[i].y, 10, 10);
  }
}

function drawFruit() {
  context.fillStyle = "red";
  context.strokeStyle = "darkred";
  context.fillRect(fruit.x, fruit.y, 10, 10);
  context.strokeRect(fruit.x, fruit.y, 10, 10);
}

// heuristics

function findFruitBFS(head, fruit) {
  const queue = [];
  const visited = new Set();
  const directions = [
    { x: 0, y: -10 }, // Up
    { x: 0, y: 10 }, // Down
    { x: -10, y: 0 }, // Left
    { x: 10, y: 0 }, // Right
  ];

  queue.push({ position: head, path: [] });
  visited.add(`${head.x},${head.y}`);

  while (queue.length > 0) {
    const { position, path } = queue.shift();

    if (position.x === fruit.x && position.y === fruit.y) {
      return [...path, position];
    }

    for (const direction of directions) {
      const newPosition = {
        x: position.x + direction.x,
        y: position.y + direction.y,
      };

      const newPositionKey = `${newPosition.x},${newPosition.y}`;

      if (
        newPosition.x >= 0 &&
        newPosition.x < canvas.width &&
        newPosition.y >= 0 &&
        newPosition.y < canvas.height &&
        !visited.has(newPositionKey) &&
        !isSnakeCollision(newPosition)
      ) {
        queue.push({ position: newPosition, path: [...path, newPosition] });
        visited.add(newPositionKey);
      }
    }
  }
  let possibleNext = [];
  for (const direction of directions) {
    const newPosition = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    if (
      newPosition.x >= 0 &&
      newPosition.x < canvas.width &&
      newPosition.y >= 0 &&
      newPosition.y < canvas.height &&
      !isSnakeCollision(newPosition)
    ) {
      possibleNext.push([newPosition]);
    }
  }
  if (possibleNext.length === 0) {
    gameOver = true;
    endGame();
    return [];
  }
  return possibleNext[Math.floor(Math.random() * possibleNext.length)];
}

// Add the isSnakeCollision() function
function isSnakeCollision(position) {
  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === position.x && snake[i].y === position.y) {
      return true;
    }
  }
  return false;
}

function agentNextPosition() {
  if (it == -1 || it == pathToFruit.length) {
    const head = {
      x: snake[0].x,
      y: snake[0].y,
    };
    const fruitPosition = { x: fruit.x, y: fruit.y };
    pathToFruit = findFruitBFS(head, fruitPosition);
    // pathToFruit = tailSearch();
    it = 0;
  }
  if (it >= 0 && it < pathToFruit.length) {
    drawPath();
    nextPosition = pathToFruit[it];
    it++;
    return nextPosition;
  }
  return null;
}

// Modify the moveSnake() function
function moveSnake() {
  let head = {
    x: snake[0].x,
    y: snake[0].y,
  };
  if (agent) {
    if (!ateFruit()) {
      snake.pop();
    } else {
      // Fruit is eaten
      score++;
      updateFruitPosition();

      const head = {
        x: snake[0].x + getDirection().x,
        y: snake[0].y + getDirection().y,
      };
      const fruitPosition = { x: fruit.x, y: fruit.y };
    }
    let nextPosition = agentNextPosition();
    if (nextPosition.x == head.x && nextPosition.y == head.y) {
      nextPosition = agentNextPosition();
    }
    if (nextPosition === null) {
      return;
    }
    const deltaX = nextPosition.x - snake[0].x;
    const deltaY = nextPosition.y - snake[0].y;
    if (deltaX > 0) {
      direction = "right";
    } else if (deltaX < 0) {
      direction = "left";
    } else if (deltaY > 0) {
      direction = "down";
    } else if (deltaY < 0) {
      direction = "up";
    }
    snake.unshift(head);

    changingDirection = false;
  }
  head.x += getDirection().x;
  head.y += getDirection().y;
}

// check for game end
function checkCollision() {
  // hit the wall
  if (
    snake[0].x < 0 ||
    snake[0].x > canvas.width - 10 ||
    snake[0].y < 0 ||
    snake[0].y > canvas.height - 10
  ) {
    gameOver = true;
    endGame();
  }

  // hit self
  for (let i = 1; i < snake.length; i++) {
    if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
      gameOver = true;
      endGame();
    }
  }

  // length of snake not in aligned with score
  if (snake.length - 5 != score) {
    gameOver = true;
    endGame();
  }
}

function drawScore() {
  document.getElementById("score-value").innerText = score;
}

function ateFruit() {
  return snake[0].x === fruit.x && snake[0].y === fruit.y;
}

function updateFruitPosition() {
  while (isSnakeCollision(fruit)) {
    fruit.x = Math.floor(Math.random() * (canvas.width / 10)) * 10;
    fruit.y = Math.floor(Math.random() * (canvas.height / 10)) * 10;
  }
}

const gameOverMask = document.getElementById("game-over-mask");

function endGame() {
  gameOverMask.style.display = "flex";

  const userId = userIdInput.value;
  const params = {
    Bucket: "snake-container",
    Key: userId + "/" + Date.now() + ".json",
  };

  const message = JSON.stringify(snapshots);

  params.Body = message;
  params.ContentMD5 = btoa(CryptoJS.MD5(message).toString(CryptoJS.enc.Latin1));

  s3.putObject(params, function (error, data) {
    if (error) {
    } else if (data) {
      console.log(
        "Game data sent from",
        userId,
        "; final score:",
        score,
        "; data:",
        data,
      );
    }
  });
}

const pausedMask = document.getElementById("paused-mask");

function pauseGame() {
  paused = true;
  pausedMask.style.display = "flex";
}

function resumeGame() {
  paused = false;
  pausedMask.style.display = "none";
}

function restartGame() {
  document.location.reload();
}

// Get direction
function getDirection() {
  switch (direction) {
    case "up":
      return { x: 0, y: -10 };
    case "down":
      return { x: 0, y: 10 };
    case "left":
      return { x: -10, y: 0 };
    case "right":
    default:
      return { x: 10, y: 0 };
  }
}

// keyboard listener

// state recorder
function getCanvasSnapshot() {
  // record direction (action)
  const currentDirection = direction;

  // record snake head position and fruit position (An alternative for state representation)
  const snakeHeadPosition = { x: snake[0].x, y: snake[0].y };
  const fruitPosition = { x: fruit.x, y: fruit.y };

  // create a new canvas and save as image(state)
  const snapshotCanvas = document.createElement("canvas");
  snapshotCanvas.width = canvas.width;
  snapshotCanvas.height = canvas.height;
  const snapshotContext = snapshotCanvas.getContext("2d");

  snapshotContext.drawImage(canvas, 0, 0);

  // turn snapshot to base64 data
  const imageData = snapshotCanvas.toDataURL();

  // return time and data
  return {
    time: Date.now(),
    imageData,
    currentDirection,
    snakeHeadPosition,
    fruitPosition,
  };
}

// start
const startEl = document.getElementById("before-start");

const gameBoard = document.getElementById("game");
// userId input
const userIdInput = document.getElementById("user-id");

function startGame() {
  if (!userIdInput.value) {
    alert("please input userId");
    return;
  }
  gameBoard.style.display = "block";
  updateFruitPosition();

  void new Promise(() => gameLoopNoGUI()); // game start
  startEl.style.display = "none"; // hide the start button
}
