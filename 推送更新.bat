@echo off
chcp 65001 >nul
REM 一键推送脚本：把博客推送到 GitHub Pages
REM 首次运行会弹出浏览器让你登录 GitHub 并授权，之后记住凭据

setlocal
set "PATH=D:\git\Git\bin;D:\git\Git\cmd;D:\git\Git\mingw64\bin;%PATH%"

cd /d E:\yxg\web\blog

echo ============================================
echo   正在推送博客到 GitHub Pages ...
echo   首次会弹出浏览器，请登录 GitHub 并点击授权
echo ============================================

git add -A
git commit -m "更新博客内容" 2>nul

git push origin main

echo.
echo ============================================
echo   完成！如果上面没有报错，稍等 1-2 分钟后
echo   访问 https://yxg-321.github.io/ 即可看到更新
echo ============================================
pause
endlocal
