@echo off
:: Relaunch this script as Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :run
) else (
    echo Requesting admin privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:run
title Game Booster
cd /d "%~dp0"
python game_booster.py
pause
