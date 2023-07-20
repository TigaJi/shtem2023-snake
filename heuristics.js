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


