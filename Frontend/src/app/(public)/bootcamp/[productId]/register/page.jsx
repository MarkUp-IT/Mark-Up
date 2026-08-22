"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Upload, ShieldCheck, Clock, FileText, AlertCircle, Lock, Info } from "lucide-react";
import Linkify from "@/component/Linkify";
import BootcampTimeline from "@/component/BootcampTimeline";
import { apiRequest, apiRequestRaw, getAccessToken } from "@/lib/api";
import { toast } from "sonner";
import LoginRequiredDialog from "@/component/LoginRequiredDialog";
import { useIsLoggedIn } from "@/lib/useIsLoggedIn";

const MAX_REGISTRATION_DOC_SIZE = 10 * 1024 * 1024;
const MAX_COMMITMENT_LETTER_SIZE = 5 * 1024 * 1024;

const formatIDR = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val));

function formatMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_META = {
  registered: { label: "Menunggu Ditinjau", cls: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30" },
  accepted: { label: "Diterima", cls: "bg-[#148F89]/10 text-[#148F89] border-[#148F89]/30" },
  rejected: { label: "Ditolak", cls: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30" },
};

function BootcampRegisterPageInner() {
  const params = useParams();
  // null = belum ketahuan (masih SSR). Gerbang baru ditampilkan setelah
  // statusnya pasti, biar user yang sudah login gak kena popup sekilas.
  const isLoggedIn = useIsLoggedIn();
  const productId = params.productId;

  const [product, setProduct] = useState(null);
  const [packages, setPackages] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [commitmentLetterMaxWords, setCommitmentLetterMaxWords] = useState(500);
  const [perluCommitmentLetter, setPerluCommitmentLetter] = useState(true);
  const [pertanyaan, setPertanyaan] = useState([]);
  // { [id pertanyaan]: teks jawaban }
  const [jawaban, setJawaban] = useState({});

  const [loading, setLoading] = useState(true);
  const [myRegs, setMyRegs] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [file, setFile] = useState(null);
  const [commitmentLetterFile, setCommitmentLetterFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pertanyaan disaring sesuai paket yang sedang dipilih. Server menyaring
  // ulang saat pendaftaran dikirim, jadi ini murni supaya formulirnya langsung
  // berubah begitu pilihan paket diganti.
  //
  // Sengaja BUKAN "daftar paket kosong berarti semua": pertanyaan yang
  // dibatasi tapi paketnya belum dipilih admin tidak ditanyakan ke siapa pun.
  const pertanyaanBerlaku = pertanyaan.filter(
    (q) =>
      q.for_all_packages ||
      (selectedPackageId && (q.package_ids || []).includes(selectedPackageId))
  );


  // Validasi ukuran di browser dulu -- sebelumnya file oversize diloloskan
  // begitu aja lalu ditolak nginx (413 HTML, bukan JSON) pas submit, bikin
  // user cuma liat toast generik "Gagal mendaftar." tanpa tau kenapa.
  const handleFileSelect = (selectedFile, maxSize, setter) => {
    if (!selectedFile) {
      setter(null);
      return;
    }
    if (selectedFile.size > maxSize) {
      toast.error("File Terlalu Besar", {
        description: `Ukuran file (${formatMB(selectedFile.size)}) melebihi batas maksimal ${formatMB(maxSize)}. Mohon perkecil ukuran berkas terlebih dahulu.`,
      });
      setter(null);
      return;
    }
    setter(selectedFile);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [productRes, pkgRes, timelineRes, reqRes] = await Promise.all([
        apiRequest(`/api/products/${productId}/`, { auth: false }),
        apiRequest(`/api/products/${productId}/packages/`, { auth: false }),
        apiRequest(`/api/products/${productId}/timeline/`, { auth: false }),
        apiRequest(`/api/products/${productId}/requirements/`, { auth: false }),
      ]);
      setProduct(productRes);
      setPackages(pkgRes?.packages || []);
      setTimeline(timelineRes?.timeline || []);
      setRequirements(reqRes?.requirements || []);
      if (reqRes?.commitment_letter_max_words) {
        setCommitmentLetterMaxWords(reqRes.commitment_letter_max_words);
      }
      // Dua isian ini diatur admin per bootcamp: commitment letter boleh
      // dimatikan, dan pertanyaan boleh dinyalakan sebagai gantinya (atau
      // keduanya, atau tidak sama sekali).
      setPerluCommitmentLetter(reqRes?.require_commitment_letter !== false);
      setPertanyaan(reqRes?.questions || []);
      if (getAccessToken()) {
        const regRes = await apiRequest("/api/products/bootcamp-registrations/me/");
        setMyRegs((regRes?.registrations || []).filter((r) => r.bootcamp_id === productId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Cuma ada 1 paket -> gak usah nampilin kartu "pilih salah satu", auto-pilih
  // di belakang layar biar user gak bingung ngerasa ada opsi yang harus dipilih.
  useEffect(() => {
    if (packages.length === 1 && !selectedPackageId) {
      setSelectedPackageId(packages[0].id);
    }
  }, [packages, selectedPackageId]);

  const registeredPackageIds = new Set(myRegs.map((r) => r.package.id));
  const singlePackageMode = packages.length === 1;

  const handleSubmit = async () => {
    if (!selectedPackageId || !file || !cvFile || submitting) return;
    if (perluCommitmentLetter && !commitmentLetterFile) return;
    // Pertanyaan wajib harus terisi. Server tetap memeriksa ulang -- ini cuma
    // supaya orang tidak perlu menunggu request bolak-balik.
    const belumDijawab = pertanyaanBerlaku.filter(
      (q) => q.is_required && !(jawaban[q.id] || "").trim()
    );
    if (belumDijawab.length > 0) {
      toast.error("Masih ada pertanyaan yang belum dijawab", {
        description: belumDijawab[0].text,
      });
      return;
    }
    if (!getAccessToken()) {
      toast.error("Perlu Masuk Terlebih Dahulu", { description: "Silakan masuk ke akunmu sebelum mendaftar." });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("package_id", selectedPackageId);
      formData.append("requirement_doc", file);
      if (commitmentLetterFile) formData.append("commitment_letter", commitmentLetterFile);
      formData.append("cv", cvFile);
      if (pertanyaanBerlaku.length > 0) {
        // Cuma jawaban pertanyaan yang berlaku untuk paket ini yang dikirim,
        // supaya jawaban sisa dari paket lain (kalau pilihannya sempat
        // diganti) tidak ikut terbawa.
        const jawabanTerpakai = {};
        pertanyaanBerlaku.forEach((q) => {
          jawabanTerpakai[q.id] = jawaban[q.id] || "";
        });
        formData.append("answers", JSON.stringify(jawabanTerpakai));
      }
      if (portfolioFile) formData.append("portfolio", portfolioFile);
      // Lewat apiRequest (bukan fetch mentah) supaya kalau access token keburu
      // kedaluwarsa pas user lama ngisi form, tokennya di-refresh otomatis dan
      // request diulang. Dulu pakai fetch mentah -> langsung 401 "Gagal mendaftar"
      // tanpa penjelasan.
      const res = await apiRequestRaw(`/api/products/bootcamp-register/`, formData);
      const data = res.data;
      if (!res.ok) {
        // data null artinya respons bukan JSON -- biasanya halaman error dari
        // nginx (mis. 413 gabungan 2 file kelebihan batas server), bukan error
        // tervalidasi dari Django. Pesan generik lama bikin bingung karena gak
        // nunjukin ini soal ukuran file.
        const msg =
          data?.detail ||
          Object.values(data?.errors || {}).flat().join(" ") ||
          (res.status === 413
            ? "Gabungan ukuran berkas melebihi batas server. Mohon perkecil ukuran PDF, lalu coba kembali."
            : data === null
              ? "Terjadi kesalahan tak terduga di server. Coba lagi, atau kecilkan ukuran file kalau masih gagal."
              : (res.message || "Gagal mendaftar."));
        throw new Error(msg);
      }
      toast.success("Pendaftaran Terkirim", { description: "Menunggu ditinjau admin." });
      setFile(null);
      setCommitmentLetterFile(null);
      setCvFile(null);
      setPortfolioFile(null);
      setSelectedPackageId("");
      fetchAll();
    } catch (err) {
      toast.error("Gagal Mendaftar", { description: err?.message || "Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0F081C] font-inter text-white">

      {/* Gerbang login. Isi halaman tetap kerender di belakang sebagai konteks
          (biar user lihat dia mau daftar bootcamp apa), tapi ketutup lapisan
          ini sepenuhnya -- gak bisa diklik atau discroll. */}
      {isLoggedIn === false && (
        <LoginRequiredDialog
          title="Masuk Terlebih Dahulu untuk Mendaftar"
          message="Pendaftaran bootcamp butuh akun supaya status seleksi dan pembayaranmu bisa dilacak."
          backHref="/products"
        />
      )}

      <div className="max-w-[860px] mx-auto px-4 pt-32 pb-16 flex flex-col gap-8">
        <Link href="/products" className="text-[#9CA3AF] hover:text-white text-[13px] transition-colors w-fit">
          ← Kembali ke Produk
        </Link>

        {loading ? (
          <p className="text-[#9CA3AF] text-[14px]">Memuat...</p>
        ) : !product ? (
          <p className="text-[#9CA3AF] text-[14px]">Produk tidak ditemukan.</p>
        ) : (
          <>
            {/* Hero produk: gambar, judul, deskripsi */}
            <div className="rounded-[16px] overflow-hidden border border-[#2D2342] bg-[#170F26]">
              {product.image_url && (
                <div className="w-full h-[220px] sm:h-[280px] overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 flex flex-col gap-2">
                <span className="self-start px-3 py-1 rounded-full text-[10px] font-bold bg-[#0A4A5C] text-[#00C6D1] tracking-wider">
                  BOOTCAMP
                </span>
                <h1 className="text-[24px] sm:text-[28px] font-bold leading-tight">{product.title}</h1>
                <p className="text-[#9CA3AF] text-[14px] leading-relaxed whitespace-pre-line">
                  <Linkify text={product.description} />
                </p>
              </div>
            </div>

            {/* Timeline utama */}
            {timeline.length > 0 && (
              <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5">
                <h2 className="font-bold text-[15px] mb-4">Timeline Utama</h2>
                <BootcampTimeline items={timeline} />
              </div>
            )}

            {/* Status pendaftaran yang sudah ada */}
            {myRegs.length > 0 && (
              <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-3">
                <h2 className="font-bold text-[15px]">Status Pendaftaranmu</h2>
                {myRegs.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.registered;
                  const quizzes = r.quizzes || [];
                  const canTakeQuiz = r.package.requires_selection && r.status === "registered" && quizzes.length > 0;
                  const canPay = r.status === "accepted";
                  return (
                    <div key={r.id} className="flex flex-col gap-2.5 border-b border-[#2D2342] last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold">Paket {r.package.name}</span>
                          <span className="text-[#9CA3AF] text-[12px]">
                            {r.package.requires_selection ? "Jalur seleksi (Mentee)" : "Jalur langsung"}
                          </span>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </div>
                      {canTakeQuiz && (
                        <div className="flex flex-col gap-2">
                          {/* Satu bootcamp bisa punya beberapa tes (mis. tes tahap
                              awal & tes akhir), masing-masing dikerjakan sekali. */}
                          {quizzes.map((qz) => (
                            <div key={qz.quiz_id} className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-medium">{qz.title}</span>
                                <span className="text-[#9CA3AF] text-[11px]">
                                  Durasi {qz.duration_minutes} menit &middot; sekali kerjakan
                                </span>
                              </div>
                              {qz.status === "not_started" && (
                                <Link
                                  href={`/bootcamp/${productId}/quiz/${r.id}?quiz=${qz.quiz_id}`}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#148F89] text-white text-[12.5px] font-semibold hover:bg-[#117A75] transition-colors"
                                >
                                  <ShieldCheck size={14} /> Mulai Tes
                                </Link>
                              )}
                              {qz.status === "in_progress" && (
                                <Link
                                  href={`/bootcamp/${productId}/quiz/${r.id}?quiz=${qz.quiz_id}`}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#F59E0B] text-white text-[12.5px] font-semibold hover:bg-[#D97706] transition-colors"
                                >
                                  <Clock size={14} /> Lanjutkan Tes
                                </Link>
                              )}
                              {(qz.status === "submitted" || qz.status === "expired") && (
                                <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#148F89]/10 text-[#148F89] text-[12.5px] font-semibold border border-[#148F89]/30">
                                  <Check size={14} /> Sudah Dikumpulkan
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {canPay && (
                        <>
                          {r.payment?.status === "PAID" ? (
                            <span className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#148F89]/10 text-[#148F89] text-[12.5px] font-semibold border border-[#148F89]/30">
                              <Check size={14} /> Lunas
                            </span>
                          ) : r.payment_deadline_passed ? (
                            <span className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#EF4444]/10 text-[#EF4444] text-[12.5px] font-semibold border border-[#EF4444]/30">
                              <AlertCircle size={14} /> Batas Waktu Bayar Sudah Lewat
                            </span>
                          ) : r.payment?.status === "PENDING" ? (
                            <span className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#F59E0B]/10 text-[#F59E0B] text-[12.5px] font-semibold border border-[#F59E0B]/30">
                              <Clock size={14} /> Menunggu Verifikasi Pembayaran
                            </span>
                          ) : (
                            <Link
                              href={`/bootcamp/${productId}/pay/${r.id}`}
                              className={`self-start flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-white text-[12.5px] font-semibold transition-colors ${
                                r.payment?.status === "FAILED" ? "bg-[#EF4444] hover:bg-[#DC2626]" : "bg-[#148F89] hover:bg-[#117A75]"
                              }`}
                            >
                              {r.payment?.status === "FAILED"
                                ? "Bayar Ulang"
                                : `Bayar Sekarang (${formatIDR(Number(r.package.price) + Number(r.package.commitment_fee))})`}
                            </Link>
                          )}
                          {!r.payment_deadline_passed && r.payment?.status !== "PAID" && r.package.payment_deadline_at && (
                            <span className="text-[#9CA3AF] text-[11px]">
                              Bayar sebelum {formatFullDate(r.package.payment_deadline_at)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Daftar paket + benefit -- kalau cuma ada 1 paket, tampil sebagai
                ringkasan info aja (bukan grid "pilih salah satu" yang bikin
                user ngira ada opsi lain). */}
            {(() => {
              const renderPackageCard = (pkg, { interactive }) => {
                const alreadyReg = registeredPackageIds.has(pkg.id);
                const locked = pkg.registration_status !== "open";
                const disabled = alreadyReg || locked;
                const selected = selectedPackageId === pkg.id;
                const Wrapper = interactive ? "button" : "div";
                return (
                  <Wrapper
                    key={pkg.id}
                    type={interactive ? "button" : undefined}
                    disabled={interactive ? disabled : undefined}
                    onClick={interactive ? () => setSelectedPackageId(pkg.id) : undefined}
                    className={`text-left rounded-[14px] border p-5 flex flex-col gap-3 transition-colors ${
                      !interactive
                        ? "border-[#148F89]/50 bg-[#148F89]/5"
                        : disabled
                          ? "border-[#2D2342] bg-[#170F26]/50 opacity-60 cursor-not-allowed"
                          : selected
                            ? "border-[#148F89] bg-[#148F89]/10"
                            : "border-[#2D2342] bg-[#170F26] hover:border-[#148F89]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-[16px]">{pkg.name}</span>
                        {pkg.requires_selection && (
                          <span className="text-[#D1D83E] text-[11px] font-semibold flex items-center gap-1 mt-0.5">
                            <ShieldCheck size={12} /> Perlu seleksi
                          </span>
                        )}
                      </div>
                      {interactive && selected && !disabled && <Check size={18} className="text-[#148F89] shrink-0" />}
                      {locked && <Lock size={16} className="text-[#6B7280] shrink-0" />}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-[#148F89] font-bold text-[20px]">{formatIDR(pkg.price)}</span>
                      {Number(pkg.commitment_fee) > 0 && (
                        <span className="text-[#9CA3AF] text-[11px]">
                          + {formatIDR(pkg.commitment_fee)} commitment fee
                        </span>
                      )}
                    </div>
                    {Number(pkg.commitment_fee) > 0 && (
                      <span className="text-[#9CA3AF] text-[11px] -mt-2 leading-relaxed">
                        Total {formatIDR(pkg.total_price)}, termasuk commitment fee {formatIDR(pkg.commitment_fee)}
                        yang dikembalikan penuh di akhir program. Dibayar nanti, hanya jika kamu dinyatakan lolos.
                      </span>
                    )}

                    <div className="flex flex-col gap-1.5 mt-1">
                      {pkg.benefits.map((b) => (
                        <span key={b.label} className={`text-[12px] flex items-center gap-2 ${b.included ? "text-[#E2E8F0]" : "text-[#6B7280]"}`}>
                          {b.included ? <Check size={13} className="text-[#148F89] shrink-0" /> : <X size={13} className="text-[#6B7280] shrink-0" />}
                          {b.label}
                        </span>
                      ))}
                      {/* Benefit tambahan yang diatur admin -- selalu "dapat",
                          soalnya kalau gak ditawarin ya tinggal gak dibikin. */}
                      {(pkg.extra_benefits || []).map((b) => (
                        <span key={b.id} className="text-[12px] flex items-center gap-2 text-[#E2E8F0]">
                          <Check size={13} className="text-[#148F89] shrink-0" />
                          {b.label}
                        </span>
                      ))}
                    </div>

                    {alreadyReg && (
                      <span className="text-[11px] text-[#9CA3AF] italic mt-1">Kamu sudah mendaftar paket ini.</span>
                    )}
                    {!alreadyReg && pkg.registration_status === "not_open_yet" && (
                      <span className="text-[11px] text-[#F59E0B] italic mt-1">
                        Pendaftaran dibuka mulai {formatFullDate(pkg.registration_opens_at)}.
                      </span>
                    )}
                    {!alreadyReg && pkg.registration_status === "closed" && (
                      <span className="text-[11px] text-[#EF4444] italic mt-1">Pendaftaran paket ini sudah ditutup.</span>
                    )}
                  </Wrapper>
                );
              };

              return singlePackageMode ? (
                <div className="flex flex-col gap-2">
                  <h2 className="font-bold text-[15px]">Paket</h2>
                  {renderPackageCard(packages[0], { interactive: false })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packages.map((pkg) => renderPackageCard(pkg, { interactive: true }))}
                </div>
              );
            })()}

            <div className="flex items-start gap-2.5 bg-[#148F89]/10 border border-[#148F89]/30 rounded-[10px] px-4 py-3">
              <Info size={15} className="text-[#148F89] shrink-0 mt-0.5" />
              <p className="text-[#E2E8F0] text-[12.5px] leading-relaxed">
                <span className="font-semibold text-white">Pendaftaran ini gratis.</span> Kamu belum perlu bayar
                apa pun sekarang. Pembayaran (termasuk commitment fee, khusus paket Mentee) baru dilakukan
                setelah kamu dinyatakan <span className="font-semibold text-white">lolos/diterima</span> ke
                tahap berikutnya.
              </p>
            </div>

            {/* Syarat + upload */}
            <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-[15px]">Syarat Pendaftaran</h2>
                <p className="text-[#9CA3AF] text-[12px] mt-1">
                  Gabungkan semua bukti berikut menjadi <span className="text-white font-medium">satu file PDF</span>, lalu unggah di bawah.
                </p>
              </div>
              {requirements.filter((r) => r.category !== "commitment_letter").length > 0 && (
                <ol className="flex flex-col gap-2">
                  {requirements.filter((r) => r.category !== "commitment_letter").map((r, i) => (
                    <li key={r.id} className="flex items-start gap-2.5 text-[13px] text-[#E2E8F0]">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#148F89]/15 text-[#148F89] text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {r.text}
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-1 flex flex-col gap-1.5">
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#2D2342] rounded-[10px] py-6 cursor-pointer hover:border-[#148F89]/50 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleFileSelect(e.target.files?.[0] || null, MAX_REGISTRATION_DOC_SIZE, setFile);
                      e.target.value = "";
                    }}
                  />
                  {file ? (
                    <span className="flex items-center gap-2 text-[#148F89] text-[13px] font-semibold">
                      <FileText size={16} /> {file.name}
                    </span>
                  ) : (
                    <>
                      <Upload size={22} className="text-[#148F89]" />
                      <span className="text-[13px] font-semibold">Klik untuk unggah PDF</span>
                    </>
                  )}
                </label>
                <p className="text-[#6B7280] text-[11px] text-center">
                  Format PDF, ukuran file maksimal 10MB.
                </p>
              </div>
            </div>

            {/* Pertanyaan pendaftaran -- pengganti motivation letter. Cuma
                tampil kalau admin menyalakannya dan ada pertanyaan aktif. */}
            {pertanyaanBerlaku.length > 0 && (
              <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-5">
                <div>
                  <h2 className="font-bold text-[15px]">Pertanyaan Pendaftaran</h2>
                  <p className="text-[#9CA3AF] text-[12px] mt-1">
                    Jawab langsung di sini, tidak perlu mengunggah berkas.
                  </p>
                </div>

                {pertanyaanBerlaku.map((q, i) => {
                  const isi = jawaban[q.id] || "";
                  const jumlahKata = isi.trim() ? isi.trim().split(/\s+/).length : 0;
                  const lewatBatas = q.max_words > 0 && jumlahKata > q.max_words;
                  return (
                    <div key={q.id} className="flex flex-col gap-2">
                      <label className="flex items-start gap-2.5 text-[13px] text-[#E2E8F0]">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[#148F89]/15 text-[#148F89] text-[11px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span>
                          {q.text}
                          {q.is_required ? (
                            <span className="text-[#F87171]"> *</span>
                          ) : (
                            <span className="text-[#6B7280] text-[11.5px]"> (opsional)</span>
                          )}
                        </span>
                      </label>
                      {q.helper_text && (
                        <p className="text-[#6B7280] text-[11.5px] pl-7.5">{q.helper_text}</p>
                      )}
                      <textarea
                        rows={4}
                        value={isi}
                        onChange={(e) =>
                          setJawaban((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Tulis jawabanmu di sini"
                        className={`w-full bg-[#0F081C] border rounded-[8px] px-4 py-3 text-[13.5px] text-white outline-none transition-colors resize-y ${
                          lewatBatas ? "border-[#F87171]" : "border-[#2D2342] focus:border-[#148F89]/60"
                        }`}
                      />
                      {q.max_words > 0 && (
                        <p
                          className={`text-[11.5px] ${
                            lewatBatas ? "text-[#F87171]" : "text-[#6B7280]"
                          }`}
                        >
                          {jumlahKata} / {q.max_words} kata
                          {lewatBatas ? " -- melebihi batas" : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Commitment Letter -- terpisah dari PDF syarat di atas. Bisa
                dimatikan admin kalau sudah digantikan pertanyaan di atas. */}
            {perluCommitmentLetter && (
            <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-[15px]">Commitment Letter</h2>
                <p className="text-[#9CA3AF] text-[12px] mt-1">
                  Tulis motivation/commitment letter mengikuti struktur berikut, lalu unggah sebagai <span className="text-white font-medium">satu file PDF</span>.
                </p>
              </div>
              {requirements.filter((r) => r.category === "commitment_letter").length > 0 && (
                <ol className="flex flex-col gap-2">
                  {requirements.filter((r) => r.category === "commitment_letter").map((r, i) => (
                    <li key={r.id} className="flex items-start gap-2.5 text-[13px] text-[#E2E8F0]">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#148F89]/15 text-[#148F89] text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {r.text}
                    </li>
                  ))}
                </ol>
              )}
              <p className="text-[#F59E0B] text-[12px] font-semibold">
                Maximum {commitmentLetterMaxWords} words.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#2D2342] rounded-[10px] py-6 cursor-pointer hover:border-[#148F89]/50 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleFileSelect(e.target.files?.[0] || null, MAX_COMMITMENT_LETTER_SIZE, setCommitmentLetterFile);
                      e.target.value = "";
                    }}
                  />
                  {commitmentLetterFile ? (
                    <span className="flex items-center gap-2 text-[#148F89] text-[13px] font-semibold">
                      <FileText size={16} /> {commitmentLetterFile.name}
                    </span>
                  ) : (
                    <>
                      <Upload size={22} className="text-[#148F89]" />
                      <span className="text-[13px] font-semibold">Klik untuk unggah PDF</span>
                    </>
                  )}
                </label>
                <p className="text-[#6B7280] text-[11px] text-center">
                  Format PDF, ukuran file maksimal 5MB.
                </p>
              </div>
            </div>
            )}

            {/* CV (wajib) & Portofolio (opsional) -- dulu diunggah sekali di
                profil user; sekarang diminta per pendaftaran biar yang masuk
                selalu versi terbaru. */}
            <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-[15px]">CV &amp; Portofolio</h2>
                <p className="text-[#9CA3AF] text-[12px] mt-1">
                  Unggah CV terbarumu. Portofolio boleh dilampirkan kalau ada, tapi tidak wajib.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold">CV <span className="text-[#EF4444]">*</span></span>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#2D2342] rounded-[10px] py-6 cursor-pointer hover:border-[#148F89]/50 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleFileSelect(e.target.files?.[0] || null, MAX_COMMITMENT_LETTER_SIZE, setCvFile);
                      e.target.value = "";
                    }}
                  />
                  {cvFile ? (
                    <span className="flex items-center gap-2 text-[#148F89] text-[13px] font-semibold">
                      <FileText size={16} /> {cvFile.name}
                    </span>
                  ) : (
                    <>
                      <Upload size={22} className="text-[#148F89]" />
                      <span className="text-[13px] font-semibold">Klik untuk unggah PDF</span>
                    </>
                  )}
                </label>
                <p className="text-[#6B7280] text-[11px] text-center">Format PDF, ukuran file maksimal 5MB.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold">
                  Portofolio <span className="text-[#9CA3AF] font-normal">(opsional)</span>
                </span>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#2D2342] rounded-[10px] py-6 cursor-pointer hover:border-[#148F89]/50 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleFileSelect(e.target.files?.[0] || null, MAX_COMMITMENT_LETTER_SIZE, setPortfolioFile);
                      e.target.value = "";
                    }}
                  />
                  {portfolioFile ? (
                    <span className="flex items-center gap-2 text-[#148F89] text-[13px] font-semibold">
                      <FileText size={16} /> {portfolioFile.name}
                    </span>
                  ) : (
                    <>
                      <Upload size={22} className="text-[#148F89]" />
                      <span className="text-[13px] font-semibold">Klik untuk unggah PDF</span>
                    </>
                  )}
                </label>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-[#6B7280] text-[11px]">Format PDF, maksimal 5MB.</p>
                  {portfolioFile && (
                    <button
                      onClick={() => setPortfolioFile(null)}
                      className="text-[#EF4444] text-[11px] font-semibold hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#170F26] border border-[#2D2342] rounded-[12px] p-5 flex flex-col gap-4">
              {!selectedPackageId && (
                <p className="flex items-center gap-2 text-[#F59E0B] text-[12px]">
                  <AlertCircle size={13} /> Silakan pilih paket terlebih dahulu di atas.
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={
                  !selectedPackageId ||
                  !file ||
                  !cvFile ||
                  (perluCommitmentLetter && !commitmentLetterFile) ||
                  pertanyaanBerlaku.some((q) => q.is_required && !(jawaban[q.id] || "").trim()) ||
                  submitting
                }
                className="w-full py-3 rounded-[8px] bg-[#148F89] text-white font-semibold text-[14px] hover:bg-[#117A75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Mengirim..." : "Kirim Pendaftaran"}
              </button>
              <p className="flex items-center gap-2 text-[#6B7280] text-[11px]">
                <Clock size={12} /> Setelah dikirim, pendaftaran akan ditinjau admin. Pembayaran dilakukan setelah kamu diterima/di-ACC.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// LoginRequiredDialog pakai useSearchParams, jadi wajib ada Suspense di atasnya
// supaya build produksi gak gagal waktu prerender.
export default function BootcampRegisterPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[#0F081C]" />}>
      <BootcampRegisterPageInner />
    </Suspense>
  );
}
