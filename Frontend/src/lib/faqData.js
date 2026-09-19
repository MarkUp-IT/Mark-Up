// Data FAQ dipisah dari komponen halaman biar bisa dipakai dua tempat sekaligus:
// (1) halaman FAQ itu sendiri, dan (2) JSON-LD FAQPage di layout-nya, yang bikin
// pertanyaan-pertanyaan ini berpeluang muncul langsung di hasil pencarian Google.
// Kalau datanya dibiarkan di dalam komponen, JSON-LD-nya harus nyalin manual dan
// gampang basi begitu FAQ diubah.

export const categories = [
  "General",
  "Bootcamp",
  "Mentoring",
  "Modul",
  "Pembayaran",
  "Akun",
];

// Konten asli (bukan placeholder) -- disusun supaya nyambung sama fitur yang
// beneran ada di produk (rekaman sesi, sertifikat, halaman Settings, dst).
export const faqData = {
  General: [
    {
      q: "Apa itu Mark-Up?",
      a: "Mark-Up adalah platform mentoring dan pelatihan yang membantu pelajar dan mahasiswa mempersiapkan diri menghadapi kompetisi bisnis, studi kasus, debat, dan ajang sejenis. Kami menyediakan tiga jenis layanan utama: Bootcamp intensif berkelompok, Private Mentoring 1-on-1, dan modul E-Learning yang bisa diakses mandiri kapan saja.",
    },
    {
      q: "Apakah sertifikat Mark-Up diakui secara profesional?",
      a: "Sertifikat Mark-Up diterbitkan sebagai bukti partisipasi dan penyelesaian program, ditandatangani atas nama mentor pemateri dan Mark-Up. Sertifikat ini bisa kamu cantumkan di CV, LinkedIn, atau portofolio sebagai bukti pengalaman mengikuti pelatihan intensif. Perlu dicatat, ini bukan gelar atau sertifikasi resmi dari lembaga pendidikan formal, melainkan bukti pengalaman dan kompetensi praktis.",
    },
    {
      q: "Apakah pembayaran di Mark-Up bisa dicicil?",
      a: "Saat ini seluruh pembayaran di Mark-Up dilakukan secara penuh (lunas), baik lewat iPaymu maupun transfer bank manual. Sistem cicilan belum tersedia, tapi bisa jadi akan kami hadirkan untuk program Bootcamp bernilai besar di masa mendatang.",
    },
    {
      q: "Bisakah saya melakukan refund jika batal mengikuti kelas?",
      a: "Bisa, dengan syarat dan ketentuan yang berbeda tergantung jenis produk yang kamu beli. Kebijakan lengkapnya, termasuk berapa lama batas waktu pengajuan dan berapa potongan yang berlaku, bisa kamu baca selengkapnya di halaman Refund Policy kami.",
    },
  ],
  Bootcamp: [
    {
      q: "Apa itu program Bootcamp di Mark-Up?",
      a: "Bootcamp adalah program pelatihan intensif berbasis project nyata yang terdiri dari beberapa sesi pertemuan berurutan, dibimbing langsung oleh mentor praktisi. Cocok untuk kamu yang ingin belajar terstruktur dari dasar sampai siap tampil di kompetisi.",
    },
    {
      q: "Berapa lama durasi satu program Bootcamp?",
      a: "Durasi bervariasi tergantung paketnya, umumnya terdiri dari 4-8 sesi yang tersebar dalam beberapa minggu. Detail jumlah sesi dan jadwalnya bisa kamu lihat di halaman detail masing-masing produk sebelum membeli.",
    },
    {
      q: "Apakah saya dapat sertifikat setelah menyelesaikan Bootcamp?",
      a: "Ya. Setelah kamu menyelesaikan seluruh sesi dalam sebuah program Bootcamp, tim kami akan menerbitkan sertifikatmu. Prosesnya biasanya memakan waktu beberapa hari kerja setelah program berakhir, dan begitu terbit kamu bisa langsung melihat serta mengunduhnya dari halaman Sertifikat di akunmu.",
    },
    {
      q: "Bagaimana jika saya melewatkan salah satu sesi?",
      a: "Tidak masalah -- setiap sesi Bootcamp yang sudah selesai dilaksanakan akan tersedia rekamannya, dan kamu bisa menontonnya kembali kapan saja lewat halaman Produk Saya.",
    },
  ],
  Mentoring: [
    {
      q: "Bagaimana cara memesan sesi Private Mentoring?",
      a: "Pilih paket mentoring yang sesuai kebutuhanmu di halaman Produk, lalu lakukan pembayaran. Setelah itu, jadwal sesi akan dikoordinasikan dengan mentor terkait dan muncul di halaman Produk Saya begitu terjadwal.",
    },
    {
      q: "Berapa lama durasi satu sesi mentoring?",
      a: "Umumnya 60 menit per sesi, meskipun beberapa paket bisa memiliki durasi atau jumlah sesi yang berbeda. Rincian lengkapnya selalu tercantum di halaman detail produk sebelum kamu membeli.",
    },
    {
      q: "Apakah saya bisa memilih mentor tertentu?",
      a: "Beberapa paket mentoring memungkinkanmu memilih mentor sesuai keahliannya -- kamu bisa mengenal lebih jauh profil para mentor kami di halaman Mentors.",
    },
    {
      q: "Bagaimana jika saya perlu mengubah jadwal sesi?",
      a: "Hubungi tim support kami minimal 24 jam sebelum jadwal sesi berlangsung untuk mengatur ulang jadwal. Perubahan yang diajukan terlalu mendekati waktu sesi mungkin tidak bisa selalu diakomodasi.",
    },
  ],
  Modul: [
    {
      q: "Apa itu modul E-Learning Mark-Up?",
      a: "Modul E-Learning adalah materi pembelajaran mandiri (self-paced) berisi kombinasi e-book, video pembahasan, template siap pakai, dan bank soal, yang bisa kamu pelajari sendiri sesuai waktumu tanpa jadwal sesi langsung.",
    },
    {
      q: "Berapa lama akses modul yang saya beli berlaku?",
      a: "Selamanya. Begitu pembelian berhasil, modul akan tersimpan permanen di halaman Produk Saya dan bisa kamu akses ulang kapan pun kamu butuhkan.",
    },
    {
      q: "Format apa saja yang tersedia dalam satu modul?",
      a: "Bervariasi tergantung modulnya, umumnya berupa file PDF, video pembahasan, dan template presentasi/dokumen yang bisa diedit (Canva atau PowerPoint). Rincian isi tiap modul dijelaskan lengkap di halaman produknya.",
    },
  ],
  Pembayaran: [
    {
      q: "Metode pembayaran apa saja yang didukung Mark-Up?",
      a: "Mark-Up menerima pembayaran lewat iPaymu (otomatis -- bisa pakai QRIS, transfer virtual account, e-wallet, atau kartu, akses langsung terbuka begitu pembayaran selesai) maupun transfer bank manual (unggah bukti transfer, diverifikasi tim kami maksimal 1x24 jam). Kamu bisa pilih salah satu di halaman pembayaran setelah checkout.",
    },
    {
      q: "Apakah transaksi di Mark-Up aman?",
      a: "Aman. Pembayaran lewat iPaymu diproses langsung oleh sistem resmi iPaymu, sedangkan transfer bank manual kami verifikasi berdasarkan bukti yang kamu unggah. Status pembayaranmu bisa dipantau langsung dari halaman Transaksi.",
    },
    {
      q: "Bagaimana jika pembayaran saya gagal atau belum terverifikasi?",
      a: 'Silakan periksa status transaksi di halaman Transaksi -- kalau masih berstatus "Menunggu Verifikasi" padahal kamu sudah mengunggah bukti transfer, tunggu proses verifikasi tim kami (maksimal 1x24 jam) atau hubungi tim support kami dengan menyertakan bukti pembayaran agar bisa segera kami tindak lanjuti.',
    },
  ],
  Akun: [
    {
      q: "Bagaimana cara mendaftar akun Mark-Up?",
      a: 'Klik tombol "Daftar" di pojok kanan atas halaman, lalu isi data dirimu. Setelah akun aktif, kamu bisa langsung menjelajahi katalog produk kami.',
    },
    {
      q: "Saya lupa kata sandi, bagaimana cara mengatasinya?",
      a: 'Gunakan opsi "Lupa Kata Sandi" di halaman masuk untuk menerima tautan reset lewat email terdaftarmu. Kalau sudah masuk ke akun, kamu juga bisa mengubah kata sandi kapan saja lewat menu Pengaturan Akun.',
    },
    {
      q: "Bagaimana cara menghapus akun saya?",
      a: 'Masuk ke Pengaturan Akun, lalu buka bagian "Zona Berbahaya" di bagian paling bawah dan tekan Hapus Akun. Kami akan mengirim tautan konfirmasi ke email kamu, dan akun baru dihapus setelah kamu membuka tautan tersebut. Setelah dihapus, akun tidak dapat digunakan untuk masuk lagi, tetapi riwayat produk, sertifikat, dan transaksi kamu tetap tersimpan sebagai catatan.',
    },
  ],
};
