void wait_state(unsigned char retardo)
{
long i,t;
 for (i=0;i<=retardo*10000;i++) {t=(rand()*43);}
}
  void desliza_derecha(char vel)
{
 if (play[jug].H_x-absolutoX>MAX_X-20) return;
 play[jug].H_x+=vel;analizaDER(vel);
}
  void desliza_izquierda(char vel)
{
 if (play[jug].H_x-absolutoX<16) return;
 play[jug].H_x-=vel;analizaIZQ(vel);
}
  void desliza_arriba(char vel)
{ 
 if (play[jug].H_y-absolutoY<16) return;
 play[jug].H_y-=vel;analizaARR(vel);
}
  void desliza_abajo(char vel)
{
 if (play[jug].H_y-absolutoY>MAX_Y-16) return;
 play[jug].H_y+=vel;analizaABJ(vel);
}

void mirar_pies()
{
long prop;
        prop=caracteristica(play[jug].H_x+camHV_X-4,play[jug].H_y+4);
        switch (propiedad[prop])
        {
         case desDER:{desliza_derecha(2);return;}
         case desIZQ:{desliza_izquierda(2);return;}
         case desARR:{desliza_arriba(2);return;}
         case desABJ:{desliza_abajo(2);return;}
        };

}
  void ctrl_jugadores()
{
switch (jug)
    {
    case 0:
         {
         if (KeyTable[DER]==TRUE) derecha(); else
         if (KeyTable[IZQ]==TRUE) izquierda();
         if (KeyTable[ARR]==TRUE) arriba(); else 
         if (KeyTable[ABJ]==TRUE) abajo();         
         if (KeyTable[SPC]==TRUE) disparar(); else
         if (KeyTable[CERO]==TRUE) tira_pot(); else
         if (reposo!=TRUE) mueve_hombre();
         reposo=TRUE;
         mirar_pies();
         break;
         }
    case 1:
         {
         if (KeyTable[nDE]==TRUE) derecha(); else
         if (KeyTable[nIZ]==TRUE) izquierda();
         if (KeyTable[nAR]==TRUE) arriba(); else 
         if (KeyTable[nAB]==TRUE) abajo();         
         if (KeyTable[nDI]==TRUE) disparar(); else
         if (reposo!=TRUE) mueve_hombre();
         reposo=TRUE;
         mirar_pies();
         break;
         }
   }//switch
}
void mueve_play(char Activo,char Inactivo)
{
char tmp,tmp1;
jug=Activo;
         play[jug].H_x_back=play[jug].H_x;play[jug].H_y_back=play[jug].H_y;play[jug].H_s_back=play[jug].H_s;

         ctrl_jugadores();
    
         //yo choco con alguien (solo si me he movido)
         if (play[jug].H_s!=play[jug].H_s_back) 
         for (num=0;num<max_ene;num++) if (choqueyo_el(jug)==TRUE){
                                                 play[jug].H_x=play[jug].H_x_back;
                                                 play[jug].H_y=play[jug].H_y_back;
                                                 break; }

//Le he dado a el otro?
              EL.x1=play[Inactivo].H_x;EL.y1=play[Inactivo].H_y;
              EL.x2=EL.x1+13;EL.y2=EL.y1+13;
              //disparo
              YO.x1=play[jug].D_x;YO.y1=play[jug].D_y;
              YO.x2=play[jug].D_x+9;YO.y2=play[jug].D_y+9;

              if (HayInterseccion(YO,EL)==TRUE) {play[jug].D_d=255;
                                                           play[jug].D_x=play[jug].D_y=0;
                                                           play[Inactivo].energia-=arma_fuerza;
                                                          }

        // choco con el otro empujo?
         if (choqueP0_P1()==TRUE) {
                                   play[jug].H_x=play[jug].H_x_back;
                                   play[jug].H_y=play[jug].H_y_back;
                                   //empujo
                                   jug=Inactivo;
                                   tmp=play[Inactivo].H_d;tmp1=play[Inactivo].H_s;
                                   play[Inactivo].H_d=play[Activo].H_d;
                                    mueve_hombre();
                                   play[Inactivo].H_d=tmp;play[Inactivo].H_s=tmp1;//no cambia dir ni secu.
                                    jug=Activo;
                                  } 

}

  void mueve_players()
{
if ((play[0].energia>0) && (play[0].level_end==FALSE)) mueve_play(0,1);
if ((play[1].energia>0) && (play[1].level_end==FALSE)) mueve_play(1,0);
///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
          if (KeyTable[F01]==TRUE) marcador=1-marcador;
///control de enemigos
 for (num=0;num<max_ene;num++) {mueveE();poneE();
                                pon_disparo(enemigo[num].D_x,enemigo[num].D_y,enemigo[num].D_r,enemigo[num].D_d,enemigo[num].puntos);
                                if (enemigo[num].energia<=0) continue; //los muertos no me acercan
                                YO.x1=play[0].H_x;YO.y1=play[0].H_y;
                                YO.x2=YO.x1+16;YO.y2=YO.y1+16;
                                if (dado(enemigo[num].D_x+5,enemigo[num].D_y+5,YO)==TRUE)
                                           {enemigo[num].D_d=255;
                                           play[0].energia-=arma_fuerza;
                                           }

                                if ((play[1].energia>0) && (play[1].level_end==FALSE)) {
                                YO.x1=play[1].H_x;YO.y1=play[1].H_y;
                                YO.x2=YO.x1+16;YO.y2=YO.y1+16;
                                if (dado(enemigo[num].D_x+5,enemigo[num].D_y+5,YO)==TRUE)
                                           {enemigo[num].D_d=255;
                                           play[1].energia-=arma_fuerza;
                                           }
                                                }
                               }
///control de enemigos FIN
 num=9999;//para poder dar al ultimo
 if ((play[1].energia>0) && (play[1].level_end==FALSE)) {
                  poneH();
                  pon_disparo(play[1].D_x,play[1].D_y,play[1].D_r,play[1].D_d,play[1].puntos);
                 }
 if ((play[0].energia>0) && (play[0].level_end==FALSE)) {
 jug=0;poneH();
       pon_disparo(play[0].D_x,play[0].D_y,play[0].D_r,play[0].D_d,play[0].puntos);
                                                        }
}
  void pon_marcador()
{
unsigned char i;
         sprintf(cadena,"%d",play[0].energia);
         pontext_M (0,3,cadena);
         sprintf(cadena,"%u",play[0].puntos);
         pontextXY(50,3,cadena,miniFNT);
         for (i=0;i<play[0].llaves;i++) putico(i*5,13,16,16,mkey,Pvirtual);
         for (i=0;i<play[0].pot;i++) putico(i*5,23,16,16,mpot,Pvirtual);

         i=0;
         if (play[0].magia) {putico(i*10,36,16,16,mmagia,Pvirtual);i++;}
         if (play[0].armadura) {putico(i*10,36,16,16,marmadura,Pvirtual);i++;}
         if (play[0].combate) {putico(i*10,36,16,16,mcombate,Pvirtual);i++;}

         if (PLAYERS==2) {
         sprintf(cadena,"%d",play[1].energia);
         pontext_M (MAX_X-80,3,cadena);
         sprintf(cadena,"%u",play[1].puntos);
         pontextXY(MAX_X-30,3,cadena,miniFNT);
         for (i=0;i<play[1].llaves;i++) putico((MAX_X-80)+(i*5),13,16,16,mkey,Pvirtual);
         for (i=0;i<play[1].pot;i++) putico((MAX_X-80)+(i*5),23,16,16,mpot,Pvirtual);

         i=0;
         if (play[1].magia) {putico((MAX_X-80)+(i*10),36,16,16,mmagia,Pvirtual);i++;}
         if (play[1].armadura) {putico((MAX_X-80)+(i*10),36,16,16,marmadura,Pvirtual);i++;}
         if (play[1].combate) {putico((MAX_X-80)+(i*10),36,16,16,mcombate,Pvirtual);i++;}

                         }

}
