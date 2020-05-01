const fs = require('fs')

function Canvas(x,y, zomX,zomY){
	
	function Core(x,y,zomX,zomY){
		this.cache = [];
		this.X = x;
		this.Y = y;
		this.camX = 0;	// Left
		this.camY = 0;	// Top
		this.zomX =  zomX;
		this.zomY =  zomY;
		this.imgdat =  [];
		this.paintc =  4294967295;
		this.curX =  0;
		this.curY =  0;
		
		this.p2l = function(x,y){
			x |= 0;
			y |= 0;
			x--;y--;
			return x + y*this.zomX;
		}
		
		this.l2p = function(l){
			l |= 0;
			return [(l+1)%5,((l/this.zomX)+1)|0];
		}
		
		this.drawPixel = function(x,y,c){
			
			c = c || this.paintc;
			
			x -= this.camX;
			y -= this.camY;
			if(x >= this.zomX || y >= this.zomY || x <= 0 || y <= 0){
				// print('Out of range');
				// throwError();
				return;
			}
			this.imgdat[this.p2l(x,y)] = c;
		};
		
		this.moveTo = function(x,y){
			this.curX = x;
			this.curY = y;
		};
		
		this.drawLine = function(x1,y1,x2,y2){
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
					this.drawPixel(x1,y);
				}
			}else if(dy==0){
				for(var x=x1;x<=x2;++x){
					this.drawPixel(x,y1);
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
					this.drawPixel(0|(x+0.5),y);
				}
			}else{
				var k = dy/dx;
				for(var y=y1, x=x1;x<=x2;++x,y+=k){
					this.drawPixel(x,0|(y+0.5));
				}
			}
		};
		
		this.lineTo = function(x,y){
			this.drawLine(this.curX,this.curY,x,y);
			this.curX = x;
			this.curY = y;
		};
		
		this.setStrokeColor = function(c){
			this.paintc = c || 4294967295;
		};
		
		this.init = function(color){
			// this.imgdat = [];
			color = color || 0;
			for(var i=0;i<this.zomX*this.zomY;++i){
				this.imgdat[i] = color;
			}
			this.cache = [];
		};
		
		this.clearRect = function(x,y,xx,yy,c){
			c = c || 0;
			for(var i=x;i<=xx;++i){
				for(var j=y;j<=yy;++j){
					this.drawPixel(i,j,c);
				}
			}
		};
		
		this.setCameraPos = function(x,y,center){
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
		};
		
		this.setZoom = function(zX,zY){
			this.zomX = zX;
			this.zomY = zY;
		};
		
		this.outputBMP = function(){
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
					dat >>>= 8;
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
					dat>>>=8;
				}
			}
			fs.writeSync(process.stdout.fd,out,0,l);
		};
		
		this.stroke = function(){	
			var n = this.cache.length;
			for(var i=0;i<n;++i){
				var p = this.cache[i];
				switch(p[0]){
					case 'p':
						this.drawPixel(p[1],p[2],p[3],p[4],p[5],p[6]);
						break;
					case 'm':
						this.moveTo(p[1],p[2]);
						break;
					case 'bl':
						this.drawLine(p[1],p[2],p[3],p[4]);
						break;
					case 'l':
						this.lineTo(p[1],p[2]);
						break;
					case 'c':
						this.setStrokeColor(p[1]);
						break;
				}
			}
		}
		
		this.clearCache = function(){
			this.cache = [];
		}
		
		this.getCanvasSize = function(){
			return this.X*this.Y;
		}
		
		this.getCameraSize = function(){
			return this.zomX*this.zomY;
		}
		
	}
	
	this.core = new Core(x,y,zomX,zomY);
	
	this.init = function(color){
		this.core.init(color);
		// this.core.clearCache();
	}
	
	this.drawPixel = function(x,y,c){
		this.core.cache.push(['p',x,y,c]);
	}
	
	this.moveTo = function(x,y){
		this.core.cache.push(['m',x,y]);
	}
	
	this.drawLine = function(x1,y1,x2,y2){
		this.core.cache.push(['bl',x1,y1,x2,y2]);
	}
	
	this.lineTo = function(x,y){
		this.core.cache.push(['l',x,y]);
	}
	
	this.setStrokeColor = function(c){
		this.core.cache.push(['c',c]);
	}
	
	this.clearRect = function(x,y,xx,yy,c){
		this.core.clearRect(x,y,xx,yy,c);
	}
	
	this.clear = function(color){
		this.init(color);
	}
	
	this.stroke = function(){	
		this.core.stroke();
		this.core.clearCache();
	}
	
	this.outputBMP = function(){
		this.core.outputBMP();
	}
	
	this.setCameraPos = function(x,y,center){
		this.core.setCameraPos(x,y,center);
	}
	
	this.setZoom = function(zX,zY){
		this.core.setZoom(zX,zY);
	}
	
}
module.exports = Canvas;
