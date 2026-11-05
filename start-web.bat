@echo off
title SMARTBUY AI - WEB DEV SERVER
color 0B
echo ========================================================
echo        SMARTBUY AI - KHOI DONG HE THONG WEB
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Dang kiem tra Node.js va thu vien...
if not exist "node_modules\" (
    echo Chua tim thay node_modules. Dang tien hanh cai dat npm install...
    call npm install
)

echo.
echo [2/2] Dang khoi dong may chu web Vite tai http://localhost:5173 ...
start http://localhost:5173
npm run dev

pause
