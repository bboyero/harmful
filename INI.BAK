#include<stdio.h>
#include<io.h>
#include<string.h>
#include<stdlib.h>

char *cuerpo;

int valorDE(char *QUE)
{
char *coincide;
coincide=strstr (cuerpo,QUE);
return(atoi(coincide+strlen(QUE)));
}
char *textoDE(char *QUE)
{
char *coincide;
coincide=strstr (cuerpo,QUE);
return(coincide+strlen(QUE));
}
void initINI(char fichero[])
{
FILE *ini;
struct stat statbuf;
int i=0;
if ((ini = fopen(fichero, "rt"))== NULL)
 {
   printf("ERROR 66: Falta el fichero %s",fichero);
   exit (66);
 }
stat (fichero,&statbuf);
cuerpo=(char *)malloc(statbuf.st_size);
while (!feof(ini)) {
		    cuerpo[i]=fgetc(ini);
		    i++;cuerpo[i]=0;//pon el final de cadena
		   }
fclose(ini);

}
/*
main()
{
initINI("ziiip.ini");

printf("%i",valorDE("Frames="));
free(cuerpo);
return(0);
}
*/
