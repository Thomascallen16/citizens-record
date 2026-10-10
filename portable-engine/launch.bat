@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"

where py >nul 2>nul
if not errorlevel 1 goto use_py

where python >nul 2>nul
if not errorlevel 1 goto use_python

echo Big Data Energy - Autopilot development launcher
echo This launcher requires Python 3.x. The standalone release does not.
echo No files were installed on the host.
pause
exit /b 1

:use_py
py -3 engine.py
set "engine_exit=%errorlevel%"
goto finish

:use_python
python engine.py
set "engine_exit=%errorlevel%"
goto finish

:finish
if not "%engine_exit%"=="0" (
  echo Autopilot exited with error code %engine_exit%.
  pause
)
exit /b %engine_exit%
