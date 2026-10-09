// PM2 config buat Next.js di production. Jalanin (di folder Frontend):
//   npm run build
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup   <- biar auto-start lagi kalau server reboot
//
// Deploy berikutnya pakai ./deploy-frontend.sh (bukan build + restart
// manual) -- build ke folder terpisah lalu `pm2 reload`, tanpa downtime.
//
// 2 instance cluster: `pm2 reload` ngeganti instance BERGILIRAN, jadi selalu
// ada satu yang melayani. Dulu cuma 1 instance + `pm2 restart` -> ada jeda
// tanpa server, nginx balas 502 (51x dalam 2 minggu, Okt 2026). Script-nya
// langsung binary Next (bukan `npm start`) karena mode cluster PM2 butuh
// proses Node langsung.
module.exports = {
  apps: [
    {
      name: "markup-frontend",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      exec_mode: "cluster",
      instances: 2,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      autorestart: true,
      max_memory_restart: "400M",
      // Kasih waktu instance baru siap sebelum yang lama dimatikan.
      listen_timeout: 15000,
      kill_timeout: 8000,
    },
  ],
};
