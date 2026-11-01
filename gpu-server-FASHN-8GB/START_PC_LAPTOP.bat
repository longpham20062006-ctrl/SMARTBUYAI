@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "HF_HOME=%CD%\models_cache"
set "HF_HUB_OFFLINE=1"
set "SMARTFIT_8gb=8gb"
set "SMARTFIT_PORT=7860"

echo ============================================================
echo    SMARTFIT AI - PC RTX -> Laptop demo (LAN / Tailscale)
echo ============================================================
echo Tren PC, mo CMD va go ipconfig de xem IPv4 cua PC.
echo Neu khac mang, cai Tailscale tren ca PC va laptop va xem IP PC 100.x.x.x.
echo KHONG nhap 0.0.0.0 hay IP cua laptop.
echo.
set /p "SMARTFIT_HOST=Nhap IPv4 RIENG cua PC (vd 192.168.1.10 hoac 100.x.x.x): "
if "%SMARTFIT_HOST%"=="" (
    echo [LOI] Chua nhap IP PC.
    pause
    exit /b 1
)

echo.
echo Neu laptop dung Next.js proxy va muon bao ve API, dat key dai.
echo Neu mo thang /web-demo/ qua Wi-Fi rieng, Enter de bo trong.
set /p "SMARTFIT_API_KEY=Nhap API key (Enter de trong): "

if not exist ".venv\Scripts\python.exe" (
    echo [LOI] Chay INSTALL.bat va DOWNLOAD_MODELS.bat tren PC truoc.
    pause
    exit /b 1
)

echo.
echo [INFO] PC API: http://%SMARTFIT_HOST%:%SMARTFIT_PORT%/api/v1/health
if "%SMARTFIT_API_KEY%"=="" (
    echo [INFO] Laptop demo: http://%SMARTFIT_HOST%:%SMARTFIT_PORT%/web-demo/
) else (
    echo [INFO] Da bat API key. Dung Next.js proxy va dat key trong .env.local.
    echo [INFO] Web-demo truc tiep se khong gui duoc key.
)
echo [INFO] Windows Firewall phai cho phep laptop ket noi TCP 7860.
echo [INFO] KHONG port-forward 7860 tren router.
echo.
".venv\Scripts\python.exe" app.py
if errorlevel 1 echo [LOI] Xem traceback o tren.
pause
