#!/usr/bin/env bash
# Jalanin script ini di server tiap kali mau deploy update terbaru.
# Sesuaikan REPO_DIR kalau lokasi repo di server beda.
set -euo pipefail

REPO_DIR="/var/www/markup"

echo "==> Pull kode terbaru"
cd "$REPO_DIR"
git pull

echo "==> Update backend"
cd "$REPO_DIR/Backend"
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
# Tabel cache buat rate limiter (settings.py pakai DatabaseCache di produksi).
# Aman dijalanin berulang -- kalau tabelnya udah ada, perintah ini cuma bilang
# "already exists" dan lanjut. Kalau dilewatin, cache.add() di is_rate_limited
# bakal error dan semua endpoint yang di-rate-limit (login, register, lupa
# password) balikin 500.
python manage.py createcachetable
python manage.py collectstatic --noinput
deactivate

echo "==> Update frontend"
cd "$REPO_DIR/Frontend"
npm install
npm run build

echo "==> Restart service"
sudo systemctl restart gunicorn
pm2 restart markup-frontend

echo "==> Selesai"
