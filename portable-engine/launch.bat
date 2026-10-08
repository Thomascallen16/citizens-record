@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 engine.py
  exit /b %errorlevel%
)
where python >nul 2>nul
if %errorlevel%==0 (
  python engine.py
  exit /b %errorlevel%
)
echo Portable Intelligence Engine requires Python 3.x for this development build.
echo No files were installed on the host.
pause
exit /b 1
