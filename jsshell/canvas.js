function Canvas(x,y){
	this.X = x;
	this.Y = y;
	
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
			imgdat: [],
			paintc: [255,255,255,255],
			curX: 0,
			curY: 0,
			canvas: this,
			
			drawPixel(x,y,r=this.paintc[0],g=this.paintc[1],b=this.paintc[2],a=this.paintc[3]){
				if(x >= this.X || y >= this.Y || x <= 0 || y <= 0){
					// print('Out of range');
					// throwError();
					return;
				}
				x |= 0;
				y |= 0;
				x--;y--;
				var loc = x + y*this.X;
				this.imgdat[loc] = [r,g,b,a];
			},
			moveTo: function(x,y){
				this.curX = x;
				this.curY = y;
			},
			drawLine: function(x1,y1,x2,y2){
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
			},
			lineTo: function(x,y){
				this.drawLine(this.curX,this.curY,x,y);
				this.curX = x;
				this.curY = y;
			},
			clearRect: function(x,y,xx,yy){
				for(var i=x;i<=xx;++i){
					for(var j=y;j<=yy;++j){
						this.drawPixel(i,j,0,0,0,0);
					}
				}
			},
			beginPath: function(){
				
			},
			stroke: function(){
				return this.imgdat;
			},
			setStrokeColor: function(r=255,g=255,b=255){
				this.paintc = [r,g,b,255];
			},
			output: function(){
				var n = this.X * this.Y;
				var out = '';
				for(var x=0;x<this.X*this.Y; ++x){
					for(var y=0;y<4;++y){
						out += this.imgdat[x][y]+' ';
					}
				}
				putstr(out);
			}
		};
		for(var i=0;i<this.X*this.Y;++i){
			ret.imgdat[i] = [0,0,0,0];
		}
		return ret;
	}
	
}
