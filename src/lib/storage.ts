import type { AppData, UserProfile } from "../types";

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
