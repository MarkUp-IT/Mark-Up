"use client";

import {
  Search,
  Plus,
  TrendingUp,
  Download,
  Eye,
  PenLine,
  X,
  CloudUpload,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import DashboardLayout from "@/component/admin/DashboardLayout";
import StatCard from "@/component/admin/StatCard";
import EmptyState from "@/component/admin/EmptyState";
import Toast from "@/component/Toast";
import { api, ApiError } from "@/lib/api";

const CATEGORY_FILTERS = ["Semua", "Mentoring", "Bootcamp", "Modul"];
const STATUS_FILTERS = ["Semua", "Aktif", "Nonaktif"];

const CATEGORY_BADGE = {
  Mentoring: "bg-[#FEF9C3] text-[#854D0E] border border-[#FEF08A]",
  Bootcamp: "bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]",
  Modul: "bg-[#FCE7F3] text-[#9D174D] border border-[#FBCFE8]",
};

export default function Products() {
  const heightFix = `
    .adm-h-42 { height: 42px; }
    .adm-h-48 { height: 48px; }
    .adm-w-220 { width: 220px; }
  `;

  

  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formCategory, setFormCategory] = useState("Bootcamp");

  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [productSummary, setProductSummary] = useState(null);
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
      type: "BOOTCAMP",
      title: "",
      description: "",
      explanation: "",
      new_price: "",
      original_price: "",
      session_count: 1,
      duration_minutes: 60,
      registration_link: "",
      image_url: "",
      file_pdf_url: "",
      stock: "",
    });

    const [editFormData, setEditFormData] = useState({
    type: "",
    title: "",
    description: "",
    explanation: "",
    new_price: "",
    original_price: "",
    stock: "",
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "Berhasil",
    message: "",
  });

  const showToast = (type, title, message) => {
    setToast({ open: true, type, title, message });
  };

  useEffect(() => {
    document.body.style.overflow = isAddOpen || isEditOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAddOpen, isEditOpen]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);

        const [purchaseData, productData, revenueData,] = await Promise.all([
          api.get("/api/transactions/summary/purchases/?period=all"),
          api.get("/api/products/summary/"),
          api.get("/api/transactions/summary/revenue/"),
        ]);

        setPurchaseSummary(purchaseData);
        setProductSummary(productData);
        setRevenueSummary(revenueData);
      } catch (err) {
        console.error(err);

        if (err instanceof ApiError) {
          console.error(err.message);
        }
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const data = await api.get(
          `/api/products/?page=${currentPage}&page_size=10`
        );

        setProducts(data.products ?? []);
        setPagination(data.pagination ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [currentPage]);

  const formatIDR = (val) =>
    val == null
      ? "-"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(val);

  const chartData = loadingSummary
    ? []
    : [
        {
          product: "MENTORING",
          revenue: Number(
            revenueSummary?.revenue_by_type?.MENTORING ?? 0
          ),
        },
        {
          product: "BOOTCAMP",
          revenue: Number(
            revenueSummary?.revenue_by_type?.BOOTCAMP ?? 0
          ),
        },
        {
          product: "MODUL",
          revenue: Number(
            revenueSummary?.revenue_by_type?.MODULE ?? 0
          ),
        },
      ];


  const filtered = products.filter((p) => {
    const category =
      p.type === "MENTORING"
        ? "Mentoring"
        : p.type === "BOOTCAMP"
        ? "Bootcamp"
        : "Modul";

    const matchCategory =
      categoryFilter === "Semua" || category === categoryFilter;

    const matchStatus =
      statusFilter === "Semua" ||
      (statusFilter === "Aktif"
        ? p.is_active
        : !p.is_active);

    return matchCategory && matchStatus;
  });

  const renderCategorySpecificFields = (data, setData, category) => {
    if (category === "Mentoring") {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
            Jumlah Sesi
          </p>
          <input
            type="number"
            value={data.original_price}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                original_price: e.target.value,
              }))
            }
          />
          <p className="text-[#94A3B8] text-[11px]">
            Sesi pertama dipilih user pas checkout, sisanya dipilih sendiri dari
            halaman Produk Saya setelah pembayaran dikonfirmasi.
          </p>
        </div>
      );
    }
    if (category === "Modul") {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
            File PDF Utama
          </p>
          <div
            style={{ height: "100px" }}
            className="bg-[#F8FAFC] w-full rounded-[8px] flex items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] transition-all cursor-pointer"
          >
            <p className="text-[#64748B] text-[13px]">
              Klik untuk unggah PDF materi utama
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handlePublish = async () => {
    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        new_price: Number(formData.new_price),
        original_price:
          formData.original_price === "" ? null : Number(formData.original_price),
        stock: formData.stock === "" ? null : Number(formData.stock),
      };

      const res = await api.post("/api/products/add/", payload);
      const successMessage =
        typeof res?.detail === "string" && res.detail.trim()
          ? res.detail
          : "Produk berhasil diterbitkan.";

      showToast("success", "Produk diterbitkan", successMessage);
      setIsAddOpen(false);

      const data = await api.get(`/api/products/?page=${currentPage}&page_size=10`);
      setProducts(data.products ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      console.error(err);

      if (err instanceof ApiError) {
        showToast("error", "Gagal menerbitkan produk", err.message);
      } else {
        showToast(
          "error",
          "Gagal menerbitkan produk",
          "Terjadi kesalahan. Coba lagi."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;

    try {
      setSubmitting(true);

      const payload = {
        ...editFormData,
        new_price: Number(editFormData.new_price),
        original_price:
          editFormData.original_price === ""
            ? null
            : Number(editFormData.original_price),
        stock:
          editFormData.stock === "" ? null : Number(editFormData.stock),
        is_active: editFormData.is_active,
      };

      const res = await api.patch(
        `/api/products/${selectedProduct.id}/`,
        payload
      );

      const successMessage =
        typeof res?.detail === "string" && res.detail.trim()
          ? res.detail
          : "Produk berhasil diperbarui.";

      showToast("success", "Produk diperbarui", successMessage);
      setIsEditOpen(false);

      const data = await api.get(
        `/api/products/?page=${currentPage}&page_size=10`
      );
      setProducts(data.products ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      console.error(err);

      if (err instanceof ApiError) {
        showToast("error", "Gagal memperbarui produk", err.message);
      } else {
        showToast(
          "error",
          "Gagal memperbarui produk",
          "Terjadi kesalahan. Coba lagi."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Produk">
      <style>{heightFix}</style>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-[22px] text-[#0F172A]">
            Katalog Produk
          </h1>
          <p className="text-[#64748B] text-[14px] mt-1">
            Kelola bootcamp, modul, dan paket mentoring MARK-UP dari satu
            tempat.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="adm-h-42 flex items-center gap-2 px-5 rounded-[8px] bg-[#148F89] text-white text-[13px] font-semibold hover:bg-[#117A75] transition-colors"
        >
          <Plus size={16} />
          Produk Baru
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Mentoring Terjual"
          value={
            loadingSummary
              ? "..."
              : String(
                  purchaseSummary?.counts_by_type?.MENTORING ?? 0
                )
          }
          unit="unit"
        />

        <StatCard
          label="Bootcamp Terjual"
          value={
            loadingSummary
              ? "..."
              : String(
                  purchaseSummary?.counts_by_type?.BOOTCAMP ?? 0
                )
          }
          unit="unit"
        />

        <StatCard
          label="Modul Terjual"
          value={
            loadingSummary
              ? "..."
              : String(
                  purchaseSummary?.counts_by_type?.MODULE ?? 0
                )
          }
          unit="unit"
        />

        <div className="col-span-2 row-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-[12px] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] font-bold text-[#64748B] tracking-wide uppercase">
              Total Pendapatan Produk
            </p>
            
          </div>
          <p className="font-bold text-[28px] text-[#0F172A] mb-4">
            {loadingSummary
              ? "..."
              : formatIDR(Number(revenueSummary?.total_revenue ?? 0))}
          </p>
          <div className="flex-1" style={{ minHeight: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barCategoryGap={30}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="product"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatIDR(value)}
                  cursor={{ fill: "#F8FAFC" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={["#EAB308", "#148F89", "#9333EA"][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <StatCard
          label="Produk Aktif"
          value={
            loadingSummary
              ? "..."
              : String(productSummary?.total_active ?? 0)
          }
          unit="produk"
          variant="success"
        />

        <StatCard
          label="Total Produk"
          value={
            loadingSummary
              ? "..."
              : String(productSummary?.total ?? 0)
          }
          unit="produk"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[16px] font-semibold text-[#0F172A]">
              Daftar Produk
            </h2>
            <p className="text-[#64748B] text-[13px] mt-0.5">
              Seluruh produk MARK-UP sepanjang waktu.
            </p>
          </div>
          <a
            href="/admin/products"
            className="text-[#148F89] font-bold text-[13px] hover:underline"
          >
            Lihat Semua Produk
          </a>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                size={15}
              />
              <input
                type="text"
                placeholder="Cari di tabel..."
                className="bg-white adm-w-220 adm-h-42 rounded-[8px] pl-9 border border-[#E2E8F0] outline-none focus:border-[#148F89] text-[13px]"
              />
            </div>
            <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setCategoryFilter(f)}
                  className={`px-3.5 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors ${categoryFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="adm-h-42 bg-[#F1F5F9] px-1.5 rounded-[8px] flex items-center gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3.5 py-2 rounded-[6px] font-medium text-[12.5px] transition-colors ${statusFilter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/60"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <button className="adm-h-42 flex items-center gap-2 px-4 bg-[#F1F5F9] text-[13px] font-medium rounded-[8px] hover:bg-[#E2E8F0] transition-colors text-[#475569]">
            <Download size={15} />
            Ekspor .CSV
          </button>
        </div>

        {loadingProducts ? (
          <EmptyState message="Memuat produk..." />
        ) : filtered.length === 0 ? (
          <EmptyState message="Nggak ada produk yang cocok sama filter ini." />
        ) : (
          <div className="rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      ID
                    </th>
                    <th className="px-6 py-3.5 text-left font-bold text-[#64748B] tracking-wider text-[11px]">
                      NAMA PRODUK
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      HARGA
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      KATEGORI
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      STATUS
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      TERJUAL
                    </th>
                    <th className="px-6 py-3.5 text-center font-bold text-[#64748B] tracking-wider text-[11px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {filtered.map((item) => (
                    <tr
                      key={`${item.type.slice(0, 2)}${String(item.id).slice(-4)}`}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-4 text-[#64748B] font-medium">
                        {item.type.slice(0,2)}{String(item.id).slice(-4)}
                      </td>
                      <td className="px-6 py-4 text-[#1E293B] font-semibold">
                        {item.title}
                        {item.session_count > 1 && (
                          <span className="ml-2 text-[#148F89] text-[11px] font-semibold">
                            ({item.session_count}x sesi)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-[#334155] font-medium">
                        {item.original_price && (
                          <span className="line-through text-[#94A3B8] mr-1.5">
                            {formatIDR(item.original_price)}
                          </span>
                        )}
                        {formatIDR(item.new_price)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1.5 text-[11px] rounded-[6px] font-semibold ${CATEGORY_BADGE[
                              item.type === "MENTORING"
                                ? "Mentoring"
                                : item.type === "BOOTCAMP"
                                ? "Bootcamp"
                                : "Modul"
                            ]}`}
                          >
                          {item.type === "MENTORING"
                          ? "Mentoring"
                          : item.type === "BOOTCAMP"
                          ? "Bootcamp"
                          : "Modul"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-bold ${item.is_active ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"}`}
                        >
                          {item.is_active ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[#475569] font-medium">
                        {item.sold_count}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Eye
                            size={17}
                            className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                          />
                          <PenLine
                            size={17}
                            onClick={() => {
                              setSelectedProduct(item);
                              setFormCategory(
                                item.type === "MENTORING"
                                  ? "Mentoring"
                                  : item.type === "BOOTCAMP"
                                  ? "Bootcamp"
                                  : "Modul"
                              );
                              setEditFormData({
                                type: item.type,
                                title: item.title ?? "",
                                description: item.description ?? "",
                                explanation: item.explanation ?? "",
                                new_price: item.new_price ?? "",
                                original_price: item.original_price ?? "",
                                stock: item.stock ?? "",
                                is_active: item.is_active,
                              });
                              setIsEditOpen(true);
                            }}
                            className="cursor-pointer text-[#94A3B8] hover:text-[#148F89] transition-colors"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0] bg-white">
                  <p className="text-sm text-[#64748B]">
                    Halaman {pagination.page} dari {pagination.total_pages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      disabled={!pagination.has_previous}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="px-4 py-2 border rounded disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>

                    <button
                      disabled={!pagination.has_next}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-4 py-2 border rounded disabled:opacity-40"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isAddOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsAddOpen(false)}
        />
      )}
      <div
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isAddOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Produk Baru</p>
            <button
              onClick={() => setIsAddOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Isi detail buat bikin produk baru.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Thumbnail Produk
            </p>
            <div
              style={{ height: "160px" }}
              className="bg-[#F8FAFC] w-full rounded-[8px] flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] hover:bg-[#F1F5F9] transition-all cursor-pointer"
            >
              <CloudUpload size={22} className="text-[#148F89] mb-2" />
              <p className="text-[#1E293B] font-semibold text-[14px]">
                Klik untuk unggah gambar
              </p>
              <p className="text-[#94A3B8] text-[12px]">Maks. 5MB</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Judul
            </p>
            <input
                value={formData.title}
                onChange={(e) =>
                    setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                    }))
                }
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kategori
            </p>
            <div className="relative w-full">
              <select
                    value={formCategory}
                    onChange={(e) => {
                        const value = e.target.value;

                        setFormCategory(value);

                        setFormData((prev) => ({
                            ...prev,
                            type:
                                value === "Mentoring"
                                    ? "MENTORING"
                                    : value === "Bootcamp"
                                    ? "BOOTCAMP"
                                    : "MODULE",
                        }));
                    }}
                >
                <option>Bootcamp</option>
                <option>Mentoring</option>
                <option>Modul</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Deskripsi Singkat
            </p>
            <input
                value={formData.description}
                onChange={(e)=>
                    setFormData(prev=>({
                        ...prev,
                        description:e.target.value
                    }))
                }
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Deskripsi Lengkap
            </p>
            <textarea
                value={formData.explanation}
                onChange={(e)=>
                    setFormData(prev=>({
                        ...prev,
                        explanation:e.target.value
                    }))
                }
            />
          </div>

          {renderCategorySpecificFields(formData, setFormData, formCategory)}

          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-2">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Stok
              </p>
              <input
                type="number"
                min="0"
                placeholder="Jumlah stok"
                value={formData.stock}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stock: e.target.value,
                  }))
                }
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89]"
              />
            </div>

            <div className="flex gap-4 w-full">
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                  Harga (Rp)
                </p>
                <input
                  type="number"
                  value={formData.new_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      new_price: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                  Harga Asli (opsional)
                </p>
                <input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      original_price: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={() => setIsAddOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batalkan
          </button>
          <button
              onClick={handlePublish}
              disabled={submitting}
              className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] disabled:opacity-50"
          >
              {submitting ? "Menyimpan..." : "Publikasikan"}
          </button>
        </div>
      </div>

      {isEditOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsEditOpen(false)}
        />
      )}
      <div
        style={{ width: "560px", maxWidth: "100%" }}
        className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isEditOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="w-full shrink-0 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col justify-center px-8 py-6 gap-1">
          <div className="flex justify-between items-center">
            <p className="text-[#1E293B] text-[19px] font-bold">Edit Produk</p>
            <button
              onClick={() => setIsEditOpen(false)}
              className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
            >
              <X className="text-[#64748B]" size={20} />
            </button>
          </div>
          <p className="text-[#64748B] text-[13px]">
            Ubah detail {selectedProduct?.title || "produk terpilih"}.
          </p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Judul
            </p>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Kategori
            </p>
            <div className="relative w-full">
              <select
                value={formCategory}
                disabled
                className="w-full adm-h-48 bg-[#F1F5F9] border border-[#E2E8F0] rounded-[8px] px-4 appearance-none outline-none text-[#94A3B8] cursor-not-allowed"
              >
                <option>Bootcamp</option>
                <option>Mentoring</option>
                <option>Modul</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
              />
            </div>
            <p className="text-[#94A3B8] text-[11px]">
              Tipe produk tidak bisa diubah setelah dibuat.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Deskripsi Singkat
            </p>
            <input
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Deskripsi Lengkap
            </p>
            <textarea
              value={editFormData.explanation}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  explanation: e.target.value,
                }))
              }
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 py-3 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
            />
          </div>

          {renderCategorySpecificFields(editFormData, setEditFormData, formCategory)}

          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-2">
              <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                Stok
              </p>
              <input
                type="number"
                min="0"
                placeholder="Jumlah stok"
                value={editFormData.stock}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, stock: e.target.value }))
                }
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89]"
              />
            </div>

            <div className="flex gap-4 w-full">
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                  Harga (Rp)
                </p>
                <input
                  type="number"
                  value={editFormData.new_price}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      new_price: e.target.value,
                    }))
                  }
                  className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
                  Harga Asli (opsional)
                </p>
                <input
                  type="number"
                  value={editFormData.original_price}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      original_price: e.target.value,
                    }))
                  }
                  className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[#64748B] text-[12px] uppercase font-bold tracking-wider">
              Status
            </p>
            <div className="relative w-full">
              <select
                value={editFormData.is_active ? "Aktif" : "Nonaktif"}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    is_active: e.target.value === "Aktif",
                  }))
                }
                className="w-full adm-h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-4 pr-10 appearance-none outline-none focus:border-[#148F89] transition-all text-[#1E293B]"
              >
                <option>Aktif</option>
                <option>Nonaktif</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 bg-white border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={() => setIsEditOpen(false)}
            className="flex-1 py-3 bg-white border border-[#E2E8F0] text-[#475569] font-bold rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleUpdate}
            disabled={submitting}
            className="flex-1 py-3 bg-[#148F89] text-white font-bold rounded-[8px] hover:bg-[#117A75] disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        position="bottom-right"
      />
    </DashboardLayout>
  );
}
