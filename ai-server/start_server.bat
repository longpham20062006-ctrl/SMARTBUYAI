@echo off
title SMARTBUY AI - Virtual Try-On Server (RTX 3060 12GB)
cd /d "%~dp0"

echo ======================================================================
echo   SMARTBUY AI - PHONG THU DO AO (AI VIRTUAL TRY-ON SERVER)
echo   GPU: NVIDIA GeForce RTX 3060 12GB VRAM
echo   Host: 0.0.0.0 (Ho tro truy cap tu moi thiet bi trong Wi-Fi/LAN)
echo ======================================================================

IF NOT EXIST ".venv\Scripts\python.exe" (
    echo [!] Khong tim thay moi truong ao .venv. Dang khoi tao...
    where uv >nul 2>&1
    IF %ERRORLEVEL% EQU 0 (
        uv venv .venv --python 3.10
        uv pip install --python .venv\Scripts\python.exe -r requirements.txt
    ) ELSE (
        echo [!] Vui long chay cai dat moi truong theo file AI_SERVER_SETUP.md
        pause
        exit /b 1
    )
)

echo [*] Dang khoi dong FastAPI Server tai cong 8000...
echo [*] API Health Check: http://127.0.0.1:8000/health
echo [*] API Documentation: http://127.0.0.1:8000/docs
echo.

.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000

pause
