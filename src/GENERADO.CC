char max_gen;
char ruleta;
struct house
{
long X,Y;
signed char energia;
unsigned char tipo=0,vel=7;//<-----Rabia del generador
} generador[50+5];

int gn;

  void activa_generador()
{
long prop;
int x,y;
char i;
x=generador[gn].X-absolutoX;y=generador[gn].Y-absolutoY;
if ((x<-16) || (x>MAX_X) || (y<-16) || (y>MAX_Y)) return;
if ((generador[gn].energia<=0) || (veces%generador[gn].vel!=0)) return;
 for (num=0;num<=max_ene;num++) if (enemigo[num].s_m>5) break;//si ya ha explotado
 if (num==max_ene) return; //no hay 'sitio' para mas
//por donde lo intento generar.
ruleta++;if (ruleta>7) ruleta=0;
switch(ruleta){
           case 0:{enemigo[num].X=generador[gn].X;
                   enemigo[num].Y=generador[gn].Y-16;
                   break;
                  }
           case 1:{enemigo[num].X=generador[gn].X+16;
                   enemigo[num].Y=generador[gn].Y-16;
                   break;
                  }
           case 2:{enemigo[num].X=generador[gn].X+16;
                   enemigo[num].Y=generador[gn].Y;
                   break;
                  }
           case 3:{enemigo[num].X=generador[gn].X+16;
                   enemigo[num].Y=generador[gn].Y+16;
                   break;
                  }
           case 4:{enemigo[num].X=generador[gn].X;
                   enemigo[num].Y=generador[gn].Y+16;
                   break;
                  }
           case 5:{enemigo[num].X=generador[gn].X-16;
                   enemigo[num].Y=generador[gn].Y+16;
                   break;
                  }
           case 6:{enemigo[num].X=generador[gn].X-16;
                   enemigo[num].Y=generador[gn].Y;
                   break;
                  }
           case 7:{enemigo[num].X=generador[gn].X-16;
                   enemigo[num].Y=generador[gn].Y-16;
                   break;
                  }

                }
//compruebo si es posible
if ((choque_entre_ellos()==TRUE) || (choque(0)==TRUE) || (choque(1)==TRUE)) return;

 prop=caracteristica(enemigo[num].X,enemigo[num].Y);
 if (propiedad[prop]!=0) return;
/*
 prop+=ancho;if (propiedad[prop]!=0) return;
 prop++;if (propiedad[prop]!=0) return;
 prop+=ancho;if (propiedad[prop]!=0) return;
*/
// si estoy aqui lo es

 enemigo[num].tipo=generador[gn].tipo;
 init_personaje(enemigo[num].tipo);
 enemigo[num].energia=generador[gn].energia;

}

  void putimage(int x,int y,int LX,int LY,unsigned char *origen,unsigned char *destino)
{
register int cx,cy;
for (cy=0;cy<LY;cy++)
 for (cx=0;cx<LX;cx++) {
                putpixel (cx+x,cy+y,*origen,destino);
                origen++;
                       }

}

  void putimage_CTRL(int x,int y,int LX,int LY,unsigned char *origen,unsigned char *destino)
{
register int cx,cy;
for (cy=y;cy<LY+y;cy++)
 for (cx=x;cx<LX+x;cx++) {
            if ((cx>=0) && (cx<MAX_X) && (cy>=0) && (cy<MAX_Y))
                putpixel (cx,cy,*origen,destino);
                origen++;
                       }

}

  void destruye_generador()
{
long prop;
prop=(generador[gn].Y/16)*ancho+(generador[gn].X/16);
propiedad[prop]=0;
mapa[prop]=522;//Imagen del generador destruido
putimage_CTRL(generador[gn].X-absolutoX,generador[gn].Y-absolutoY,16,16,baldosas+(mapa[prop]*256),Pfondo);
}
