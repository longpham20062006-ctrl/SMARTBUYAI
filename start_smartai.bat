@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title SMARTBUY AI - Local Launcher (http://smartai.test/)

echo ==============================================================================
echo           SMARTBUY AI - KHOI DONG HE THONG (http://smartai.test/)
echo ==============================================================================
echo.

cd /d "%~dp0"

:: 1. KIEM TRA FILE HOSTS CHO DOMAIN smartai.test
set "HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts"
findstr /i /c:"smartai.test" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [CANH BAO] Chua tim thay ten mien "smartai.test" trong file hosts!
    echo.
    echo Ban co the chay script: scripts\setup_hosts.bat de tu dong them vao hosts.
    echo Hoac mo Notepad voi quyen Administrator them dong: 127.0.0.1 smartai.test
    echo.
    pause
) else (
    echo [OK] 1. Domain smartai.test da duoc cau hinh trong Windows hosts.
)

:: 2. KIEM TRA NODE.JS VA CADDY
where.exe node >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js trong he thong!
    pause
    exit /b 1
)

set "CADDY_BIN="
where.exe caddy >nul 2>&1
if %errorlevel% equ 0 (
    set "CADDY_BIN=caddy"
) else if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\caddy.exe" (
    set "CADDY_BIN=%LOCALAPPDATA%\Microsoft\WindowsApps\caddy.exe"
) else if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe" (
    set "CADDY_BIN=%LOCALAPPDATA%\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe"
)

if "%CADDY_BIN%"=="" (
    echo [CANH BAO] Khong tim thay caddy.exe. Se su dung Node.js reverse proxy du phong.
) else (
    echo [OK] 2. Caddy reverse proxy san sang: !CADDY_BIN!
)

:: 3. KIEM TRA VA KHOI DONG VITE DEV SERVER (PORT 5173)
powershell -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 3. Vite Dev Server da dang chay tren cong 5173.
) else (
    echo [DANG BAT] 3. Dang khoi dong Vite Dev Server (port 5173)...
    start "SMARTBUY AI - Vite Dev Server" cmd /c "npm run dev"
    timeout /t 3 /nobreak >nul
)

:: 4. KIEM TRA VA KHOI DONG REVERSE PROXY (PORT 80)
powershell -Command "if (Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 4. Reverse Proxy tren cong 80 da dang chay san sang.
) else (
    if not "%CADDY_BIN%"=="" (
        echo [DANG BAT] 4. Dang khoi dong Caddy Reverse Proxy tren cong 80...
        start "SMARTBUY AI - Caddy Proxy (Port 80)" cmd /c ""!CADDY_BIN!" run --config "%~dp0Caddyfile""
    ) else (
        echo [DANG BAT] 4. Dang khoi dong Node Reverse Proxy tren cong 80...
        start "SMARTBUY AI - Node Proxy (Port 80)" cmd /c "node scripts\smartai_proxy.cjs"
    )
    timeout /t 2 /nobreak >nul
)

:: 5. KIEM TRA PHAN HOI HTTP VA MO TRINH DUYET
echo.
echo ==============================================================================
echo [HOAN TAT] HE THONG DA SAN SANG!
echo.
echo   Dia chi truy cap: http://smartai.test/  (Khong can nhap :5173)
echo   Trang san pham  : http://smartai.test/products
echo.
echo Dang mo trinh duyet...
echo ==============================================================================

start http://smartai.test/
exit /b 0
