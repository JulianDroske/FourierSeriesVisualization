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
module.exports = C;
