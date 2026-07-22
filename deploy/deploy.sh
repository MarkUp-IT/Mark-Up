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
