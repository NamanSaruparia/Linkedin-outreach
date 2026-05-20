const SESSION_KEY = "linkedin-outreach-session";
const USERS_KEY = "linkedin-outreach-users";
const LEGACY_KEY = "linkedin-outreach-dashboard";

export interface Session {
  mobile: string;
  token: string;
  loggedInAt: string;
}

export { normalizeMobile, formatMobileDisplay } from "./phone";

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (s?.mobile?.length === 10 && s?.token) return s;
  } catch {
    /* ignore */
  }
  return null;
}

export function setSession(mobile: string, token: string): void {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ mobile, token, loggedInAt: new Date().toISOString() })
  );
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function registerUser(mobile: string): void {
  const users = getRegisteredUsers();
  if (!users.includes(mobile)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([mobile, ...users].slice(0, 8)));
  }
}

export function getRegisteredUsers(): string[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as string[];
    return list.filter((m) => typeof m === "string" && m.length === 10);
  } catch {
    return [];
  }
}

export function userDataKey(mobile: string): string {
  return `linkedin-outreach-data-${mobile}`;
}

/** Local backup key — used for one-time migration to cloud */
export function getLegacyLocalData(mobile: string): string | null {
  const userKey = userDataKey(mobile);
  return localStorage.getItem(userKey) ?? localStorage.getItem(LEGACY_KEY);
}

export function clearLegacyLocalData(mobile: string): void {
  localStorage.removeItem(userDataKey(mobile));
  localStorage.removeItem(LEGACY_KEY);
}
