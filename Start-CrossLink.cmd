@echo off
setlocal
cd /d "%~dp0"
set "CROSSLINK_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "CROSSLINK_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not "%CROSSLINK_NODE%"=="node" if not exist "%CROSSLINK_NODE%" (
  echo Node.js belum ditemukan. Pasang Node.js lalu jalankan launcher ini kembali.
  pause
  exit /b 1
)
"%CROSSLINK_NODE%" "%~dp0scripts\start-crosslink.mjs" %*
if errorlevel 1 pause
endlocal
