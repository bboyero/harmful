inline void ponbaldosa (int origen,int destino,int lineas)
{
register int i; 
 for (i=0;i<lineas;i++)
  movedata (ds,(int)origen+(i*16),ds,(int)destino+(i*MAX_X),4);
}
inline void scrollDER()
{
register int i;
for (i=0;i<MAX_Y;i++)
movedata (ds,(int)Pfondo+(i*MAX_X)+4,ds,(int)Pfondo+(i*MAX_X),(MAX_X-4));
}
void ponefondoDER()
{
int offsetOrigen,offsetDestino,Nro;
char filas;
if (topeX==absolutoX) return;
scrollDER();
absolutoX+=4;
Nro=(mapaY*ancho)+mapaX+(MAX_X/16);//el n§ de baldosa que pondre 1§
offsetOrigen=(mapa[Nro]*256)+((posenbaldosaY*16)+posenbaldosaX);//pixel de la baldosa que pondre
offsetDestino=16-posenbaldosaY;//lineas que tengo que poner
 ponbaldosa ((int)baldosas+offsetOrigen,(int)Pfondo+(MAX_X-4),offsetDestino);//la 1¦ baldosa completa
Nro+=ancho;//Siguiente linea en el mapa
offsetOrigen=(mapa[Nro]*256)+(posenbaldosaX);//pixel de la baldosa que pondre
	     //ya estoy situado en destino

for (filas=0;filas<(MAX_Y/16);filas++){
ponbaldosa ((int)baldosas+offsetOrigen,(int)Pfondo+(offsetDestino*MAX_X)+(MAX_X-4),16);
offsetDestino+=16;
Nro+=ancho;//Siguiente linea en el mapa
offsetOrigen=(mapa[Nro]*256)+(posenbaldosaX);//pixel de la baldosa que pondre
			   }
posenbaldosaX+=4;if (posenbaldosaX>15) {posenbaldosaX=0;mapaX++;}
}
inline void scrollIZQ()
{
register int i;
for (i=0;i<MAX_Y;i++)
memmove ((void *)Pfondo+(i*MAX_X)+4,(void *)Pfondo+(i*MAX_X),(MAX_X-4));//Ojo sintanxis
}
void ponefondoIZQ()
{
int offsetOrigen,offsetDestino,Nro;
char filas;
if (absolutoX==0) return;
scrollIZQ();
absolutoX-=4;
posenbaldosaX-=4;if (posenbaldosaX<0) {posenbaldosaX=12;mapaX--;}
Nro=(mapaY*ancho)+mapaX;//el n§ de baldosa que pondre 1§
offsetOrigen=(mapa[Nro]*256)+((posenbaldosaY*16)+posenbaldosaX);//pixel de la baldosa que pondre
offsetDestino=16-posenbaldosaY;
 ponbaldosa ((int)baldosas+offsetOrigen,(int)Pfondo,offsetDestino);//la 1¦ baldosa completa
Nro+=ancho;//Siguiente linea en el mapa
offsetOrigen=(mapa[Nro]*256)+(posenbaldosaX);//pixel de la baldosa que pondre             
	     //ya estoy situado en destino

for (filas=0;filas<(MAX_Y/16);filas++){
ponbaldosa ((int)baldosas+offsetOrigen,(int)Pfondo+(offsetDestino*MAX_X),16);
Nro+=ancho;//Siguiente linea en el mapa
offsetOrigen=(mapa[Nro]*256)+(posenbaldosaX);//pixel de la baldosa que pondre
offsetDestino+=16;
			   }

}
inline void scrollABJ()
{
register int i;
for (i=0;i<MAX_Y;i++)
movedata (ds,(int)Pfondo+((i+4)*MAX_X),ds,(int)Pfondo+(i*MAX_X),MAX_X);
}
void ponefondoABJ()
{
int offsetOrigen,offsetDestino,Nro;
unsigned int resto,mover;
if (topeY==absolutoY) return;
char filas;
scrollABJ();
absolutoY+=4;
Nro=((mapaY+(MAX_Y/16))*ancho)+mapaX;//el n§ de baldosa que pondre 1§//12
offsetOrigen=(mapa[Nro]*256)+((posenbaldosaY*16)+posenbaldosaX);//pixel de la baldosa que pondre
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+(MAX_X*(MAX_Y-4)),16);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+(MAX_X*(MAX_Y-3)),16);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+(MAX_X*(MAX_Y-2)),16);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+(MAX_X*(MAX_Y-1)),16);
offsetDestino=(16-posenbaldosaX);
Nro++;//Siguiente baldosa en mapa
offsetOrigen=(mapa[Nro]*256)+(posenbaldosaY*16);//pixel de la baldosa que pondre
	     //ya estoy situado en destino
resto=(16-posenbaldosaX);
for (filas=0;filas<(MAX_X/16);filas++){
mover=(MAX_X-resto);if (mover>16) mover=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+offsetDestino+(MAX_X*(MAX_Y-4)),mover);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+offsetDestino+(MAX_X*(MAX_Y-3)),mover);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+offsetDestino+(MAX_X*(MAX_Y-2)),mover);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+offsetDestino+(MAX_X*(MAX_Y-1)),mover);
offsetDestino+=16;resto+=16;
Nro++;
offsetOrigen=(mapa[Nro]*256)+(posenbaldosaY*16);//pixel de la baldosa que pondre
                               }
posenbaldosaY+=4;if (posenbaldosaY>15) {posenbaldosaY=0;mapaY++;}
}
inline void scrollARR()
{
register int i;
for (i=(MAX_Y-1);i>=0;i--)
movedata (ds,(int)Pfondo+(i*MAX_X),ds,(int)Pfondo+((i+4)*MAX_X),MAX_X);
}
void ponefondoARR()
{
int offsetOrigen,offsetDestino,Nro;
unsigned int resto,mover;
if (absolutoY==0) return;
char filas;
scrollARR();
absolutoY-=4;
posenbaldosaY-=4;if (posenbaldosaY<0) {posenbaldosaY=12;mapaY--;}
Nro=(mapaY*ancho)+mapaX;//el n§ de baldosa que pondre 1§
offsetOrigen=(mapa[Nro]*256)+((posenbaldosaY*16)+posenbaldosaX);//pixel de la baldosa que pondre
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+0,16);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+MAX_X,16);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+(MAX_X*2),16);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+(MAX_X*3),16);

offsetDestino=(16-posenbaldosaX);
Nro++;//Siguiente baldosa en mapa
offsetOrigen=(mapa[Nro]*256)+(posenbaldosaY*16);//pixel de la baldosa que pondre
	     //ya estoy situado en destino

resto=(16-posenbaldosaX);
for (filas=0;filas<(MAX_X/16);filas++){
mover=(MAX_X-resto);if (mover>16) mover=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+offsetDestino,mover);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+MAX_X+offsetDestino,mover);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+(MAX_X*2)+offsetDestino,mover);
offsetOrigen+=16;
movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+(MAX_X*3)+offsetDestino,mover);
offsetDestino+=16;resto+=16;
Nro++;
offsetOrigen=(mapa[Nro]*256)+(posenbaldosaY*16);//pixel de la baldosa que pondre
                               }
}
void pone_fondo_completo()
{
long x,y,a;
int Nro,offsetOrigen,offsetDestino;
signed long firstX,firstY;
posenbaldosaX=posenbaldosaY=0;
firstX=(play[0].H_x/16);firstY=(play[0].H_y/16);

firstX=firstX-(MAX_X/32);
firstY=firstY-(MAX_Y/32);
if (firstX+(MAX_X/16)>ancho) firstX=ancho-(MAX_X/16); else if (firstX<0) firstX=0;
if (firstY+(MAX_Y/16)>alto) firstY=alto-(MAX_Y/16); else if (firstY<0) firstY=0;
mapaX=firstX;mapaY=firstY;
absolutoX=mapaX*16;absolutoY=mapaY*16;

 for (y=firstY;y<firstY+(MAX_Y/16);y++)
  for (x=firstX;x<firstX+(MAX_X/16);x++) {
                      Nro=(y*ancho)+x;                     
                      offsetOrigen=mapa[Nro]*256;
                      offsetDestino=(((y-firstY)*16)*MAX_X)+((x-firstX)*16);
                           for (a=0;a<16;a++) {
                              movedata(ds,(int)baldosas+offsetOrigen,ds,(int)Pfondo+offsetDestino,16);
                              offsetDestino+=MAX_X;offsetOrigen+=16;
                                              }
                                         }
}

