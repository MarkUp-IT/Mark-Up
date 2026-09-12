from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Lepas reservasi slot mentor / stok produk milik transaksi iPaymu yang "
        "sudah lewat 5 menit tanpa dibayar (Transaction.expires_at). MANUAL "
        "tidak pernah kena ini -- lihat catatan di transactions/models.py. "
        "Jaring pengaman umum di luar pengecekan lazy yang sudah jalan tiap "
        "kali ada yang mau checkout slot/produk yang sama. Dijadwalkan jalan "
        "tiap ~2 menit lewat cron di server produksi."
    )

    def handle(self, *args, **options):
        from transactions.views import _release_expired_transactions

        jumlah = _release_expired_transactions()
        if jumlah:
            self.stdout.write(self.style.SUCCESS(f"Melepas {jumlah} reservasi yang kedaluwarsa."))
        else:
            self.stdout.write("Tidak ada reservasi kedaluwarsa yang perlu dilepas.")
