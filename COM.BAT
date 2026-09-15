gcc -O2 -m486 %2 %3 %4 %5 %1 -lpc
strip a.out
coff2exe a.out
del a.out

