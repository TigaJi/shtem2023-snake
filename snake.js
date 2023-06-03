// get canvas and button
const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')
const restartBtn = document.getElementById('restart-btn')

// init
let score = 0 

// init snake and fruit
let snake = [
  { x: 200, y: 200 },
  { x: 190, y: 200 },
  { x: 180, y: 200 },
  { x: 170, y: 200 },
  { x: 160, y: 200 }
]
let fruit = { x: 0, y: 0 }

// init direction and action
let direction = 'right'
let changingDirection = false

// init game loop and gameover flag
let gameLoopIntervalId
let gameOver = false

// record states 
const snapshots = []

// game loop
function gameLoop() {
  const fps = document.querySelector('#fps-input').value
  gameLoopIntervalId = setTimeout(function () {
    if (!gameOver) {
      requestAnimationFrame(gameLoop)
      drawCanvas() // draw canvas
      moveSnake() // move the snake
      checkCollision() // check for game ending condition
      drawScore() 
      snapshots.push(getCanvasSnapshot()) // record state
    }
  }, 1000 / fps)
}


function drawCanvas() {
  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = 'black'
  context.strokeRect(0, 0, canvas.width, canvas.height)
  drawSnake() 
  drawFruit() 
}


function drawSnake() {
  context.fillStyle = 'green'
  context.strokeStyle = 'darkgreen'
  for (let i = 0; i < snake.length; i++) {
    context.fillStyle = i === 0 ? 'green' : 'lightgreen'
    context.fillRect(snake[i].x, snake[i].y, 10, 10)
    context.strokeRect(snake[i].x, snake[i].y, 10, 10)
  }
}


function drawFruit() {
  context.fillStyle = 'red'
  context.strokeStyle = 'darkred'
  context.fillRect(fruit.x, fruit.y, 10, 10)
  context.strokeRect(fruit.x, fruit.y, 10, 10)
}


function moveSnake() {
  const head = { x: snake[0].x + getDirection().x, y: snake[0].y + getDirection().y }
  snake.unshift(head) // add head
  if (!ateFruit()) {
    snake.pop() // delete tail if no fruit is eaten
  } else {
    score++ // increment score
    updateFruitPosition() // update fruit position
  }
  changingDirection = false
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
    gameOver = true
    endGame()
  }

  // hit self
  for (let i = 1; i < snake.length; i++) {
    if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
      gameOver = true
      endGame()
    }
  }
}


function drawScore() {
  document.querySelector('.score > span').innerText = score
}


function ateFruit() {
  return snake[0].x === fruit.x && snake[0].y === fruit.y
}


function updateFruitPosition() {
  fruit.x = Math.floor(Math.random() * (canvas.width / 10)) * 10
  fruit.y = Math.floor(Math.random() * (canvas.height / 10)) * 10
}

const maskEl = document.querySelector('.mask')

function endGame() {
  maskEl.style.display = 'flex'

  console.log('snapshots', snapshots)

  // TODO: upload data to S3 when an episode ends; Utilize "user_id" to record the trajectories for each player


}

// 获取方向
function getDirection() {
  if (direction === 'up') {
    return { x: 0, y: -10 }
  } else if (direction === 'down') {
    return { x: 0, y: 10 }
  } else if (direction === 'left') {
    return { x: -10, y: 0 }
  } else {
    return { x: 10, y: 0 }
  }
}

// keyboard listener
document.addEventListener('keydown', function (event) {
  if (!changingDirection) {
    if (event.keyCode === 37 && direction !== 'right') {
      direction = 'left'
      changingDirection = true
    } else if (event.keyCode === 38 && direction !== 'down') {
      direction = 'up'
      changingDirection = true
    } else if (event.keyCode === 39 && direction !== 'left') {
      direction = 'right'
      changingDirection = true
    } else if (event.keyCode === 40 && direction !== 'up') {
      direction = 'down'
      changingDirection = true
    }
  }
})

// state recorder
function getCanvasSnapshot() {
  // record direction (action)
  const currentDirection = direction

  // record snake head position and fruit position (An alternative for state representation)
  const snakeHeadPosition = { x: snake[0].x, y: snake[0].y }
  const fruitPosition = { x: fruit.x, y: fruit.y }

  // create a new canvas and save as image(state)
  const snapshotCanvas = document.createElement('canvas')
  snapshotCanvas.width = canvas.width
  snapshotCanvas.height = canvas.height
  const snapshotContext = snapshotCanvas.getContext('2d')


  snapshotContext.drawImage(canvas, 0, 0)

  // turn snapshot to base64 data
  const imageData = snapshotCanvas.toDataURL()

  // return time and data
  return {
    time: new Date().getTime(),
    imageData,
    currentDirection,
    snakeHeadPosition,
    fruitPosition
  }
}


restartBtn.addEventListener('click', function () {
  document.location.reload()
})

// start
const startEl = document.querySelector('.before-start')

const gameBoard = document.querySelector('.game')
// userId input
const userIdInput = document.querySelector('#user-id')

function startGame() {
  if (!userIdInput.value) {
    alert('please input userId')
    return
  }
  gameBoard.style.display = 'block' 
  updateFruitPosition() 
  gameLoop() // game start
  startEl.style.display = 'none' // hide the start button
}
