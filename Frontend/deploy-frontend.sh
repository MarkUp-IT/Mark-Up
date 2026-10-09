#!/usr/bin/env bash
# Deploy frontend TANPA downtime. Jalankan di server, dari folder Frontend:
#   ./deploy-frontend.sh
#
# Alur:
#   1. Build ke .next-build -- server yang lagi jalan tetap melayani dari
#      .next yang gak disentuh sama sekali.
#   2. Build gagal -> berhenti, situs tetap jalan pakai versi lama.
#   3. Aset JS/CSS versi lama disalin ke build baru (tanpa menimpa) -- biar
#      pengunjung yang halamannya masih versi lama gak kena 404 waktu minta
#      potongan JS berikutnya.
#   4. Tukar folder, lalu `pm2 reload` -> instance diganti bergiliran.
set -euo pipefail
cd "$(dirname "$0")"

echo "[1/4] Build ke .next-build..."
rm -rf .next-build
NEXT_DIST_DIR=.next-build npm run build

echo "[2/4] Simpan aset versi lama..."
if [ -d .next/static ]; then
  cp -r --update=none .next/static/. .next-build/static/
fi

echo "[3/4] Tukar folder build..."
rm -rf .next-old
if [ -d .next ]; then mv .next .next-old; fi
mv .next-build .next

echo "[4/4] Reload PM2 bergiliran..."
pm2 reload ecosystem.config.js --update-env
pm2 save > /dev/null

echo "Selesai. Versi sebelumnya disimpan di .next-old (buat rollback cepat:"
echo "  mv .next .next-broken && mv .next-old .next && pm2 reload ecosystem.config.js)."
