@echo off
echo ========================================
echo Building Lumina with Custom Icons
echo ========================================
echo.

REM Check if icon files exist
if not exist "build\windows\icon.ico" (
    echo ERROR: build\windows\icon.ico not found!
    echo Please generate the icon first using build\generate-icon.bat
    pause
    exit /b 1
)

if not exist "build\appicon.png" (
    echo ERROR: build\appicon.png not found!
    echo Please generate the icon first using build\generate-icon.bat
    pause
    exit /b 1
)

echo Icon files found:
echo - build\windows\icon.ico
echo - build\appicon.png
echo.

echo Building application...
echo.

wails build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build completed successfully!
    echo ========================================
    echo.
    echo The executable is located in:
    echo build\bin\lumina.exe
    echo.
    echo The application now uses your custom icon.
    echo.
) else (
    echo.
    echo ========================================
    echo Build failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause
