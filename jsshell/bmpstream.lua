-- Usage: script [width] [height]
-- @stdin: data
-- @data.format = R G B A


header = {
	string.byte('B'),string.byte('M'),
	0,0,0,0,	-- Size
	0,0,
	0,0,
	54,0,0,0,	-- imageDataOffset
	40,0,0,0,	-- infoHeaderSize
	0,0,0,0,	-- width
	0,0,0,0,	-- height
	1,0,
	32,0,		-- bit :32
	0,0,0,0,	-- compression
	0,0,0,0,	-- imageSize
	0,0,0,0,	-- pixelx
	0,0,0,0,	-- pixely
	0,0,0,0,	-- colors
	0,0,0,0		-- colors:imp
};
function n2b(n)
	local byte = {0,0,0,0}
	local i = 1
	if(n<0) then
		n=-n;
		local c = 0
		local m = ''
		repeat
			if n % 2 == 0 then
				m = '1'..m;
			else
				m = '0'..m;
			end
			n = math.modf(n/2);
			c = c+1;
		until n == 0
		for x=2,32-c do
			m = '1'..m;
		end
		m = '1'..m;
		
		-- +1
		n = ''
		local up=0
		for x=32,2,-1 do
			local z = string.byte(string.sub(m,x,x))-48+up;
			if(x==32) then z = z+1 end
			if(z==2) then
				up=1;
				z = 0;
			else
				up=0;
			end
			n = string.char(z+48)..n;
		end
		
		n = '1'..n
		
		for i=0,3 do
			local k = 4-i;
			for j=i*8+1,i*8+8 do
				byte[k] = byte[k] * 2 + string.byte( string.sub(n, j, j) )-48;
			end
		end
		
	else
		while not (n == 0) do
			byte[i] = n % 256;
			n = math.modf(n/256);
			i = i+1;
		end
	end
	return byte;
end

function setHeader(off,dat)
	local vl = nil
	for i=off+1,off+#dat do
		vl,vv = next(dat,vl)
		header[i] = vv
	end
end


-- Main



if(not arg[1] or not arg[2]) then
	print('Invalid Arguments')
	os.exit()
end

x = tonumber(arg[1])
y = tonumber(arg[2])

len = x*y

setHeader(2,n2b(54 + len*4))
setHeader(18,n2b(x));
setHeader(22,n2b(-y));


:: INPUT ::

-- check status
tr = io.stdin:read('*n')
if(not tr) then
	-- EOF
	error('EOF DETECTED')
end

-- header
for k,v in pairs(header) do
	io.stdout:write(string.char(v));
end


for i=1,len do
	if tr then r = tr; tr = nil; else r = io.stdin:read('*n'); end
	g = io.stdin:read('*n')
	io.stdout:write(string.char(io.stdin:read('*n')))
	io.stdout:write(string.char(g))
	io.stdout:write(string.char(r))
	
	io.stdout:write(string.char(io.stdin:read('*n')))
end

--io.stdout:write(string.char(255)..string.char(255))

if(arg[3] == '-loop') then goto INPUT end
