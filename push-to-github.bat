@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Day code len GitHub: dinhtv079/bookstore ===
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua cai Git. Tai tai: https://git-scm.com/download/win
  echo Cai xong thi chay lai file nay.
  pause
  exit /b 1
)

git config user.name >nul 2>nul || git config --global user.name "dinhtv079"
git config user.email >nul 2>nul || git config --global user.email "dinhtv079@gmail.com"

if not exist ".git" git init
git add .
git commit -m "Website ban sach" 2>nul
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/dinhtv079/bookstore.git
git push -u origin main

echo.
if errorlevel 1 (
  echo [LOI] Push that bai. Chup man hinh gui lai cho Claude.
) else (
  echo [XONG] Da day len: https://github.com/dinhtv079/bookstore
)
pause
