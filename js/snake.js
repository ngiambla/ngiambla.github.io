

var canvas;
var context;

var grid = 0;
var cellsize = 0;
var hiscore = 0;

var aniframeid;

var midx;
var midy;
  
var snake = {
  x: 0,
  y: 0,
  
  // snake velocity. moves one grid length every frame in either the x or y direction
  dx: 0,
  dy: 0,
  
  // keep track of all grids the snake body occupies
  cells: [],
  
  // length of the snake. grows when eating an apple
  maxCells: 4
};
var apple = {
  x: 0,
  y: 0
};


var stop = false;
var frameCount = 0;
var fpsInterval, startTime, now, then, elapsed;



function initializeGame() {
  canvas = document.getElementById('game');
  canvas.width = document.body.clientWidth; //document.width is obsolete
  canvas.height = document.body.clientHeight; //document.height is obsolete  
  midx = Math.floor(canvas.width/2);
  midy = Math.floor(canvas.height/2);
  
  context = canvas.getContext('2d');
  context.font = '25px Ubuntu Mono';
  if(grid === 0)
    grid = Math.max(context.measureText("@").width, context.measureText("$").width);
  cellsize=grid;
  console.log("GridSize: "+cellsize);
  apple.x = genRandInt(1, cellsize) * grid;
  apple.y = genRandInt(1, cellsize) * grid; 
  
  snake.x = midx;
  snake.y = midy;
  snake.dx = cellsize;
  snake.dy = 0;
  snake.cells = [];
  snake.maxCells = 4;

  $("#game").show();

  // 25 FPS
  fpsInterval = 1000/25;
  then = Date.now();
  startTime = then;
  console.log(startTime);  
  
  aniframeid=requestAnimationFrame(loop);
}

function intersect(x1, y1, width1, x2, y2, width2) {
  return (Math.abs(x1 - x2) * 2 < (width1 + width2)) &&
         (Math.abs(y1 - y2) * 2 < (width1 + width2));
}

function genRandInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// game loop
function loop() {
  aniframeid = requestAnimationFrame(loop);

  // calc elapsed time since last loop
  now = Date.now();
  elapsed = now - then;

  // if enough time has elapsed, draw the next frame

  if (elapsed <= fpsInterval) {
    return;
  }

  then = now - (elapsed % fpsInterval);

  count = 0;
  context.clearRect(0,0,canvas.width,canvas.height);

  // move snake by it's velocity
  snake.x += snake.dx;
  snake.y += snake.dy;

  // wrap snake position horizontally on edge of screen
  if (snake.x <= 0) {
    snake.x = canvas.width - grid;
  }

  else if (snake.x >= canvas.width) {
    snake.x = 0;
  }
  
  // wrap snake position vertically on edge of screen
  if (snake.y <= 0) {
    snake.y = canvas.height - grid;
  }

  else if (snake.y >= canvas.height) {
    snake.y = 0;
  }

  // keep track of where snake has been. front of the array is always the head
  snake.cells.unshift({x: snake.x, y: snake.y});

  // remove cells as we move away from them
  if (snake.cells.length > snake.maxCells) {
    snake.cells.pop();
  }

  // draw score
  context.fillStyle = 'white';
  context.fillText("[ESC] to end.", 0, cellsize);
  if(snake.cells.length > hiscore) {
    hiscore = snake.cells.length;
  }
  context.fillText("Score: "+(snake.cells.length).toString()+" High Score: "+hiscore.toString(), 0, cellsize+cellsize*2);


  // draw apple
  context.fillStyle = 'green';
  context.fillText("$", apple.x, apple.y, cellsize);

  // draw snake one cell at a time
  context.fillStyle = 'red';
  snake.cells.forEach(function(cell, index) {
    
    // drawing 1 px smaller than the grid creates a grid effect in the snake body so you can see how long it is
    context.fillText("@", cell.x, cell.y, cellsize);  


    if (intersect(cell.x, cell.y, cellsize, apple.x, apple.y, cellsize)) {
      snake.maxCells++;
      apple.x = genRandInt(1, midx*2);
      apple.y = genRandInt(1, midy*2);      
    }

    // check collision with all cells after this one (modified bubble sort)
    for (var i = index + 1; i < snake.cells.length; i++) {
      
      // snake occupies same space as a body part. reset game
      if (intersect(cell.x, cell.y, cellsize, snake.cells[i].x, snake.cells[i].y, cellsize)) {
        snake.x = midx;
        snake.y = midy;
        snake.cells = [];
        snake.maxCells = 4;
        snake.dx = grid;
        snake.dy = 0;

        apple.x = genRandInt(1, cellsize) * grid;
        apple.y = genRandInt(1, cellsize) * grid;
      }
    }
  });
}

// listen to keyboard events to move the snake
document.addEventListener('keydown', function(e) {
  // prevent snake from backtracking on itself by checking that it's 
  // not already moving on the same axis (pressing left while moving
  // left won't do anything, and pressing right while moving left
  // shouldn't let you collide with your own body)
  
  // left arrow key
  if (e.which === 37 && snake.dx === 0) {
    snake.dx = -grid;
    snake.dy = 0;
  }
  // up arrow key
  else if (e.which === 38 && snake.dy === 0) {
    snake.dy = -grid;
    snake.dx = 0;
  }
  // right arrow key
  else if (e.which === 39 && snake.dx === 0) {
    snake.dx = grid;
    snake.dy = 0;
  }
  // down arrow key
  else if (e.which === 40 && snake.dy === 0) {
    snake.dy = grid;
    snake.dx = 0;
  }
  else if (e.which === 27) {
    cancelAnimationFrame(aniframeid);
    $("#game").hide();
    term.show().enable();
  }
});
