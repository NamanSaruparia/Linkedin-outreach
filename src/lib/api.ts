import type { AppData } from "../types";
import { getApiBase } from "./devMode";

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
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body = await res.json().catch(() => ({}));

  if (res.ok && !contentType.includes("application/json")) {
    throw new ApiError(
      "Server returned HTML instead of JSON — API route may be missing. Redeploy latest code.",
      res.status
    );
  }

  if (!res.ok) {
    const errMsg =
      (body as { error?: string }).error ??
      res.statusText ??
      `HTTP ${res.status}`;
    throw new ApiError(errMsg, res.status);
  }

  return body as T;
}

export async function apiLogin(mobile: string): Promise<{
  token: string;
  mobile: string;
  displayMobile: string;
}> {
  return request("/api/login", {
    method: "POST",
    body: JSON.stringify({ mobile }),
  });
}

export async function apiFetchData(token: string): Promise<AppData> {
  return request("/api/user-data", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiSaveData(token: string, data: AppData): Promise<void> {
  await request("/api/user-data", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function apiForceSync(
  token: string,
  data: AppData
): Promise<{ connections: number }> {
  return request("/api/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}
