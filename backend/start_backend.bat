@echo off
echo ========================================================
echo  SMARTBUY AI - JAVA SPRING BOOT BACKEND
echo  Port: 8080 - Swagger: http://localhost:8080/swagger-ui.html
echo ========================================================
set "JAVA_HOME=C:\Program Files\Apache NetBeans\jdk"
set "PATH=C:\Program Files\Apache NetBeans\jdk\bin;%PATH%"
cd /d "%~dp0"
java -jar target\smartbuy-backend-1.0.0.jar
