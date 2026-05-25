import type { AppData, UserProfile } from "../types";
import { DEFAULT_PROFILE } from "../types";
import { userDataKey } from "./auth";

const LEGACY_KEY = "linkedin-outreach-dashboard";

function migrateProfile(raw: Partial<UserProfile>): UserProfile {
  const profile = { ...DEFAULT_PROFILE, ...raw };
  if (!profile.outreachPurpose && raw.lookingFor) {
    profile.outreachPurpose = raw.lookingFor;
  }
  if (!profile.messageMode) profile.messageMode = "auto";
  if (!profile.messageTemplate)
    profile.messageTemplate = DEFAULT_PROFILE.messageTemplate;
  if (profile.templateAutoTweak === undefined) profile.templateAutoTweak = true;
  return profile;
}

export function loadAppDataLocal(mobile: string): AppData {
  try {
    const key = userDataKey(mobile);
    const raw =
      localStorage.getItem(key) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      return {
        profile: { ...DEFAULT_PROFILE },
        connections: [],
        lastImportedAt: null,
      };
    }
    const parsed = JSON.parse(raw) as AppData;
    return {
      profile: migrateProfile(parsed.profile ?? {}),
      connections: parsed.connections ?? [],
      lastImportedAt: parsed.lastImportedAt ?? null,
    };
  } catch {
    return {
      profile: { ...DEFAULT_PROFILE },
      connections: [],
      lastImportedAt: null,
    };
  }
}

export function saveAppDataLocal(mobile: string, data: AppData): void {
  localStorage.setItem(userDataKey(mobile), JSON.stringify(data));
}

export function exportDataBackup(data: AppData, mobile: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `linkedin-outreach-${mobile}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function profileCompleteness(profile: UserProfile): number {
  if (profile.messageMode === "template") {
    const fields = [profile.messageTemplate, profile.name];
    const filled = fields.filter((f) => f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }
  const fields = [
    profile.name,
    profile.outreachPurpose,
    profile.outreachWhy,
    profile.headline || profile.about,
  ];
  const filled = fields.filter((f) => f.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}
