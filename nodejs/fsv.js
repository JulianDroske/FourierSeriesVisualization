const fs = require('fs')
const cp = require('child_process');

function printErr(dat){
	process.stderr.write(String(dat)+'\n');
}

var pathDat = "m177,404c-4.25,6.25 7.25,17.75 25.0625,18.0625c17.8125,0.3125 26.9375,-14.5625 26.9375,-29.0625c0,-14.5 -23,-207 -26,-242c-3,-35 14,-75 30,-75c16,0 31,78 7,105c-24,27 -60,44 -73,74c-13,30 -7,42 1,57c8,15 31,27 54,23c23,-4 33,-25 26,-50c-3.5,-12.5 -17,-21.5 -27.875,-20.875c-10.875,0.625 -28.125,14.54167 -25.125,30.875c3,16.33333 9,13.66667 13,21c-6.5,4.5 -14.5,-2.75 -19.5,-7.375c-5,-4.625 -13,-21.625 -5.5,-37.625c7.5,-16 18,-20 31,-24c13,-4 39,0 48,24c9,24 3,56 -23,68c-26,12 -51,7 -71,-9c-20,-16 -29,-45 -20,-75c9,-30 40,-55 55,-70c15,-15 34,-33 39,-53c5,-20 1,-29 -5,-29c-6,0 -15,11 -19,20c-4,9 -4,25 -5,32c-1,7 22,209 24,228c2,19 -3,35 -14,43c-11,8 -34,9 -50,-5c-16,-14 -18,-31 -11,-46c7,-15 29,-20 38,-5c9,15 0,33 -15,30.375l-3,0.3125c-1.66667,1.10417 -3.33333,2.20833 -5,3.3125";

var width = 100000;
var height = 100000;
var zomX = 800;
var zomY = 600;
var samp = 0.005;
var dsmp = 0.001;
var vN = 100;
var starT = 0;
var endT = 1;
var scale = 1;
var offX = 0, offY = 0;
var camfollow=true;
var COLORS = {vect: -1, stro: 4278255615, bg: 0};

function C2I(r,g,b){
	r = parseInt(r || 255);
	g = parseInt(g || 255);
	b = parseInt(b || 255);
	return 4278190080 + (r<<16) + (g<<8) + b;
}

function I2C(num){
	var dat = [];
	for(var i=0;i<4;++i){
		dat.push((num&4278190080)>>>24);
		num <<= 8;
	}
	return dat;
}

// parse command
for(var i=2;i<process.argv.length;++i){
	var arg = process.argv[i];
	var cmd = arg.substr(0,arg.lastIndexOf('=')>0?arg.lastIndexOf('='):arg.length);
	var argvl = arg.substring(arg.indexOf('=')+1,arg.length);
	switch(cmd){
		default:
			process.stderr.write('Error when parsing arguments: unknown command.\n');
			process.exit(1);
		case 'canvasw':
			width = parseInt(argvl);
			break;
		case 'canvash':
			height = parseInt(argvl);
			break;
		case 'camw':
			zomX = parseInt(argvl);
			break;
		case 'camh':
			zomY = parseInt(argvl);
			break;
		case 'svgsamp':
			samp = parseFloat(argvl);
			break;
		case 'drawsamp':
			dsmp = parseFloat(argvl);
			break;
		case 'vectn':
			vN = parseInt(argvl);
			break;
		case 'start':
			starT = parseFloat(argvl);
			break;
		case 'end':
			endT = parseFloat(argvl);
			break;
		case 'scale':
			scale = parseFloat(argvl);
			break;
		case 'offx':
			offX = parseInt(argvl);
			break;
		case 'offy':
			offY = parseInt(argvl);
			break;
		case 'camstatic':
			camfollow = false;
			break;
		case 'color.vect':
			var c = argvl.split(',');
			COLORS.vect = C2I(c[0],c[1],c[2]);
			break;
		case 'color.str':
			var c = argvl.split(',');
			COLORS.stro = C2I(c[0],c[1],c[2]);
			break;
		case 'color.bg':
			var c = argvl.split(',');
			COLORS.bg = C2I(c[0],c[1],c[2]);
			break;
		case 'file':
			// only to find <path d=>
			try{
				var content = fs.readFileSync(argvl).toString();
			}catch(e){
				process.stderr.write('Error when loading svg file.\n');
				process.exit(1);
			}
			content = content.substring(content.indexOf(' d="')+4,content.length);
			pathDat = content.substring(0,content.indexOf('"'));
			break;
		case 'help':
			process.stderr.write("\
Fourier Series Visualization\n\
2020 @ JuRt\n\n\
Usage: node fsv.js [opts]\n\n\
Options:\n\
\tfile=string\t\t\tSVG file to load\n\
\tcanvasw=int\t\t\tCanvas Width\n\
\tcanvash=int\t\t\tCanvas Heighr\n\
\tcamw=int\t\t\tCamera Width\n\
\tcamh=int\t\t\tCamera Height\n\
\tcamstatic\t\t\tDisable Camera Following\n\
\tscale=float\t\t\tSVG scaling\n\
\toffx=int\t\t\tMove SVG to x+int\n\
\toffy=int\t\t\tMove SVG to y+int\n\
\tsvgsamp=float\t\t\tSampling on SVG\n\
\tdrawsamp=float\t\t\tSampling on Drawing\n\
\tvectn=int\t\t\tAmout of Vectors\n\
\tstart=float\t\t\tTime to start, [0,1]\n\
\tend=float\t\t\tTime to end, [0,1]\n\
\tcolor.vect=r,g,b\t\tColor of Vectors\n\
\tcolor.str=r,g,b\t\t\tColor of Stroke\n\
\tcolor.bg=r,g,b\t\t\tColor of Background\n\
			");
			process.exit(0);
	}
	if(starT >= endT){
		endT = starT + dsmp;
	}
}


function FFmpeg(fn){
	
	this.extCode = 0;
	this.ff = null;
	this.log = '';
	
	this.init = function(filename){
		
		try{
			this.ff.kill('SIGINT');
		}catch(e){}
		
		if(filename) this.ff = cp.spawn('ffmpeg',['-loop','1','-i','pipe:','-y','-c:v','mpeg1video','-q','0',filename]);
		else this.ff = cp.spawn('ffplay',['-fflags','nobuffer','-analyzeduration','1','-i','pipe:']);
		// this.ff = cp.spawn('ffplay',['-i','pipe:']);
		// this.ff.stdin.setNoDelay(true);
		
		this.ff.stdout.on('data',function(dat){
			// this.log += dat.toString();
			console.log('FFMPEG:', dat.toString())
		});
		this.ff.stderr.on('data',function(dat){
			// this.log += dat.toString();
			console.error('FFMPEG:', dat.toString())
		});
		this.ff.on('close',function(code){
			this.extCode = code;
			try{
				this.ff.stdin.end();
			}catch(e){}
			this.ff = null;
		});
	}
	
	this.init(fn);
	
	this.write = function(dat){
		if(this.ff != null){
			for(var i=0;i<180;++i){
				this.ff.stdin.write(dat);
				// fs.writeSync(this.ff.stdin._handle.fd,dat,0,dat.length);
			}
			return true;
		}
		return false;
	}
	
	this.writeiloop = function(dat){
		if(this.ff != null){
			this.ff.stdin.write(dat);
			// fs.writeSync(this.ff.stdin._handle.fd,dat,0,dat.length);
			// this.ff.stdin.end();
			// fs.writeSync(this.ff.stdin.fd,dat,0,dat.length);
			return true;
		}
		// process.stderr.write('FFmpeg terminated.\n');
		return false;
	}
	
	this.read = function(){
		return this.log;
	}
	
	this.kill = function(){
		try{
			// this.ff.kill('SIGINT');
			this.ff.kill('SIGTERM');
			// this.ff.stdin.end('q');
		}catch(e){}
		// this.ff = null;
	}
}



function Canvas(zomX,zomY, x,y, rev){
	
	rev = rev || false;
	x = x || zomX;
	y = y || zomY;
	
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
		this.ff = null;
		this.rev = rev;
		this.svgs = [];
		this.anim = [];
		
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
		this.getl = function(){
			var n = this.zomX * this.zomY;
			return n*4+54;
		}
		this.getBMP = function(){
			var n = this.zomX * this.zomY;
			var l = this.getl();
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
			setHeader(this.rev?this.zomY:0-this.zomY,22);
			
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
			return out;
		};
		
		this.outputBMP = function(){
			fs.writeSync(process.stdout.fd,this.getBMP(),0,this.getl());
		}
		
		this.outputMPEG = function(relt,filename){
			if(this.ff == null) this.ff = new FFmpeg(filename);
			var bmp = this.getBMP();
			if(relt){
				if(!this.ff.write(bmp)){
					this.ff.init();
					this.ff.write(bmp);
				}
			}else{
				if(!this.ff.writeiloop(bmp)){
					this.ff.init();
					this.ff.writeiloop(bmp);
				}
			}
		}
		
		this.stroke = function(){	
			var n = this.cache.length;
			for(var i=0;i<n;++i){
				var p = this.cache[i];
				switch(p[0]){
					case 'p':
						this.drawPixel(p[1],p[2],p[3]);
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
			
			// Svg support
			var n = this.svgs.length;
			for(var i=0;i<n;++i){
				var ps = this.svgs[i].getPoints();
				var nn = ps.length;
				for(var j=0;j<nn;++j){
					this.drawPixel(ps[j][0], ps[j][1]);
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
		
		this.putSvg = function(svg){
			this.svgs.push(svg);
		}
		
		this.rmSvg = function(svg){
			var n = this.svgs.length;
			for(var i=0;i<n;++i){
				if(this.svgs[i] == svg){
					this.svgs.splice(i,1);
					return;
				}
			}
		}
		
		this.putText = function(text){
			var n = text.texts.length;
			for(var i=0;i<n;++i){
				this.putSvg(text.texts[i]);
			}
		}
		
		this.rmText = function(text){
			var n = text.texts.length;
			for(var i=0;i<n;++i){
				this.rmSvg(text.texts[i]);
			}
		}
		
		this.setAnim = function(obj, anim){
			obj.ANIM(anim);
			this.anim.push(anim);
		}
		
		this.startAnim = function(){
			// var anim = this.anim;
			var t = [];
			var dur = [];
			setInterv(function(){
				var n = this.anim.length;
				var cleared = true;
				for(var i=0;i<n;++i){
					if(t[i] == undefined){
						t[i] = 0;
						dur[i] = 1/this.anim[i].dur;
					}
					if(t[i] >= 1){
						t[i] = null;
					}
					if(t[i] != null) cleared = false;
					else continue;
					this.anim[i].appPara(t[i]);
					console.log(t[i])
					t[i]+=dur[i];
				}
				this.init();
				this.stroke();
				this.outputMPEG();
				if(cleared){
					this.anim = [];
					return false;
				}
				return true;
			},0,this);
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
	
	this.outputMPEG = function(realtime,filename){
		this.core.outputMPEG(realtime,filename);
	}
	
	this.endMPEG = function(){
		this.core.ff.kill();
	}
	
	this.setCameraPos = function(x,y,center){
		this.core.setCameraPos(x,y,center);
	}
	
	this.setZoom = function(zX,zY){
		this.core.setZoom(zX,zY);
	}
	
	this.setReversed = function(stat){
		this.core.rev = stat;
	}
	
	this.putSvg = function(svg){
		this.core.putSvg(svg);
	}
	
	this.rmSvg = function(svg){
		this.core.rmSvg(svg);
	}
	
	this.putText = function(text){
		this.core.putText(text);
	}
	
	this.rmText = function(text){
		this.core.rmText(text);
	}
	
	this.setAnim = function(obj, anim){
		this.core.setAnim(obj, anim);
	}
	
	this.startAnim = function(){
		this.core.startAnim();
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


/* format@path:
	[ [ cmd, [ x, y ], ... ], ... ]
*/
function SVG(d,scale,offX,offY){
	this.scale = scale || 1;
	this.path = [];
	this.length = 0;
	this.offX = offX || 0;
	this.offY = offY || 0;
	
	if(!d) d = 'z';
	d = d.toString().trim();
	
	// boolean: absolute ; boolean: push?
	this.Donfig = {
		'M': [1, true, false],
		'm': [1,false, false],
		
		'C': [3, true, true],
		'c': [3, false, true],
		
		'S': [2, true, true],
		's': [2, false, true],
		
		'L': [1, true, true],
		'l': [1, false, true],
		
		'Z': [0, true, true],
		'z': [0, true, true],
		
		'Q': [2, true, true],
		'q': [2, false, true],
		
		'T': [1, true, true],
		't': [1, false, true],
		
		'H': [-1, true, true, 'x'],
		'h': [-1, false, true, 'x'],
		
		'V': [-1, true, true, 'y'],
		'v': [-1, false, true, 'y']
	}
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
	var cwd = null;
	this.getCmd = function(){
		this.sKpace();
		if(!this.Donfig[d.charAt(i)]){
			return cwd;
		}
		return cwd=d.charAt(i++);
	}
	this.next = function(save, rel){
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
		
		num = neg?-num:num;
		
		if(save == 'x') save = 1;
		if(save == 'y') save = 2;
		if(save){
			save--;
			if(rel) num += tmPoint[save];
			// tmPoint[save] = num;
			var bkp = tmPoint.slice();
			bkp[save] = num;
			tmPoint = bkp;
		}
		return num;
	}
	this.nextps = function(n, rel){
		var points = [tmPoint];
		var x = tmPoint[0];
		var y = tmPoint[1];
		if(rel){
			for(var i=0;i<n; ++i){
				points.push( [ x+this.next() , y+this.next() ] );
			}
		}else{
			for(var i = 0;i<n; ++i){
				points.push( [ this.next() , this.next() ] );
			}
		}
		tmPoint = points[n];
		return points;
	}
	/* this.nextpsRelative = function(n){
		var points = [tmPoint];
		var x = tmPoint[0];
		var y = tmPoint[1];
		for(var i=0;i<n; ++i){
			points.push( [ x+this.next() , y+this.next() ] );
		}
		tmPoint = points[n];
		return points;
	}*/

	var mvStart = [0,0];
	while( i<d.length ){
		var ch = this.getCmd();
		if(this.Donfig[ch][0] >= 0) var dat = this.nextps(this.Donfig[ch][0], !this.Donfig[ch][1])
		else var dat = [tmPoint, (this.Donfig[ch][3]=='x')?[this.next(this.Donfig[ch][3], !this.Donfig[ch][1]), tmPoint[1]]:[tmPoint[0], this.next(this.Donfig[ch][3], !this.Donfig[ch][1])]];
		
		var cmd = ch.toUpperCase();
		/* Fixs */
		switch(cmd){
			case 'Z':
				dat.push(tmPoint = /*this.path[0][1][0]*/mvStart);
				// ch = 'L';
				break;
			case 'S':
			case 'T':
				var ldat = this.path[this.path.length-1];
				var indep = false;
				if(ldat){
					var ld = ldat[1];
					switch(ldat[0]){
						default:
							// indep
							indep = true;
							break;
						case 'T':
						case 'Q':
							if(cmd != 'T'){indep = true;break;}
							//dat = [[2*ld[1][0]-ld[0][0], 2*ld[1][1]-ld[0][1]]].concat(dat);
							// dat = [[2*ld[2][0]-ld[1][0], 2*ld[2][1]-ld[1][1]]].concat(dat);
							dat = [dat[0]].concat([[2*ld[2][0]-ld[1][0], 2*ld[2][1]-ld[1][1]]]).concat(dat.slice(1));
							break;
						case 'S':
						case 'C':
							if(cmd != 'S'){indep = true;break;}
							// dat = [[2*ld[2][0]-ld[1][0], 2*ld[2][1]-ld[1][1]]].concat(dat);
							dat = [dat[0]].concat([[2*ld[3][0]-ld[2][0], 2*ld[3][1]-ld[2][1]]]).concat(dat.slice(1));
							break;
					}
				}else{
					// indep
					indep = true;
				}
				if(indep){
					// dat.concat(dat);
					dat = [ldat[1][ldat[1].length-1]].concat(dat);
				}
				break;
			case 'M':
				mvStart = dat[1].slice();
				break;
		}
		// console.log(JSON.stringify(dat))
		
		if(this.Donfig[ch][2]) this.path.push( [cmd, dat] );
	}
	
	// console.log(JSON.stringify(this.path).replace(new RegExp(']]','g'),']]\n'))
	
	
	this.calcPoint = function(parg, per){
		var CMD = this.path[parg];
		var ps = CMD[1];
		var tmp = 1 - per;
		switch(CMD[0]){
			case 'S':
			case 'C':
				return { x: ps[0][0] * Math.pow(tmp,3) + 3 * ps[1][0] * per * tmp * tmp + 3 * ps[2][0] * per * per * tmp + ps[3][0] * Math.pow(per,3), y: ps[0][1] * Math.pow(tmp,3) + 3 * ps[1][1] * per * tmp * tmp + 3 * ps[2][1] * per * per * tmp + ps[3][1] * Math.pow(per,3) }
			case 'T':
			case 'Q':
				return { x: ps[0][0] * tmp * tmp + 2 * ps[1][0] * tmp * per + ps[2][0] * per * per, y: ps[0][1] * tmp * tmp + 2 * ps[1][1] * tmp * per + ps[2][1] * per * per }
			case 'V':
			case 'H':
			case 'Z':
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
		//this.DL.push(0);
		this.DL[k] = 0;
		switch(dp[0]){
			case 'S':
			case 'T':
			case 'Q':
			case 'C':
				var lst = this.calcPoint(i, 0);
				for(var j=samp;j<=1;j+=samp){
					var st = this.calcPoint(i, j);
					this.DL[k] += calcLength(st,lst);
					lst = st;
				}
				break;
			case 'V':
			case 'H':
			case 'Z':
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
		// Fixed for d=undefined
		while(this.DL[parg] <= l && this.DL[parg+1] != undefined) ++parg;
		parg--;
		
		return this.calcPoint(parg, (l - this.DL[parg])/(this.DL[parg+1]-this.DL[parg]));
	}
	
	
	this.f = function(t){
		var p = this.getPointAtLength(this.length*t);
		return new C(p.x, p.y).time(this.scale).plus(new C(this.offX,this.offY));
	}
	
	this.getPoints = function(samp){
		samp = samp || 0.001;
		points = [];
		for(var i=0;i<=1;i+=samp){
			var c = this.f(i);
			points.push([c.a, c.b]);
		}
		return points;
	}
}
SVG.parseFile = function(path,scale,offX,offY){
	try{
		var content = fs.readFileSync(path).toString();
	}catch(e){
		process.stderr.write('Error when loading svg file.\n');
		// process.exit(1);
		return;
	}
	var start = content.indexOf(' d="');
	if(start < 0) start = content.indexOf('\nd="');
	content = content.substring(start+4,content.length);
	return new SVG(content.substring(0,content.indexOf('"')),scale,offX,offY);
}









var svg = new SVG(pathDat,scale,offX,offY);



// var canvas = new Canvas(width,height,zomX,zomY);
var canvas = new Canvas(zomX, zomY, width, height);


var vectors = [];

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

var tmPath = [];
var t = starT;
for(var T=0;T<t;T+=dsmp){
	var cx=0, cy=0;
	for(var i=0; i<vN; ++i){
		var vector = vectors[i].getPoint(T);
		cx += vector[0];
		cy += vector[1];
	}
	tmPath.push([cx,cy]);
}
f = [];


var CX = vectors[0].getPoint(0)[0];
var CY = vectors[0].getPoint(0)[1];

while(t<=endT){
	canvas.clear(COLORS.bg);
	// canvas.clear(0xffffffff);
	canvas.setStrokeColor(COLORS.vect);
	var cx=0, cy=0;
	canvas.moveTo(cx,cy);

	for(var i=0; i<vN; ++i){
		var vector = vectors[i].getPoint(t);
		if(i==0) canvas.moveTo(cx += vector[0], cy += vector[1]);
		else canvas.lineTo(cx += vector[0], cy += vector[1]);
	}
	
	if(camfollow) canvas.setCameraPos(cx,cy,true);
	else canvas.setCameraPos(CX,CY,true);
	
	canvas.setStrokeColor(COLORS.stro);
	tmPath.push([cx,cy]);
	canvas.moveTo(tmPath[0][0], tmPath[0][1]);
	/*tmPath.forEach(function(p){
		canvas.lineTo(p[0], p[1]);
	});*/
	for(var p of tmPath){
		canvas.lineTo(p[0], p[1]);
	}
	t += dsmp;

	canvas.stroke();canvas.outputMPEG(true);
}
