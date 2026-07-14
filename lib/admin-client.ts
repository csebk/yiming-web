/**
 * Admin panel — shared client-side helpers.
 * Stores admin token in localStorage; wraps fetch with Authorization header.
 */

"use client";

export const ADMIN_TOKEN_KEY = "yiming_admin_token";

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminFetch(url: string, opts: RequestInit = {}): Promise<any> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...opts, headers, credentials: "include" });
  if (res.status === 401 || res.status === 403) {
    clearAdminToken();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    return { success: false, error: "未登录或无权限" };
  }
  return res.json();
}

export function formatTime(ts: string | number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
