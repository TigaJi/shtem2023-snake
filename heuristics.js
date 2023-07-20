import * as snaker from "snake.js";

//some local variables used by the worker to track it's state.
let config = new Object();
let stats = new Object();
stats.moves = 0;
stats.food = 0;
stats.count = 0;
let grid;
let food;
let moves = new Array();


config.grid_size = snaker.canvas.width;
config.snake_length = snake.length;
config.search = 'BFS';
config.runTimeout = 0; // not used
//Point class, used to refer to a specific square on the grid
function Point(pos_x,pos_y){
	this.x = pos_x;
	this.y = pos_y;
}
//Node class, used by searches as nodes in a tree.
function Node(parent,point,children,g_score,h_score){
	this.parent = parent;
	this.point = point;
	this.children = children;
	this.g_score = g_score;
	this.h_score = h_score;
	this.f_score = g_score + h_score;
}



let snake = new Array(config.snake_length);



// 0=empty
// 1=snake
// 2=food
// 3=wall
//initialize the state of the grid.
function init(){
    // init for snake positions
    for (let i = 0; i < snake.length; i++) {
        let point = snake[i];
        snake.push(new Point(point.x, point.y));
    }
    
    // init for grid
	grid = new Array(config.grid_size);
	for(var i=0;i<config.grid_size;i++){
		grid[i] = new Array(config.grid_size);
	}
	//initialize square values, set walls
	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			if(i == 0 || j == 0 || i == config.grid_size-1 || j == config.grid_size-1){
				grid[i][j] = 3;
			}else{
				grid[i][j] = 0;
			}
		}
	}
}


//Breadth First Search
function junyaoPlay(){

	// Creating our Open and Closed Lists
	var queue = new Array();
	var gridState = new Array(config.grid_size);
	for(var i=0;i<config.grid_size;i++){
		gridState[i] = new Array(config.grid_size);
	}
	//initialize gridState values to 0
	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			gridState[i][j] = 0;
		}
	}
	
	
	// Adding our starting point to Open List
	queue.push(new Node(null,snake[0],new Array()));
	// Loop while queue contains some data.
	while (queue.length != 0) {
		var n = queue.shift();
		if(gridState[n.point.x][n.point.y] == 1)
			continue;
		stats.count++;
		// Check if node is food
		if (grid[n.point.x][n.point.y] == 2) {
			//if we have reached food, climb up the tree until the root to obtain path
			do{
				moves.unshift(n.point);
				if(grid[n.point.x][n.point.y] == 0)
					grid[n.point.x][n.point.y] = 1;
				n = n.parent;
			}while(n.parent != null)
			break;
		}
		// Add current node to gridState
		gridState[n.point.x][n.point.y] = 1;
		
		// Add adjacent nodes to queue to be processed.
		if(gridState[n.point.x][n.point.y-1] == 0 && (grid[n.point.x][n.point.y-1] == 0 || grid[n.point.x][n.point.y-1] == 2))
			n.children.unshift(new Node(n,new Point(n.point.x,n.point.y-1),new Array()));
		if(gridState[n.point.x+1][n.point.y] == 0 && (grid[n.point.x+1][n.point.y] == 0 || grid[n.point.x+1][n.point.y] == 2))
			n.children.unshift(new Node(n,new Point(n.point.x+1,n.point.y),new Array()));
		if(gridState[n.point.x][n.point.y+1] == 0 && (grid[n.point.x][n.point.y+1] == 0 || grid[n.point.x][n.point.y+1] == 2))
			n.children.unshift(new Node(n,new Point(n.point.x,n.point.y+1),new Array()));
		if(gridState[n.point.x-1][n.point.y] == 0 && (grid[n.point.x-1][n.point.y] == 0 || grid[n.point.x-1][n.point.y] == 2))
			n.children.unshift(new Node(n,new Point(n.point.x-1,n.point.y),new Array()));
		for(var i=0;i<n.children.length;i++){
			queue.push(n.children[i]);
		}
	}
}

// work in progress
function tylerPlay() {
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


