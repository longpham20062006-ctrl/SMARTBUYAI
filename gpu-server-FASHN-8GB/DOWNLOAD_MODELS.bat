@echo off
cd /d "%~dp0"
set "HF_HOME=%CD%\models_cache"
if not exist .venv\Scripts\python.exe (echo Chay INSTALL.bat truoc. & pause & exit /b 1)
call .venv\Scripts\activate.bat
python "vendor\fashn-vton-1.5\scripts\download_weights.py" --weights-dir "%CD%\weights"
if errorlevel 1 (echo Tai model loi. Kiem tra Internet va dung luong o dia. & pause & exit /b 1)
echo Dang tai FASHN Human Parser vao cache...
python -c "from fashn_human_parser import FashnHumanParser; FashnHumanParser(device='cpu'); print('Human Parser OK')"
if errorlevel 1 (echo Human Parser chua tai du. Kiem tra ket noi mang, sau do chay lai file nay. & pause & exit /b 1)
echo Tai model thanh cong. Co the chay offline khi model da du.
pause
