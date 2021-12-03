#!/bin/sh
PTH="$(dirname ${0})"
"$PTH/node.exe" "$PTH/fsv.js" "$@" | "$PTH/ffplay.exe" -loop 1 -i pipe:
