@echo off
echo Starting Time-Nest Development Servers...
echo.

echo Starting Backend Server with Auto-Reload...
cd /d d:\SCMS\Project\time-nest\backend
start "Backend Server" cmd /k "uvicorn main:socket_app --reload --host 0.0.0.0 --port 8000"

echo Waiting 3 seconds before starting frontend...
timeout /t 3 /nobreak > nul

echo Starting Frontend Development Server...
cd /d d:\SCMS\Project\time-nest\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting:
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
