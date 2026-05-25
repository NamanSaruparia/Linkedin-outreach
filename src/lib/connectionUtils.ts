import type { Connection } from "../types";

export const FOLLOW_UP_MIN_DAYS = 5;

export function nowIso(): string {
  return new Date().toISOString();
}

/** Ensure legacy rows have updatedAt for sorting */
export function migrateConnection(c: Connection): Connection {
  const updatedAt =
    c.updatedAt ?? c.repliedAt ?? c.contactedAt ?? null;
  return updatedAt === c.updatedAt ? c : { ...c, updatedAt };
}

export function migrateConnections(list: Connection[]): Connection[] {
  return list.map(migrateConnection);
}

export function getLastActionAt(c: Connection): string | null {
  return c.updatedAt ?? c.repliedAt ?? c.contactedAt ?? null;
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/** Contacted 5+ days ago, still waiting (no reply marked) */
export function needsFollowUp(c: Connection, minDays = FOLLOW_UP_MIN_DAYS): boolean {
  if (c.status !== "contacted" || !c.contactedAt) return false;
  const days = daysSince(c.contactedAt);
  return days != null && days >= minDays;
}

export function formatRelativeDays(iso: string | null): string {
  const days = daysSince(iso);
  if (days == null) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export type SortKey = "last_action" | "name" | "company" | "status";

export function sortConnections(
  list: Connection[],
  key: SortKey,
  direction: "asc" | "desc" = "desc"
): Connection[] {
  const dir = direction === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.fullName.localeCompare(b.fullName);
        break;
      case "company":
        cmp = (a.company || "").localeCompare(b.company || "");
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "last_action":
      default: {
        const ta = getLastActionAt(a) ?? "";
        const tb = getLastActionAt(b) ?? "";
        cmp = ta.localeCompare(tb);
        if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName);
        break;
      }
    }
    return cmp * dir;
  });
}

export function touchUpdates(
  updates: Partial<Connection>
): Partial<Connection> {
  return { ...updates, updatedAt: nowIso() };
}
