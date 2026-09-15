#include<dpmi.h>
#include<go32.h>
#include<stdio.h>
#include<dos.h>
#include<time.h>
#include<string.h>

main()
{
FILE *hand;
char *bigFNT,*destino;
long i;
unsigned char byte[8]={128,64,32,16,8,4,2,1};

bigFNT=(char *)malloc(52*55*93);
hand=fopen("big","rb");
fread(bigFNT,1,52*55*93,hand);
fclose(hand);

destino=(char *)malloc( ((52*55*93)/8)+8 );

for (i=0;i<52*55*93;i++) {
         if (bigFNT[i]==0) {destino[i/8]=destino[i/8] | byte[i%8];
                          printf("%u",destino[i/8]);}
                         }


hand=fopen("d","wb");
fwrite(destino,1,((52*55*93)/8)+8,hand);
fclose(hand);
return;
}
