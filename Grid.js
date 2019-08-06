/* jshint undef: true, unused: true, sub:true, loopfunc:true, esversion:6, node:true, browser:true */
/* exported Grid */

class Grid {
  
  constructor(w,h){
    this.w = w;
    this.h = h;
    this.data = [];
    if(w > 0 && h > 0){
      for(let y=0;y<h;y++){
        let d = [];
        for(let x=0;x<w;x++) d[x] = null;
        this.data.push(d);
      }
    }
  }

  save(){
    let obj = {w:this.w,h:this.h};
    obj.data = this.data.map(line => line.slice());
    return obj;
  }

  static reload(data){
    let grid = new Grid(data.w,data.h);
    grid.data = data.data.map(line => line.slice());
    return grid;
  }

  set(p,v){
    if(!this.data[p.y]) this.data[p.y] = [];
    this.data[p.y][p.x] = v;
  }

  get(p){ return this.data[p.y][p.x]; }

  has(p,i){ return (this.data[p.y][p.x] & i); }

  each(f){
    for(let y=0;y<this.data.length;y++){
      let d = this.data[y];
      for(let x=0;x<d.length;x++) d[x] = f({x:x,y:y});
    }
  }

  fill(v){
    if(typeof v == "function") return this.each(v);
    for(let y=0;y<this.data.length;y++){
      let d = this.data[y];
      for(let x=0;x<d.length;x++) d[x] = v;
    }
  }

  or(p,v){
    let d = this.data[p.y];
    if(!d) d = this.data[p.y] = [];
    let v0 = d[p.x];
    if(v0 === null) v0 = v;
    else v0 |= v;
    d[p.x] = v0;
  }

  andNot(p,v){
    let d = this.data[p.y];
    if(!d) d = this.data[p.y] = [];
    let v0 = d[p.x];
    if(v0 === null) v0 = v;
    else v0 &= ~v;
    d[p.x] = v0;
  }
      
  min(p,v){
    let d = this.data[p.y];
    if(!d) d = this.data[p.y] = [];
    let v0 = d[p.x];
    if(v0 === null) v0 = v;
    else v0 = Math.min(v0,v);
    d[p.x] = v0;
  }

  max(p,v){
    let d = this.data[p.y];
    if(!d) d = this.data[p.y] = [];
    let v0 = d[p.x];
    if(v0 === null) v0 = v;
    else v0 = Math.max(v0,v);
    d[p.x] = v0;
  }

  clone(cloneCellFct){
    if(!cloneCellFct) cloneCellFct = function(cell){ return cell; };
    let nGrid = new Grid(this.w,this.h);
    nGrid.data = this.data.map(function(row){ return row.map(cloneCellFct); });
    return nGrid;
  }
}

if(typeof module !== 'undefined' && module.exports)
  module.exports = Grid;