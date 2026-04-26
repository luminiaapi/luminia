# PowerShell script to build Lumina with custom icons

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Lumina with Custom Icons" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if icon files exist
$iconExists = Test-Path "build\windows\icon.ico"
$appIconExists = Test-Path "build\appicon.png"

if (-not $iconExists) {
    Write-Host "ERROR: build\windows\icon.ico not found!" -ForegroundColor Red
    Write-Host "Please generate the icon first using build\generate-icon.bat" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not $appIconExists) {
    Write-Host "ERROR: build\appicon.png not found!" -ForegroundColor Red
    Write-Host "Please generate the icon first using build\generate-icon.bat" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Icon files found:" -ForegroundColor Green
Write-Host "  - build\windows\icon.ico" -ForegroundColor White
Write-Host "  - build\appicon.png" -ForegroundColor White
Write-Host ""

# Get file sizes
$iconSize = (Get-Item "build\windows\icon.ico").Length
$appIconSize = (Get-Item "build\appicon.png").Length

Write-Host "Icon file sizes:" -ForegroundColor Cyan
Write-Host "  - icon.ico: $([math]::Round($iconSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "  - appicon.png: $([math]::Round($appIconSize/1KB, 2)) KB" -ForegroundColor White
Write-Host ""

Write-Host "Building application..." -ForegroundColor Yellow
Write-Host ""

# Run wails build
$buildProcess = Start-Process -FilePath "wails" -ArgumentList "build" -NoNewWindow -Wait -PassThru

if ($buildProcess.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "The executable is located in:" -ForegroundColor Cyan
    Write-Host "  build\bin\lumina.exe" -ForegroundColor White
    Write-Host ""
    Write-Host "The application now uses your custom icon." -ForegroundColor Green
    Write-Host ""
    
    # Check if executable exists and show its size
    if (Test-Path "build\bin\lumina.exe") {
        $exeSize = (Get-Item "build\bin\lumina.exe").Length
        Write-Host "Executable size: $([math]::Round($exeSize/1MB, 2)) MB" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Read-Host "Press Enter to exit"
