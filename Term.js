/* jshint undef: true, unused: true, sub:true, loopfunc:true, esversion:6, node:true, browser:true */
/* globals Grid */

(function(){

/* jshint ignore:start */
if(typeof module !== 'undefined' && module.exports){
  Grid = require("./Grid.js");
}
/* jshint ignore:end */

const TERM_DARK  =   0;  /* d */    /* 0 0 0 */
const TERM_WHITE  =  1;  /* w */    /* 4 4 4 */
const TERM_SLATE  =  2;  /* s */    /* 2 2 2 */
const TERM_ORANGE  = 3;  /* o */    /* 4 2 0 */
const TERM_RED     = 4;  /* r */    /* 3 0 0 */
const TERM_GREEN   = 5;  /* g */    /* 0 2 1 */
const TERM_BLUE   =  6;  /* b */    /* 0 0 4 */
const TERM_UMBER  =  7;  /* u */    /* 2 1 0 */
const TERM_L_DARK =  8;  /* D */    /* 1 1 1 */
const TERM_L_WHITE = 9;  /* W */    /* 3 3 3 */
const TERM_L_PURPLE =10; /* P */    /* ? ? ? */
const TERM_YELLOW =  11; /* y */    /* 4 4 0 */
const TERM_L_RED  =  12; /* R */    /* 4 0 0 */
const TERM_L_GREEN = 13; /* G */    /* 0 4 0 */
const TERM_L_BLUE  = 14; /* B */    /* 0 4 4 */
const TERM_L_UMBER = 15; /* U */    /* 3 2 1 */

const TERM_PURPLE   =   16;    /* p */
const TERM_VIOLET   =   17;    /* v */
const TERM_TEAL     =   18;    /* t */
const TERM_MUD       =  19;    /* m */
const TERM_L_YELLOW  =  20;    /* Y */
const TERM_MAGENTA   =  21;    /* i */
const TERM_L_TEAL   =   22;    /* T */
const TERM_L_VIOLET =   23;    /* V */
const TERM_L_PINK   =   24;    /* I */
const TERM_MUSTARD  =   25;    /* M */
const TERM_BLUE_SLATE = 26;    /* z */
const TERM_DEEP_L_BLUE =27;    /* Z */

function textWrapInternal(term,w,h,sx,pad,x,y,col,str){
  const len = str.length;
  for(let j=0;j<len;j++){
    let s = str[j];
    if(s == '\n'){
      x = sx;
      y++;
      if(y >= h)
        throw new Error("problem during the text wrapping");
      term.erase({x,y}, w-sx);
      x += pad;
      continue;
    }
    if((x >= w - 1) && (s != ' ')){
      let cv = [];
      let n = sx;
      if(x < w){
        for(let i=w-2;i>=sx;i--){
          cv[i] = term.getChr({x:i,y}).chr;
          if(cv[i] == ' ') break;
          n = i;
        }
      }
      if (n == sx) n = w;
      term.erase({x:n,y}, w-n);
      y++;
      if(y >= h)
        throw new Error("problem during the text wrapping");
      x = sx;
      term.erase({x,y}, w-sx);
      x += pad;      
      for (let i = n; i < w - 1; i++){
        term.putChr({x,y}, col, cv[i]);
        if (++x > w) x = w;
      }
    }
    term.putChr({x,y}, col, s);
    if (++x > w) x = w;
  }
  return {x,y};
}

class Term {
  constructor(w, h, drawImage){
    this.drawImage = drawImage || function(){};
    this.grid = new Grid(w,h);
    this.offset = {x:0,y:0};
    this.map = {x:13,y:1};
    this.size = {x:w,y:h};
    this.pos = {x:0,y:0};
    this.oldPos = null;
    this.cursor = false;
    let posChr = [];
    const lines =
      ["!\"#$%&'()*+,-./0123456789:;<=>?@",
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`",
      "abcdefghijklmnopqrstuvwxyz{|}~ "];
    for(let y=0;y<lines.length;y++)
      for(let x=0;x<lines[y].length;x++)
        posChr[lines[y].substr(x,1)] = {x,y};
    this.posChr = posChr;
    this.imgs = [];
    this.savedState = [];
    this.grid.each(function(){ return {col:TERM_DARK,chr:' ',change:true}; });
    this.message = null;
  }

  // screen
  init(document, imageObj){
    function imgColor(imageObj, front, back) {
      let c = document.createElement('canvas');
      c.width = imageObj.width; c.height = imageObj.height;
      let ctx = c.getContext('2d');
      ctx.drawImage(imageObj,0,0);
      let pixels = ctx.getImageData(0,0,c.width,c.height);
      let d = pixels.data;
      let fr = (front >> 24) & 0xFF;
      let fg = (front >> 16) & 0xFF;
      let fb = (front >> 8)  & 0xFF;
      let fa = (front >> 0)  & 0xFF;
      let br = (back >> 24)  & 0xFF;
      let bg = (back >> 16)  & 0xFF;
      let bb = (back >> 8)   & 0xFF;
      let ba = (back >> 0)   & 0xFF;
      for (let i=0; i<d.length; i+=4){
        if(d[i] == 0xFF){
          d[i] = fr;
          d[i+1] = fg;
          d[i+2] = fb;
          d[i+3] = fa;
        }else{
          d[i] = br;
          d[i+1] = bg;
          d[i+2] = bb;
          d[i+3] = ba;
        }
      }
      ctx.putImageData(pixels, 0, 0);
      return c;
    }
    /* @@@@CROQ@@@@ it was a good try, but your character set can't handle it
    let posChr = this.posChr;
    function voyelWithAccent(opaqueObj, transObj){
      let c = document.createElement('canvas');
      c.width = imageObj.width; 
      c.height = imageObj.height+13;
      let ctx = c.getContext('2d');
      ctx.drawImage(opaqueObj,0,0);
      let posChar = posChr["a"];
      let posAcct = posChr["^"];
      let posDest = posChr["â"];
      ctx.drawImage(opaqueObj, posChar.x*8, posChar.y*13, 8, 13, posDest.x*8, posDest.y*13, 8, 13);
      ctx.drawImage(transObj,  posAcct.x*8, posAcct.y*13, 8, 13, posDest.x*8, posDest.y*13, 8, 13);
      return c;
    }
    imageObj = voyelWithAccent(imageObj, imgColor(imageObj,0xFFFFFFFF,0x00000000));
    */
    this.imgTransparent         = imgColor(imageObj,0xFFFFFFFF,0x00000000);
    this.imgs[TERM_DARK] =        imgColor(imageObj,0xFFFFFFFF,0x000000FF); // need to review (problem with potion)
    this.imgs[TERM_WHITE] =       imgColor(imageObj,0xFFFFFFFF,0x000000FF);
    this.imgs[TERM_SLATE] =       imgColor(imageObj,0x808080FF,0x000000FF);
    this.imgs[TERM_ORANGE] =      imgColor(imageObj,0xFF8000FF,0x000000FF);
    this.imgs[TERM_RED] =         imgColor(imageObj,0xC00000FF,0x000000FF);
    this.imgs[TERM_GREEN] =       imgColor(imageObj,0x008040FF,0x000000FF);
    this.imgs[TERM_BLUE] =        imgColor(imageObj,0x0000FFFF,0x000000FF);
    this.imgs[TERM_UMBER] =       imgColor(imageObj,0x804000FF,0x000000FF);
    this.imgs[TERM_L_DARK] =      imgColor(imageObj,0x606060FF,0x000000FF);
    this.imgs[TERM_L_WHITE] =     imgColor(imageObj,0xC0C0C0FF,0x000000FF);
    this.imgs[TERM_L_PURPLE] =    imgColor(imageObj,0xFF00FFFF,0x000000FF);
    this.imgs[TERM_YELLOW] =      imgColor(imageObj,0xFFFF00FF,0x000000FF);
    this.imgs[TERM_L_RED] =       imgColor(imageObj,0xFF4040FF,0x000000FF);
    this.imgs[TERM_L_GREEN] =     imgColor(imageObj,0x00FF00FF,0x000000FF);
    this.imgs[TERM_L_BLUE] =      imgColor(imageObj,0x00FFFFFF,0x000000FF);
    this.imgs[TERM_L_UMBER] =     imgColor(imageObj,0xC08040FF,0x000000FF);
    this.imgs[TERM_PURPLE] =      imgColor(imageObj,0x900090FF,0x000000FF);
    this.imgs[TERM_VIOLET] =      imgColor(imageObj,0x9020FFFF,0x000000FF);
    this.imgs[TERM_TEAL] =        imgColor(imageObj,0x00A0A0FF,0x000000FF);
    this.imgs[TERM_MUD] =         imgColor(imageObj,0x6C6C30FF,0x000000FF);
    this.imgs[TERM_L_YELLOW] =    imgColor(imageObj,0xFFFF90FF,0x000000FF);
    this.imgs[TERM_MAGENTA] =     imgColor(imageObj,0xFF00A0FF,0x000000FF);
    this.imgs[TERM_L_TEAL] =      imgColor(imageObj,0x20FFDCFF,0x000000FF);
    this.imgs[TERM_L_VIOLET] =    imgColor(imageObj,0xB8A8FFFF,0x000000FF);
    this.imgs[TERM_L_PINK] =      imgColor(imageObj,0xFF8080FF,0x000000FF);
    this.imgs[TERM_MUSTARD] =     imgColor(imageObj,0xB4B400FF,0x000000FF);
    this.imgs[TERM_BLUE_SLATE] =  imgColor(imageObj,0xA0C0D0FF,0x000000FF);
    this.imgs[TERM_DEEP_L_BLUE] = imgColor(imageObj,0x00B0FFFF,0x000000FF);
  }
    
  save(noInternalState){ // @@@@CROQ@@@@ my goal is to deprecate the usage of the internal state
    if(this.message)
      this.message.flush();
    let grid = this.grid.clone(c => ({col: c.col, chr: c.chr}));
    if(!noInternalState)
      this.savedState.push(grid);
    return grid;
    //console.log("Save", this.savedState.length, Error("stack").stack);
  }

  load(savedGrid){
    if(this.message)
      this.message.flush();
    //console.log("Load", this.savedState.length, Error("stack").stack);
    if(savedGrid){
      this.grid = savedGrid.clone(c => ({col: c.col, chr: c.chr}));
    }else{
      this.grid = this.savedState.pop();
      if(!this.grid) throw Error("uneven number of load/save terminal screen");
    }
    this.fresh(true);
  }

  draw(pos, col, chr){
    let cell = this.grid.get(pos);
    if(typeof col == "string") col = Term.char2colors[col];
    if(col === undefined) throw Error("code error, draw receive undefined color");
    if(!this.posChr[chr]) throw Error("code error, non existing character"); //// @@@@ Remove in prod
    if(col == cell.col && chr == cell.chr) return;
    //if(col === 0 && chr !== ' ') throw new Error("code error, try to paint it black");
    cell.col = col;
    cell.chr = chr;
    cell.change = true;
  }

  dump(file,s,e){
    file = file || [];
    s = s || {x:0,y:0};
    e = e || this.size;
    for(let y=s.y;y<e.y;y++){
      let line = [];
      for(let x=s.x;x<e.x;x++){
        line.push(this.grid.get({x,y}).chr);
      }
      file.push(line.join(""));
    }
    return file;
  }

  fresh(force){
    const w = this.size.x;
    const h = this.size.y;
    const posChr = this.posChr;
    const imgs = this.imgs;
    let g = {};
    let p = '.';
    for(let x=0;x<w;x++)
      for(let y=0;y<h;y++){
        g = this.grid.get({x,y});
        if(!force && !g.change) continue;
        p = posChr[g.chr];
        this.drawImage(imgs[g.col], p.x*8, p.y*13, 8, 13, x*8, y*13, 8, 13);
        g.change = false;
      }
    if(!force && this.oldPos){
      g = this.grid.get(this.oldPos);
      p = posChr[g.chr];
      this.drawImage(imgs[g.col], p.x*8, p.y*13, 8, 13, this.oldPos.x*8, this.oldPos.y*13, 8, 13);
      g.change = false;
      this.oldPos = null;
    }
    if(this.cursor && this.pos){
      this.drawImage(this.imgTransparent, 31*8, 2*13, 8, 13, this.pos.x*8, this.pos.y*13, 8, 13);
      this.oldPos = this.pos;
    }
  }

  setCursor(active){ this.cursor = active; }
  getCursor(){ return this.cursor; }
  go(pos){ this.pos = pos; }
  
  addChr(col, chr){
    if(chr === undefined){ chr = col; col = TERM_WHITE; }
    this.draw(this.pos, col, chr);
    this.pos = {x:this.pos.x + 1, y:this.pos.y};
  }
  
  addStr(col, str){
    if(str === undefined){ str = col; col = TERM_WHITE; }
    let p = {x:this.pos.x,y:this.pos.y};
    for(let i=0;i<str.length;i++){
      if(p.x < this.size.x)
        this.draw(p, col, str[i]);
      p.x++;
    }
    this.pos = p;
  }
  
  putChr(p, col, chr){
    this.draw(p, col, chr);
    this.pos = {x:p.x + 1, y:p.y};
  }
  
  putStr(p, col, str){
    if(p.x < 0)
      p.x = this.size.x-(str||col).length+p.x;
    if(p.y < 0)
      p.y = this.size.x+p.y;
    this.pos = p;
    this.addStr(col, str);
  }
  
  putStrCentred(x1, x2, y, col, str){
    if(str === undefined) 
      return this.putStrCentred(x1, x2, y, TERM_WHITE, col);
    if(str.length > (x2-x1)) 
      console.log("the length of the string is too big to fit");
    let dx = Math.floor((x2-x1)/2 - str.length/2);
    this.putStr({x:x1 + dx,y}, col, str);
  }
  
  erase(p, n){
    if(!p){
      const w = this.size.x;
      const h = this.size.y;
      for(let x=0;x<w;x++)
        for(let y=0;y<h;y++)
          this.draw({x,y}, TERM_DARK, ' ');
    }else{
      if(n === undefined) n = 9999;
      for(let i=0;i<n;i++){ if(p.x+i>=this.size.x) return; this.draw({x:p.x+i,y:p.y}, TERM_DARK, ' '); }
    }
  }
  
  print(p, col, str){
    if(p.y < 0 || p.y >= this.size.y) 
      throw new Error("Unable to print the line, out of screen: " + p);
    if(str === undefined) 
      return this.print(p, TERM_WHITE, col);
    this.erase(p);
    this.putStr(p, col, str);
  }
  
  redraw(/*rect*/){ this.fresh(true); }
  getSize(){ return this.size; }
  locate(){ return this.pos; }
  
  getChr(pos){ 
    let cell = this.grid.get(pos); 
    return {col:cell.col,chr:cell.chr}; 
  }
  
  clearFrom(row){ 
    for(;row<this.size.y;row++) 
      this.erase({x:0,y:row}); 
  }
  
  clear(){ 
    this.grid.each(() => ({col:TERM_DARK,chr:' ',change:true})); 
  }
  
  contain(p){
    const x = p.x - this.offset.x;
    const y = p.y - this.offset.y;
    const tx = this.size.x - this.map.x - 1;
    const ty = this.size.y - this.map.y - 1;
    if(x < 0 || y < 0 || x >= tx || y >= ty) return false;
    return true;
  }
  
  isValidChr(chr){ 
    return this.posChr[chr]; 
  }

  // input (@@@@CROQ@@@@ to deprecate)
  flush(){}
  mousePress(){}
  keyPress(){}
  keyPush(){}

  putText(reg, col, str){
    if(str === undefined) 
      return this.putText(reg, TERM_WHITE, col);
    let x = reg.col;
    let sx = x;
    let y = reg.row;
    let w = x+reg.width;
    let h = y+reg.rows;
    if(h == -1) h = this.size.y;
    textWrapInternal(this,w,h,sx,0,x,y,col,str);
  }

  putWrappedText(opt, col, str){
    if(str === undefined) 
      return this.putWrappedText(opt, TERM_WHITE, col);
    let w = opt.wrap || this.size.x;
    let h = this.size.y;
    let sx = opt.indent || 0;
    let pad = opt.pad || 0;
    let x = this.pos.x;
    let y = this.pos.y;
    this.pos = textWrapInternal(this,w,h,sx,pad,x,y,col,str);
  }

  // Draw a surround box in ASCII art
  windowMake(p1, p2){
    const c = Term.colors["WHITE"];

    for(let x = p1.x+1; x < p2.x; x++)
      for(let y = p1.y+1; y < p2.y; y++)
        this.draw({x:x,y:y}, c, ' ');

    this.draw(p1, c, '+');
    this.draw({x:p2.x,y:p1.y}, c, '+');
    this.draw({x:p1.x,y:p2.y}, c, '+');
    this.draw(p2, c, '+');

    for(let x = p1.x+1; x < p2.x; x++){
      this.draw({x:x,y:p1.y}, c, '-');
      this.draw({x:x,y:p2.y}, c, '-');
    }

    for(let y = p1.y+1; y < p2.y; y++){
      this.draw({x:p1.x,y:y}, c, '|');
      this.draw({x:p2.x,y:y}, c, '|');
    }
  }
}

Term.BASIC_COLORS = [
  TERM_WHITE,
  TERM_SLATE,
  TERM_ORANGE,
  TERM_RED,
  TERM_GREEN,
  TERM_BLUE,
  TERM_UMBER,
  TERM_L_DARK,
  TERM_L_WHITE,
  TERM_L_PURPLE,
  TERM_YELLOW,
  TERM_L_RED,
  TERM_L_GREEN,
  TERM_L_BLUE,
  TERM_L_UMBER
];

Term.colorFlicker = [
  [TERM_DARK, TERM_L_DARK, TERM_L_RED],
  [TERM_WHITE, TERM_L_WHITE, TERM_L_BLUE],
  [TERM_SLATE, TERM_WHITE, TERM_L_DARK],
  [TERM_ORANGE, TERM_YELLOW, TERM_L_RED],
  [TERM_RED, TERM_L_RED, TERM_L_PINK],
  [TERM_GREEN, TERM_L_GREEN, TERM_L_TEAL],
  [TERM_BLUE, TERM_L_BLUE, TERM_SLATE],
  [TERM_UMBER, TERM_L_UMBER, TERM_MUSTARD],
  [TERM_L_DARK, TERM_SLATE, TERM_L_VIOLET],
  [TERM_WHITE, TERM_SLATE, TERM_L_WHITE],
  [TERM_L_PURPLE, TERM_PURPLE, TERM_L_VIOLET],
  [TERM_YELLOW, TERM_L_YELLOW, TERM_MUSTARD],
  [TERM_L_RED, TERM_RED, TERM_L_PINK],
  [TERM_L_GREEN, TERM_L_TEAL, TERM_GREEN],
  [TERM_L_BLUE, TERM_DEEP_L_BLUE, TERM_BLUE_SLATE],
  [TERM_L_UMBER, TERM_UMBER, TERM_MUD],
  [TERM_PURPLE, TERM_VIOLET, TERM_MAGENTA],
  [TERM_VIOLET, TERM_L_VIOLET, TERM_MAGENTA],
  [TERM_TEAL, TERM_L_TEAL, TERM_L_GREEN],
  [TERM_MUD, TERM_YELLOW, TERM_UMBER],
  [TERM_L_YELLOW, TERM_WHITE, TERM_L_UMBER],
  [TERM_MAGENTA, TERM_L_PINK, TERM_L_RED],
  [TERM_L_TEAL, TERM_L_WHITE, TERM_TEAL],
  [TERM_L_VIOLET, TERM_L_PURPLE, TERM_VIOLET],
  [TERM_L_PINK, TERM_L_RED, TERM_L_WHITE],
  [TERM_MUSTARD, TERM_YELLOW, TERM_UMBER],
  [TERM_BLUE_SLATE, TERM_BLUE, TERM_SLATE],
  [TERM_DEEP_L_BLUE, TERM_L_BLUE, TERM_BLUE],
];

Term.colors = {
  "DARK": 0,
  "WHITE":1,
  "SLATE":2,
  "ORANGE":3,
  "RED":4,
  "GREEN":5,
  "BLUE":6,
  "UMBER":7,
  "L_DARK":8,
  "L_WHITE":9,
  "L_PURPLE":10,
  "YELLOW":11,
  "L_RED":12,
  "L_GREEN":13,
  "L_BLUE":14,
  "L_UMBER":15,
  "PURPLE":16,
  "VIOLET":17,
  "TEAL":18,
  "MUD":19,
  "L_YELLOW":20,
  "MAGENTA":21,
  "L_TEAL":22,
  "L_VIOLET":23,
  "L_PINK":24,
  "MUSTARD":25,
  "BLUE_SLATE":26,
  "DEEP_L_BLUE":27
};

Term.colors2char = {
  0:  "d",
  1:  "w",
  2:  "s",
  3:  "o",
  4:  "r",
  5:  "g",
  6:  "b",
  7:  "u",
  8:  "D",
  9:  "W",
  10: "P",
  11: "y",
  12: "R",
  13: "G",
  14: "B",
  15: "U",
  16: "p",
  17: "v",
  18: "t",
  19: "m",
  20: "Y",
  21: "i",
  22: "T",
  23: "V",
  24: "I",
  25: "M",
  26: "z",
  27: "Z"
};

Term.char2colors = {
  "d":0,
  "w":1,
  "s":2,
  "o":3,
  "r":4,
  "g":5,
  "b":6,
  "u":7,
  "D":8,
  "W":9,
  "P":10,
  "y":11,
  "R":12,
  "G":13,
  "B":14,
  "U":15,
  "p":16,
  "v":17,
  "t":18,
  "m":19,
  "Y":20,
  "i":21,
  "T":22,
  "V":23,
  "I":24,
  "M":25,
  "z":26,
  "Z":27
};

if(typeof module !== 'undefined' && module.exports)
  module.exports = Term;
else
  window.Term = Term;
})();

