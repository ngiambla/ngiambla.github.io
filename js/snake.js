

var canvas;
var context;

var grid = 16;
var cellsize=grid;
var count = 0;

var aniframeid;
  
var snake = {
  x: 160,
  y: 160,
  
  // snake velocity. moves one grid length every frame in either the x or y direction
  dx: grid,
  dy: 0,
  
  // keep track of all grids the snake body occupies
  cells: [],
  
  // length of the snake. grows when eating an apple
  maxCells: 4
};
var apple = {
  x: 320,
  y: 320
};


function initializeGame() {
  canvas = document.getElementById('game');
  context = canvas.getContext('2d');
  context.font = '25px Ubuntu Mono';
  $("#game").show();
  aniframeid=requestAnimationFrame(loop);
}

function genRandInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// game loop
function loop() {
  aniframeid = requestAnimationFrame(loop);

  // Approximate game loop to 15 fps = (60fps/15fps = 4)
  if (++count < 4) {
    return;
  }

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
  if (snake.y <= grid*2) {
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
  context.fillText("Score: "+(snake.cells.length).toString(), cellsize, cellsize);


  // draw apple
  context.fillStyle = 'green';
  context.fillText("$", apple.x, apple.y, cellsize);

  // draw snake one cell at a time
  context.fillStyle = 'red';
  snake.cells.forEach(function(cell, index) {
    
    // drawing 1 px smaller than the grid creates a grid effect in the snake body so you can see how long it is
    context.fillText("@", cell.x, cell.y, cellsize);  

    // snake ate apple
    if (cell.x === apple.x && cell.y === apple.y) {
      snake.maxCells++;

      // canvas is 400x400 which is 25x25 grids 
      apple.x = genRandInt(1, cellsize) * grid;
      apple.y = genRandInt(4, cellsize) * grid;
    }

    // check collision with all cells after this one (modified bubble sort)
    for (var i = index + 1; i < snake.cells.length; i++) {
      
      // snake occupies same space as a body part. reset game
      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        snake.x = 160;
        snake.y = 160;
        snake.cells = [];
        snake.maxCells = 4;
        snake.dx = grid;
        snake.dy = 0;

        apple.x = genRandInt(1, cellsize) * grid;
        apple.y = genRandInt(4, cellsize) * grid;
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
