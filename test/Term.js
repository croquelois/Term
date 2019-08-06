let ava = require("ava");
let Term = require("../term.js");

let DARK = Term.colors["DARK"];
let WHITE = Term.colors["WHITE"];
let SLATE = Term.colors["SLATE"];

function fakeContext(){
  return {
    drawImage: function(){},
    getImageData: function(){ return {data:[]}; },
    putImageData: function(){},
  }
}

function fakeCanvas(){
  return {
    getContext:function(){ return fakeContext(); }
  };
}

function fakeDocument(){
  return {
    createElement:function(type){
      if(type != "canvas") 
        throw new Error("Expect canvas");
      return fakeCanvas();
    }
  };
}

function createTermAndInit(w,h){
  w = w || 80;
  h = h || 24;
  let term = new Term(w, h);
  let document = fakeDocument();
  let image = {};
  term.init(document,image);
  return term;
}

ava.test("constructor", function(t){
  createTermAndInit();
  t.pass();
});

ava.test("draw",function(t){
  let term = createTermAndInit(3,3);
  term.draw({x:1,y:1},WHITE,"c");
  let cell = term.grid.get({x:1,y:1});
  t.deepEqual(cell.col,WHITE);
  t.deepEqual(cell.chr,"c");
  t.deepEqual(cell.change,true);
  cell = term.grid.get({x:0,y:0});
  t.deepEqual(cell.col,DARK);
  t.deepEqual(cell.chr," ");
  t.deepEqual(cell.change,true); 
});

ava.test("save-load",function(t){
  let term = createTermAndInit(3,3);
  term.draw({x:1,y:1},WHITE,"a");
  term.draw({x:0,y:0},WHITE,"c");
  let before = JSON.stringify(term.grid.clone(function(c){ return {col: c.col, chr: c.chr}; }));
  let saved = term.save();
  term.draw({x:1,y:1},SLATE,"b");
  term.load(saved);  
  let after = JSON.stringify(term.grid.clone(function(c){ return {col: c.col, chr: c.chr}; }));
  t.deepEqual(before,after);
});

ava.test("dump",function(t){
  let term = createTermAndInit(3,3);
  term.draw({x:1,y:1},WHITE,"a");
  term.draw({x:0,y:0},WHITE,"c");
  t.deepEqual(term.dump().join(""),"c   a    ");
});

ava.test("go-addChr-addStr-getChr",function(t){
  let term = createTermAndInit(3,3);
  term.go({x:1,y:1});
  term.addChr("b");
  term.addChr("a");
  t.deepEqual(term.dump().join(""),"    ba   ");
  term.go({x:0,y:2});
  term.addChr("c");
  term.addStr("ff");
  t.deepEqual(term.dump().join(""),"    bacff");
  term.go({x:0,y:0});
  term.addStr("coucou");
  t.deepEqual(term.dump().join(""),"cou bacff");
  let cell = term.getChr({x:0,y:2});
  t.deepEqual(cell.col,WHITE);
  t.deepEqual(cell.chr,"c");
});

ava.test("putChr-putStr",function(t){
  let term = createTermAndInit(3,3);
  term.putChr({x:1,y:1},WHITE,"b");
  term.putChr({x:1,y:1},WHITE,"a");
  t.deepEqual(term.dump().join(""),"    a    ");
  term.putStr({x:1,y:2},"ff");
  t.deepEqual(term.dump().join(""),"    a  ff");
  term.putStr({x:0,y:0},"coucou");
  t.deepEqual(term.dump().join(""),"cou a  ff");
});

ava.test("putChr-putStr",function(t){
  let term = createTermAndInit(5,5);
  term.putStrCentred(0,5,2,"hey");
  t.deepEqual(term.dump().join(""),"     "+"     "+" hey "+"     "+"     ");
  term.putStrCentred(0,5,3,"oups");
  t.deepEqual(term.dump().join(""),"     "+"     "+" hey "+"oups "+"     ");
  t.throws(() => term.putStrCentred(0,5,3,"too big to fail"));
});

ava.test("erase",function(t){
  let term = createTermAndInit(3,3);
  term.putStr({x:0,y:0},"123");
  term.putStr({x:0,y:1},"456");
  term.putStr({x:0,y:2},"789");
  t.deepEqual(term.dump().join(""),"123456789");
  term.erase();
  t.deepEqual(term.dump().join(""),"         ");
  term.putStr({x:0,y:0},"123");
  term.putStr({x:0,y:1},"456");
  term.putStr({x:0,y:2},"789");
  term.erase({x:1,y:1});
  t.deepEqual(term.dump().join(""),"1234  789");
  term.putStr({x:0,y:1},"456");
  term.erase({x:1,y:1},1);
  t.deepEqual(term.dump().join(""),"1234 6789");
});

ava.test("print",function(t){
  let term = createTermAndInit(10,3);
  term.putStr({x:0,y:0},"0123456789");
  term.putStr({x:0,y:1},"0123456789");
  term.putStr({x:0,y:2},"0123456789");
  term.print({x:1,y:1},"Hello !");
  t.deepEqual(term.dump().join(""),"01234567890Hello !  0123456789");
});

ava.test("clear",function(t){
  let term = createTermAndInit(5,5);
  term.putStr({x:0,y:0},"01234");
  term.putStr({x:0,y:1},"01234");
  term.putStr({x:0,y:2},"01234");
  term.putStr({x:0,y:3},"01234");
  term.putStr({x:0,y:4},"01234");
  t.deepEqual(term.dump().join(""),"0123401234012340123401234");
  term.clearFrom(3);
  t.deepEqual(term.dump().join(""),"012340123401234          ");
  term.clear();
  t.deepEqual(term.dump().join(""),"                         ");
});

ava.test("contain",function(t){
  let term = createTermAndInit();
  t.truthy(term.contain({x:5,y:5}));
  t.falsy(term.contain({x:500,y:5}));
  t.falsy(term.contain({x:-500,y:5}));
  t.falsy(term.contain({x:5,y:500}));
});

ava.test("isValidChr",function(t){
  let term = createTermAndInit();
  t.truthy(term.isValidChr("$"));
  t.falsy(term.isValidChr("€"));
});

ava.test("putText",function(t){
  let term = createTermAndInit(25,6);
  let txt = "But so far trouble had not come; and as Mr. Baggins was generous with his money";
  term.putText({width:23,rows:4,col:1,row:1},txt);
  let dmp = term.dump();
  t.deepEqual(dmp[0],"                         ");
  t.deepEqual(dmp[1]," But so far trouble had  ");
  t.deepEqual(dmp[2]," not come; and as Mr.    ");
  t.deepEqual(dmp[3]," Baggins was generous    ");
  t.deepEqual(dmp[4]," with his money          ");
  t.deepEqual(dmp[5],"                         ");
  t.throws(() => term.putText({width:10,rows:3,col:1,row:1},txt));
});

ava.test("putWrappedText",function(t){
  let term = createTermAndInit(25,6);
  let txt = "But so far trouble had not come; and as Mr. Baggins was generous with his money";
  term.go({x:1,y:1});
  term.putWrappedText({indent:1,pad:1,wrap:24},txt);
  let dmp = term.dump();
  t.deepEqual(dmp[0],"                         ");
  t.deepEqual(dmp[1]," But so far trouble had  ");
  t.deepEqual(dmp[2],"  not come; and as Mr.   ");
  t.deepEqual(dmp[3],"  Baggins was generous   ");
  t.deepEqual(dmp[4],"  with his money         ");
  t.deepEqual(dmp[5],"                         ");
});

ava.test("windowMake",function(t){
  let term = createTermAndInit(25,6);
  let txt = "But so far trouble had not come; and as Mr. Baggins was generous with his money";
  term.go({x:1,y:1});
  term.windowMake({x:1,y:1},{x:23,y:4});
  let dmp = term.dump();
  t.deepEqual(dmp[0],"                         ");
  t.deepEqual(dmp[1]," +---------------------+ ");
  t.deepEqual(dmp[2]," |                     | ");
  t.deepEqual(dmp[3]," |                     | ");
  t.deepEqual(dmp[4]," +---------------------+ ");
  t.deepEqual(dmp[5],"                         ");
});

ava.test("smoke-fresh",function(t){
  let term = createTermAndInit(3,3);
  term.putStr({x:0,y:0},"123");
  term.putStr({x:0,y:1},"456");
  term.putStr({x:0,y:2},"789");
  term.fresh();
  t.pass();
});
