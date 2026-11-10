# TexnoRoboCAD — amaliy ishga tushirish

## 1. Kerakli dasturlar
- Node.js 20 yoki yangiroq: https://nodejs.org/
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Chrome yoki Edge (USB Serial uchun)
- Arduino CLI: https://arduino.github.io/arduino-cli/installation/
- OpenSCAD: https://openscad.org/downloads.html (AI 3D uchun)

## 2. Birinchi ishga tushirish
`START_WINDOWS.bat` faylini ishga tushiring. Bu frontend, API va PostgreSQL bazasini lokal kompyuterda ishga tushiradi. Brauzer manzili `http://localhost:5173`.

## 3. Arduino UNO
Arduino UNO ni data uzatishni qo‘llaydigan USB kabel bilan ulang. Arduino IDE/Arduino CLI drayverlari o‘rnatilgan bo‘lsin. Arduino CLI terminalida:
```powershell
arduino-cli core update-index
arduino-cli core install arduino:avr
arduino-cli board list
```
Saytda Arduino UNO bo‘limida USB ulash tugmasini bosing. Haqiqiy sketch yuklash uchun Real integratsiya bo‘limida ro‘yxatdan o‘ting, portni aniqlang va sketchni yuboring.

## 4. AI 3D
`server/.env` ichidagi `OPENAI_API_KEY` qiymatiga o‘zingizning API kalitingizni yozing. OpenSCAD o‘rnatilgan va `openscad` buyrug‘i PATH ichida bo‘lsin. API server oynasini qayta ishga tushiring.

## 5. Tekshirish
- `http://localhost:4000/api/health` — API javobi.
- `http://localhost:5173` — platforma.
- `docker compose ps` — PostgreSQL konteyneri.
- `arduino-cli board list` — USB orqali aniqlangan Arduino.

## Xavfsizlik
ESP8266 va RC522 3.3V mantiqiy darajasida. Servo/DC motorni Arduino 5V pinidan quvvatlantirmang; tashqi mos quvvat manbai ishlating va GND ni umumiy qiling. 5V Arduino signallarini 3.3V modullarga bevosita bermang — level shifter ishlating.
