# Term
ASCII Terminal in JS for browser

# Initialisation

```js
function initTerm(width, height, cb){
  let canvas = document.getElementById("myCanvas");
  let context = canvas.getContext("2d");
  let imageObj = new Image();
  imageObj.onload = function(){
    canvas.width  = width*8;
    canvas.height = height*13;
    let term = new Term(width, height, context.drawImage.bind(context));
    term.init(document, imageObj);
    return cb(null, term);
  };
  imageObj.src = "ascii.png";
}
window.onload = function(){
  initTerm(80,24,function(err, term){
    if(err){
      console.log(err);
      return;
    }
    // Your code goes here !
  });
}
```

check the index.html for example

# Demo

https://croquelois.github.io/Term/index.html

# Feature

- basic ASCII character
- 28 colors

# Methods

```js
constructor(w, h, drawImage) // Constructor
init(document, imageObj) // Initialisation
getSize() // Return the size of the terminal (in characters)
getChr(pos) // Get color and character {col,chr} for this position {x,y}
isValidChr(chr) // Check if the character belong to the supported character set
save() // Save the terminal, return a copy of the internal state
load(savedGrid) // Reload a previously saved terminal
dump(file,s,e) // Return the screen in the file array, start at row 's', end at 'e'

fresh(force) // Refresh the screen, call it after you've changed something
redraw() // Force a redraw, same as fresh(true)

clearFrom(row) // Clear this row and below
clear() // Clear the terminal

setCursor(active) // Activate the blinking of the cursor
getCursor() // Retrieve the blinking state of the cursor
go(pos) // Move cursor position
addChr(col, chr) // Add a character at the current cursor position, move the cursor
addStr(col, str) // Add a string at the current cursor position, move the cursor
locate() // Return the current position of the cursor

putChr(p, col, chr) // Put a single character at position p
putStr(p, col, str) // Put a text at position p
putStrCentred(x1, x2, y, col, str) // Put a centered text between x1 and x2
erase(p, n) // Erase the position and n characters after
print(p, col, str) // erase the line then print text  

putText(reg, col, str) // Put text and wrap it in the region 'reg' {col,row,rows,width}
putWrappedText(opt, col, str) // Put text and wrap it
windowMake(p1, p2) // Draw a surround box in ASCII art
```