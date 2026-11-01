@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================================
echo SMARTBUY AI - Website demo tren laptop (PC GPU xu ly AI)
echo ==========================================================
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Cai Node.js 22 hoac moi hon de su dung Vite 8.
  pause
  exit /b 1
)
if not exist .env.local (
  echo [CHUA CAU HINH] Sao chep .env.smartfit.example thanh .env.local
  echo Nhap IP rieng PC GPU vao SMARTFIT_BACKEND_URL va API key tuong ung.
  pause
  exit /b 1
)
if not exist node_modules (
  echo [INFO] Dang cai thu vien website...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Khong cai duoc thu vien website.
    pause
    exit /b 1
  )
)
echo [INFO] Mo http://localhost:5173 tren laptop.
call npm run dev
pause
