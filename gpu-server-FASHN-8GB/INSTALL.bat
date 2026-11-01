@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "HF_HOME=%CD%\models_cache"
echo [1/7] Kiem tra Python 3.11 ...
py -3.11 --version || (echo Can Python 3.11 x64 tu python.org & pause & exit /b 1)
if not exist .venv (py -3.11 -m venv .venv || (pause & exit /b 1))
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip setuptools wheel || goto :failed

echo [2/7] Cai PyTorch CUDA 12.1 ...
python -m pip install "torch==2.5.1" "torchvision==0.20.1" --index-url https://download.pytorch.org/whl/cu121 || goto :failed

echo [3/7] Cai numpy 1.x, opencv-python va transformers tuong thich PyTorch 2.5.1 ...
python -m pip install "numpy>=1.26,<2" "opencv-python==4.10.0.84" "transformers==4.49.0" || goto :failed

echo [4/7] Tai ma nguon chinh thuc FASHN ...
where git >nul 2>nul || (echo Can cai Git for Windows & pause & exit /b 1)
if not exist "vendor\fashn-vton-1.5\pyproject.toml" (
  git clone https://github.com/fashn-AI/fashn-vton-1.5.git "vendor\fashn-vton-1.5" || goto :failed
)
echo [5/7] Cai FASHN VTON ...
python -m pip install -e "vendor\fashn-vton-1.5" || goto :failed

echo [6/7] Cai giao dien va API ...
python -m pip install -r requirements_app.txt || goto :failed

echo [7/7] Kiem tra card ...
python check_gpu.py

echo.
echo Cai thu vien xong! Chay DOWNLOAD_MODELS.bat (1 lan) roi START_SMARTFIT.bat.
pause
exit /b 0
:failed
echo.
echo LOI CAI DAT. Khong xoa log; chup 30 dong cuoi gui de sua.
pause
exit /b 1
