# TexnoRoboCAD — MVP starter

O‘zbek tilidagi Web + PWA + Android/iOS prototipi.

## Talablar
- Node.js 20 yoki yangiroq
- npm
- Android Studio (Android ilovasini yig‘ish uchun)
- Xcode va macOS (iOS ilovasini yig‘ish uchun)

## Ishga tushirish
```bash
npm install
npm run dev
```
Brauzerda Vite ko‘rsatgan manzilni oching (odatda http://localhost:5173).

## Production build va PWA
```bash
npm run build
npm run preview
```
PWA o‘rnatish imkoniyati HTTPS orqali joylashtirilganda yoki localhost'da ishlaydi.

## Android va iOS
```bash
npm run mobile:init
npm run mobile:sync
npx cap open android
npx cap open ios
```
Android Studio orqali APK/AAB, Xcode orqali iOS build tayyorlanadi. iOS build uchun macOS va Apple developer signing talab qilinadi.

## Hozir ishlaydigan qismlar
- Responsive dashboard va o‘zbekcha navigatsiya
- 3D CAD Studio: Three.js sahnasi, orbit/zoom, kub/shar/konus qo‘shish, rang tanlash
- STL eksport
- RoboLab: 8×8 virtual maydon, to‘siqlar, yo‘nalish tugmalari, koordinatalar va harakatlar jurnali
- ElectroLab: LED zanjiri, kuchlanish/qarshilik sozlamalari, Ohm qonuni bo‘yicha tok hisoblash va mahalliy saqlash
- Mahalliy demo saqlash (localStorage)
- PWA manifest va service worker sozlamasi
- Capacitor Android/iOS konfiguratsiyasi

## Keyingi ishlab chiqish uchun
Hozircha autentifikatsiya, server API, PostgreSQL, bulutli loyiha sinxronizatsiyasi, haqiqiy elektronika/robot simulyatorlari va AI API ulanmagan. Bular backend va alohida modul sifatida ishlab chiqilishi kerak.

## v0.3 — yangi modullar
- Arduino UNO virtual plata: raqamli pin holatlari, tahrirlanadigan Blink sketch maydoni va demo Serial Monitor.
- Komponent ulash laboratoriyasi: virtual endpointlar orasida sim ulash/o‘chirish va LED zanjiri parametrlarini sozlash.
- Blokli dasturlash: bloklarni qo‘shish/o‘chirish, ketma-ketlikni bajarish va robot yo‘lini demo ko‘rsatish.
- O‘quvchi/o‘qituvchi kabineti: rol almashtirish, profil va vazifa holati (faqat local demo).
- AI 3D Design: prompt va parametrik shablon asosida model konsepsiyasi; JSON spetsifikatsiya eksporti. Haqiqiy generativ AI backend ulanmagan.

### Cheklovlar
Arduino sketch muharriri kodni haqiqiy ATmega328P emulyatorida kompilyatsiya qilmaydi. Pinlar va Serial Monitor demo holatida. Elektron komponentlar virtual vizual boshqaruvdir, haqiqiy apparatga ulanmaydi. Blokli dasturlashning interpreter'i soddalashtirilgan demo. Sinf kabineti localStorage/session darajasida, server login va bulut yo‘q. AI 3D Design hozircha haqiqiy AI mesh/STEP/STL yaratmaydi; promptdan loyiha spetsifikatsiyasi va tanlangan shablonni beradi.

## v0.4 — haqiqiy integratsiyalar uchun backend

`server/` papkasida Express API, PostgreSQL/Prisma sxemasi, JWT autentifikatsiya, foydalanuvchiga tegishli loyihalarni saqlash, AI-to-OpenSCAD-to-STL va Arduino CLI compile/upload endpointlari qo‘shildi. Interfeysdagi **Real integratsiya** sahifasi ushbu API bilan ishlaydi.

### 1) Server va PostgreSQL

Talab: Node.js 20+, Docker. Terminalda:

```bash
cp server/.env.example server/.env
# server/.env ichida JWT_SECRET qiymatini uzun tasodifiy maxfiy kalitga almashtiring
docker compose up -d db
cd server && npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Frontend uchun loyiha ildizida `.env` yarating:

```env
VITE_API_URL=http://localhost:4000
```

Boshqa terminalda `npm install && npm run dev`.

### 2) Haqiqiy AI 3D

Server `.env` faylida `OPENAI_API_KEY` va zarur bo‘lsa `OPENAI_MODEL` ni kiriting. Server kompyuteriga OpenSCAD CLI o‘rnating (`openscad` buyrug‘i PATH ichida bo‘lsin). Interfeysdagi **Real integratsiya → AI 3D generator** bo‘limi promptni AI orqali OpenSCAD geometriyasiga aylantiradi va OpenSCAD haqiqiy STL faylini render qiladi. AI geometriyasi ishlab chiqarishdan oldin o‘lcham, mustahkamlik va 3D printer talablariga muvofiq tekshirilishi shart.

### 3) Arduino UNO apparati

Server ishlayotgan kompyuterga Arduino USB orqali ulang. `arduino-cli` o‘rnating va bir marta:

```bash
arduino-cli core update-index
arduino-cli core install arduino:avr
```

`server/.env` ichida `ARDUINO_FQBN=arduino:avr:uno` ni tekshiring. Interfeysda Real integratsiya sahifasiga kirib, USB portlarni toping, kodni kompilyatsiya qiling va plataga yuklang. Upload endpoint faqat backend server kompyuteriga fizik ulangan plataga kod yuboradi. Hozirgi versiyada serial monitorning uzluksiz WebSocket oqimi va mobil qurilmadan USB OTG ulanishi hali qo‘shilmagan.

### API endpointlari

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me`
- `GET/POST /api/projects`, `PUT/DELETE /api/projects/:id`
- `POST /api/ai3d/generate`
- `GET /api/arduino/ports`, `POST /api/arduino/compile`, `POST /api/arduino/upload`

### Xavfsizlik va deploy

`.env` fayllarini Git'ga yubormang; API kalitini faqat serverda saqlang. Production'da HTTPS, kuchli JWT_SECRET, cheklangan CORS origin, zaxira nusxa, DB migratsiyasi va server loglarini sozlang. Arduino upload endpointini ommaviy internetga autentifikatsiyasiz ochmang. `docker-compose.yml` hozir ishlab chiqish uchun oddiy PostgreSQL sozlamasidir; production parollarini albatta almashtiring.

### Hali talab qilinadigan amaliy sozlash

Bu kod tashqi hisoblar va qurilmalarga o‘z-o‘zidan kira olmaydi: foydalanuvchi OpenAI API kalitini server `.env` ga kiritishi, PostgreSQL va OpenSCAD'ni ishga tushirishi hamda Arduino'ni USB orqali server kompyuteriga ulashi kerak. Haqiqiy deploy uchun hosting/VPS va domen ham kerak bo‘ladi. Arduino serial monitor, OTA/Wi‑Fi upload va mobil USB OTG alohida keyingi bosqich sifatida qolmoqda.


## v0.4.1 — USB Serial va Arduino qurilmalar kutubxonasi

- Arduino UNO sahifasida Web Serial API orqali brauzerdan USB port tanlash, 9600 baud tezlikda Serial Monitor o‘qish va matn yuborish.
- USB orqali Serial Monitor Chrome/Edge brauzerlarida HTTPS yoki localhost orqali ishlaydi; foydalanuvchi portga ruxsat berishi kerak.
- Arduino CLI orqali server kompyuteriga ulangan plata uchun upload so‘rovi autentifikatsiyalangan token va tanlangan COM/TTY port bilan yuboriladi.
- HC-SR04, DHT11, SG90, L298N, LCD1602 I²C, RC522 RFID, HC-05 Bluetooth va ESP8266 Wi-Fi uchun alohida pin/quvvat tavsiyalari qo‘shildi.
- Modul xaritalari bir vaqtda hammasini ulash sxemasi emas: pin to‘qnashuvlarini loyihaga qarab hal qilish kerak.

### USB Serial ishlatish
1. Arduino UNO ni USB kabel bilan kompyuterga ulang.
2. TexnoRoboCAD'ni Chrome yoki Edge'da `localhost` yoki HTTPS orqali oching.
3. Arduino UNO sahifasida **USB Arduino ulash** tugmasini bosing va portga ruxsat bering.
4. Serial qurilma bilan 9600 baud tezlikda o‘qish/yuborish ishlaydi. Sketchdagi `Serial.begin(...)` qiymati ham mos bo‘lishi kerak.
5. Plataga sketch yuklash uchun Real integratsiya sahifasida tizimga kiring, serverga `arduino-cli` va `arduino:avr` core o‘rnating, so‘ng COM/TTY portni tanlang.

### Muhim elektr xavfsizligi
- ESP8266 va RC522 3.3V mantiqiy darajasida ishlaydi; 5V signalni bevosita ulamang.
- Servo va DC motorni Arduino 5V chiqishidan quvvatlantirmang; mos tashqi manba ishlating va GND'larni umumiy qiling.
- Motor drayverining kuchlanish/tok chegaralarini motor parametrlariga mos tekshiring.


## Windows kompyuterda amaliy ishga tushirish (v0.4.2)

1. Node.js 20+ va Docker Desktop o‘rnating; Docker Desktop ishga tushgan bo‘lsin.
2. ZIP arxivni to‘liq papkaga chiqaring.
3. `START_WINDOWS.bat` faylini ikki marta bosing. U frontend/backend paketlarini o‘rnatadi, PostgreSQL konteynerini ishga tushiradi, Prisma jadvallarini yaratadi va ikkita terminalda API hamda saytni ochadi.
4. Brauzerda `http://localhost:5173` manziliga kiring. API tekshiruvi: `http://localhost:4000/api/health`.
5. `CHECK_HARDWARE_WINDOWS.ps1` skripti Arduino CLI va OpenSCAD holatini tekshiradi. Zarur dasturlarni rasmiy manbalardan alohida o‘rnating. Arduino CLI o‘rnatilgach `arduino-cli core update-index` va `arduino-cli core install arduino:avr` bajariladi.
6. Arduino UNO ni USB data-kabel bilan ulang. Chrome/Edge brauzerida Arduino UNO bo‘limiga o‘ting va `USB Arduino ulash` tugmasini bosing. USB Serial uchun brauzer portga ruxsat so‘raydi. Kodni plataga yuklash uchun Real integratsiya sahifasida hisob yarating, COM portni tanlang va upload bajaring.

### Amaliy cheklovlar
- Birinchi ishga tushirishda internet kerak: npm paketlari yuklanadi. Docker Desktop va PostgreSQL konteyneri kerak.
- AI 3D uchun `server/.env` ichida `OPENAI_API_KEY` ni o‘zingiz kiriting va serverni qayta ishga tushiring; OpenSCAD ham o‘rnatilgan bo‘lishi shart. API kalitini hech kimga yubormang.
- Arduino upload server ishlayotgan shu kompyuterga fizik ulangan plata uchun ishlaydi. Web Serial esa Chrome/Edge va localhost/HTTPS talab qiladi.
- Men bu muhitda foydalanuvchining kompyuteriga dastur o‘rnata olmayman yoki uning USB portiga kira olmayman. Shu sababli real apparat bilan yakuniy sinov foydalanuvchi kompyuterida bajariladi.
- Dastlabki Docker ma’lumotlar bazasi paroli faqat lokal ishlab chiqish uchun; internetga ochiq serverda uni albatta almashtiring.
