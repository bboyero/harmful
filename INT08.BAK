// #define limite_frames 5
static signed int crono=-1;
static unsigned char tic,retardo,frames_por_seg;
long old_veces=0,cronometro=0;
static _go32_dpmi_seginfo old_int08, new_int08;
extern long veces;
void reprograma_frec(int tics)
{
disable();
outportb(0x43,0x34);
outportb(0x40,tics%256);//parte baja
outportb(0x40,tics>>8);//alta
enable();
}
void tic_handler(_go32_dpmi_registers *regs)
{
  VOLCAR=TRUE;
  tic ++;crono--;
  if (tic==TICS_SEG)  {
   tic=0;Tpuertas++;//cronometro++;
    if (play[0].level_end==FALSE) play[0].energia--;
    if (play[1].level_end==FALSE) play[1].energia--;
   frames_por_seg=veces-old_veces;
   old_veces=veces;
//   if (frames_por_seg>limite_frames) retardo++; else if (retardo>0) retardo--;
               }
outportb(0x20,0x20);//Interrupcion atendida ???? solo en hardware
}

InitRitmo()
{
// reprograma_frec(1193180/TICS_SEG);
  printf("¯ Hock Int 0x08: ON\n");
  _go32_dpmi_get_protected_mode_interrupt_vector(0x08, &old_int08);
  
  new_int08.pm_offset = (int)tic_handler;
  new_int08.pm_selector = _go32_my_cs();
  _go32_dpmi_chain_protected_mode_interrupt_vector(0x08, &new_int08);
}
RitmoOFF()
{
  printf("¯ Hock Int 0x08: OFF\n");
  _go32_dpmi_set_protected_mode_interrupt_vector(0x08, &old_int08);
//  reprograma_frec(0);
}
