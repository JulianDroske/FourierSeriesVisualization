const fs = require('fs')
const Canvas = require('./Canvas.js')
const SVG = require('./SVG.js')
const C = require('./C.js')
const V = require('./V.js')


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
var COLORS = {vect: -1, stro: 4278255615, bg: 0}

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




var svg = new SVG(pathDat,scale,offX,offY);



var context = new Canvas(width,height,zomX,zomY);



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

while(t<endT){
	context.clear(COLORS.bg);
	context.setStrokeColor(COLORS.vect);
	var cx=0, cy=0;
	context.moveTo(cx,cy);
	for(var i=0; i<vN; ++i){
		var vector = vectors[i].getPoint(t);
		if(i==0) context.moveTo(cx += vector[0], cy += vector[1]);
		else context.lineTo(cx += vector[0], cy += vector[1]);
	}
	// context.stroke();
	
	if(camfollow) context.setCameraPos(cx,cy,true);
	else context.setCameraPos(CX,CY,true);
	
	context.setStrokeColor(COLORS.stro);
	tmPath.push([cx,cy]);
	context.moveTo(tmPath[0][0], tmPath[0][1]);
	tmPath.forEach(function(p){
		context.lineTo(p[0], p[1]);
	});
	t += dsmp;
	context.stroke();context.outputBMP();
}
