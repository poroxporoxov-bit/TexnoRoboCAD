# TexnoRoboCAD: Arduino CLI va OpenSCAD yordamchi sozlamalari
# Administrator PowerShell talab qilinishi mumkin.
$ErrorActionPreference = 'Stop'
Write-Host 'TexnoRoboCAD qo‘shimcha vositalari tekshirilmoqda...' -ForegroundColor Cyan
if (-not (Get-Command arduino-cli -ErrorAction SilentlyContinue)) {
  Write-Host 'Arduino CLI topilmadi. O‘rnatish: https://arduino.github.io/arduino-cli/installation/' -ForegroundColor Yellow
} else {
  arduino-cli core update-index
  arduino-cli core install arduino:avr
}
if (-not (Get-Command openscad -ErrorAction SilentlyContinue)) {
  Write-Host 'OpenSCAD topilmadi. O‘rnating: https://openscad.org/downloads.html' -ForegroundColor Yellow
} else { Write-Host 'OpenSCAD topildi.' -ForegroundColor Green }
Write-Host 'Tayyor. Arduino UNO ni USB orqali ulang va Device Manager ichidan COM portni tekshiring.' -ForegroundColor Green
