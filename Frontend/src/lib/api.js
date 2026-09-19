export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * Akses localStorage SELALU lewat pembungkus ini.
 *
 * Menyentuh localStorage bisa MELEMPAR, bukan sekadar mengembalikan null:
 * browser yang memblokir penyimpanan situs (Chrome "Block all cookies", mode
 * privat tertentu, Brave/Safari dengan proteksi ketat, sebagian webview)
 * melempar SecurityError begitu propertinya dibaca.
 *
 * Dulu dipanggil langsung, jadi error itu naik ke React dan seluruh halaman
 * diganti layar "Halaman ini gagal ditampilkan" -- termasuk halaman publik
 * yang sebenarnya tidak butuh login sama sekali.
 *
 * Gagal-aman: kalau storage tidak bisa diakses, pengguna dianggap belum login.
 * Situs tetap bisa dijelajahi; hanya sesi login yang tidak bisa disimpan.
 */
function bacaStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function tulisStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* penyimpanan diblokir atau penuh -- diabaikan, jangan merusak halaman */
  }
}

function hapusStorage(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* sama seperti di atas */
  }
}

/** true kalau sesi login tidak akan bertahan (penyimpanan diblokir browser). */
export function isStorageBlocked() {
  if (typeof window === "undefined") return false;
  try {
    const uji = "__markup_uji_storage__";
    window.localStorage.setItem(uji, "1");
    window.localStorage.removeItem(uji);
    return false;
  } catch {
    return true;
  }
}

export function getAccessToken() {
  return bacaStorage(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return bacaStorage(REFRESH_TOKEN_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) tulisStorage(ACCESS_TOKEN_KEY, access);
  if (refresh) tulisStorage(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  hapusStorage(ACCESS_TOKEN_KEY);
  hapusStorage(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, { status, data, url } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.url = url;
  }
}

const isDev = process.env.NODE_ENV !== "production";

function logRequest(method, url, options) {
  if (!isDev) return;
  console.groupCollapsed(`%c[API] ${method} ${url}`, "color:#08C7E1");
  if (options?.body) {
    try {
      console.log("body:", JSON.parse(options.body));
    } catch {
      console.log("body:", options.body);
    }
  }
  console.groupEnd();
}

function logResponse(method, url, status, data) {
  if (!isDev) return;
  const color = status >= 400 ? "#FF6B6B" : "#4ADE80";
  console.log(`%c[API] ${method} ${url} -> ${status}`, `color:${color}`, data);
}

function logError(method, url, err) {
  console.error(`[API] ${method} ${url} failed:`, err);
}

let isRefreshing = false;
let refreshQueue = [];

function subscribeToRefresh(callback) {
  refreshQueue.push(callback);
}

function onRefreshed(newAccessToken) {
  refreshQueue.forEach((cb) => cb(newAccessToken));
  refreshQueue = [];
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    throw new ApiError("Sesi berakhir, silakan login kembali.", { status: res.status });
  }

  const data = await res.json();
  setTokens({ access: data.access, refresh: data.refresh });
  return data.access;
}

export async function apiRequest(
  path,
  { method = "GET", body, headers = {}, auth = true, credentials = "omit", ...rest } = {}
) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  // Upload file harus dikirim sebagai FormData mentah -- kalau di-JSON.stringify
  // filenya hilang, dan Content-Type-nya wajib dibiarin browser yang isi
  // (butuh boundary multipart). Sebelum ini apiRequest maksa JSON, jadi semua
  // upload terpaksa pakai fetch mentah -- akibatnya mereka gak kebagian
  // auto-refresh token, dan pendaftaran gagal 401 kalau token keburu expired
  // pas user lagi lama ngisi form.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const buildHeaders = () => {
    const h = isFormData ? { ...headers } : { "Content-Type": "application/json", ...headers };
    if (auth) {
      const token = getAccessToken();
      if (token) h["Authorization"] = `Bearer ${token}`;
    }
    return h;
  };

  const doFetch = async () => {
    const options = {
      method,
      headers: buildHeaders(),
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      ...rest,
    };

    logRequest(method, url, options);

    let res;
    try {
      res = await fetch(url, options);
    } catch (networkErr) {
      
      logError(method, url, networkErr);
      throw new ApiError(
        "Tidak dapat terhubung ke server. Periksa koneksi atau server backend.",
        { status: 0, url }
      );
    }

    let data = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }

    logResponse(method, url, res.status, data);

    return { res, data };
  };

  let { res, data } = await doFetch();

  if (res.status === 401 && auth && !path.includes("/auth/")) {
    const hasRefreshToken = Boolean(getRefreshToken());

    if (!hasRefreshToken) {
      // Dulu di sini `return null` diam-diam. Bagi pemanggil itu nggak bisa
      // dibedain dari "sukses tapi datanya kosong" -- yang langsung baca
      // res.field jadi crash dengan TypeError yang nggak nyambung, dan yang
      // punya try/catch pun nggak kena catch-nya sama sekali. Sesi habis itu
      // kegagalan, jadi diperlakukan sama kayak cabang refresh yang gagal di
      // bawah: dilempar sebagai ApiError 401.
      clearTokens();
      throw new ApiError("Sesi berakhir, silakan login kembali.", {
        status: 401,
        url,
      });
    } else if (isRefreshing) {
      const newToken = await new Promise((resolve) => subscribeToRefresh(resolve));
      if (newToken) {
        ({ res, data } = await doFetch());
      }
    } else {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newToken);
        if (newToken) {
          ({ res, data } = await doFetch());
        }
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(null);
        clearTokens();
        logError(method, url, refreshErr);
        throw new ApiError("Sesi berakhir, silakan login kembali.", {
          status: 401,
          url,
        });
      }
    }
  }

  if (!res.ok) {
    // Backend balikin error validasi field dalam bentuk
    // {"errors": {"field": ["pesan", ...]}} -- kalau nggak ada detail/message
    // yang kebaca, rangkai pesan dari errors itu biar user tau field mana yang
    // salah, bukan cuma "Request gagal dengan status 400" yang nggak informatif.
    let message = data && (data.detail || data.message || data.error);
    if (!message && data?.errors && typeof data.errors === "object") {
      const parts = Object.values(data.errors)
        .flat()
        .filter(Boolean);
      if (parts.length) message = parts.join(" ");
    }
    if (!message) message = `Request gagal dengan status ${res.status}`;
    throw new ApiError(message, { status: res.status, data, url });
  }

  return data;
}

/**
 * Upload file (FormData) yang balikin {ok, status, data} alih-alih nge-throw.
 *
 * Dipakai halaman-halaman upload yang butuh baca status mentah (mis. bedain
 * 413 "file kegedean" dari error validasi biasa). Bedanya sama fetch mentah:
 * ini tetap lewat apiRequest, jadi kalau access token keburu kedaluwarsa pas
 * user lama ngisi form, tokennya di-refresh otomatis dan request diulang --
 * ini yang dulu bikin pendaftaran gagal 401 tanpa penjelasan.
 */
export async function apiRequestRaw(path, formData, { method = "POST" } = {}) {
  try {
    const data = await apiRequest(path, { method, body: formData });
    return { ok: true, status: 200, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, status: err.status, data: err.data ?? null, message: err.message };
    }
    throw err;
  }
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options) => apiRequest(path, { ...options, method: "POST", body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => apiRequest(path, { ...options, method: "DELETE" }),
};