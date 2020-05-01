const C = require('./C.js')

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
module.exports = V;
