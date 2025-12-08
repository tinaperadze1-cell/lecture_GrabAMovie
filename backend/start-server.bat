@echo off
echo Starting backend server...
echo.
cd /d %~dp0
node src/server.js
pause

