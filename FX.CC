

void lineaAlinea()
{
register unsigned int scrollx,i;
char vel=10;
for (scrollx=0;scrollx<=MAX_X;scrollx+=vel)
 {
   for (i=0;i<MAX_Y;i++)
    {
     movedata (ds,(int)Pfondo+((MAX_X*i)+(MAX_X-scrollx)),ds,(int)Pvirtual+(MAX_X*i),scrollx+1);
     i++;
     movedata (ds,(int)Pfondo+(MAX_X*i),ds,(int)Pvirtual+((MAX_X*i)+(MAX_X-scrollx)),scrollx+1);
    }
   volcado2SVGA((int)Pvirtual);if (scrollx>580) vel=5;
 }
}

void pixelize()
{
 int x,y,offsetOrigen,offsetDestino;
 char factor,a; 
 for (factor=16;factor>1;factor--) {
 for (y=0;y<MAX_Y;y+=factor)
  for (x=0;x<MAX_X;x+=factor) {                         
                        for (a=0;a<factor;a++)
                          Hline (x,y+a,factor,Pfondo[(MAX_X*y)+x],(char *)Pvirtual);
                              }
 volcado2SVGA((int)Pvirtual);
                                   }
}
 void to_gray()
{
unsigned char r,g,b,gris;
unsigned short color;
for (color=0;color<=255;color++) {
   Getpal(color,r,g,b);
   paleta[color][0]=paleta[color][1]=paleta[color][2]=(4*r + 10*g + 2*b)>>4;
                                  }
}
 void to_black()
{
memset (paleta,0,256*3);
}
 void to_white()
{
memset (paleta,63,256*3);
}
void pon_paleta()
{
unsigned short color;
for (color=0;color<256;color++)
 Setpal(color,paleta[color][0],paleta[color][1],paleta[color][2]);
}
 void fade_to(char speed)
{
unsigned char i,r,g,b;
unsigned short color;
for (i=0;i<64;i++){
    for (color=0;color<256;color++) {
                                     Getpal(color,r,g,b);
                                     if (r>paleta[color][0]) r--; else
                                         if (r<paleta[color][0]) r++;
                                     if (g>paleta[color][1]) g--; else
                                        if (g<paleta[color][1]) g++;
                                     if (b>paleta[color][2]) b--; else
                                        if (b<paleta[color][2]) b++;
                                        wait_retaze();
                                     Setpal(color,r,g,b);
                                    }            
                  delay(speed);wait_retaze();
                  }
}
void putico_escala(int x,int y,int LX,int LY,unsigned char *origen,unsigned char *destino,char escala)
{
register int cx,cy,pixel=0,ix,iy;
for (cy=0;cy<LY*escala;cy+=escala)
 for (cx=0;cx<LX*escala;cx+=escala) {
                if (origen[pixel]!=0) {
                            for (iy=0;iy<escala;iy++)
                             for (ix=0;ix<escala;ix++)
                            putpixel (x+cx+ix,y+cy+iy,origen[pixel],destino);
                                      } 
		pixel++;
							}
}
void rotar_toda(char inicio)
{
int i;
char r,g,b,rt,gt,bt;
 Getpal(inicio,rt,gt,bt);
 for (i=inicio;i<=254;i++) {Getpal(i+1,r,g,b);Setpal(i,r,g,b);}
 Setpal(255,rt,gt,bt);
}
void black_hole(char inicio)
{
int i;
char r,g,b;
 for (i=inicio;i<=254;i++) {Getpal(i+1,r,g,b);Setpal(i,r,g,b);}
 Setpal(255,0,0,0);
}

/*
void fundido(char *origen,char *destino,char *resultado,char *origen_pal,char *destino_pal)
{
register unsigned int x,y;
int color,actual;
char r,g,b,r1,g1,b1,cambios;
 for (y=0;y<MAX_Y;y++);
  for (x=0;x<MAX_X;x++) {
       if ((getpixel(x,y,origen)!=0) || (getpixel(x,y,destino)!=0)) {
              cambios=FALSE;
              r=origen_pal[(getpixel(x,y,origen)*3)+0];
              g=origen_pal[(getpixel(x,y,origen)*3)+1];
              b=origen_pal[(getpixel(x,y,origen)*3)+2];
              r1=destino_pal[(getpixel(x,y,destino)*3)+0];
              g1=destino_pal[(getpixel(x,y,destino)*3)+1];
              b1=destino_pal[(getpixel(x,y,destino)*3)+2];

              for (color=0;color<=actual;color++){
                  if ( (origen_pal[(color*3)+0]==r) && (origen_pal[(color*3)+1]==g) && (origen_pal[(color*3)+2]==b)
                     &&(destino_pal[(color*3)+0]==r1) && (destino_pal[(color*3)+1]==g1) && (destino_pal[(color*3)+2]==b1) ) {
                                                                                     cambios=TRUE;
                                                                                     putpixel (x,y,color,resultado);
                                                                                                                   }
                                                 }//for color
              if (cambios==FALSE) {
                   actual++;
                   putpixel (x,y,actual,resultado);
                   origen_pal[(actual*3)+0]=r;
                   origen_pal[(actual*3)+1]=g;
                   origen_pal[(actual*3)+2]=b;
                   destino_pal[(actual*3)+0]=r1;
                   destino_pal[(actual*3)+1]=g1;
                   destino_pal[(actual*3)+2]=b1;
                                  }
                                                                   }
                        }
}
*/
