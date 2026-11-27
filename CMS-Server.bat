@echo off
chcp 65001 >nul
title PROINVENTIVE CMS Server

echo ============================================
echo   PROINVENTIVE CMS Server
echo   http://localhost:8131/admin.html
echo ============================================
echo.

cd /d "%~dp0"

echo กำลังเปิด CMS Server...
start "" "http://localhost:8131/admin.html"
py cms-server.py

pause
