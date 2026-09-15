@echo off
REM Lanza el AVD 'harmful' con ventana y WiFi virtual desactivado
REM (netsimd.exe crashea con 0xc000001d en esta maquina y mata el emulador).
REM OJO: la ventana con GPU host a veces no muestra overlays HTML (cruceta)
REM aunque el framebuffer real si los tenga -- es un quirk del emulador.
setlocal
set EMU=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe
if not exist "%EMU%" (
  echo No encuentro %EMU%
  exit /b 1
)
"%EMU%" -avd harmful -gpu host -no-snapshot -no-audio -no-boot-anim -feature -VirtioWifi
endlocal
