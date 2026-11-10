@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ================================================
echo       TexnoRoboCAD - AMALIY ISHGA TUSHIRISH
echo ================================================
where node >nul 2>nul || (echo XATO: Node.js 20+ o'rnatilmagan. https://nodejs.org/ & pause & exit /b 1)
where npm >nul 2>nul || (echo XATO: npm topilmadi. Node.js ni qayta o'rnating. & pause & exit /b 1)
where docker >nul 2>nul || (echo XATO: Docker Desktop o'rnatilmagan. https://www.docker.com/products/docker-desktop/ & pause & exit /b 1)
for /f "tokens=1" %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODEMAJOR=%%v
if %NODEMAJOR% LSS 20 (echo XATO: Node.js 20 yoki yangiroq kerak. & pause & exit /b 1)
if not exist .env copy .env.example .env >nul
if not exist server\.env (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48)); $t=Get-Content 'server/.env.example' -Raw; $t=$t.Replace('CHANGE_THIS_TO_A_LONG_RANDOM_SECRET',$s); Set-Content -Path 'server/.env' -Value $t -Encoding UTF8"
)
echo [1/6] Frontend kutubxonalari o'rnatilmoqda...
call npm install --no-audit --no-fund || goto fail
echo [2/6] Backend kutubxonalari o'rnatilmoqda...
call npm --prefix server install --no-audit --no-fund || goto fail
echo [3/6] PostgreSQL ishga tushirilmoqda...
docker compose up -d db || goto fail
timeout /t 6 /nobreak >nul
echo [4/6] Prisma client tayyorlanmoqda...
call npm --prefix server run db:generate || goto fail
echo [5/6] Ma'lumotlar bazasi jadvallari yaratilmoqda...
call npm --prefix server run db:migrate -- --name init || goto fail
echo [6/6] API va sayt ochilmoqda...
start "TexnoRoboCAD API" cmd /k "cd /d %~dp0server && npm start"
timeout /t 2 /nobreak >nul
start "TexnoRoboCAD Web" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo Tayyor! Sayt: http://localhost:5173
 echo API: http://localhost:4000/api/health
echo Keyingi sozlashlar: README_AMALIY.md faylini o'qing.
pause
exit /b 0
:fail
echo.
echo XATO: O'rnatish yoki ishga tushirishda muammo yuz berdi.
echo Yuqoridagi xato matnini saqlang va texnik yordam uchun yuboring.
pause
exit /b 1
