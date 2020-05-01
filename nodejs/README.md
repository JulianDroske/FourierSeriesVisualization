# FSV for Node.js
## Mainline, the fastest speed version of this program

***
### dependences: FFMPEG, nodejs
***
## Usage: ./fsv [parameters] |[ffmpegcmd]

Windows users : use ./fsv.cmd

Linux users : use ./fsv.sh

for [parameters], you can run
```
./fsv help
```
for more details.

### [ffmpegcmd] can be:
```
ffmpeg -loop 1 -i pipe: -c:v mpeg1video fsv.mpg # if you want to save the stream to .mpg file
ffplay -loop 1 -i pipe: # if you want to watch the output directly.
```
