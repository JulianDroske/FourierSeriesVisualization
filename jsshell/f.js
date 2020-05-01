function C(a=0,b=0){
	// MUST BE INT,INT
	
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

function V(c = 1,s = 0){
	// saved PI
	// c*e^{s*PI*i}
	
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
		return new C(p.x, p.y).time(50);
	}
}


var svg = new SVG("M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0");



var fo=0;


var width = 1000;
var height = 1000;
var canvas = new Canvas(width,height);

var context = canvas.getContext('2d');

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
f = [];
gc();

// draw
var t = 0.0;
var tmPath = [];
var savePath = true;
var n = 1;
while(t<n){
	context.clearRect(0,0,width,height);
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
	
	context.beginPath();
	context.setStrokeColor(0,255,150);
	tmPath.push([cx,cy]);
	context.moveTo(tmPath[0][0], tmPath[0][1]);
	tmPath.forEach(function(p){
		context.lineTo(p[0], p[1]);
	});
	// context.stroke();
	t += 0.005;
	// if(t > 1) clearInterval(fo);
	context.output();
	// break;
}
// print(String.fromCharCode(-1))
