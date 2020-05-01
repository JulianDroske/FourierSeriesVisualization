#!/bin/sh
PTH="$(dirname ${0})"
node "$PTH/fsv.js" $@ | ffplay -loop 1 -i pipe:
