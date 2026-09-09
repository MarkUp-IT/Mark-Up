from django.db import migrations


class Migration(migrations.Migration):
    """Buang 3 field Transaction (follow_proof, wa_share_proof,
    commitment_letter) yang cuma dipakai jalur checkout langsung lama untuk
    BOOTCAMP -- jalur itu sudah ditutup total (checkout_product menolak
    ProductType.BOOTCAMP sejak sekarang, dan halaman checkout FE dialihkan
    paksa ke halaman pendaftaran bootcamp), jadi field ini gak akan pernah
    keisi lagi. Dicek ke DB production sebelum migrasi ini ditulis: 0 baris
    yang pernah mengisi ketiganya, jadi aman didrop tanpa kehilangan data."""

    dependencies = [
        ("transactions", "0015_seed_bank_account"),
    ]

    operations = [
        migrations.RemoveField(model_name="transaction", name="follow_proof"),
        migrations.RemoveField(model_name="transaction", name="wa_share_proof"),
        migrations.RemoveField(model_name="transaction", name="commitment_letter"),
    ]
