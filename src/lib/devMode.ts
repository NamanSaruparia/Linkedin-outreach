/** Local-only session when API is not available (npm run dev without vercel dev) */
export const LOCAL_TOKEN = "local-storage";

export function isLocalMode(token: string): boolean {
  return token === LOCAL_TOKEN;
}

/** API base URL — production always uses same origin (avoids broken VITE_API_URL on Vercel) */
export function getApiBase(): string {
  if (import.meta.env.PROD) return "";
  return import.meta.env.VITE_API_URL ?? "";
}

/** Use MongoDB API when VITE_API_URL is set or we're on the deployed site */
export function useCloudApi(): boolean {
  if (import.meta.env.VITE_USE_LOCAL === "true") return false;
  if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) return false;
  return true;
}

export function isApiUnreachableError(e: unknown): boolean {
  if (e instanceof Error) {
    const m = e.message.toLowerCase();
    return (
      m.includes("not found") ||
      m.includes("failed to fetch") ||
      m.includes("network")
    );
  }
  return false;
}
