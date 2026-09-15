#define TRUE 1
#define FALSE 0

#include <dos.h>
#include <dpmi.h>
#include <stdio.h>
unsigned short KeyTable[127];
static _go32_dpmi_seginfo old_int09,new_int09;
static _go32_dpmi_registers Backup_regs,regs;

  void ResetKeyboard()
{
unsigned short n;
n=inportb(0x61);
outportb(0x61,(n | 0x80));
outportb(0x61,n);
outportb(0x61,0);
}
void NewInt09(_go32_dpmi_registers *regs)
{
unsigned short ScanCode,KeyCode;
ScanCode=inportb(0x60);
KeyCode=(ScanCode & 0x7F);
if ((ScanCode & 0x80)==0) //si es <128
        KeyTable[KeyCode]=TRUE;
   else KeyTable[KeyCode]=FALSE;
             //ResetKeyboard();
outportb(0x20,0x20);//Interrupcion atendida
}



void InitTeclado()
{
unsigned short i;
disable();
printf ("¯ Hock Int 0x09:");
 _go32_dpmi_get_real_mode_interrupt_vector (9,&old_int09);       
   new_int09.pm_offset=(int)NewInt09;
   new_int09.pm_selector=_go32_my_cs();
 _go32_dpmi_allocate_real_mode_callback_iret(&new_int09,&Backup_regs);
  _go32_dpmi_set_real_mode_interrupt_vector (9,&new_int09);
printf(" ON\n");
enable();
for (i=0;i<=127;i++) KeyTable[i]=FALSE;
}

void TecladoOFF()
{
printf ("¯ Hock Int 0x09:");
_go32_dpmi_set_real_mode_interrupt_vector (9,&old_int09);
_go32_dpmi_free_real_mode_callback(&new_int09);
printf (" OFF\n");
}
/*
main()
{
InitTeclado();
 
 do {} 
 while (KeyTable[1]==FALSE);

TecladoOFF();
return 0;
}
  
*/  

