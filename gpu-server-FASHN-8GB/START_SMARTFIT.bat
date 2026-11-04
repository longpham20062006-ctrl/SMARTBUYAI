@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "HF_HOME=%CD%\models_cache"
set "HF_HUB_OFFLINE=1"
set "SMARTFIT_PROFILE=8gb"
set "SMARTFIT_HOST=127.0.0.1"
set "SMARTFIT_PORT=7860"

rem Tu dong khoi phuc lien ket neu bi thieu
if not exist .venv\Scripts\python.exe (
  if exist "D:\shyn\SMARTBUYAI-main\gpu-server-FASHN-8GB\.venv\Scripts\python.exe" (
    echo [Tu dong ket noi] Phat hien .venv tai D:\shyn\SMARTBUYAI-main, dang tao lien ket...
    mklink /J .venv "D:\shyn\SMARTBUYAI-main\gpu-server-FASHN-8GB\.venv" >nul 2>&1
  )
)
if not exist weights\model.safetensors (
  if exist "D:\shyn\SMARTBUYAI-main\gpu-server-FASHN-8GB\weights" (
    echo [Tu dong ket noi] Phat hien weights tai D:\shyn\SMARTBUYAI-main, dang tao lien ket...
    mklink /J weights "D:\shyn\SMARTBUYAI-main\gpu-server-FASHN-8GB\weights" >nul 2>&1
  )
)
if not exist models_cache (
  if exist "D:\shyn\SMARTBUYAI-main\gpu-server-FASHN-8GB\models_cache" (
    echo [Tu dong ket noi] Phat hien models_cache tai D:\shyn\SMARTBUYAI-main, dang tao lien ket...
    mklink /J models_cache "D:\shyn\SMARTBUYAI-main\gpu-server-FASHN-8GB\models_cache" >nul 2>&1
  )
)

if not exist .venv\Scripts\python.exe (echo Chay INSTALL.bat truoc. & pause & exit /b 1)
call .venv\Scripts\activate.bat
echo SmartFit AI - FASHN VTON v1.5 - 8gb
echo Mo http://127.0.0.1:7860/studio
start "" "http://127.0.0.1:7860/studio"
python app.py
if errorlevel 1 (echo UNEXPECTED ERROR: Gui anh man hinh va log de chinh sua.)
pause
