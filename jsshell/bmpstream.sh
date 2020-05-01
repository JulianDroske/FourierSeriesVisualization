#!/bin/sh
lua bmpheader.lua ${1} ${2}
while read DAT ; do
	printf \\x$(printf %x ${DAT})
done
