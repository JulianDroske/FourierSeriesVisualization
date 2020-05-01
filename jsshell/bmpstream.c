#include "stdio.h"
#include "io.h"
#include "fcntl.h"
#include "malloc.h"
#include "stdlib.h"

int LOOP=0;

int strl(char* str){
	int l=0;
	while(str[l]) ++l;
	return l;
}

int strc(char* s1, char* s2){
	int l = strl(s1);
	if(l != strl(s2)) return 0;
	for(int i=0;i<l; ++i){
		if(s1[i] != s2[i]) return 0;
	}
	return 1;
}

int parseInt(char* str){
	int n = strl(str);
	int num=0;
	for(int i=0;i<n;++i){
		num *= 10;
		num += str[i] - 48;
	}
	return num;
}

char* n2b(int num){
	static char byte[] = {0,0,0,0};
	if(num<0){
		for(int j=3;j>=0;--j){
			for(int k=0;k<8;++k){
				byte[j] = byte[j]*2 + (num&0x80000000?1:0);
				num <<= 1;
			}
		}
	}else{
		for(int i=0;i<4;++i){
			byte[i] = num % 256;
			num /= 256;
		}
	}
	return byte;
}

void setHeader(char* head, char* byte, int pos){
	for(int i=pos, j=0;j<4;++i,++j){
		head[i] = byte[j];
	}
}

int main(int argc, char**argv){
	if(_setmode(_fileno(stdout), O_BINARY) == -1){
		printf("Cannot set stdout to binary mode.\n");
		return -1;
	}
	
	if(argc<3){
		printf("Invalid Arguments.\n");
		return -1;
	}
	
	if(argc>3){
		// extra options
		if(strc(argv[3],"-loop")){
			LOOP = 1;
		}
	}
	
	char header[] = {'B','M',0,0,0,0,0,0,0,0,54,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,1,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
	
	int width = parseInt(argv[1]);
	int height = parseInt(argv[2]);
	
	setHeader(header,n2b(width*height*4+54),2);
	setHeader(header,n2b(width),18);
	setHeader(header,n2b(0-height),22);
	
	LOOP_START:
	for(int i=0;i<54;++i){
		// printf("%d ",header[i]);
		fputc(header[i],stdout);
	}
	
	int n = width*height;
	int R,G,B,A;
	for(int i=0;i<n;++i){
		if(scanf("%d%d%d%d",&B,&G,&R,&A)!=4){
			if(i!=0){
				fputs("Warning: data may corrupted.\n",stderr);
			}
			fflush(stdout);
			goto LOOP_END;
		}
		printf("%c%c%c%c",R,G,B,A);
	}
	fflush(stdout);
	if(LOOP) goto LOOP_START;
	LOOP_END:
	return 0;
}
