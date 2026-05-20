import type { AppData } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      (body as { error?: string }).error ?? res.statusText,
      res.status
    );
  }

  return body as T;
}

export async function apiLogin(mobile: string): Promise<{
  token: string;
  mobile: string;
  displayMobile: string;
}> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ mobile }),
  });
}

export async function apiFetchData(token: string): Promise<AppData> {
  return request("/api/user/data", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiSaveData(token: string, data: AppData): Promise<void> {
  await request("/api/user/data", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function apiForceSync(
  token: string,
  data: AppData
): Promise<{ connections: number }> {
  return request("/api/user/sync-local", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}
