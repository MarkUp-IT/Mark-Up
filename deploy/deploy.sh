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

# ---------------------------------------------------------------------------
# CRON yang harus terpasang di server (pasang sekali, `crontab -e`):
#
#   # Backup database harian
#   0 2 * * * cd /var/www/markup/Backend && ./.venv/bin/python manage.py backup_database >> /var/log/markup_backup.log 2>&1
#
#   # Link Zoom sesi mentoring, dibuat ~24 jam sebelum sesi.
#   # Dijalankan tiap 15 menit supaya sesi yang baru dijadwalkan mepet tetap
#   # kebagian link. Aman diulang: yang sudah punya link dilewati.
#   */15 * * * * cd /var/www/markup/Backend && ./.venv/bin/python manage.py generate_zoom_links --execute >> /var/log/markup_zoom.log 2>&1
#
#   # Link rekaman cloud. Tiap jam, karena Zoom butuh waktu memproses rekaman
#   # setelah meeting bubar.
#   17 * * * * cd /var/www/markup/Backend && ./.venv/bin/python manage.py fetch_zoom_recordings --execute >> /var/log/markup_zoom.log 2>&1
#
# Keduanya WAJIB pakai --execute. Tanpa itu perintahnya cuma dry-run: melapor
# tanpa mengubah apa pun, dan link tidak akan pernah terisi.
#
# Butuh ZOOM_CRED_KEY di Backend/.env. Bikin sekali:
#   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# ---------------------------------------------------------------------------

echo "==> Selesai"
