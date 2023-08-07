// get canvas and button

const restartBtn = document.getElementById("restart-btn");

function rescale(coord, gameState) {
  return {x: coord.x * gameState.config.scalor, y: coord.y * gameState.config.scalor};
}

async function launch(userId, canvas, config) {
  return new Promise(function (resolve, reject) {
    const gameState = {
      userId,
      canvas,
      context: canvas.getContext("2d"),
      score: 0,
      snake: [
        { x: 40, y: 40 },
        { x: 38, y: 40 },
        { x: 36, y: 40 },
        { x: 34, y: 40 },
        { x: 32, y: 40 },
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
      startTime: performance.now(),
      endTime: null,
      config: config,
      resolve,
      reject,
    };
    gameState.snake = gameState.snake.map((s) => rescale(s, gameState))
    updateFruitPosition(gameState);

    document.addEventListener("keydown", function (event) {
      if (event.key === " ") {
        if (gameState.paused) {
          resumeGame(gameState);
        } else {
          pauseGame(gameState);
        }
        return;
      }

      if (config.noAgent) {
        if (event.key === "ArrowLeft" && gameState.direction !== "right") {
          gameState.direction = "left";
        } else if (event.key === "ArrowUp" && gameState.direction !== "down") {
          gameState.direction = "up";
        } else if (
          event.key === "ArrowRight" &&
          gameState.direction !== "left"
        ) {
          gameState.direction = "right";
        } else if (event.key === "ArrowDown" && gameState.direction !== "up") {
          gameState.direction = "down";
        }
      }
    });
    gameLoop(gameState);
  });
}

// const gameState = initGameState("asd", canvas);
// game loop
async function gameLoop(gameState) {
  function runFrame() {
    if (!gameState.config.noDelay) {
      if (gameState.gameOver) {
        endGame(gameState);
        return;
      }
      requestAnimationFrame(() => gameLoop(gameState));
      if (gameState.paused) {
        return;
      }
    }

    try {
      drawCanvas(gameState); // draw canvas
      moveSnake(gameState); // move the snake
      checkCollision(gameState); // check for game ending condition
      drawScore(gameState);
      if (!gameState.config.noSnapshots) {
        gameState.snapshots.push(getCanvasSnapshot(gameState)); // record state
      }
    } catch (error) {
      console.log("Game ended with an error", error);
      gameState.gameOver = true;
    }
  }

  if (gameState.config.noDelay) {
    while (!gameState.gameOver) {
      if (gameState.paused) continue;
      runFrame();
    }
    endGame(gameState);
  } else {
    const fps = document.querySelector("#fps-input").value;
    gameState.gameLoopIntervalId = setTimeout(runFrame, 1000 / fps);
  }
}

function drawCanvas(gameState) {
  gameState.context.fillStyle = "white";
  gameState.context.fillRect(
    0,
    0,
    gameState.canvas.width,
    gameState.canvas.height,
  );
  gameState.context.strokeStyle = "black";
  gameState.context.strokeRect(
    0,
    0,
    gameState.canvas.width,
    gameState.canvas.height,
  );
  drawSnake(gameState);
  drawFruit(gameState);
}

function drawSnake(gameState) {
  gameState.context.fillStyle = "green";
  gameState.context.strokeStyle = "darkgreen";
  for (let i = 0; i < gameState.snake.length; i++) {
    gameState.context.fillStyle = i === 0 ? "green" : "lightgreen";
    let {x: width, y: height} = rescale({x: 2, y: 2}, gameState);
    gameState.context.fillRect(
      gameState.snake[i].x,
      gameState.snake[i].y,
      width,
      height,
    );
    gameState.context.strokeRect(
      gameState.snake[i].x,
      gameState.snake[i].y,
      width,
      height,
    );
  }
}

function drawPath(gameState, path) {
  let {x: width, y: height} = rescale({x: 2, y: 2}, gameState);
  gameState.context.fillStyle = "yellow";
  for (let i = 0; i < path.length; i++) {
    gameState.context.fillRect(path[i].x, path[i].y, width, height);
  }
}

function drawFruit(gameState) {
  let {x: width, y: height} = rescale({x: 2, y: 2}, gameState);
  gameState.context.fillStyle = "red";
  gameState.context.strokeStyle = "darkred";
  gameState.context.fillRect(gameState.fruit.x, gameState.fruit.y, width, height);
  gameState.context.strokeRect(gameState.fruit.x, gameState.fruit.y, width, height);
}

// heuristics

function findFruitBFS(gameState, head, fruit) {
  const queue = [];
  const visited = new Set();
  const directions = [
    { x: 0, y: -2 }, // Up
    { x: 0, y: 2 }, // Down
    { x: -2, y: 0 }, // Left
    { x: 2, y: 0 }, // Right
  ].map((s) => rescale(s, gameState));
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

  if (!gameState.config.noAgent) {
    let nextPosition = agentNextPosition(gameState);
    if (nextPosition === null) {
      gameState.gameOver = true;
      return;
    }
    if (nextPosition.x == head.x && nextPosition.y == head.y) {
      nextPosition = agentNextPosition(gameState);
      if (nextPosition === null) {
        gameState.gameOver = true;
        return;
      }
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
  let {x: width, y: height} = rescale({x: 2, y: 2}, gameState);
  if (
    gameState.snake[0].x < 0 ||
    gameState.snake[0].x > gameState.canvas.width - width ||
    gameState.snake[0].y < 0 ||
    gameState.snake[0].y > gameState.canvas.height - height
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
    let {x: width, y: height} = rescale({x: 2, y: 2}, gameState);
    do {
    gameState.fruit.x =
      Math.floor(Math.random() * (gameState.canvas.width / width)) * width;
    gameState.fruit.y =
      Math.floor(Math.random() * (gameState.canvas.height / height)) * height;
  } while (isSnakeCollision(gameState, gameState.fruit));
}

const gameOverMask = document.getElementById("game-over-mask");

function endGame(gameState) {
  let { resolve, snapshots, canvas, context, ...states } = gameState;

  console.log("finalState", JSON.stringify(states));
  if (gameState.config.noSnapshots) {
    states.endTime = performance.now();
    resolve(states);
    return;
  }

  const params = {
    Bucket: "snake-container",
    Key: gameState.userId + "/" + Date.now() + ".json",
  };

  const message = JSON.stringify(snapshots);
  console.log("prepost");

  params.Body = message;
  params.ContentMD5 = btoa(CryptoJS.MD5(message).toString(CryptoJS.enc.Latin1));
  console.log("encoded");
  s3.putObject(params, function (error, data) {
    if (error) {
      reject(error);
    } else if (data) {
      states.endTime = performance.now();
      resolve(states.startTime, states.endTime);
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

function restartGame() {
  startEl.style.display = "block";
  gameBoard.style.display = "none";
  gameOverMask.style.display = "none";
}

// Get direction
function getDirection(gameState) {
    let {x: width, y: height} = rescale({x: 2, y: 2}, gameState);
    switch (gameState.direction) {
    case "up":
      return { x: 0, y: -height };
    case "down":
      return { x: 0, y: height };
    case "left":
      return { x: -width, y: 0 };
    case "right":
    default:
      return { x: width, y: 0 };
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

async function startGame() {
  const autoRestart = Number.parseInt(
    document.getElementById("auto-restart").value,
  );
  const rounds = 1 + autoRestart;
  let config = {
    noSnapshots: false,
    noDelay: false,
    noAgent: false,
  };
  const userIdInput = document.getElementById("user-id").value;
  if (!userIdInput) {
    alert("please input userId");
    return;
  }
  config.noSnapshots = document.getElementById("no-snapshots").checked;
  config.noDelay = document.getElementById("no-delay").checked;
  config.noAgent = document.getElementById("no-agent").checked;
  config.scalor = Number.parseInt(
    document.getElementById("canvas-scalor").value,
  );
  const snakeCount = Number.parseInt(
    document.getElementById("snake-count").value,
  );
  const canvasContainer = document.getElementById("snake-canvas");

  for (let i = 0; i < rounds; i++) {
    const roundStart = performance.now();
    console.log(`Running ${i + 1} out of ${rounds} of games`);
    gameOverMask.style.display = "none";
    startEl.style.display = "none"; // hide the start button
    gameBoard.style.display = "block";

    canvasContainer.innerHTML = "";
    const results = [];
    let doneCount = 0;
    for (let i = 0; i < snakeCount; i++) {
      canvas = document.createElement("canvas");
      canvas.width = 120 * config.scalor;
      canvas.height = 120 * config.scalor;
      canvasContainer.appendChild(canvas);
      results.push(
        launch(userIdInput, canvas, config).then((startTime, endTime) => {
          doneCount++;
          console.log(
            `Done with ${doneCount} out of ${snakeCount} snakes in ${
              endTime - startTime
            }ms; snake #${i + 1}`,
          );
        }),
      );
    }
    await Promise.all(results);
    console.log(
      `Done with round ${i + 1} in ${performance.now() - roundStart}ms`,
    );
  }
  gameOverMask.style.display = "flex";
}
