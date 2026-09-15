{$G+,A+,F-,E-,O-,R-,S-,I-,Q-,V-,B-,X-,T-,P-,D+,L+,Y-,N-,E-}
{cccccccc nnnnnnnn nnnnnnnn -->64K baldosas 256 caracteristicas}
Uses Graph,Crt,Dos,raton;
{$F+}
procedure SVGA256m;external;
  {$L svga256m.obj}
const regilla=5;filas=16;columnas=16;
      maxbal=255;
      blanco=255;negro=0;{largo=101;alto=53;}
      agua=1;solido=2;mina=3;deslizDER=4;deslizIZQ=5;deslizARR=6;deslizABJ=7;
      fragil=10;fragil1=12;
      aleatorio=99;
      llave=100;comida=101;comidaF=102;pocion=104;pocionF=103;veneno=120;llavero=121;
      armadura=105;combate=106;magia=107;inmovil=108;inmune=109;repulsivo=110;invisible=111;
      trampa=252;cable=251;solidoF=250;{solido falso}
      salida=255;generador=254;puerta=253;trans=249;
      void=200;
const Xorigen=380;Yorigen=50;{regilla}
var mapa,fondo,caract:pointer;
    Pmapa,aux3:^word;{apunta a la posicion del mapa que edito}
    Pbaldosa,aux,aux2:^byte;{apuna a la baldosa que edito}
    Mox,Moy:word;
    Mol,Mom,Mor,fin:boolean;
    color:byte;
    OFSmapa,OFSbaldosa:word;
    tecla:char;
    Px,Py,editando,baldosa,Xb,Yb,ultima,ultimoMAPA:word;
    tmp:string[8];
    paleta:array [0..767] of byte;
    caracteristica:word;
    ViendoX,ViendoY:integer;
    tmp1,incX,incY:byte;
    largo,alto:word;
    fic_fondo:file;
    Nro,bancoACTUAL,banco:longint;
    leido,overflow:word;
    G_x,G_y:array [0..50] of longint;
    G_t:array [0..50] of byte;
    E_x,E_y:array[0..100] of longint;
    E_t:array [0..100] of longint;

   {---------------------}
   Autor:string [25];
   origenX,origenY:longint;

Function ABase(Num: longint) : String;
Const
  BaseChars : Array [0..15] of Char = '0123456789ABCDEF';
Var
  St : String;
begin
  St := '';
  Repeat
    St  := BaseChars[Num MOD 16] + St;
    Num := Num Div 16;
  Until Num = 0;
  ABase:= St;
end;
procedure grafico;
var   driver, modo : integer;
begin
  Driver := InstallUserDriver('SVGA256m',nil);
  if RegisterBGIdriver(@SVGA256m)<0 then halt(1);
  modo:=2;
  InitGraph(driver,modo,'');
  mouseRESET;
  mouseLIM (0,0,639,479);
end;
procedure ponemapa;
var x,y:word;
    color:byte;
begin
aux:=caract;
for y:=0 to alto-1 do
 for x:=0 to largo-1 do
  begin
     case aux^ of
      solido:putpixel (x,y,200);
        agua:putpixel (x,y,145);
      puerta:putpixel (x,y,32);
      salida:putpixel (x,y,99);
      generador:putpixel(x,y,111);

   DeslizDER:putpixel (x,y,183);
   DeslizIZQ:putpixel (x,y,120);
   end;
  inc (aux);
  end;
end;

procedure cuadricula;
var x,y:word;
begin
for y:=0 to filas-1 do
    for x:=0 to columnas-1 do begin
                            inc (Pbaldosa,(y*16)+x);
                            setfillstyle (1,Pbaldosa^);
    bar ((X*regilla)+1+Xorigen,(Y*regilla)+1+Yorigen,(X*regilla)+regilla-1+Xorigen,(Y*regilla)+regilla-1+Yorigen);
                            Pbaldosa:=fondo;inc (Pbaldosa,baldosa*256);
                            {**************}
{                            putpixel (x+550,y+60,imagen^[x+(y*320)+offset]);}
                            end;
end;
procedure cambia;
var x,y:word;
begin
aux3:=mapa;
for y:=0 to (alto*largo)-1 do begin
                        if (aux3^=0) then aux3^:=42;
                        inc(aux3);
                        end;

end;
procedure graba;
var f:file;
    i:word;
begin
(*
{----trns}
aux3:=mapa;aux:=caract;

for i:=1 to largo*alto do
 begin
if (aux3^ and 49152)=49152 then aux^:=solidos else
if (aux3^ and 32768)=32768 then aux^:=agua else
if (aux3^ and 16384)=16384 then aux^:=mortal else aux^:=0;
 aux3^:=aux3^ and 16383;
 inc (aux3);inc(aux);
 end;
{}*)
assign (f,paramstr(1));
rewrite (f,1);
 blockwrite (f,largo,2);
 blockwrite (f,alto,2);
 blockwrite (f,origenX,4);
 blockwrite (f,origenY,4);
blockwrite (f,mapa^,largo*alto*2);
{close(f);}

 {assign (f,'caract.dat');
rewrite (f,1);}
blockwrite (f,caract^,largo*alto);
 for i:=0 to 49 do begin
 blockwrite (f,G_x[i],4);
 blockwrite (f,G_y[i],4);
 blockwrite (f,G_t[i],1);
                 end;
for i:=0 to 99 do begin
  blockwrite (f,E_x[i],4);
  blockwrite (f,E_y[i],4);
  blockwrite (f,E_t[i],1);
                 end;

blockwrite (f,autor[1],25);
close (f);





assign (f,'gen');
rewrite (f,1);
 for i:=0 to 49 do begin
 blockwrite (f,G_x[i],4);
 blockwrite (f,G_x[i],4);
 blockwrite (f,G_t[i],1);
                 end;
close (f);
(*

                             {-------------------------------------}
                             seek (fic_fondo,(bancoACTUAL*256)*maxbal);
                             if ultima<((bancoACTUAL+1)*maxbal) then overflow:=ultima else overflow:=maxbal;
                             blockwrite (fic_fondo,fondo^,256*overflow);
                             close(fic_fondo);
                             {-------------------------------------}
  *)
{assign (f,'fondo.dat');
rewrite (f,1);
blockwrite (f,fondo^,(16*16*ultima));
close (f);}

end;
procedure carga;
var f:file;
    i:byte;
begin
     Assign(Fic_fondo,'fondo.1');
     reset (fic_fondo,1);
      ultima:=filesize(fic_fondo) div 256;
     getmem (fondo,maxbal*256);
     fillchar (fondo^,256*maxbal,0);
     blockread (fic_fondo,fondo^,(256*maxbal));
{     close (f);}
bancoACTUAL:=0;

     assign(F, 'paleta.1');
     reset(f,1);
     blockread(f,paleta,768);
     close (f);

     assign (f,paramstr(1));
     reset(f,1);
     blockread (f,largo,2);
     blockread (f,alto,2);
     blockread (f,origenX,4);
     blockread (f,origenY,4);
     getmem(mapa,largo*alto*2);
     blockread (f,mapa^,largo*alto*2);
     getmem (caract,largo*alto);
     blockread (f,caract^,largo*alto);
 for i:=0 to 49 do begin
 blockread (f,G_x[i],4);
 blockread (f,G_y[i],4);
 blockread (f,G_t[i],1);
                 end;
 for i:=0 to 99 do begin
 blockread (f,E_x[i],4);
 blockread (f,E_y[i],4);
 blockread (f,E_t[i],1);
                   end;
                   blockread (f,autor[1],25);
close (f);
{alto:=100;}
end;
procedure Amapa;
var x,y:byte;
begin
mouseOFF;
for y:=0 to filas-1 do
    for x:=0 to columnas-1 do begin
                            inc (Pbaldosa,(y*16)+x);
                             putpixel (x+Xb,y+Yb,Pbaldosa^);

                             banco:=baldosa div maxbal;
                             if banco<>bancoACTUAL then begin
                             bancoACTUAL:=banco;
                             seek (fic_fondo,(bancoACTUAL*256)*maxbal);

{                             if ultima<((bancoACTUAL+1)*maxbal) then overflow:=ultima else overflow:=maxbal;
                             blockwrite (fic_fondo,fondo^,256*overflow);}
                                  fillchar (fondo^,256*maxbal,0);
                             blockread(fic_fondo,fondo^,256*maxbal,leido);
                                                        end;
                             Nro:=baldosa-(maxbal*banco);

                            Pbaldosa:=fondo;inc (Pbaldosa,Nro*256);
                            end;
mouseON;
end;
procedure actualizaBALDOSA;
var a,b,x,y:byte;
begin
mouseOFF;
Xb:=1;Yb:=151;
for a:=0 to 34 DO BEGIN
                              {-------------------------------------}
                             banco:=(OFSbaldosa+a) div maxbal;
                             if banco<>bancoACTUAL then begin
                             bancoACTUAL:=banco;
                             seek (fic_fondo,(bancoACTUAL*256)*maxbal);
                 {                                       bar (0,110,50,140);}
{                             str (bancoACTUAL,tmp);outtextXY(0,120,tmp);
                             str (filepos(fic_fondo),tmp);outtextXY(0,130,tmp);}

                             {if ultima<((bancoACTUAL+1)*maxbal) then overflow:=ultima else overflow:=maxbal;
                             blockwrite (fic_fondo,fondo^,256*overflow);}
                                  fillchar (fondo^,256*maxbal,0);
                             blockread(fic_fondo,fondo^,256*maxbal,leido);
{                             str (leido,tmp);outtextXY(0,110,tmp);}
                                                        end;
                             Nro:=(OFSbaldosa+a)-(maxbal*banco);
                             {-------------------------------------}
 Pbaldosa:=fondo;inc (Pbaldosa,Nro*256);
 for y:=0 to filas-1 do
    for x:=0 to columnas-1 do begin
                             putpixel (x+Xb,y+Yb,Pbaldosa^);
                             inc (Pbaldosa,1);
                              end;
                  inc (XB,17);
                  END;
mouseON;
end;
procedure actualizaMAPA;
var a,b,x,y:byte;
    tmpb:byte;
 datomapa:word;
begin
mouseOFF;
setfillstyle (1,0);
bar (0,180,612,189);
for a:=0 to 13 do
  for b:=0 to 35 do begin
          Xb:=(b*17)+1;Yb:=(a*17)+191;
          outtextXY (Xb,180,Abase(b+OFSmapa));
          Pmapa:=mapa;
          inc (Pmapa,((a*largo)+b)+OFSmapa);
          aux:=caract;
          inc (aux,((a*largo)+b)+OFSmapa);
           datoMAPA:=Pmapa^;
                              {-------------------------------------}
                             banco:=datomapa div maxbal;
                             if banco<>bancoACTUAL then begin
                             bancoACTUAL:=banco;
                             seek (fic_fondo,(bancoACTUAL*256)*maxbal);
                             {if ultima<((bancoACTUAL+1)*maxbal) then overflow:=ultima else overflow:=maxbal;
                             blockwrite (fic_fondo,fondo^,256*overflow);}
                                  fillchar (fondo^,256*maxbal,0);
                             blockread(fic_fondo,fondo^,256*maxbal,leido);
                                                        end;
                             Nro:=datomapa-(maxbal*banco);
                             {-------------------------------------}

          Pbaldosa:=fondo;inc(Pbaldosa,256*Nro);

if (a+ViendoY<alto) and (b+ViendoX<largo) then BEGIN
for y:=0 to filas-1 do
    for x:=0 to columnas-1 do begin
                             putpixel (x+Xb,y+Yb,Pbaldosa^);
                             inc (Pbaldosa,1);
                            end;

           case aux^ of
           solido:outtextXY(Xb,Yb,'S');
             agua:outtextXY (Xb,Yb,'A');
        deslizDER:outtextXY (Xb,Yb,'DD');
        deslizIZQ:outtextXY (Xb,Yb,'DI');
        generador:outtextXY(Xb,Yb,'Gen');
        void:outtextXY(Xb,Yb,'Ene');
        puerta:outtextXY(Xb,Yb,'P');
        pocion:outtextXY(Xb,Yb,'M');
        pocionF:outtextXY(Xb,Yb,'Mf');
        veneno:outtextXY(Xb,Yb,'Vn');
        llave:outtextXY(Xb,Yb,'Ll');
        comida:outtextXY(Xb,Yb,'Cm');
        comidaF:outtextXY(Xb,Yb,'Cf');
        salida:outtextXY(Xb,Yb,'SA');
        fragil:outtextXY(Xb,Yb,'F3');
        fragil1:outtextXY(Xb,Yb,'F1');
        trampa:outtextXY(Xb,Yb,'Tr');
        cable:outtextXY(Xb,Yb,'Cb');
        solidoF:outtextXY(Xb,Yb,'Sf');
        mina:outtextXY(Xb,Yb,'Mn');
        armadura:outtextXY(Xb,Yb,'Ar');
        combate:outtextXY(Xb,Yb,'Cb');
        magia:outtextXY(Xb,Yb,'Mg');
        aleatorio:outtextXY(Xb,Yb,'??');
        inmovil:outtextXY(Xb,Yb,'In');
        inmune:outtextXY(Xb,Yb,'Im');
        repulsivo:outtextXY(Xb,Yb,'Re');
        invisible:outtextXY(Xb,Yb,'Iv');
        trans:outtextXY(Xb,Yb,'Tr');
        deslizDER:outtextXY(Xb,Yb,'Dd');
        deslizIZQ:outtextXY(Xb,Yb,'Di');
        deslizARR:outtextXY(Xb,Yb,'Da');
        deslizABJ:outtextXY(Xb,Yb,'Db');
           end;

                                            END ELSE
for y:=0 to filas-1 do
    for x:=0 to columnas-1 do begin
                             putpixel (x+Xb,y+Yb,255);
                             inc (Pbaldosa,1);
                            end;

                      end;
mouseON;
end;
procedure pantalla;
var   cont,cont2:byte;
begin
setcolor (28);setfillstyle (1,28);
for cont:=0 to filas do bar (0+Xorigen,((cont*regilla))+Yorigen,(columnas*regilla)+Xorigen,(cont*regilla)+Yorigen);
for cont:=0 to columnas do line ((cont*regilla)+Xorigen,0+Yorigen,(cont*regilla)+Xorigen,(filas*regilla)+Yorigen);
setcolor (blanco);setfillstyle (1,blanco);
for cont:=0 to 14 do bar (0,190+(cont*17),36*17,190+(cont*17));
for cont:=0 to 36 do line ((cont*17),190,(cont*17),428);

for cont:=0 to 1 do bar (0,150+(cont*17),595,150+(cont*17));
for cont:=0 to 35 do line ((cont*17),150,(cont*17),166);

for cont:=0 to 4 do bar (0,439+(cont*10),639,439+(cont*10));
for cont:=0 to 64 do line ((cont*10),440,(cont*10),479);

color:=0;
for cont2:=0 to 3 do
 for cont:=0 to 63 do begin
                     setfillstyle (1,(color));
                     bar ((cont*10)+1,440+(cont2*10),(cont*10)+9,448+(cont2*10));
                     inc (color,1);
                     end;

line (639,439,639,480);
{rectangle (549,59,550+columnas,60+filas);
setcolor (blanco);setfillstyle (1,blanco);}
outtextXY (550,0,'Co:');outtextXY (550,10,'Col:');
outtextXY (550,20,'Edi:');outtextXY (550,30,'Bal:');

outtextXY (400,0,'Incrementos X:');
outtextXY (400,10,'Incrementos Y:');
str (largo,tmp);outtextXY(400,20,'Max X: '+tmp);
str (alto,tmp);outtextXY(400,30,'Max Y: '+tmp);
{outtextXY (550,20,'Ori:');outtextXY (550,30,'Des:');outtextXY (550,40,'Lon:');}
setcolor (1);
rectangle (600,150,615,166);
rectangle (620,190,639,220);
rectangle (360,0,370,9);rectangle (360,10,370,20);
setcolor (4);
rectangle (620,150,635,166);
rectangle (620,230,639,260);
rectangle (380,0,390,9);rectangle (380,10,390,20);
setcolor (118);
rectangle (620,270,639,300);

setcolor (15);
rectangle (620,310,639,340);

outtextXY (475,40,'<ESC> Salir y grabar');
outtextXY (475,50,'<1> Trans/Soldado');
outtextXY (475,60,'<2> Agua/Mago');
outtextXY (475,70,'<3> Solido/Fantasma');
outtextXY (475,80,'<4> Fragil<5> Fgrl1');
outtextXY (475,90,'<P> Puerta');
outtextXY (475,100,'<S> Salida');
outtextXY (475,110,'<*> Origen');
outtextXY (475,120,'<+-.> Generador');
outtextXY (475,130,'<L> Llave');
outtextXY (475,140,'<C> Comida<c>C.Frg');

outtextXY (310,50,'<M> Pocion<m>P.Frg');
outtextXY (310,60,'<6> Trampa,<V>Ven.');
outtextXY (310,70,'<7> Cable');
outtextXY (310,80,'<8> S.Falso');
outtextXY (310,90,'<90­> Enemigo');
outtextXY (310,100,'<Q> Mina');
outtextXY (310,110,'<A> Armadura');
outtextXY (310,120,'<W> Combate');
outtextXY (310,130,'<E> Magia');
outtextXY (320,140,'<?> ??????');

outtextXY(150,50,'<I> Imoviles');
outtextXY(150,60,'<i> Inmune');
outtextXY(150,70,'<R> Repulsivo');
outtextXY(150,80,'<$> Invisible');
outtextXY(150,90,'<T> Transpor');
outtextXY(150,100,'<>> Des. DER');
outtextXY(150,110,'<<> Des. IZQ');
outtextXY(150,120,'<U> Des. ARR');
outtextXY(150,130,'<D> Des. ABJ');


outtextXY (0,140,'Borja Boyero 1995-96');
rectangle (0,0,largo+1,alto);
end;
procedure otracolumna;
var f:file;
    i:word;
    a:word;
    ptro:pointer;
begin
a:=0;
aux3:=mapa;
assign (f,'mapa.1');
rewrite (f,1);
 blockwrite (f,largo,2);
 blockwrite (f,alto,2);
for i:=0 to alto-1 do begin
 blockwrite (f,aux3^,largo*2);
 blockwrite (f,a,2);
 inc(aux3,largo);
                      end;
close(f);

freemem (mapa,largo*alto*2);


     assign (f,'mapa.1');
     reset(f,1);
     blockread (f,largo,2);
     blockread (f,alto,2);
inc (largo);
     getmem(mapa,largo*alto*2);
             fillchar (mapa^,largo*alto*2,0);
     blockread (f,mapa^,largo*alto*2);
     close (f);

dec (largo);

getmem(ptro,(largo*alto)+alto);
fillchar(ptro^,(largo*alto)+alto,#0);
aux2:=ptro;aux:=caract;

for i:=0 to alto-1 do begin
 move (aux2^,aux^,largo);
 inc(aux,largo);inc(aux2,largo+1);
                      end;
freemem(caract,largo*alto);
getmem(caract,(largo*alto)+alto);
fillchar (caract^,(largo*alto)+alto,#0);

move (caract^,ptro^,(largo*alto)+alto);
inc (largo);

str (largo,tmp);outtextXY(400,20,'Max X: '+tmp);
{bar (139,0,139+largo+1,alto);
rectangle (139,0,139+largo+1,alto);}
end;
procedure elimina;
var aux,aux2:^byte;
    aux3:^word;
    carac,i:word;
begin
aux3:=mapa;
aux:=fondo;inc(aux,256*baldosa);inc(aux,256);
aux2:=fondo;inc(aux2,256*baldosa);
move (aux^,aux2^,(ultima-baldosa)*256);
dec (ultima);
{
aux:=caract;
for i:=0 to (largo*alto)-1 do
begin
if aux3^>=baldosa then dec(aux3^);
inc(aux3);
end;}
sound(40);delay(100);nosound;
end;

procedure corrige;
var numero:word;
    i:word;
aux3:^word;
begin
for i:=0 to (largo*alto)-1 do
begin
aux3:=mapa;inc(aux3,i);

if aux3^>ultima then aux3^:=0;
end;
sound(40);delay(100);nosound;
end;
procedure Qt_generadores;
var i:byte;
begin
for i:=0 to 50 do begin
G_y[i]:=0;
G_x[i]:=0;
G_t[i]:=0;
end;
sound(100);
delay(100);
nosound;
end;
procedure Qt_enemigos;
var i:byte;
begin
for i:=0 to 100 do begin
E_y[i]:=0;
E_x[i]:=0;
E_t[i]:=0;
end;
sound(100);
delay(100);
nosound;

end;

procedure Q_generador;
var X,Y:longint;
    i:byte;

begin
X:=editando mod largo;
Y:=editando div largo;

for i:=0 to 50 do if (G_x[i]=X*16) and (G_y[i]=Y*16) then break;
if i=50 then exit;
{for i:=0 to 50 do begin}
G_y[i]:=0;
G_x[i]:=0;
G_t[i]:=0;
{end;}
sound(100);
delay(100);
nosound;
end;
procedure Q_enemigo;
var X,Y:longint;
    i:byte;

begin
X:=editando mod largo;
Y:=editando div largo;

for i:=0 to 100 do if (E_x[i]=X*16) and (E_y[i]=Y*16) then break;
if i=100 then exit;
{for i:=0 to 50 do begin}
E_y[i]:=0;
E_x[i]:=0;
E_t[i]:=0;
{end;}
sound(100);
delay(100);
nosound;
end;

procedure origen;
begin
origenX:=(editando mod largo)*16;
origenY:=(editando div largo)*16;
end;
procedure A_generador;
var X,Y:longint;
    i:byte;
begin
X:=editando mod largo;
Y:=editando div largo;
for i:=0 to 50 do if (G_x[i]=0) and (G_y[i]=0) then break;
if i=50 then exit;
sound(100);
delay(100);
nosound;
G_x[i]:=X*16;
G_y[i]:=Y*16;
G_t[i]:=caracteristica;
                            Xb:=((Mox div 17)*17)+1;Yb:=((Moy div 17)*17)+4;
str (G_x[i],tmp);outtextXY (Xb,Yb,tmp);
str (G_y[i],tmp);outtextXY (Xb,Yb+10,tmp);
                               aux:=caract;inc(aux,editando);
                               aux^:=GENERADOR;


 end;
procedure A_enemigo;
var X,Y:longint;
    i:byte;
begin
X:=editando mod largo;
Y:=editando div largo;
for i:=0 to 100 do if (E_x[i]=0) and (E_y[i]=0) then break;
if i=100 then exit;
sound(100);
delay(100);
nosound;
E_x[i]:=X*16;
E_y[i]:=Y*16;
E_t[i]:=caracteristica;
                            Xb:=((Mox div 17)*17)+1;Yb:=((Moy div 17)*17)+4;
str (E_x[i],tmp);outtextXY (Xb,Yb,tmp);
str (E_y[i],tmp);outtextXY (Xb,Yb+10,tmp);
                               aux:=caract;inc(aux,editando);
                               aux^:=VOID;
end;

BEGIN
{largo:=215;alto:=100;}
autor:='Borja Boyero.';
if paramcount=0 then halt(100);
if paramcount>1 then begin
                   val(paramstr(2),largo,viendoX);
                   val(paramstr(3),alto,viendoX);
                   autor:=paramstr(4);
                   if (largo*alto*2)>$FFFF-20 then begin writeln ('Demasiado grande');halt(99);end;
                   getmem(mapa,largo*alto*2);
                   fillchar (mapa^,largo*alto*2,#0);
                   getmem (caract,largo*alto);
                   fillchar (caract^,largo*alto,#0);
                   graba;
                   writeln ('Creado mapa.dat:');
                   writeln ('X=',largo);
                   writeln ('Y=',alto);
                   halt(100);
                   end;
carga;
{Pbaldosa:=mapa;}
grafico;
  asm
    mov ax,1012h
    xor bx,bx
    mov cx,256
    mov dx,ds
    mov es,dx
    mov dx,offset paleta
    int 10h   {pongo la paleta}
  end;
pantalla;Ofsmapa:=0;caracteristica:=0;IncX:=1;IncY:=1;
ponemapa;
actualizaBALDOSA;
actualizaMAPA;
incX:=10;incY:=10;
mouseON;
repeat
mousePOS (Mox,Moy,Mol,Mom,Mor);
setfillstyle (1,negro);bar (580,0,640,49);
Px:=(Mox-Xorigen) div regilla;Py:=(Moy-Yorigen) div regilla;
  if (Mox<(columnas*regilla)+Xorigen) and (Moy<(filas*regilla)+Yorigen) and (Mox>Xorigen) and (moy>Yorigen)then begin
str (Px,tmp);outtextXY (580,0,tmp);str (Py,tmp);outtextXY (610,0,tmp);
                                                         end else
  if (moy>191) and (moy<428) and (mox<36*17) then begin
str (moX div 17,tmp);outtextXY (580,0,tmp);str ((moY-191) div 17,tmp);outtextXY (610,0,tmp);
                                                  end;
str (color,tmp);outtextXY (590,10,tmp);setfillstyle(1,color);bar (610,10,615,15);
editando:=( ((Moy-191) div 17)*(largo)+(mox div 17))+(OFSmapa);
str (editando,tmp);outtextXY (590,20,tmp+'<');
                            Pmapa:=mapa;inc (Pmapa,editando);

str (Pmapa^,tmp);outtextXY (590,30,tmp);
{str (caracteristica,tmp);outtextXY (590,40,tmp);}
str (OFSbaldosa+35,tmp);outtextXY (590,40,tmp);
str (incX,tmp);outtextXY (520,0,tmp);
str (incY,tmp);outtextXY (520,10,tmp);
{delay (70);}
if mol then BEGIN
  if (Mox<(columnas*regilla)+Xorigen) and (Moy<(filas*regilla)+Yorigen) and (Mox>Xorigen) and (moy>Yorigen) then begin
             setfillstyle (1,color);
             MouseOFF;
             bar ((Px*regilla)+1,(Py*regilla)+1,(Px*regilla)+regilla-1,(Py*regilla)+regilla-1);
                             {-------------------------------------}
                             banco:=baldosa div maxbal;
                             if banco<>bancoACTUAL then begin
                             bancoACTUAL:=banco;
                             seek (fic_fondo,(bancoACTUAL*256)*maxbal);
                             {if ultima<((bancoACTUAL+1)*maxbal) then overflow:=ultima else overflow:=maxbal;
                             blockwrite (fic_fondo,fondo^,256*overflow);}
                                  fillchar (fondo^,256*maxbal,0);
                             blockread(fic_fondo,fondo^,256*maxbal,leido);
                                                        end;
                             Nro:=baldosa-(maxbal*banco);
                             {-------------------------------------}
             Pbaldosa:=fondo;inc (pbaldosa,Nro*256);
                 inc (Pbaldosa,(Py*16)+Px);Pbaldosa^:=color;
             putpixel (Px+(17*(Nro-OFsbaldosa))+1,Py+151,color);
             MouseON;
             end else
              if (moy>441) then color:=((Moy-441) div 10)*64+(mox div 10)
                 else
               if (moy>191) and (moy<428) and (mox<36*17) then BEGIN     {tablero}
                            editando:=( ((Moy-191) div 17)*(largo)+(mox div 17))+(OFSmapa);
                            if editando=ultimoMAPA then ultimoMAPA:=editando+1;

                            Pmapa:=mapa;inc (Pmapa,editando);
                            Pmapa^:=baldosa;{pongo en n§ de baldosa en el mapa}
                            Xb:=((Mox div 17)*17)+1;Yb:=((Moy div 17)*17)+4;
                            Amapa;delay (100);
                                               END else
                if (moy>151) and (moy<166) then begin
                                          if mox<595 then BEGIN
                                            baldosa:=( ((Moy-151) div 17)*40+(mox div 17))+(OFSbaldosa);
                                            if baldosa=ultima then ultima:=baldosa+1;
                                            Pbaldosa:=fondo;inc (Pbaldosa,(baldosa)*256);
                                            cuadricula;
                                                          END else
                                          if (mox>600) and (mox<615) then begin
                                                        inc (OFSbaldosa,10);
{                                                        {if OFSbaldosa>255 then OFSbaldosa:=255;}
                                                          end else
                                          if (mox>620) and (mox<635) then begin
                                                          if OFSbaldosa=0 then OFSbaldosa:=1;
                                                          dec (OFSbaldosa);
                                                          end;
                                          actualizaBALDOSA;
                                                end else
               if (mox>620) and (moy>190) and (moy<340) then begin
                           if (moy<220) then inc (viendoX,incX) else
                            if (moy>220) and (moy<260) then begin dec (viendoX,incX);if viendoX<0 then viendoX:=0;end else
                            if (moy>270) and (moy<300) then inc(viendoY,incY) else
                            if (moy>310) then begin dec (viendoY,incY);if viendoY<0 then viendoY:=0;end;
                            OFSmapa:=(ViendoY*largo+viendoX);
                            actualizaMAPA;
                                               end else
               if (mox>380) and (mox<390) then begin
                if (moy<10) then Inc (INCX);
                if (moy>10) and (moy<20) then inc(INCY);
                setfillstyle (1,0);bar (520,0,540,20);
                                               end else
                if (mox>360) and (mox<370) then begin
                if (moy<10) then dec (INCX);
                if (moy>10) and (moy<20) then dec(INCY);
                setfillstyle (1,0);bar (520,0,540,20);
                                                end;

            END;
if mor then BEGIN
                 if (moy>191) and (moy<428) and (mox<36*17) then BEGIN
                 mouseOFF;
                            editando:=( ((Moy-191) div 17)*(largo)+(mox div 17))+(OFSmapa);
                            if editando=ultimoMAPA then ultimoMAPA:=editando+1;
                               aux:=caract;inc(aux,editando);
                               aux^:=caracteristica;
                            Xb:=((Mox div 17)*17)+1;Yb:=((Moy div 17)*17)+4;
                            case caracteristica of
                             agua:outtextXY (Xb,Yb,'A');
                             solido:outtextXY (Xb,Yb,'S');
                             puerta:outtextXY(Xb,Yb,'P');
                             pocion:outtextXY(Xb,Yb,'M');
                             pocionF:outtextXY(Xb,Yb,'Mf');
                             veneno:outtextXY(Xb,Yb,'V');
                             salida:outtextXY (Xb,Yb,'SA');
                             fragil:outtextXY (Xb,Yb,'F3');
                             fragil1:outtextXY(Xb,Yb,'F1');
                             llave:outtextXY(Xb,Yb,'Ll');
                             comida:outtextXY (Xb,Yb,'Cm');
                             comidaF:outtextXY(Xb,Yb,'Cf');
                             generador:outtextXY(Xb,Yb,'Gen');
                             trampa:outtextXY(Xb,Yb,'Tr');
                             cable:outtextXY(Xb,Yb,'Cb');
                             solidoF:outtextXY(Xb,Yb,'Sf');
                             mina:outtextXY(Xb,Yb,'Mn');
                             armadura:outtextXY(Xb,Yb,'Ar');
                             combate:outtextXY(Xb,Yb,'Cb');
                             magia:outtextXY(Xb,Yb,'Mg');
                             aleatorio:outtextXY(Xb,Yb,'??');
                             inmovil:outtextXY(Xb,Yb,'In');
                             inmune:outtextXY(Xb,Yb,'Im');
                             repulsivo:outtextXY(Xb,Yb,'Re');
                             invisible:outtextXY(Xb,Yb,'Iv');
                             trans:outtextXY(Xb,Yb,'Tr');
                             deslizDER:outtextXY(Xb,Yb,'Dd');
                             deslizIZQ:outtextXY(Xb,Yb,'Di');
                             deslizARR:outtextXY(Xb,Yb,'Da');
                             deslizABJ:outtextXY(Xb,Yb,'Db');
                             else bar (Xb,Yb,Xb+10,Yb+10);
                            end; {case}
                            ponemapa;
                    mouseON;
                                               END
             END;

if keypressed then begin
                   tecla:=readkey;
                   case tecla of
                     #27:{Esc}fin:=true;
                     '1':caracteristica:=0;
                     '2':caracteristica:=agua;
                     '3':caracteristica:=solido;
                     '4':caracteristica:=fragil;
                     '5':caracteristica:=fragil1;
                     '6':caracteristica:=trampa;
                     '7':caracteristica:=cable;
                     '8':caracteristica:=solidoF;
                     'S':caracteristica:=salida;
                     'P':caracteristica:=puerta;
                     'L':caracteristica:=llave;
                     'C':caracteristica:=comida;
                     'c':caracteristica:=comidaF;
                     'M':caracteristica:=pocion;
                     'm':caracteristica:=pocionF;
                     'V':caracteristica:=Veneno;
                     'X':cambia;{cammbia el 0 por el ?}
                     '*':origen;
                     '+':A_generador;
                     '-':Q_generador;
                     '.':Qt_generadores;
                     '9':A_enemigo;
                     '0':Q_enemigo;
                     '­':Qt_enemigos;
                     'Q':caracteristica:=mina;
                     'W':caracteristica:=Combate;
                     'A':caracteristica:=Armadura;
                     'E':caracteristica:=magia;
                     '?':caracteristica:=aleatorio;
                     'I':caracteristica:=inmovil;
                     'i':caracteristica:=inmune;
                     'R':caracteristica:=repulsivo;
                     '$':caracteristica:=invisible;
                     'T':caracteristica:=trans;
                     '<':caracteristica:=deslizIZQ;
                     '>':caracteristica:=deslizDER;
                     'U':caracteristica:=deslizARR;
                     'D':caracteristica:=deslizABJ;

{                     '+':otracolumna;
                     '9':corrige;
                     '0':elimina;}
                     #13:begin
                         inc(baldosa);
                         Pbaldosa:=fondo;inc (Pbaldosa,(baldosa)*256);
                         cuadricula;
                         end;
                   end;

                   end;
until fin;
graba;
freemem (mapa,largo*alto*2);
freemem (fondo,16*16*maxbal);
closegraph;
END.