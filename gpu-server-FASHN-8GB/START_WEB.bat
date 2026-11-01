@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "HF_HOME=%CD%\models_cache"
set "HF_HUB_OFFLINE=1"
set "SMARTFIT_PROFILE=8gb"
set "SMARTFIT_HOST=127.0.0.1"
set "SMARTFIT_PORT=7860"
if not exist .venv\Scripts\python.exe (
  echo Chay INSTALL.bat truoc.
  pause
  exit /b 1
)
echo SmartFit FASHN VTON Web Local - http://127.0.0.1:7860/web-demo/
start "" "http://127.0.0.1:7860/web-demo/"
.venv\Scripts\python.exe app.py
if errorlevel 1 (echo Loi khi khoi dong. Xem terminal va chay DIAGNOSTICS.bat)
pause
