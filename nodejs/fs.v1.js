const fs = require('fs')

function Canvas(x,y, zomX,zomY){
	this.X = x;
	this.Y = y;
	this.zomX = zomX;
	this.zomY = zomY;
	
	this.getWidth = function(){
		return this.X;
	}
	
	this.getHeight = function(){
		return this.Y;
	}
	
	this.getContext = function(str){
		var ret = {
			X: this.X,
			Y: this.Y,
			camX: 0,	// Left
			camY: 0,	// Top
			zomX: this.zomX,
			zomY: this.zomY,
			imgdat: [],
			cache: [],
			paintc: [255,255,255,255],
			curX: 0,
			curY: 0,
			canvas: this,
			
			init: function(){
				// this.imgdat = [];
				for(var i=0;i<this.zomX*this.zomY;++i){
					this.imgdat[i] = 0;
				}
				this.cache = [];
			},
			
			drawPixel: function(x,y,r,g,b,a){
				this.cache.push(['p',x,y,r,g,b,a]);
			},
			moveTo: function(x,y){
				this.cache.push(['m',x,y]);
			},
			drawLine: function(x1,y1,x2,y2){
				this.cache.push(['bl',x1,y1,x2,y2]);
			},
			lineTo: function(x,y){
				this.cache.push(['l',x,y]);
			},
			setStrokeColor: function(r,g,b){
				this.cache.push(['c',r,g,b]);
			},
			
			bgDrawPixel: function(x,y,r,g,b,a){
				r = r || this.paintc[0];
				g = g || this.paintc[1];
				b = b || this.paintc[2];
				a = a || this.paintc[3];
				
				x -= this.camX;
				y -= this.camY;
				if(x >= this.zomX || y >= this.zomY || x <= 0 || y <= 0){
					// print('Out of range');
					// throwError();
					return;
				}
				x |= 0;
				y |= 0;
				x--;y--;
				var loc = x + y*this.zomX;
				// this.imgdat[loc] = [r,g,b,a];
				this.imgdat[loc] = (a<<24) + (b<<16) + (g<<8) + r;
			},
			bgMoveTo: function(x,y){
				this.curX = x;
				this.curY = y;
			},
			bgDrawLine: function(x1,y1,x2,y2){
				if(x1>x2){
					x1 += x2
					x2 = x1 - x2
					x1 -= x2
					
					y1 += y2
					y2 = y1 - y2
					y1 -= y2
				}
				
				var dx = x2-x1;
				var dy = y2-y1;
				if(dx==0){
					for(var y=y1;y<=y2;++y){
						this.bgDrawPixel(x1,y);
					}
				}else if(dy==0){
					for(var x=x1;x<=x2;++x){
						this.bgDrawPixel(x,y1);
					}
				}else if(Math.abs(dy) > Math.abs(dx)){
					if(y1>y2){
						x1 += x2
						x2 = x1 - x2
						x1 -= x2
						
						y1 += y2
						y2 = y1 - y2
						y1 -= y2
					}
					var k = dx/dy;
					for(var x=x1, y=y1;y<=y2;++y,x+=k){
						this.bgDrawPixel(0|(x+0.5),y);
					}
				}else{
					var k = dy/dx;
					for(var y=y1, x=x1;x<=x2;++x,y+=k){
						this.bgDrawPixel(x,0|(y+0.5));
					}
				}
			},
			bgLineTo: function(x,y){
				this.bgDrawLine(this.curX,this.curY,x,y);
				this.curX = x;
				this.curY = y;
			},
			clearRect: function(x,y,xx,yy){
				for(var i=x;i<=xx;++i){
					for(var j=y;j<=yy;++j){
						this.bgDrawPixel(i,j,0,0,0,0);
					}
				}
			},
			clear: function(){
				this.init();
			},
			beginPath: function(){
				
			},
			stroke: function(){	
				var n = this.cache.length;
				for(var i=0;i<n;++i){
					var p = this.cache[i];
					switch(p[0]){
						case 'p':
							this.bgDrawPixel(p[1],p[2],p[3],p[4],p[5],p[6]);
							break;
						case 'm':
							this.bgMoveTo(p[1],p[2]);
							break;
						case 'bl':
							this.bgDrawLine(p[1],p[2],p[3],p[4]);
							break;
						case 'l':
							this.bgLineTo(p[1],p[2]);
							break;
						case 'c':
							this.bgSetStrokeColor(p[1],p[2],p[3]);
							break;
					}
				}
			},
			bgSetStrokeColor: function(r,g,b){
				this.paintc = [r||255,g||255,b||255,255];
			},
			outputBMP: function(){
				var n = this.zomX * this.zomY;
				var l = n*4+54;
				var out = new Buffer(l);
				var point = -1;
				
				// Init Header
				var header = ['B'.charCodeAt(),'M'.charCodeAt(),0,0,0,0,0,0,0,0,54,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,1,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
				function setHeader(dat, pos){
					var pn = pos+4;
					for(;pos<pn;++pos){
						header[pos] = dat&255;
						dat >>= 8;
					}
				}
				
				setHeader(l,2);
				setHeader(this.zomX,18);
				setHeader(0-this.zomY,22);
				
				for(x in header){
					out[++point] = header[x];
				}
				
				// Init Data
				for(var x=0;x<n; ++x){
					var dat = this.imgdat[x];
					for(var y=0;y<4;++y){
						// out += (this.imgdat[x]?this.imgdat[x][y]:'0')+' ';
						out[++point] = dat&255;
						dat>>=8;
					}
				}
				fs.writeSync(process.stdout.fd,out,0,l);
			},
			setCameraPos: function(x,y,center){
				if(x<0) x=0;if(y<0) y=0;
				if(center){
					var hl=this.zomX/2;
					var ht=this.zomY/2;
					if(x<hl) x=hl;if(y<ht) y=ht;
					if(x>this.X-hl) x=this.X-hl;if(y>this.Y-ht) y=this.Y-ht;
					x -= hl;
					y -= ht;
				}else{
					var ml=this.X-this.zomX;
					var mt=this.Y-this.zomY;
					if(x>ml) x=ml;if(y>mt) y=mt;
				}
				
				this.camX = x;
				this.camY = y;
			},
			setZoom: function(zX,zY){
				this.zomX = zX;
				this.zomY = zY;
			}
		};
		ret.init();
		return ret;
	}
	
}








function C(a,b){
	// MUST BE INT,INT
	
	a = a || 0;
	b = b || 0;
	
	this.a = a;
	this.b = b;
	
	this.plus = function(c){
		if(c instanceof C) return new C(this.a + c.a, this.b + c.b);
		else return new C(this.a + c, this.b);
	}
	
	this.minus = function(c){
		if(c instanceof C) return new C(this.a - c.a, this.b - c.b);
		else return new C(this.a - c, this.b);
	}
	
	this.time = function(c){
		if(c instanceof C) return new C(this.a * c.a - this.b * c.b, this.a * c.b + this.b * c.a);
		else return new C(this.a * c, this.b * c);
	}
	
	this.div = function(c){
		if(c instanceof C) return;
		return new C(this.a / c, this.b / c);
	}
	
	this.getPoint = function(){
		return [a,b];
	}
	
}

function V(c,s){
	// saved PI
	// c*e^{s*PI*i}
	
	c = c || 1;
	s = s || 0;
	
	this.c = c;
	this.s = s;
	
	this.time = function(c){
		if(c instanceof V) return new V(c.c.time(this.c), c.s.plus(this.s));
		else if(c instanceof C) return new V(c.time(this.c), this.s);
		else{
			try{
				return new V(this.c.time(c), this.s);
			}catch(e){
				return new V(this.c * c,this.s);
			}
		}
	}
	
	this.toC = function(){
		try{
			return new C(Math.cos(s.time(Math.PI)), Math.sin(s.time(Math.PI))).time(c);
		}catch(e){
			return new C(Math.cos(s * Math.PI), Math.sin(s * Math.PI)).time(c);
		}
	}
	
	this.getPoint = function(t){
		// 0 < t < 1
		return new C(Math.cos(s*Math.PI * t), Math.sin(s*Math.PI * t)).time(c).getPoint();
	}
}


// define it
/* format@path:
	[ [ cmd, [ x, y ], ... ], ... ]
*/
function SVG(d){
	this.path = [];
	this.length = 0;
	
	// boolean: absolute ; boolean: push?
	this.Donfig = { 'M': [1, true, false], 'C': [3, true, true], 'm': [1,false, false], 'c': [3, false, true], 'l': [1, false, true] };
	this.DL = [0];
	tmPoint = [0,0];
	
	/* INIT */
	// parse PATH
	var i = 0;
	this.iSpace = function(ch){
		if( ch==' ' || ch=='\n' || ch==',' ) return true;
		return false;
	}
	this.iNum = function(ch){
		var ich = ch.charCodeAt();
		return ( (ich>=48 && ich<=57) || ch=='.' || ch=='-' );
	}
	this.sKpace = function(){
		while(this.iSpace(d.charAt(i))) ++i;
	}
	this.getCmd = function(){
		this.sKpace();
		return d.charAt(i++);
	}
	this.next = function(){
		this.sKpace();
		var ch = d.charAt(i);
		var num = 0;
		var neg = false;
		var flt = -1;
		while( this.iNum(ch) ){
			var ich = ch.charCodeAt();
			if(ch == '-') neg = true;
			else if(ch == '.') flt = 0;
			else if( flt != -1){
				// float
				num += (ich-48) * Math.pow(0.1, ++flt);
			}else{
				num *= 10;
				num += (ich-48);
			}
			ch = d.charAt(++i);
		}
		return neg?-num:num;
	}
	this.nextps = function(n){
		var points = [tmPoint];
		for(var i = 0;i<n; ++i){
			points.push( [ this.next() , this.next() ] );
		}
		tmPoint = points[n];
		return points;
	}
	this.nextpsRelative = function(n){
		var points = [tmPoint];
		var x = tmPoint[0];
		var y = tmPoint[1];
		for(var i=0;i<n; ++i){
			points.push( [ x+this.next() , y+this.next() ] );
		}
		tmPoint = points[n];
		return points;
	}
	while( i<d.length ){
		var ch = this.getCmd();
		var dat = this.Donfig[ch][1]?this.nextps(this.Donfig[ch][0]):this.nextpsRelative(this.Donfig[ch][0])
		if(this.Donfig[ch][2]) this.path.push( [ch.toUpperCase(), dat] );
	}
	
	
	this.calcPoint = function(parg, per){
		var CMD = this.path[parg];
		var ps = CMD[1];
		var tmp = 1 - per;
		switch(CMD[0]){
			case 'C':
				return { x: ps[0][0] * Math.pow(tmp,3) + 3 * ps[1][0] * per * tmp * tmp + 3 * ps[2][0] * per * per * tmp + ps[3][0] * Math.pow(per,3), y: ps[0][1] * Math.pow(tmp,3) + 3 * ps[1][1] * per * tmp * tmp + 3 * ps[2][1] * per * per * tmp + ps[3][1] * Math.pow(per,3) };
			case 'L':
				return { x: per*ps[1][0] + tmp*ps[0][0], y: per*ps[1][1] + tmp*ps[0][1] };
		}
	}
	
	// Calculate Length
	// vars: DL
	var samp = 0.01;
	
	function calcLength(a,b){
		var dx = Math.abs(b.x-a.x);
		var dy = Math.abs(b.y-a.y);
		return Math.sqrt(dx*dx + dy*dy);
	}
	
	for (var i=0;i<this.path.length;++i){
		var k = i+1;
		var dp = this.path[i];
		this.DL.push(0);
		switch(dp[0]){
			case 'C':
				var lst = this.calcPoint(i, 0);
				for(var j=samp;j<=1;j+=samp){
					var st = this.calcPoint(i, j);
					this.DL[k] += calcLength(st,lst);
					lst = st;
				}
				break;
			case 'L':
				var p = dp[1];
				this.DL[k] = calcLength({x: p[0][0], y:p[0][1]}, {x: p[1][0], y:p[1][1]});
				break;
		}
		this.length = (this.DL[k] += this.DL[i]);
	}
	
	this.getPointAtLength = function(l){
		var lstl = this.DL[this.DL.length-1];
		while(lstl < l) l-=lstl;
		
		var parg = 0;
		while(this.DL[parg] <= l) ++parg;
		parg--;
		
		return this.calcPoint(parg, (l - this.DL[parg])/(this.DL[parg+1]-this.DL[parg]));
	}
	
	this.f = function(t){
		var p = this.getPointAtLength(this.length*t);
		return new C(p.x, p.y).time(10).plus(new C(800,800));
	}
}


var svg = new SVG("m177,404c-4.25,6.25 7.25,17.75 25.0625,18.0625c17.8125,0.3125 26.9375,-14.5625 26.9375,-29.0625c0,-14.5 -23,-207 -26,-242c-3,-35 14,-75 30,-75c16,0 31,78 7,105c-24,27 -60,44 -73,74c-13,30 -7,42 1,57c8,15 31,27 54,23c23,-4 33,-25 26,-50c-3.5,-12.5 -17,-21.5 -27.875,-20.875c-10.875,0.625 -28.125,14.54167 -25.125,30.875c3,16.33333 9,13.66667 13,21c-6.5,4.5 -14.5,-2.75 -19.5,-7.375c-5,-4.625 -13,-21.625 -5.5,-37.625c7.5,-16 18,-20 31,-24c13,-4 39,0 48,24c9,24 3,56 -23,68c-26,12 -51,7 -71,-9c-20,-16 -29,-45 -20,-75c9,-30 40,-55 55,-70c15,-15 34,-33 39,-53c5,-20 1,-29 -5,-29c-6,0 -15,11 -19,20c-4,9 -4,25 -5,32c-1,7 22,209 24,228c2,19 -3,35 -14,43c-11,8 -34,9 -50,-5c-16,-14 -18,-31 -11,-46c7,-15 29,-20 38,-5c9,15 0,33 -15,30.375l-3,0.3125c-1.66667,1.10417 -3.33333,2.20833 -5,3.3125");



var fo=0;


var width = 200000;
var height = 200000;
var canvas = new Canvas(width,height,800,600);

var context = canvas.getContext();

var samp = 0.005;

var vectors = [];
var vN = 100;
var f = [];
for(var i=0; i<=1; i+=samp){
	f.push(svg.f(i).time(samp));
}

for(var i=0, v=0.5;i<vN;++i,v+=0.5){
	var c_n = new C();
	// sum
	for(var k=0,j=0; j<=1; k++,j+=samp){
		c_n = c_n.plus(new V(f[k], -2 * (0|v)*Math.pow(-1,i) * j).toC());
	}
	vectors.push(new V(c_n, 2*(0|v)*Math.pow(-1,i)));
	// console.log(c_n.a + ';' + c_n.b);
}


// draw
var dsmp = 0.0002;
var tmPath = [];
var t = 0.5;
for(var i=0;i<t;i+=dsmp){
	var F = svg.f(i);
	tmPath.push([F.a,F.b]);
}
f = [];

var n = 0.8;
while(t<n){
	context.clear();
	context.beginPath();
	context.setStrokeColor(255,255,255);
	var cx=0, cy=0;
	context.moveTo(cx,cy);
	for(var i=0; i<vN; ++i){
		var vector = vectors[i].getPoint(t);
		// console.log(vector);
		if(i==0) context.moveTo(cx += vector[0], cy += vector[1]);
		else context.lineTo(cx += vector[0], cy += vector[1]);
	}
	// context.stroke();
	
	context.setCameraPos(cx,cy,true);
	
	context.beginPath();
	context.setStrokeColor(0,255,150);
	tmPath.push([cx,cy]);
	context.moveTo(tmPath[0][0], tmPath[0][1]);
	tmPath.forEach(function(p){
		context.lineTo(p[0], p[1]);
	});
	t += dsmp;
	context.stroke();context.outputBMP();
}
