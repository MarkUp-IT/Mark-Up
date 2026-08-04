"""Kompresi gambar sebelum diunggah ke storage.

Sebelum ini file disimpan apa adanya -- poster produk sempat 1,7 MB PNG dan
foto mentor 1,5 MB, jadi halaman berat banget. Pillow sebenarnya sudah
terpasang (dependensi ImageField) tapi belum pernah dipakai buat apa pun.

Semua jalur upload gambar lewat sini supaya aturannya seragam.
"""

import io
import os

from django.core.files.base import ContentFile

# Batas sisi terpanjang. Poster dipajang paling lebar ~800px di layar, dikali
# 2 buat layar retina; avatar cuma ~96px, 512 sudah lebih dari cukup.
MAX_DIM_POSTER = 1600
MAX_DIM_AVATAR = 512

WEBP_QUALITY = 82


def compress_image(uploaded_file, *, max_dim, quality=WEBP_QUALITY):
    """Perkecil + konversi gambar ke WebP.

    Balikin ``(ContentFile, nama_file_baru)``, atau ``None`` kalau filenya
    bukan gambar yang bisa dibaca / prosesnya gagal.

    SENGAJA gagal-aman: optimasi itu bonus, bukan syarat. Kalau Pillow gagal
    (format aneh, file korup, dependensi kurang), pemanggil tinggal pakai file
    aslinya -- fitur upload gak boleh rusak gara-gara ini.
    """
    try:
        from PIL import Image, ImageOps
    except Exception:
        return None

    try:
        uploaded_file.seek(0)
        img = Image.open(uploaded_file)

        # Foto dari HP sering nyimpen orientasi di EXIF, bukan di pikselnya.
        # Tanpa ini, foto yang di HP tegak bisa jadi miring di web.
        img = ImageOps.exif_transpose(img)

        # WebP gak mendukung mode P/CMYK dsb. RGBA dipertahankan supaya PNG
        # transparan (mis. logo) gak jadi kotak hitam.
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA" if "A" in img.mode else "RGB")

        # thumbnail() cuma mengecilkan, gak pernah memperbesar -- gambar yang
        # sudah kecil dibiarkan apa adanya, jadi gak ada kualitas yang dibuang
        # percuma.
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

        buf = io.BytesIO()
        # save() ke buffer baru tanpa exif= -> metadata (termasuk lokasi GPS
        # kalau fotonya dari HP) otomatis gak ikut. Bonus privasi.
        img.save(buf, format="WEBP", quality=quality, method=6)
        buf.seek(0)

        base = os.path.splitext(os.path.basename(uploaded_file.name or "image"))[0]
        new_name = f"{base}.webp"
        # name WAJIB diisi: kalau hasilnya di-assign langsung ke ImageField
        # (mis. user.profile_image = foto), Django nolak nyimpen ContentFile
        # yang gak punya nama -> FieldError.
        content = ContentFile(buf.read(), name=new_name)
        return content, new_name
    except Exception:
        return None
    finally:
        try:
            uploaded_file.seek(0)
        except Exception:
            pass


def compress_or_original(uploaded_file, *, max_dim):
    """Versi praktis: balikin ``(file, nama)`` yang siap disimpan.

    Kalau kompresi gagal ATAU hasilnya malah lebih besar (kadang kejadian di
    gambar kecil/sederhana), pakai file aslinya -- percuma nyimpen versi yang
    lebih gede.
    """
    original_name = uploaded_file.name
    result = compress_image(uploaded_file, max_dim=max_dim)
    if result is None:
        return uploaded_file, original_name

    compressed, new_name = result
    if compressed.size >= getattr(uploaded_file, "size", float("inf")):
        return uploaded_file, original_name
    return compressed, new_name
