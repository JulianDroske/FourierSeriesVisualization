# FSV for jsshell
***
this version is runnable under command line.


and you can change the parameter in the constructor of SVG at f.js:line205 to change the image to draw.

the parameter is the value of d in label 'path'

Since this version is not mainline; it has a bug that it cannot parse those paths which have no space between points.

## This version can be very slow when running. Check Node.js version for faster speed.

***

## Usage: js -f canvas.js f.js |[bmpstrcmd] |[ffmpegcmd]

### [bmpstrcmd] can be:

```
lua bmpipe.lua 1000 1000
lua bmpstream.lua 1000 1000
sh bmpstream.sh 1000 1000 # requires bmpheader.lua
./bmpstream 1000 1000 # you need to compile bmpstream.c
```

the arguments '1000 1000' is the width&height of the image to output.

you can change it if you changed the constants at f.js: line212 & line213

### [ffmpegcmd] can be:
```
ffmpeg -loop 1 -i pipe: -c:v mpeg1video fsv.mpg # if you want to save the stream to .mpg file
ffplay -loop 1 -i pipe: # if you want to watch the output directly.
```


