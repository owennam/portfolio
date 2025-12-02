@echo off
:: Move to the project directory
cd /d "c:\Users\admin\Desktop\AntiGravity\portfolio"

:: Start the Next.js server in a new window
start "Portfolio Server" cmd /k "npm run dev"

:: Wait for 5 seconds to let the server initialize
timeout /t 5 >nul

:: Open the dashboard in the default browser
start http://localhost:3000
