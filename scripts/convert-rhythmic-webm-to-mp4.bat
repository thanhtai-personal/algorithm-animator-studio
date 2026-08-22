@echo off
setlocal
if "%~1"=="" (
  echo Usage: convert-rhythmic-webm-to-mp4.bat ^<input.webm^> [output.mp4]
  exit /b 1
)
set "INPUT=%~1"
if "%~2"=="" (
  set "OUTPUT=%~dpn1.mp4"
) else (
  set "OUTPUT=%~2"
)
ffmpeg -y -i "%INPUT%" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "%OUTPUT%"
if errorlevel 1 exit /b %errorlevel%
echo Created: %OUTPUT%
