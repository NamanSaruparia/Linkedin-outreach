import type { AppData } from "../types";
import { DEFAULT_PROFILE } from "../types";
import { PRIMARY_MOBILE } from "./config";
import { mergeConnections } from "./parser";

const LEGACY_KEY = "linkedin-outreach-dashboard";
const DATA_PREFIX = "linkedin-outreach-data-";

function parseSnapshot(raw: string): AppData | null {
  try {
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || !Array.isArray(parsed.connections)) return null;
    return {
      profile: { ...DEFAULT_PROFILE, ...parsed.profile },
      connections: parsed.connections,
      lastImportedAt: parsed.lastImportedAt ?? null,
    };
  } catch {
    return null;
  }
}

/** Every local snapshot on this browser (any number + legacy key) */
export function collectAllLocalSnapshots(): AppData[] {
  const snapshots: AppData[] = [];
  const seen = new Set<string>();

  const add = (raw: string | null) => {
    if (!raw || seen.has(raw)) return;
    seen.add(raw);
    const data = parseSnapshot(raw);
    if (data) snapshots.push(data);
  };

  add(localStorage.getItem(LEGACY_KEY));

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(DATA_PREFIX)) {
      add(localStorage.getItem(key));
    }
  }

  return snapshots;
}

export function getBestLocalSnapshot(): AppData | null {
  const snapshots = collectAllLocalSnapshots();
  if (snapshots.length === 0) return null;

  return snapshots.reduce((best, cur) =>
    cur.connections.length > best.connections.length ? cur : best
  );
}

export function mergeAppData(cloud: AppData, local: AppData): AppData {
  return {
    profile: { ...DEFAULT_PROFILE, ...cloud.profile, ...local.profile },
    connections: mergeConnections(cloud.connections, local.connections).connections,
    lastImportedAt: cloud.lastImportedAt ?? local.lastImportedAt,
  };
}

export function clearAllLocalSnapshots(): void {
  localStorage.removeItem(LEGACY_KEY);
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(DATA_PREFIX)) keys.push(key);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function getLocalSnapshotForMobile(mobile: string): AppData | null {
  const raw =
    localStorage.getItem(`${DATA_PREFIX}${mobile}`) ??
    (mobile === PRIMARY_MOBILE ? localStorage.getItem(LEGACY_KEY) : null);
  if (!raw) return null;
  return parseSnapshot(raw);
}
