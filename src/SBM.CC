/*
 * Play digitized sound sample on soundblaster DAC using DMA.
 * This source code is in the public domain.
 * 
 * Modification History
 *
 *  9-Nov-93	David Baggett		Wrote it based on Sound Blaster
 *		<dmb@ai.mit.edu>	Freedom project and Linux code.
 *
   12-6-96      Borja Boyero 
 */

#include <sys/types.h>
#include <sys/stat.h>

#include <stdio.h>
#include <go32.h>
#include <dos.h>
#include <dpmi.h>
#include <string.h>
#include <pc.h>

#include "sb.h"
 
#define _PROTO_(x) x

#include "proto.h"
  

static _go32_dpmi_seginfo dosmem;	/* DOS (conventional) memory buffer */

static _go32_dpmi_seginfo oldirq_rm;	/* original real mode IRQ */
static _go32_dpmi_registers rm_regs;
static _go32_dpmi_seginfo rm_si;	/* real mode interrupt segment info */

static _go32_dpmi_seginfo oldirq_pm;	/* original prot-mode IRQ */
static _go32_dpmi_seginfo pm_si;	/* prot-mode interrupt segment info */

unsigned int     sb_ioaddr;
unsigned int     sb_irq;
unsigned int     sb_DMA;
unsigned char SB;
char SB_Mayor,SB_Minor;
char     sonandoVOC = 0,digital_channels=4;
int DMA_CHUNK;


int     sb_bufnum = 0;
char             *sb_buf[2],smpl=0;
unsigned int     sb_buflen[2];

static unsigned char    *sb_curdata[8],*onda;    /* pointer to next bit of data */
static unsigned long    resto_sample[8],el_mayor;   /* lo que falta por tocar*/


inline char sb_readdac()
{
        while((inportb(sb_ioaddr + SB_DSP_DATA_AVAIL) & 0x80)==0);
        return(inportb(sb_ioaddr + SB_DSP_READ_DATA));

}
inline void sb_writedac(char x)
{
        while( (inportb(sb_ioaddr + SB_DSP_WRITE_STATUS) & 0x80));
        outportb(sb_ioaddr + SB_DSP_WRITE_DATA, (x));                   
}

void sb_intr(_go32_dpmi_registers *reg)
{                
        register unsigned n = sb_bufnum;    /*El buffer que acabo de tocar*/

	inportb(sb_ioaddr + SB_DSP_DATA_AVAIL);

        sb_play_buffer(1 - n); /*alterna entre buffer 0 y 1*/
	
        sb_fill_buffer(n); /* lleno el buffer DMA n§ n con un trozo mas de sample*/
        
        outportb(0x20, 0x20);
        
       
}

inline void sb_fill_buffer(register unsigned n)
{
register char i;
register unsigned int pos;
memset (onda,0,DMA_CHUNK);el_mayor=0;

 for (i=0;i<digital_channels;i++) {

        if (resto_sample[i] > DMA_CHUNK) {
   for (pos=0;pos<DMA_CHUNK;pos++) onda[pos]=(onda[pos]+sb_curdata[i][pos])/2;
   if (el_mayor<DMA_CHUNK) el_mayor=DMA_CHUNK;
                resto_sample[i] -= DMA_CHUNK;
                sb_curdata[i] += DMA_CHUNK;
                                         }else {
   for (pos=0;pos<resto_sample[i];pos++) onda[pos]=(onda[pos]+sb_curdata[i][pos])/2;
   if (el_mayor<resto_sample[i]) el_mayor=resto_sample[i];
                resto_sample[i] = 0;
                sb_curdata[i] += resto_sample[i];
                                               }
                 }//for

       sb_buflen[n]=el_mayor;
dosmemput(onda, el_mayor, (unsigned long) sb_buf[n]);
}

inline void sb_play_buffer(register unsigned n)
{
	int		t;
	unsigned char	im, tm;
        if (el_mayor==0) {sonandoVOC=0;
                          return;
                         }

	im = inportb(0x21);
	tm = ~(1 << sb_irq);
        outportb(0x21,im & tm);
        outportb(SB_DMA_MASK, 5);
	outportb(SB_DMA_FF, 0);
	outportb(SB_DMA_MODE, 0x49);
	
	sb_bufnum = n;
	t = (int) ((unsigned long) sb_buf[n] >> 16);
	outportb(SB_DMAPAGE + 3, t);
	t = (int) ((unsigned long) sb_buf[n] & 0xFFFF);
        outportb(SB_DMA + 2 * sb_DMA, t & 0xFF);
        outportb(SB_DMA + 2 * sb_DMA, t >> 8);

        outportb(SB_DMA + 2 * sb_DMA + 1, sb_buflen[n] & 0xFF);
        outportb(SB_DMA + 2 * sb_DMA + 1, sb_buflen[n] >> 8);

        outportb(SB_DMA_MASK, sb_DMA);

	sb_writedac(SB_DMA_8_BIT_DAC); /* command byte for DMA DAC transfer */

	sb_writedac(sb_buflen[n] & 0xFF);
	sb_writedac(sb_buflen[n] >> 8);
        sonandoVOC=1;

}

void sb_set_sample_rate(unsigned int rate)
{
    unsigned char tc = (unsigned char) (256 - 1000000/rate);

    sb_writedac(SB_TIME_CONSTANT);      /* Command pos for sample rate */
    sb_writedac(tc);		/* Sample rate time constant */
}

void sb_voice(int state)
{
    sb_writedac(state ? SB_SPEAKER_ON : SB_SPEAKER_OFF);
}


void sb_initcard()
{
	outportb(sb_ioaddr + SB_DSP_RESET, 1);
	
	inportb(sb_ioaddr + SB_DSP_RESET);
	inportb(sb_ioaddr + SB_DSP_RESET);
	inportb(sb_ioaddr + SB_DSP_RESET);
	inportb(sb_ioaddr + SB_DSP_RESET);
	
	outportb(sb_ioaddr + SB_DSP_RESET, 0);
	
        while (inportb(sb_ioaddr + SB_DSP_READ_DATA) != 0xAA);

       sb_writedac(SB_DSP_VER);
       SB_Mayor=sb_readdac();
       SB_Minor=sb_readdac();
}

void sb_install_rm_interrupt()
{
	int	ret;
        disable();
        _go32_dpmi_get_real_mode_interrupt_vector(8 + sb_irq, &oldirq_rm);
	rm_si.pm_offset = (int) sb_intr;
        rm_si.pm_selector=_go32_my_cs();
        ret = _go32_dpmi_allocate_real_mode_callback_iret(&rm_si, &rm_regs);
	_go32_dpmi_set_real_mode_interrupt_vector(8 + sb_irq, &rm_si);
	enable();
}

void sb_cleanup_rm_interrupt()
{
	disable();
	_go32_dpmi_set_real_mode_interrupt_vector(8 + sb_irq, &oldirq_rm);
	_go32_dpmi_free_real_mode_callback(&rm_si);
	enable();
}


void sb_init_buffers()
{
	dosmem.size = 65536*3/16;
	if (_go32_dpmi_allocate_dos_memory(&dosmem)) {
                printf("No hay suficiente memoria basica.\n");
		exit(1);
	}

	
	(unsigned long) sb_buf[0] = dosmem.rm_segment * 16;
	(unsigned long) sb_buf[0] += 0x0FFFFL;
	(unsigned long) sb_buf[0] &= 0xFFFF0000L;
	(unsigned long) sb_buf[1] = (unsigned long) sb_buf[0] + 0x10000;
	
}

void  sb_init()
{
	sb_initcard();	
	sb_install_rm_interrupt();
        printf("Hock Int 0x%x: ON\n",sb_irq+8);
	sb_init_buffers();
        onda=(char *)malloc(DMA_CHUNK);
        sb_voice(1);
        switch(SB_Mayor){
                case 1:{printf("Sound Blaster  V. %u.%u\n",SB_Mayor,SB_Minor);break;}
                case 3:{printf("Sound Blaster Pro V. %u.%u\n",SB_Mayor,SB_Minor);break;}
                case 4:{printf("Sound Blaster 16 V. %u.%u\n",SB_Mayor,SB_Minor);break;}
                default:{printf("Sound Blaster 16+  V. %u.%u\n",SB_Mayor,SB_Minor);break;}
                       };
        printf("Port=%x, Irq=%d, Dma=%d\n",sb_ioaddr, sb_irq, sb_DMA);
        printf("Digital Channels=%d\n",digital_channels+1);
        printf("Dma_chunk=%d\n",DMA_CHUNK);

        
}

void sb_cleanup()
{
	sb_cleanup_rm_interrupt();

        printf("Hock Int 0x%x: OFF\n",sb_irq+8);
        free(onda);
}

void sb_play(Sonido nombre)
{
if (SB==0) return;
        sb_curdata[smpl] = nombre.ptro;
        resto_sample[smpl] = nombre.bytes;
       if (sonandoVOC==0) {
                         sb_fill_buffer(0);
                         sb_fill_buffer(1); 
                         sb_play_buffer(0);
                         }
smpl++;if (smpl>digital_channels) smpl=0;
}
