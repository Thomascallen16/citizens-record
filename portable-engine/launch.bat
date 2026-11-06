@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"

where py >nul 2>nul
if not errorlevel 1 goto use_py

where python >nul 2>nul
if not errorlevel 1 goto use_python

echo Portable Intelligence Engine requires Python 3.x for this development build.
echo No files were installed on the host.
pause
exit /b 1

:use_py
py -3 engine.py
set "EXITCODE=%ERRORLEVEL%"
exit /b %EXITCODE%

:use_python
python engine.py
set "EXITCODE=%ERRORLEVEL%"
exit /b %EXITCODE%
