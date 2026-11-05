@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo =============================================================
echo   SMARTBUY AI - TỰ ĐỘNG CẤU HÌNH DOMAIN LOCAL smartai.test
echo =============================================================
echo.

:: Kiểm tra quyền Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [THÔNG BÁO] Đang yêu cầu quyền Administrator để cập nhật file hosts...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

set "HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts"
set "DOMAIN=smartai.test"
set "IP=127.0.0.1"

:: Kiểm tra domain đã tồn tại trong hosts chưa
findstr /i /c:"%DOMAIN%" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Tên miền %DOMAIN% đã tồn tại trong file hosts!
) else (
    echo [ĐANG THÊM] Thêm %IP% %DOMAIN% vào %HOSTS_FILE%...
    echo. >> "%HOSTS_FILE%"
    echo %IP% %DOMAIN% >> "%HOSTS_FILE%"
    echo [THÀNH CÔNG] Đã thêm "%IP% %DOMAIN%" vào file hosts!
)

:: Xóa DNS Cache
ipconfig /flushdns >nul 2>&1
echo [OK] Đã làm mới DNS cache thành công!
echo.
echo =============================================================
echo Bạn đã có thể truy cập: http://smartai.test/
echo =============================================================
pause
