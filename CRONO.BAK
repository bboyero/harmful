#define CTR 90
int cr_ini;
char *led;


inline void pone_crono()
{
char i;
for (i=15;i>=0;i--) {putico(13*i+CTR,0,11,33,led+(11*33),Pvirtual);
                    putico((13*(15-i))+256+CTR,0,11,33,led+(11*33),Pvirtual);
                    }
}

void init_crono(char n)
{
Setpal(114,0,161,0);Setpal(115,0,235,0);
cr_ini=crono=(n*18);
}

inline void actualiza_crono()
{
char i;
int quedan;
pone_crono();
quedan=((16*crono)/cr_ini);
 for (i=quedan;i<16;i++) {putico(13*(15-i)+CTR,0,11,33,led,Pvirtual);
                          putico((13*i)+256+CTR,0,11,33,led,Pvirtual);}

if ((quedan<8) && (quedan>4)) {Setpal(114,161,161,0);Setpal(115,235,235,0);} else
if (quedan<4) {Setpal(114,161,0,0);Setpal(115,235,0,0);}

if (crono<=10) {inmovil=play[0].repulsivo=play[1].repulsivo=inmune=FALSE;crono=-1;
               play[0].invisible=play[1].invisible=FALSE;
               }
}

