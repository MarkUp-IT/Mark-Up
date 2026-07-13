export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ access, refresh }) {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
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
    credentials: "include",
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
  { method = "GET", body, headers = {}, auth = true, credentials = "include", ...rest } = {}
) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const buildHeaders = () => {
    const h = { "Content-Type": "application/json", ...headers };
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
      credentials,
      body: body ? JSON.stringify(body) : undefined,
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
      clearTokens();
      return null;
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
    const message =
      (data && (data.detail || data.message || data.error)) ||
      `Request gagal dengan status ${res.status}`;
    throw new ApiError(message, { status: res.status, data, url });
  }

  return data;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options) => apiRequest(path, { ...options, method: "POST", body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => apiRequest(path, { ...options, method: "DELETE" }),
};