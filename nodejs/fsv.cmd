@ECHO OFF
node fsv.js %* | ffplay -loop 1 -i pipe:
