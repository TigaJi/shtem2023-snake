// get canvas and button
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const restartBtn = document.getElementById("restart-btn");

function initGameState(userId, canvas) {
  return {
    userId,
    canvas,
    context: canvas.context,
    score: 0,
    snake: [
      { x: 200, y: 200 },
      { x: 190, y: 200 },
      { x: 180, y: 200 },
      { x: 170, y: 200 },
      { x: 160, y: 200 },
    ],
    fruit: {
      x: 0,
      y: 0,
    },
    direction: "right",
    gameLoopIntervalId: 0,
    gameOver: false,
    paused: false,
    snapshots: [],
    agentState: {
      pathToFruit: [],
      it: -1,
    },
  };
}

// const gameState = initGameState("asd", canvas);
// game loop
function gameLoop(gameState) {
  const fps = document.querySelector("#fps-input").value;

  gameState.gameLoopIntervalId = setTimeout(function () {
    if (gameState.gameOver !== false) {
      return;
    }

    if (gameState.paused) {
      return;
    }

    try {
      drawCanvas(gameState); // draw canvas
      moveSnake(gameState); // move the snake
      checkCollision(gameState); // check for game ending condition
      drawScore(gameState);
      gameState.snapshots.push(getCanvasSnapshot(gameState)); // record state
    } catch (error) {
      console.log("Game ended with an error", error);
      gameState.gameOver = true;
    }
    requestAnimationFrame(() => gameLoop(gameState));
  }, 1000 / fps);
}

function drawCanvas(gameState) {
  context.fillStyle = "white";
  context.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
  context.strokeStyle = "black";
  context.strokeRect(0, 0, gameState.canvas.width, gameState.canvas.height);
  drawSnake(gameState);
  drawFruit(gameState);
}

function drawSnake(gameState) {
  context.fillStyle = "green";
  context.strokeStyle = "darkgreen";
  for (let i = 0; i < gameState.snake.length; i++) {
    context.fillStyle = i === 0 ? "green" : "lightgreen";
    context.fillRect(gameState.snake[i].x, gameState.snake[i].y, 10, 10);
    context.strokeRect(gameState.snake[i].x, gameState.snake[i].y, 10, 10);
  }
}

function drawPath(path) {
  context.fillStyle = "yellow";
  for (let i = 0; i < path.length; i++) {
    context.fillRect(path[i].x, path[i].y, 10, 10);
  }
}

function drawFruit(gameState) {
  context.fillStyle = "red";
  context.strokeStyle = "darkred";
  context.fillRect(gameState.fruit.x, gameState.fruit.y, 10, 10);
  context.strokeRect(gameState.fruit.x, gameState.fruit.y, 10, 10);
}

// heuristics

function findFruitBFS(gameState, head, fruit) {
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
        newPosition.x < gameState.canvas.width &&
        newPosition.y >= 0 &&
        newPosition.y < gameState.canvas.height &&
        !visited.has(newPositionKey) &&
        !isSnakeCollision(gameState, newPosition)
      ) {
        queue.push({ position: newPosition, path: [...path, newPosition] });
        visited.add(newPositionKey);
      }
    }
  }

  // Go randomly if cannot reach fruit
  let possibleNext = [];
  for (const direction of directions) {
    const newPosition = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    if (
      newPosition.x >= 0 &&
      newPosition.x < gameState.canvas.width &&
      newPosition.y >= 0 &&
      newPosition.y < gameState.canvas.height &&
      !isSnakeCollision(gameState, newPosition)
    ) {
      possibleNext.push([newPosition]);
    }
  }

  if (possibleNext.length === 0) {
    return [];
  }
  return possibleNext[Math.floor(Math.random() * possibleNext.length)];
}

function isSnakeCollision(gameState, position) {
  for (let i = 0; i < gameState.snake.length; i++) {
    if (
      gameState.snake[i].x === position.x &&
      gameState.snake[i].y === position.y
    ) {
      return true;
    }
  }
  return false;
}

function agentNextPosition(gameState) {
  if (
    gameState.agentState.it == -1 ||
    gameState.agentState.it == gameState.agentState.pathToFruit.length
  ) {
    const head = {
      x: gameState.snake[0].x,
      y: gameState.snake[0].y,
    };
    const fruitPosition = { x: gameState.fruit.x, y: gameState.fruit.y };
    gameState.agentState.pathToFruit = findFruitBFS(
      gameState,
      head,
      fruitPosition,
    );
    gameState.agentState.it = 0;
  }
  if (
    gameState.agentState.it >= 0 &&
    gameState.agentState.it < gameState.agentState.pathToFruit.length
  ) {
    nextPosition = gameState.agentState.pathToFruit[gameState.agentState.it];
    gameState.agentState.it++;
    return nextPosition;
  }
  return null;
}

// Modify the moveSnake() function
function moveSnake(gameState) {
  const head = {
    x: gameState.snake[0].x,
    y: gameState.snake[0].y,
  };

  if (!ateFruit(gameState)) {
    gameState.snake.pop();
  } else {
    // Fruit is eaten
    gameState.score++;
    updateFruitPosition(gameState);
  }

  if (gameState.agentState !== undefined) {
    let nextPosition = agentNextPosition(gameState);
    if (nextPosition.x == head.x && nextPosition.y == head.y) {
      nextPosition = agentNextPosition(gameState);
    }
    if (nextPosition === null) {
      gameState.gameOver = true;
      return;
    }
    const deltaX = nextPosition.x - gameState.snake[0].x;
    const deltaY = nextPosition.y - gameState.snake[0].y;
    if (deltaX > 0) {
      gameState.direction = "right";
    } else if (deltaX < 0) {
      gameState.direction = "left";
    } else if (deltaY > 0) {
      gameState.direction = "down";
    } else if (deltaY < 0) {
      gameState.direction = "up";
    }
  }

  gameState.snake.unshift(head);

  gameState.snake[0].x += getDirection(gameState).x;
  gameState.snake[0].y += getDirection(gameState).y;
}

// check for game end
function checkCollision(gameState) {
  // hit the wall
  if (
    gameState.snake[0].x < 0 ||
    gameState.snake[0].x > gameState.canvas.width - 10 ||
    gameState.snake[0].y < 0 ||
    gameState.snake[0].y > gameState.canvas.height - 10
  ) {
    gameState.gameOver = true;
    return;
  }

  // hit self
  for (let i = 1; i < gameState.snake.length; i++) {
    if (
      gameState.snake[0].x === gameState.snake[i].x &&
      gameState.snake[0].y === gameState.snake[i].y
    ) {
      gameState.gameOver = true;
      return;
    }
  }

  // length of snake not in aligned with score
  if (gameState.snake.length - 5 != gameState.score) {
    // gameState.gameOver = true;
    return;
  }
}

function drawScore(gameState) {
  document.getElementById("score-value").innerText = gameState.score;
}

function ateFruit(gameState) {
  return (
    gameState.snake[0].x === gameState.fruit.x &&
    gameState.snake[0].y === gameState.fruit.y
  );
}

function updateFruitPosition(gameState) {
  while (isSnakeCollision(gameState, gameState.fruit)) {
    gameState.fruit.x =
      Math.floor(Math.random() * (gameState.canvas.width / 10)) * 10;
    gameState.fruit.y =
      Math.floor(Math.random() * (gameState.canvas.height / 10)) * 10;
  }
}

const gameOverMask = document.getElementById("game-over-mask");

function endGame(gameState) {
  console.log(
    "Sending game data from",
    gameState.userId,
    "; final state:",
    gameState,
  );
  gameOverMask.style.display = "flex";

  const params = {
    Bucket: "snake-container",
    Key: gameState.userId + "/" + Date.now() + ".json",
  };

  const message = JSON.stringify(gameState.snapshots);

  params.Body = message;
  params.ContentMD5 = btoa(CryptoJS.MD5(message).toString(CryptoJS.enc.Latin1));
  return;
  s3.putObject(params, function (error, data) {
    if (error) {
    } else if (data) {
      console.log("Final state:", gameState, "; data:", data);
    }
  });
}

const pausedMask = document.getElementById("paused-mask");

function pauseGame(gameState) {
  gameState.paused = true;
  pausedMask.style.display = "flex";
}

function resumeGame(gameState) {
  gameState.paused = false;
  pausedMask.style.display = "none";
}

function restartGame(gameState) {
  document.location.reload();
}

// Get direction
function getDirection(gameState) {
  switch (gameState.direction) {
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
function getCanvasSnapshot(gameState) {
  // record direction (action)
  const currentDirection = gameState.direction;

  // record snake head position and fruit position (An alternative for state representation)
  const snakeHeadPosition = {
    x: gameState.snake[0].x,
    y: gameState.snake[0].y,
  };
  const fruitPosition = { x: gameState.fruit.x, y: gameState.fruit.y };

  // create a new canvas and save as image(state)
  const snapshotCanvas = document.createElement("canvas");
  snapshotCanvas.width = gameState.canvas.width;
  snapshotCanvas.height = gameState.canvas.height;
  const snapshotContext = snapshotCanvas.getContext("2d");

  snapshotContext.drawImage(gameState.canvas, 0, 0);

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

function startGame() {
  const userIdInput = document.getElementById("user-id");
  if (!userIdInput.value) {
    alert("please input userId");
    return;
  }
  startEl.style.display = "none"; // hide the start button

  gameBoard.style.display = "block";

  const gameState = initGameState(userIdInput, canvas);
  document.addEventListener("keydown", function (event) {
    if (event.key === " ") {
      if (gameState.paused) {
        resumeGame(gameState);
      } else {
        pauseGame(gameState);
      }
      return;
    }

    if (event.key === "ArrowLeft" && gameState.direction !== "right") {
      gameState.direction = "left";
    } else if (event.key === "ArrowUp" && gameState.direction !== "down") {
      gameState.direction = "up";
    } else if (event.key === "ArrowRight" && gameState.direction !== "left") {
      gameState.direction = "right";
    } else if (event.key === "ArrowDown" && gameState.direction !== "up") {
      gameState.direction = "down";
    }
  });
  updateFruitPosition(gameState);
  gameLoop(gameState);
}
