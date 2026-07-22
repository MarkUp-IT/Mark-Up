// PM2 config buat Next.js di production. Jalanin (di folder Frontend):
//   npm run build
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup   <- biar auto-start lagi kalau server reboot
module.exports = {
  apps: [
    {
      name: "markup-frontend",
      cwd: __dirname,
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
