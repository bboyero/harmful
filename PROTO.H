/* sb.cp */
extern void disable _PROTO_((void));
extern void enable _PROTO_((void));
extern void sb_intr _PROTO_((_go32_dpmi_registers *reg));
extern void sb_fill_buffer _PROTO_((register unsigned n));
extern void sb_play_buffer _PROTO_((register unsigned n));
extern void sb_set_sample_rate _PROTO_((unsigned int rate));
extern void sb_voice _PROTO_((int state));
extern void sb_getparams _PROTO_((void));
extern void sb_initcard _PROTO_((void));
extern void sb_install_rm_interrupt _PROTO_((void));
extern void sb_cleanup_rm_interrupt _PROTO_((void));
extern void sb_install_pm_interrupt _PROTO_((void));
extern void sb_cleanup_pm_interrupt _PROTO_((void));
extern void sb_init_buffers _PROTO_((void));
extern void sb_init _PROTO_((void));
extern void sb_cleanup _PROTO_((void));
extern void sb_play _PROTO_((unsigned char *data, unsigned long length));
