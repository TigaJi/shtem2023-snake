// get canvas and button
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const restartBtn = document.getElementById('restart-btn');

// init
let score = 0;

// init snake and fruit
let snake = [
  { x: 200, y: 200 },
  { x: 190, y: 200 },
  { x: 180, y: 200 },
  { x: 170, y: 200 },
  { x: 160, y: 200 }
];
let fruit = { x: 0, y: 0 };

// init direction and action
let direction = 'right';
let changingDirection = false;

// init game loop and gameover flag
let gameLoopIntervalId = 0;
let gameOver = false;
let paused = false;

// record states 
const snapshots = [];

// game loop
function gameLoop() {
  const fps = document.querySelector('#fps-input').value;

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


function drawCanvas() {
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'black';
  context.strokeRect(0, 0, canvas.width, canvas.height);
  drawSnake();
  drawFruit();
}


function drawSnake() {
  context.fillStyle = 'green';
  context.strokeStyle = 'darkgreen';
  for (let i = 0; i < snake.length; i++) {
    context.fillStyle = i === 0 ? 'green' : 'lightgreen';
    context.fillRect(snake[i].x, snake[i].y, 10, 10);
    context.strokeRect(snake[i].x, snake[i].y, 10, 10);
  }
}


function drawFruit() {
  context.fillStyle = 'red';
  context.strokeStyle = 'darkred';
  context.fillRect(fruit.x, fruit.y, 10, 10);
  context.strokeRect(fruit.x, fruit.y, 10, 10);
}


function moveSnake() {
  const head = { x: snake[0].x + getDirection().x, y: snake[0].y + getDirection().y };
  snake.unshift(head); // add head
  if (!ateFruit()) {
    snake.pop(); // delete tail if no fruit is eaten
  } else {
    score++; // increment score
    updateFruitPosition(); // update fruit position
  }
  changingDirection = false;
}

// check for game end
function checkCollision() {
  // hit the wall
  if (snake[0].x < 0 ||
    snake[0].x > canvas.width - 10 ||
    snake[0].y < 0 ||
    snake[0].y > canvas.height - 10) {
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
}


function drawScore() {
  document.getElementById('score-value').innerText = score;
}


function ateFruit() {
  return snake[0].x === fruit.x && snake[0].y === fruit.y;
}


function updateFruitPosition() {
  fruit.x = Math.floor(Math.random() * (canvas.width / 10)) * 10;
  fruit.y = Math.floor(Math.random() * (canvas.height / 10)) * 10;
}

const gameOverMask = document.getElementById('game-over-mask');


function endGame() {
  gameOverMask.style.display = 'flex';

  console.log('snapshots', snapshots);

  const userId = userIdInput.value;
  const params = {
    Bucket: 'snake-container',
    Key: userId + '/' + Date.now() + '.json'
  };
  
  const message = JSON.stringify(snapshots);

  params.Body = message;
  params.ContentMD5 = CryptoJS.MD5(message).toString(CryptoJS.enc.Base64);

  s3.putObject(params, function (error, data) {
    if (error) {
      console.log(error, error.stack);
    } else if (data) {
      console.log(data);
    }
  });
}

const pausedMask = document.getElementById('paused-mask');


function pauseGame() {
  console.log("pause")
  paused = true;
  pausedMask.style.display = 'flex';
}


function resumeGame() {
  console.log("resume")
  paused = false;
  pausedMask.style.display = 'none';
}


function restartGame() {
  document.location.reload();
}


// 获取方向
function getDirection() {
  switch (direction) {
    case 'up': return { x: 0, y: -10 };
    case 'down': return { x: 0, y: 10 };
    case 'left': return { x: -10, y: 0 };
    case 'right':
    default:
      return { x: 10, y: 0 };
  }
}


// keyboard listener
document.addEventListener('keydown', function (event) {
  if (event.key === ' ') {
    if (gameOver){
      restartGame();
    } else if (paused) {
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

  if (event.key === 'ArrowLeft' && direction !== 'right') {
    direction = 'left';
  } else if (event.key === 'ArrowUp' && direction !== 'down') {
    direction = 'up';
  } else if (event.key === 'ArrowRight' && direction !== 'left') {
    direction = 'right';
  } else if (event.key === 'ArrowDown' && direction !== 'up') {
    direction = 'down';
  }
});


// state recorder
function getCanvasSnapshot() {
  // record direction (action)
  const currentDirection = direction;

  // record snake head position and fruit position (An alternative for state representation)
  const snakeHeadPosition = { x: snake[0].x, y: snake[0].y };
  const fruitPosition = { x: fruit.x, y: fruit.y };

  // create a new canvas and save as image(state)
  const snapshotCanvas = document.createElement('canvas');
  snapshotCanvas.width = canvas.width;
  snapshotCanvas.height = canvas.height;
  const snapshotContext = snapshotCanvas.getContext('2d');

  snapshotContext.drawImage(canvas, 0, 0);

  // turn snapshot to base64 data
  const imageData = snapshotCanvas.toDataURL();

  // return time and data
  return {
    time: Date.now(),
    imageData,
    currentDirection,
    snakeHeadPosition,
    fruitPosition
  };
}


// start
const startEl = document.getElementById('before-start');

const gameBoard = document.getElementById('game');
// userId input
const userIdInput = document.getElementById('user-id');


function startGame() {
  if (!userIdInput.value) {
    alert('please input userId');
    return;
  }
  gameBoard.style.display = 'block';
  updateFruitPosition();
  gameLoop(); // game start
  startEl.style.display = 'none'; // hide the start button
}
