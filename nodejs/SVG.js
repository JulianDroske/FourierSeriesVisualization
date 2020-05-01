const C = require('./C.js')
const V = require('./V.js')

/* format@path:
	[ [ cmd, [ x, y ], ... ], ... ]
*/
function SVG(d,scale,offX,offY){
	this.scale = scale || 1;
	this.path = [];
	this.length = 0;
	this.offX = offX || 0;
	this.offY = offY || 0;
	
	// boolean: absolute ; boolean: push?
	this.Donfig = { 'M': [1, true, false], 'C': [3, true, true], 'L': [1, true, true], 'Z': [0, false, true], 'm': [1,false, false], 'c': [3, false, true], 'l': [1, false, true], 'z': [0, false, true] }
	this.DL = [0];
	tmPoint = [0,0];
	
	/* INIT */
	// parse PATH
	var i = 0;
	this.iSpace = function(ch){
		if( ch==' ' || ch=='\n' || ch=='\r' || ch==',' || ch=='\t') return true;
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
		var sti = i;
		var num = 0;
		var neg = false;
		var flt = -1;
		while( this.iNum(ch) ){
			var ich = ch.charCodeAt();
			if(ch == '-'){
				if(sti==i)neg = true;
				else break;
			}
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
		
		/* Fix for Z */
		if(ch.toUpperCase() == 'Z'){
			dat.push(this.path[0][1][0]);
			ch = 'L';
		}
		
		if(this.Donfig[ch][2]) this.path.push( [ch.toUpperCase(), dat] );
	}
	
	
	this.calcPoint = function(parg, per){
		var CMD = this.path[parg];
		var ps = CMD[1];
		var tmp = 1 - per;
		switch(CMD[0]){
			case 'C':
				return { x: ps[0][0] * Math.pow(tmp,3) + 3 * ps[1][0] * per * tmp * tmp + 3 * ps[2][0] * per * per * tmp + ps[3][0] * Math.pow(per,3), y: ps[0][1] * Math.pow(tmp,3) + 3 * ps[1][1] * per * tmp * tmp + 3 * ps[2][1] * per * per * tmp + ps[3][1] * Math.pow(per,3) }
			case 'L':
				return { x: per*ps[1][0] + tmp*ps[0][0], y: per*ps[1][1] + tmp*ps[0][1] }
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
		return new C(p.x, p.y).time(scale).plus(new C(offX,offY));
	}
}
module.exports = SVG;
