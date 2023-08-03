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

let agent = true;
let pathToFruit = [];
let it = -1;
// Return 
function init(){
  document.addEventListener('keydown', function (event) {
    if (event.key === ' ') {
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
}


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

function drawPath() {
  context.fillStyle = 'yellow';
  for (let i = 0; i < pathToFruit.length; i++) {
    context.fillRect(pathToFruit[i].x, pathToFruit[i].y, 10, 10);
  }
}

function drawFruit() {
  context.fillStyle = 'red';
  context.strokeStyle = 'darkred';
  context.fillRect(fruit.x, fruit.y, 10, 10);
  context.strokeRect(fruit.x, fruit.y, 10, 10);
}

function findFruitBFS(head, fruit) {
  const queue = [];
  const visited = new Set();
  const directions = [
    { x: 0, y: -10 }, // Up
    { x: 0, y: 10 }, // Down
    { x: -10, y: 0 }, // Left
    { x: 10, y: 0 } // Right
  ];

  queue.push({ position: head, path: [] });
  visited.add(`${head.x},${head.y}`);
  console.log(fruit)

  while (queue.length > 0) {
    const { position, path } = queue.shift();

    if (position.x === fruit.x && position.y === fruit.y) {
      return [...path, position];
    }

    for (const direction of directions) {
      const newPosition = {
        x: position.x + direction.x,
        y: position.y + direction.y
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

  return null;
 }

// work in progress
function tailSearch() {
	const adjacentes = (a, xMax, yMax) =>
	  [
	    [a[0], a[1] - 1],
	    [a[0] + 1, a[1]],
	    [a[0], a[1] + 1],
	    [a[0] - 1, a[1]],
	  ].filter((b) => b[0] >= 0 && b[1] >= 0 && b[0] <= xMax && b[1] <= yMax);
	const equals = ([x1, y1], [x2, y2]) => x1 === x2 && y1 === y2;
	const includes = (a, b) => a.some((a) => equals(a, b));
	const difference = (a, b) => a.filter((a) => !includes(b, a));
	const shift = (a, b, collect) =>
	  b.concat(a).slice(0, b.length + (a.length - b.length + (collect ? 1 : 0)));
	const tail = (a) => a[a.length - 1];
	
	const search = (start, end, xMax, yMax, snake) => {
	  const queue = [start];
	  const paths = { [start]: [start] };
	
	  while (queue.length) {
	    const current = queue.shift();
	    const snakeShifted = shift(
	      snake,
	      (paths[current] = paths[current] || [start])
	    );
	
	    if (equals(current, end)) {
	      return paths[current];
	    }
	
	    for (const next of difference(
	      adjacentes(current, xMax, yMax),
	      snakeShifted
	    )) {
	      if (!(next in paths)) {
	        queue.push(next);
	        paths[next] = [next].concat(paths[current]);
	      }
	    }
	  }
	};
	
	/**
	 * The heuristic function will be run on every cell, and should return a number. The number that is returned will be used to determine the path of the snake.
	 *
	 * @param [number, number] cell Coordinates of the cell to return a value for
	 * @param number xLength The number of cells across the x axis
	 * @param number yLength The number of cells across the y axis
	 * @param [number, number][] snakeOrigin Coordinates of the position of the snake from head to tail. E.g. [[4, 1], [3, 1]]
	 * @param [number, number] point Coordinates of the point.
	 *
	 * @returns number The value for the cell
	 */
	function heuristic(cell, xLength, yLength, snake, point) {
	  const size = xLength * yLength * 2;
	  const xMax = xLength - 1;
	  const yMax = yLength - 1;
	
	  if (!includes(adjacentes(snake[0], xMax, yMax), cell)) return 0;
	
	  const pathToPoint = search(cell, point, xMax, yMax, snake);
	
	  if (pathToPoint) {
	    const snakeAtPoint = shift(snake, pathToPoint, true);
	
	    for (const next of difference(
	      adjacentes(point, xMax, yMax),
	      snakeAtPoint
	    )) {
	      if (search(next, tail(snakeAtPoint), xMax, yMax, snakeAtPoint)) {
	        return pathToPoint.length;
	      }
	    }
	  }
	
	  const pathToTail = search(cell, tail(snake), xMax, yMax, snake);
	
	  if (pathToTail) {
	    return size - pathToTail.length;
	  }
	
	  return size * 2;
	}
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
  if (it==-1 || it==pathToFruit.length) {
    const head = {
      x: snake[0].x,
      y: snake[0].y
    };
    const fruitPosition = { x: fruit.x, y: fruit.y };
    pathToFruit = findFruitBFS(head, fruitPosition);
    console.log("Path updated in agent next")
    console.log(pathToFruit)
    // pathToFruit = tailSearch();
    it = 0;
  }
  if (it >= 0 && it < pathToFruit.length){
    drawPath();
    nextPosition = pathToFruit[it]
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
  if (agent){
    if (!ateFruit()) {
      snake.pop();
    } else { 
      // Fruit is eaten
      score++;
      updateFruitPosition();

      const head = {
        x: snake[0].x + getDirection().x,
        y: snake[0].y + getDirection().y
      };
      const fruitPosition = { x: fruit.x, y: fruit.y };
      // pathToFruit = findFruitBFS(head, fruitPosition);
      // console.log("path updated")
      // console.log(pathToFruit)
      // it = 0;
    }
    const nextPosition = agentNextPosition();
    console.log(nextPosition)
    const deltaX = nextPosition.x - snake[0].x;
    const deltaY = nextPosition.y - snake[0].y;
    console.log(deltaX, deltaY)
    if (deltaX > 0) {
      document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowRight'}));
      // direction = 'right';
    } else if (deltaX < 0) {
      document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowLeft'}));
      // direction = 'left';
    } else if (deltaY > 0) {
      document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowDown'}));
      // direction = 'down';
    } else if (deltaY < 0) {
      document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowUp'}));
      // direction = 'up';
    } else {
      console.log("Error: deltaX = deltaY = 0")
    }
    snake.unshift(head);

  
    changingDirection = false;

  }
  head.x += getDirection().x;
  head.y += getDirection().y;


}

// function moveSnake() {
  // const head = { x: snake[0].x + getDirection().x, y: snake[0].y + getDirection().y };
  // snake.unshift(head); // add head
  // if (!ateFruit()) {
  //   snake.pop(); // delete tail if no fruit is eaten
  // } else {
  //   score++; // increment score
  //   updateFruitPosition(); // update fruit position
  // }
  // changingDirection = false;
// }

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
  params.ContentMD5 = btoa(CryptoJS.MD5(message).toString(CryptoJS.enc.Latin1));

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


// Get direction
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
  init();
  updateFruitPosition();
  
  gameLoop(); // game start
  startEl.style.display = 'none'; // hide the start button
}
