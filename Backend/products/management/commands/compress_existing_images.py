"""Kompres gambar yang terlanjur diunggah sebelum kompresi otomatis ada.

Sebelum ini file disimpan apa adanya, jadi ada poster 1,7 MB dan foto profil
1,5 MB yang bikin halaman berat. Perintah ini nyisir gambar lama, mengecilkan
& mengonversinya ke WebP, lalu menukar isi field-nya.

Default-nya DRY-RUN: cuma nampilin laporan, gak ngubah apa pun. Harus
eksplisit pakai --execute buat beneran menulis.

    python manage.py compress_existing_images                 # laporan doang
    python manage.py compress_existing_images --limit 2 --execute
    python manage.py compress_existing_images --execute
"""

from django.core.management.base import BaseCommand
from django.db.models import Q

from mark_up.imaging import compress_image, MAX_DIM_POSTER, MAX_DIM_AVATAR


def _targets():
    """(label, queryset, nama_field, max_dim) buat tiap ImageField yang ada."""
    from accounts.models import User
    from products.models import MentoringProduct, ModuleProduct, BootcampProduct
    from programs.models import Competition

    return [
        ("Produk Mentoring", MentoringProduct.objects.exclude(Q(image="") | Q(image__isnull=True)), "image", MAX_DIM_POSTER),
        ("Produk Modul", ModuleProduct.objects.exclude(Q(image="") | Q(image__isnull=True)), "image", MAX_DIM_POSTER),
        ("Produk Bootcamp", BootcampProduct.objects.exclude(Q(image="") | Q(image__isnull=True)), "image", MAX_DIM_POSTER),
        ("Poster Lomba", Competition.objects.exclude(Q(image="") | Q(image__isnull=True)), "image", MAX_DIM_POSTER),
        # Ini juga sumber foto mentor -- mentor gak punya field foto sendiri,
        # dia baca user.profile_image.
        ("Foto Profil / Mentor", User.objects.exclude(Q(profile_image="") | Q(profile_image__isnull=True)), "profile_image", MAX_DIM_AVATAR),
    ]


def _fmt_kb(n):
    return f"{n / 1024:,.0f} KB"


class Command(BaseCommand):
    help = "Kompres gambar lama jadi WebP. Default dry-run; pakai --execute buat menulis."

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute", action="store_true",
            help="Beneran tulis perubahan. Tanpa ini cuma laporan (dry-run).",
        )
        parser.add_argument(
            "--limit", type=int, default=None,
            help="Proses maksimal N gambar. Buat nyoba dulu sebelum jalan penuh.",
        )

    def handle(self, *args, **opts):
        execute = opts["execute"]
        limit = opts["limit"]

        mode = self.style.WARNING("EKSEKUSI (menulis perubahan)") if execute \
            else self.style.SUCCESS("DRY-RUN (tidak mengubah apa pun)")
        self.stdout.write(f"Mode: {mode}\n")

        total_before = total_after = 0
        processed = skipped = failed = 0

        for label, qs, field_name, max_dim in _targets():
            rows = list(qs)
            if not rows:
                continue
            self.stdout.write(self.style.HTTP_INFO(f"\n--- {label} ({len(rows)}) ---"))

            for obj in rows:
                if limit is not None and processed >= limit:
                    self.stdout.write(self.style.WARNING(f"\n(berhenti, --limit {limit} tercapai)"))
                    return self._summary(total_before, total_after, processed, skipped, failed, execute)

                f = getattr(obj, field_name)
                name = getattr(f, "name", "") or ""
                title = str(obj)[:44]

                try:
                    size_before = f.size
                except Exception as e:
                    # File tercatat di DB tapi objeknya hilang di storage.
                    self.stdout.write(f"  [LEWAT ] {title} -- file tidak terbaca ({e})")
                    skipped += 1
                    continue

                # Idempoten: yang sudah webp & sudah kecil gak perlu disentuh,
                # jadi perintah ini aman dijalankan berulang.
                if name.lower().endswith(".webp") and size_before < 300 * 1024:
                    self.stdout.write(f"  [LEWAT ] {title} -- sudah webp & kecil ({_fmt_kb(size_before)})")
                    skipped += 1
                    continue

                try:
                    f.open("rb")
                    result = compress_image(f, max_dim=max_dim)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  [GAGAL ] {title} -- {e}"))
                    failed += 1
                    continue

                if result is None:
                    self.stdout.write(f"  [LEWAT ] {title} -- bukan gambar yang bisa diproses")
                    skipped += 1
                    continue

                content, new_name = result
                size_after = content.size

                if size_after >= size_before:
                    self.stdout.write(f"  [LEWAT ] {title} -- hasil malah lebih besar")
                    skipped += 1
                    continue

                hemat = (1 - size_after / size_before) * 100
                self.stdout.write(
                    f"  [{'KOMPRES' if execute else 'RENCANA'}] {title:<46} "
                    f"{_fmt_kb(size_before):>10} -> {_fmt_kb(size_after):>10}  (-{hemat:.0f}%)"
                )

                total_before += size_before
                total_after += size_after
                processed += 1

                if not execute:
                    continue

                # Simpan yang baru DULU, baru hapus yang lama -- kalau upload
                # gagal, gambar lama masih utuh (gak ada momen tanpa gambar).
                old_name = name
                try:
                    getattr(obj, field_name).save(new_name, content, save=True)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"           gagal menyimpan: {e}"))
                    failed += 1
                    continue

                if getattr(obj, field_name).name != old_name:
                    try:
                        f.storage.delete(old_name)
                    except Exception as e:
                        # Bukan kegagalan fatal: gambar barunya sudah dipakai,
                        # ini cuma nyisa file yatim di storage.
                        self.stdout.write(f"           (file lama tak terhapus: {e})")

        return self._summary(total_before, total_after, processed, skipped, failed, execute)

    def _summary(self, before, after, processed, skipped, failed, execute):
        self.stdout.write("\n" + "=" * 62)
        self.stdout.write(f"Diproses : {processed}   Dilewat: {skipped}   Gagal: {failed}")
        if before:
            hemat = (1 - after / before) * 100
            self.stdout.write(
                f"Total    : {_fmt_kb(before)} -> {_fmt_kb(after)}  "
                + self.style.SUCCESS(f"(hemat {hemat:.0f}%)")
            )
        if not execute and processed:
            self.stdout.write(
                self.style.WARNING("\nIni baru dry-run. Jalankan ulang dengan --execute buat menerapkan.")
            )
