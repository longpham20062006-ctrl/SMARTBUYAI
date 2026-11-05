@echo off
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (echo Chay INSTALL.bat truoc. & pause & exit /b 1)
call .venv\Scripts\activate.bat
python check_gpu.py
pause
