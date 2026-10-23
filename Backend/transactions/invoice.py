"""Invoice transaksi: satu sumber data untuk halaman web (/invoice/<id>) dan
file PDF yang dilampirkan di email (pembeli, admin, mentor).

PDF dibuat dengan reportlab (pure Python, tanpa dependensi sistem). Tampilannya
mengikuti halaman invoice web: pita gelap berlogo, rincian pembeli, tabel item,
dan total.
"""
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from django.utils import timezone

from accounts.utils import tanggal_indo

LOGO = Path(__file__).resolve().parent.parent / "mark_up" / "assets" / "logo-markup.png"

METODE = {
    "BANK_TRANSFER": "Transfer Bank",
    "QRIS": "QRIS",
    "E_WALLET": "E-Wallet",
    "CREDIT_CARD": "Kartu Kredit",
    "MANUAL": "Transfer Manual",
}
JENIS = {"MENTORING": "Mentoring", "MODULE": "Modul", "BOOTCAMP": "Bootcamp"}


def nomor_invoice(txn):
    """INV/2026/10/88DE62 -- diturunkan dari tanggal & ID transaksi, jadi
    selalu sama untuk transaksi yang sama tanpa perlu kolom/penomoran baru."""
    waktu = timezone.localtime(txn.paid_at or txn.created_at)
    return f"INV/{waktu:%Y}/{waktu:%m}/{txn.id.rsplit('-', 1)[-1]}"


def nama_file_invoice(txn):
    """Nama file PDF -- '/' tidak boleh ada di nama file."""
    return f"Invoice MARK-UP {nomor_invoice(txn).replace('/', '-')}.pdf"


def _judul_produk(product):
    for attr in ("mentoring_detail", "module_detail", "bootcamp_detail"):
        detail = getattr(product, attr, None)
        if detail is not None:
            return detail.title
    return product.type


def data_invoice(txn):
    """Isi invoice sebagai dict (dipakai endpoint API & pembuat PDF)."""
    items = []
    for item in txn.items.select_related(
        "product__mentoring_detail", "product__module_detail", "product__bootcamp_detail",
    ):
        items.append({
            "title": _judul_produk(item.product),
            "type": item.product.type,
            "quantity": item.quantity,
            "price": str(item.price_at_checkout),
            "subtotal": str(item.price_at_checkout * item.quantity),
        })
    return {
        "invoice_number": nomor_invoice(txn),
        "transaction_id": txn.id,
        "status": txn.payment_status,
        "created_at": txn.created_at.isoformat(),
        "paid_at": txn.paid_at.isoformat() if txn.paid_at else None,
        "method": txn.payment_method,
        "gateway": txn.gateway,
        "buyer": {"name": txn.user.fullname, "email": txn.user.email,
                  "phone": txn.buyer_phone or txn.user.phone or ""},
        "items": items,
        "sub_total": str(txn.sub_total),
        "promo_code": txn.promo_code or "",
        "discount_amount": str(txn.discount_amount),
        "team_discount_amount": str(txn.team_discount_amount),
        "commitment_fee_amount": str(txn.commitment_fee_amount),
        "tax": str(txn.tax),
        "grand_total": str(txn.grand_total),
    }


def _rp(nilai):
    return "Rp " + f"{Decimal(nilai or 0):,.0f}".replace(",", ".")


def pdf_invoice(txn):
    """File PDF invoice (bytes)."""
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    d = data_invoice(txn)
    gelap = colors.HexColor("#140B22")
    teal = colors.HexColor("#148F89")
    abu = colors.HexColor("#64748B")
    garis = colors.HexColor("#E2E8F0")
    lebar, tinggi = A4
    pita = 34 * mm

    def gaya(nama, **kw):
        dasar = dict(fontName="Helvetica", fontSize=9.5, leading=13, textColor=colors.HexColor("#0F172A"))
        dasar.update(kw)
        return ParagraphStyle(nama, **dasar)

    biasa = gaya("biasa")
    kecil = gaya("kecil", fontSize=8, leading=11, textColor=abu)
    label = gaya("label", fontName="Helvetica-Bold", fontSize=7.5, textColor=colors.HexColor("#94A3B8"))
    tebal = gaya("tebal", fontName="Helvetica-Bold", fontSize=11.5, leading=15)
    kanan = gaya("kanan", alignment=TA_RIGHT)
    kanan_kecil = gaya("kanan_kecil", alignment=TA_RIGHT, fontSize=8.5, textColor=abu)

    def kepala(canvas, _doc):
        canvas.saveState()
        canvas.setFillColor(gelap)
        canvas.rect(0, tinggi - pita, lebar, pita, stroke=0, fill=1)
        if LOGO.exists():
            canvas.drawImage(str(LOGO), 18 * mm, tinggi - pita + 10 * mm, height=14 * mm, width=80 * mm,
                             preserveAspectRatio=True, anchor="w", mask="auto")
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 20)
        canvas.drawRightString(lebar - 18 * mm, tinggi - 17 * mm, "INVOICE")
        canvas.setFont("Helvetica", 9.5)
        canvas.drawRightString(lebar - 18 * mm, tinggi - 23 * mm, d["invoice_number"])
        canvas.restoreState()

    refund = d["status"] == "REFUNDED"
    status_teks = "DIREFUND" if refund else "LUNAS"
    status_warna = "#92400E" if refund else "#166534"
    pembeli = d["buyer"]
    metode = METODE.get(d["method"], d["method"]) + (" (iPaymu)" if d["gateway"] == "IPAYMU" else "")
    tgl = tanggal_indo(txn.paid_at, jam=False) if txn.paid_at else "-"

    info = Table([[
        [Paragraph("DITAGIHKAN KEPADA", label), Spacer(1, 3),
         Paragraph(escape(pembeli["name"]), tebal),
         Paragraph(escape(pembeli["email"]), gaya("p", textColor=colors.HexColor("#475569")))]
        + ([Paragraph(escape(pembeli["phone"]), gaya("p2", textColor=colors.HexColor("#475569")))]
           if pembeli["phone"] else []),
        [Paragraph(f'<font color="{status_warna}"><b>{status_teks}</b></font>', kanan), Spacer(1, 3),
         Paragraph(f"Tanggal lunas: <b>{tgl}</b>", kanan_kecil),
         Paragraph(f"Metode: <b>{escape(metode)}</b>", kanan_kecil),
         Paragraph(f"No. transaksi: <b>{escape(d['transaction_id'])}</b>", kanan_kecil)],
    ]], colWidths=[95 * mm, 79 * mm])
    info.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))

    baris = [[Paragraph("<b>PRODUK</b>", label), Paragraph("<b>JUMLAH</b>", label),
              Paragraph("<b>HARGA</b>", ParagraphStyle("lk", parent=label, alignment=TA_RIGHT)),
              Paragraph("<b>SUBTOTAL</b>", ParagraphStyle("lk2", parent=label, alignment=TA_RIGHT))]]
    for it in d["items"]:
        baris.append([
            [Paragraph(f"<b>{escape(it['title'])}</b>", biasa), Paragraph(JENIS.get(it["type"], it["type"]), kecil)],
            Paragraph(str(it["quantity"]), biasa),
            Paragraph(_rp(it["price"]), kanan),
            Paragraph(_rp(it["subtotal"]), kanan),
        ])
    tabel = Table(baris, colWidths=[96 * mm, 18 * mm, 30 * mm, 30 * mm], repeatRows=1)
    tabel.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 1.2, colors.HexColor("#0F172A")),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, garis),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))

    ringkas = [["Subtotal", _rp(d["sub_total"])]]
    if Decimal(d["team_discount_amount"]) > 0:
        ringkas.append(["Diskon tim", "- " + _rp(d["team_discount_amount"])])
    if Decimal(d["discount_amount"]) > 0:
        kode = f" ({d['promo_code']})" if d["promo_code"] else ""
        ringkas.append([f"Diskon{kode}", "- " + _rp(d["discount_amount"])])
    if Decimal(d["commitment_fee_amount"]) > 0:
        ringkas.append(["Commitment fee (dikembalikan di akhir program)", _rp(d["commitment_fee_amount"])])
    if Decimal(d["tax"]) > 0:
        ringkas.append(["Pajak", _rp(d["tax"])])
    total_baris = len(ringkas)
    ringkas.append(["Total dibayar", _rp(d["grand_total"])])
    total = Table([[Paragraph(escape(a), kecil if i < total_baris else tebal),
                    Paragraph(f'<font color="{"#148F89" if i == total_baris else "#0F172A"}">{b}</font>',
                              kanan if i < total_baris else ParagraphStyle("tk", parent=tebal, alignment=TA_RIGHT))]
                   for i, (a, b) in enumerate(ringkas)], colWidths=[62 * mm, 40 * mm], hAlign="RIGHT")
    total.setStyle(TableStyle([
        ("LINEABOVE", (0, total_baris), (-1, total_baris), 1.2, colors.HexColor("#0F172A")),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, total_baris), (-1, total_baris), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))

    isi = [info, Spacer(1, 9 * mm), tabel, Spacer(1, 6 * mm), total, Spacer(1, 9 * mm)]
    if refund:
        isi += [Paragraph('<font color="#92400E">Transaksi ini sudah direfund. Rincian pengembalian dana bisa '
                          'dilihat di halaman Transaksi.</font>', biasa), Spacer(1, 6 * mm)]
    isi += [
        Table([[""]], colWidths=[174 * mm], style=[("LINEABOVE", (0, 0), (-1, -1), 0.5, garis)]),
        Paragraph("<b>MARK-UP</b>", gaya("f1", fontSize=8.5, textColor=colors.HexColor("#334155"))),
        Paragraph("markup.ofc@gmail.com · mark-up.id", kecil),
        Spacer(1, 3),
        Paragraph("Invoice ini dibuat otomatis oleh sistem dan sah tanpa tanda tangan.",
                  gaya("f3", fontSize=8, textColor=colors.HexColor("#94A3B8"))),
    ]

    buf = BytesIO()
    dok = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                            topMargin=pita + 12 * mm, bottomMargin=16 * mm,
                            title=f"Invoice {d['invoice_number']}", author="MARK-UP")
    dok.build(isi, onFirstPage=kepala, onLaterPages=kepala)
    return buf.getvalue()


def lampiran_invoice(txn):
    """[(nama_file, bytes, mime)] siap dilampirkan ke email, atau [] kalau
    PDF gagal dibuat -- kegagalan PDF tidak boleh menggagalkan email/pembayaran."""
    import logging

    try:
        return [(nama_file_invoice(txn), pdf_invoice(txn), "application/pdf")]
    except Exception:
        logging.getLogger(__name__).exception("Gagal membuat PDF invoice %s", txn.id)
        return []
