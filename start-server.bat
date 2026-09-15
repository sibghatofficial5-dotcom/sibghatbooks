@echo off
echo Starting Sibghat Books server at http://localhost:8000/ ...
start http://localhost:8000/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8000
pause
