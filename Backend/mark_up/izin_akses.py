"""Baca aturan akses tiap endpoint API langsung dari dekoratornya
(`jwt_required` / `role_required`), dipakai tes matriks izin akses
(mark_up/test_izin_akses.py) supaya SEMUA endpoint ikut diuji otomatis --
termasuk endpoint baru yang nanti ditambahkan.
"""
import re

from django.urls import URLPattern, URLResolver, get_resolver


def _semua_pola(patterns=None, prefix=""):
    for p in patterns if patterns is not None else get_resolver().url_patterns:
        if isinstance(p, URLResolver):
            yield from _semua_pola(p.url_patterns, prefix + str(p.pattern))
        elif isinstance(p, URLPattern):
            yield prefix + str(p.pattern), p.callback


def _contoh_path(pola):
    """'api/x/<uuid:id>/' -> '/api/x/00000000-0000-0000-0000-000000000000/'."""
    def ganti(m):
        konv = m.group(1) or "str"
        return "00000000-0000-0000-0000-000000000000" if konv == "uuid" else "CONTOH-1"
    return "/" + re.sub(r"<(?:(\w+):)?\w+>", ganti, pola)


def aturan_akses(view):
    """(butuh_login: bool, peran_diizinkan: tuple|None)."""
    butuh_login, peran = False, None
    f = view
    while f is not None:
        # __code__.co_qualname, BUKAN __qualname__ -- functools.wraps menimpa
        # __qualname__ wrapper dengan nama view aslinya, sedangkan nama di
        # objek kodenya tetap nama wrapper (mis. "jwt_required.<locals>._wrapped_view").
        kode = getattr(f, "__code__", None)
        nama = getattr(kode, "co_qualname", "") if kode else ""
        if nama.startswith("jwt_required"):
            butuh_login = True
        if nama.startswith("role_required"):
            for cell in f.__closure__ or ():
                isi = cell.cell_contents
                if isinstance(isi, tuple) and isi and all(isinstance(x, str) for x in isi):
                    peran = isi
        f = getattr(f, "__wrapped__", None)
    return butuh_login, peran


def daftar_endpoint_api():
    """[(path_contoh, pola, view, butuh_login, peran)] untuk semua URL /api/."""
    hasil = []
    for pola, view in _semua_pola():
        if not pola.startswith("api/"):
            continue
        butuh_login, peran = aturan_akses(view)
        hasil.append((_contoh_path(pola), pola, view, butuh_login, peran))
    return hasil
