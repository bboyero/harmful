
#include "ini.cc"

#define TRUE 1
#define FALSE 0
static char VOLCAR=FALSE;

unsigned char resolucion_de_juego;
const MAX_X=640;
int MAX_Y,V_D_J,WINDOWS;
unsigned char PLAYERS,TICS_SEG=18,WS;

void Initctes()
{
char i;
printf("\nLeyendo fichero de inicio....\n");
initINI("harmful.ini");
resolucion_de_juego=valorDE("M_VIDEO=");
PLAYERS=valorDE("PLAYERS=");

        SB=valorDE("SOUND=");
       if (SB==1) {
        sb_ioaddr=valorDE("SB_A=");
        sb_irq =valorDE("SB_I=");
        sb_DMA =valorDE("SB_D=");
        DMA_CHUNK=valorDE("DMA_CHUNK=");
        sb_master =valorDE("SB_VOLUME=");
        sb_auto=valorDE("SB_AUTO=");
                  }

switch (resolucion_de_juego)
 {
// case (0): {MAX_X=320;MAX_Y=208; V_D_J=0x013;break;}
 case (1): {MAX_Y=400; V_D_J=0x100;break;}
 case (2): {MAX_Y=480; V_D_J=0x101;break;}
 default:{printf("Force to default Video mode./n");MAX_Y=400;V_D_J=0x100;break;}
// case (3): {MAX_X=800;MAX_Y=608; V_D_J=0x103;break;}
// case (4): {MAX_X=1024;MAX_Y=768;V_D_J=0x105;break;}
 }
printf ("max_x=%i max_y=%i\n",MAX_X,MAX_Y);

 WINDOWS=valorDE("WINDOWS=");
 if (WINDOWS==3){
                 r.x.ax=0x1600;                 
                 _go32_dpmi_simulate_int(0x2f,&r);
                 if (r.h.al!=0) {WINDOWS=1;
                                 printf("Windows Version: %d.%d\n",r.h.al,r.h.ah);
                                }
                }
 if (WINDOWS==1) { printf("Iniciando en modo Windows\n");
                   WS=valorDE("WaitState=");printf("*WS=%i\n",WS);
                 }
TICS_SEG=valorDE ("TICS_SEG=");
printf("FRAMES_SEG=%i\n",TICS_SEG);
free(cuerpo);//los datos del archibo ini.
}
