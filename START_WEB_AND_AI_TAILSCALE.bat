@echo off
title SMARTBUY AI - WEB & AI TAILSCALE LAUNCHER
color 0B
chcp 65001 >nul
cd /d "%~dp0"

echo ==============================================================================
echo       SMARTBUY AI - KHOI DONG WEB DEV VA MAY CHU AI VIRTUAL TRY-ON
echo             (TAILSCALE & LAN CHO MAY YEU / LAPTOP TRUY CAP TU XA)
echo ==============================================================================
echo.

:: 1. Kiem tra IP Tailscale
set "TAILSCALE_IP=100.72.114.122"
for /f "tokens=*" %%a in ('tailscale ip -4 2^>nul') do (
    set "TAILSCALE_IP=%%a"
)

echo [OK] IP Tailscale cua PC nay: %TAILSCALE_IP%
echo [OK] IP Mang LAN Wi-Fi:       192.168.1.139
echo.
echo ==============================================================================
echo [DIA CHI TRUY CAP TU MAY YEU / LAPTOP KET NOI TAILSCALE]:
echo   - Website SMARTBUY AI: http://%TAILSCALE_IP%:5173/
echo   - AI Studio Gradio:    http://%TAILSCALE_IP%:7860/studio
echo   - API Try-On Docs:     http://%TAILSCALE_IP%:7860/api/docs
echo.
echo [DIA CHI TRUY CAP TREN CHINH PC NAY]:
echo   - Website:             http://localhost:5173/
echo   - AI Studio:           http://localhost:7860/studio
echo ==============================================================================
echo.

:: 2. Khoi dong AI Server FASHN VTON tren GPU RTX 3060
echo [1/2] Dang bat may chu AI SmartFit (FASHN VTON 1.5 - GPU RTX 3060)...
start "SMARTFIT AI SERVER (RTX 3060 - Port 7860)" cmd /k "cd /d "%~dp0gpu-server-FASHN-8GB" && set "PYTHONUTF8=1" && set "HF_HOME=%CD%\models_cache" && set "HF_HUB_OFFLINE=1" && set "SMARTFIT_PROFILE=8gb" && set "SMARTFIT_PORT=7860" && set "SMARTFIT_HOST=0.0.0.0" && .venv\Scripts\python.exe app.py"

:: 3. Cho 3 giay va khoi dong Vite Web Dev Server
timeout /t 3 /nobreak >nul
echo [2/2] Dang bat may chu Web Frontend (Vite 8 - Port 5173)...
start "SMARTBUY AI - FRONTEND WEB (Port 5173)" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ==============================================================================
echo HE THONG DA KHOI DONG THANH CONG!
echo May yeu (laptop/dien thoai) chi can mo trinh duyet vao:
echo http://%TAILSCALE_IP%:5173/
echo ==============================================================================
pause

