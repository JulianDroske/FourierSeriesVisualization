-- Usage: script [width] [height]
-- @stdin: data
-- @data.format = R G B A

BMP = {
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
	curPos = 0;	-- For setPixelod()
	data = {};
	maxX = 0;
	maxY = 0;
}

function BMP:new()
	self.__index = self
	return self
end

-- Num2Byte
function BMP:n2b(n)
	local byte = {}
	local i = 1
	while not (n == 0) do
		byte[i] = n % 256;
		n = math.floor(n/256);
		i = i+1;
	end
	return byte;
end

function BMP:setSize(x,y)
	x,y = tonumber(x), tonumber(y)
	self.maxX = x;
	self.maxY = y;
end

function BMP:getSize()
	return self.maxX * self.maxY;
end

-- Extend
--[[ function BMP:setPixel(x,y,color)
	if(x > self.maxX) then self.maxX = x end
	if(y > self.maxY) then self.maxY = y end
	
	if(not self.data[x]) then self.data[x] = {}
	self.data[x][y] = color
end]]--

-- Absolute
function BMP:setPixel(x,y,color)
	if(x > self.maxX or y > self.maxY) then print('Out of Matrix'); os.exit(); end
	if(not self.data[x]) then self.data[x] = {} end
	self.data[x][y] = color
end

function BMP:l2xy(l)
	local x = (l-1) % self.maxX
	local y = math.ceil(l / self.maxX)
	return x+1,y
end

function BMP:setPixelod(l,color)
	local x,y = self:l2xy(l)
	if(not self.data[x]) then self.data[x] = {} end
	self.data[x][y] = color
end

function BMP:getCur()
	return self.curPos
end

function BMP:rePixelsod(colors, pos)
	-- l from colors
	pos = pos or 1
	local p = 1
	for i=pos,#colors do
		-- local x,y = self:l2xy(i)
		self:setPixelod(i,colors[p])
		p = p+1
	end
	self.curPos = self.curPos + #colors;
end

function BMP:setHeader(off,dat)
	local vl = nil
	for i=off+1,off+#dat do
		vl,vv = next(dat,vl)
		self.header[i] = vv
	end
end

function BMP:compile()
	-- Init
	
	-- setWidth & setHeight
	
	self:setHeader(2,self:n2b(54 + self:getSize()*4));
	self:setHeader(18,self:n2b(self.maxX));
	self:setHeader(22,self:n2b(self.maxY));
	-- for k,v in pairs(self.header) do io.stdout:write(v..',') end
	
	local dat = {}
	local i = 1
	-- header
	for k,v in pairs(self.header) do
		dat[i] = string.char(v);
		i = i+1;
	end
	
	-- body
	for y=self.maxY,1,-1 do
		for x=1,self.maxX do
			local img = nil;

			if(not self.data[x] or not self.data[x][y]) then img = {0,0,0,0};
			else img = self.data[x][y];
			end
			
			local mgi = 1;
			for z=i,i+3 do
				dat[z] = string.char(img[mgi])
				mgi = mgi+1;
			end
			i = i+4
		end
	end
	
	return dat;
end



-- Main
if(not arg[1] or not arg[2]) then
	print('Invalid Arguments')
	os.exit()
end

bmp = BMP:new()
bmp:setSize(arg[1], arg[2])
len = bmp:getSize()

-- Read from stdin
colors = {}
for i=1,len do
	colors[i] = {}
	for j = 3,1,-1 do
		colors[i][j] = io.stdin:read('*n')
	end
	colors[i][4] = io.stdin:read('*n')
end
bmp:rePixelsod(colors)
DATA = bmp:compile()

for k,v in pairs(DATA) do
	io.stdout:write(v)
end
