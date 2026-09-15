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

#include <ctype.h>

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
unsigned char    sb_master,sb_auto;
unsigned char SB;
char SB_Mayor,SB_Minor;
char     sonandoVOC = 0;

int     sb_bufnum = 0;
char             *sb_buf[2];
unsigned int     sb_buflen[2];

static unsigned char	*sb_curdata;	/* pointer to next bit of data */
static unsigned long    resto_sample;   /* lo que falta por tocar*/
int DMA_CHUNK;

//#define DMA_CHUNK (2048)

  char sb_readdac()
{
        while(!inportb(sb_ioaddr + SB_DSP_DATA_AVAIL) & 0x80);
        return(inportb(sb_ioaddr+SB_DSP_READ_DATA));

}
  sb_writedac(char x)
{
        while(inportb(sb_ioaddr + SB_DSP_WRITE_STATUS) & 0x80);
        outportb(sb_ioaddr + SB_DSP_WRITE_DATA, (x));
}
int Sb_Get_Params(void)
{
    char *t, *t1, *blaster;

    printf ("¯ Attempt to read environment variable.\n");
    t = getenv("BLASTER");

    /* Is the environment variable set? */
    if(t == NULL)  printf("The enviroment variable BLASTER is not hear!!!!\n");
                   
    /* Duplicate the string so that we don't trash our environment */
    blaster = strdup(t);

    /* Now parse the BLASTER variable */
    t = strtok(blaster," \t");
    while(t)
    {
	switch(toupper(t[0]))
	{
	    case 'A':                               /* I/O address */
                sb_ioaddr = (int)strtol(t+1,&t1,16);
		break;
	    case 'I':                               /* Hardware IRQ */
                sb_irq = atoi(t+1);
		break;
	    case 'D':                               /* DMA channel */
                sb_DMA = atoi(t+1);
		break;
	    case 'T':                               /* Soundblaster type */
                //sb_type = atoi(t+1);
		break;
	    default:
		printf("Unknown BLASTER option %c\n",t[0]);
		break;
	}
	t = strtok(NULL," \t");
    }
    free(blaster);
    return 0;
}

void sb_intr(_go32_dpmi_registers *reg)
{                
        register unsigned n = sb_bufnum;    /*El buffer que acabo de tocar*/

	inportb(sb_ioaddr + SB_DSP_DATA_AVAIL);

        sb_play_buffer(1 - n); /*alterna entre buffer 0 y 1*/
	
        sb_fill_buffer(n); /* lleno el buffer DMA n§ n con un trozo mas de sample*/
        
        outportb(0x20, 0x20);
        
       
}

void sb_fill_buffer(register unsigned n)
{
/*copio en el caso que le sample que queda se mayor que 2048*/
        if (resto_sample > DMA_CHUNK) {
		sb_buflen[n] = DMA_CHUNK;
		dosmemput(sb_curdata, DMA_CHUNK, (unsigned long) sb_buf[n]);
                resto_sample -= DMA_CHUNK;
		sb_curdata += DMA_CHUNK;
	}
/*Ya he terminado*/
        else if (resto_sample == 0) {
		sb_buflen[n] = 0;                
	}
/*lo poco que me falta*/
	else {
                sb_buflen[n] = resto_sample;
                dosmemput(sb_curdata, resto_sample, (unsigned long) sb_buf[n]);
                sb_curdata += resto_sample;
                resto_sample = 0;
	}
}

void sb_play_buffer(register unsigned n)
{
	int		t;
	unsigned char	im, tm;

	if (sb_buflen[n] == 0) {
                sonandoVOC = 0; /*termine de tocar*/
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

        sonandoVOC = 1;
}

void sb_set_sample_rate(unsigned int rate)
{
    unsigned char tc = (unsigned char) (256 - 1000000/rate);

    sb_writedac(SB_TIME_CONSTANT);	/* Command byte for sample rate */
    sb_writedac(tc);		/* Sample rate time constant */
}

void sb_voice(int state)
{
    sb_writedac(state ? SB_SPEAKER_ON : SB_SPEAKER_OFF);
}


void sb_initcard()
{
	outportb(sb_ioaddr + SB_DSP_RESET, 1);
        delay(300);
//        inportb(sb_ioaddr + SB_DSP_RESET);
	
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
        dosmem.size = 65536*2/16;
	if (_go32_dpmi_allocate_dos_memory(&dosmem)) {
                printf("No hay suficiente memoria basica. %d\n",dosmem.size);
                exit(66);
	}

	
	(unsigned long) sb_buf[0] = dosmem.rm_segment * 16;
	(unsigned long) sb_buf[0] += 0x0FFFFL;
	(unsigned long) sb_buf[0] &= 0xFFFF0000L;
	(unsigned long) sb_buf[1] = (unsigned long) sb_buf[0] + 0x10000;
	
}
void Mixer_write(char index,char valor)
{
outportb(sb_ioaddr+SB_MIXER_ADDRESS,index);
outportb(sb_ioaddr+SB_MIXER_DATA,valor);
}
void  sb_init()
{
char i;
   if (sb_auto==1) Sb_Get_Params(); else printf("¯ Using Sound Blaster INI file configuration.\n");
   printf("Port=%x, Irq=%x, Dma=%x\n",sb_ioaddr, sb_irq, sb_DMA);
        sb_initcard();
        printf("¯ Hock Int 0x%x:",sb_irq+8);sb_install_rm_interrupt();printf(" ON\n");
	sb_init_buffers();
        sb_voice(1);
        switch(SB_Mayor){
                case 1:{printf("¯ Sound Blaster  V. %u.%u\n",SB_Mayor,SB_Minor);break;}
                case 3:{printf("¯ Sound Blaster Pro V. %u.%u\n",SB_Mayor,SB_Minor);break;}
                case 4:{printf("¯ Sound Blaster 16 V. %u.%u\n",SB_Mayor,SB_Minor);break;}
                default:{printf("¯ Sound Blaster 16+ V. %u.%u\n",SB_Mayor,SB_Minor);break;}
                       };
 if (SB_Mayor>=3) {
                 printf("Reset Mixer.\n",sb_master);    
                 Mixer_write(0x0,0);//Reset mixer
                 Mixer_write(0x22,sb_master<<4);//canal der
                 Mixer_write(0x22,sb_master);   //canal izq
                 printf("Volumen:");
                 for (i=0;i<sb_master;i++) printf("Ý");
                 printf("\n");
                 }
        printf("Dma_chunk=%d\n",DMA_CHUNK);
        sb_init_buffers();        
}


void sb_cleanup()
{
	sb_cleanup_rm_interrupt();

        printf("¯ Hock Int 0x%x: OFF\n",sb_irq+8);
}

void sb_play(Sonido nombre)
{
if (SB==0) return;
        sb_curdata = nombre.ptro;
        resto_sample = nombre.bytes;
	sb_fill_buffer(0);
	sb_fill_buffer(1);	
	sb_play_buffer(0);
}
