@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "HF_HOME=%CD%\models_cache"
set "HF_HUB_OFFLINE=1"
set "SMARTFIT_PROFILE=8gb"
set "SMARTFIT_HOST=127.0.0.1"
set "SMARTFIT_PORT=7860"
if not exist .venv\Scripts\python.exe (echo Chay INSTALL.bat truoc. & pause & exit /b 1)
call .venv\Scripts\activate.bat
echo SmartFit AI - FASHN VTON v1.5 - 8gb
echo Mo http://127.0.0.1:7860/studio
start "" "http://127.0.0.1:7860/studio"
python app.py
if errorlevel 1 (echo UNEXPECTED ERROR: Gui anh man hinh va log de chinh sua.)
pause
