import type { Connection, UserProfile } from "../types";
import { buildPersonalizedMessage, detectPersona } from "./personalize";
import { buildFromTemplate } from "./template";

export type MessageSource = "custom" | "auto" | "template";

export function getGeneratedMessage(
  profile: UserProfile,
  conn: Connection
): { message: string; note: string; source: MessageSource } {
  if (profile.messageMode === "template") {
    const r = buildFromTemplate(profile, conn);
    return { message: r.message, note: r.note, source: "template" };
  }
  const r = buildPersonalizedMessage(profile, conn);
  return { message: r.message, note: r.note, source: "auto" };
}

export function isUsingCustomMessage(conn: Connection): boolean {
  return conn.customMessage.trim().length > 0;
}

export function generateMessage(
  profile: UserProfile,
  conn: Connection
): string {
  if (isUsingCustomMessage(conn)) return conn.customMessage.trim();
  return getGeneratedMessage(profile, conn).message;
}

export function getMessageMeta(profile: UserProfile, conn: Connection) {
  if (isUsingCustomMessage(conn)) {
    const base = getGeneratedMessage(profile, conn);
    return {
      message: conn.customMessage.trim(),
      note: `Custom · would use ${base.source}: ${base.note}`,
      persona: detectPersona(conn.position, conn.company),
    };
  }
  if (profile.messageMode === "template") {
    return buildFromTemplate(profile, conn);
  }
  return buildPersonalizedMessage(profile, conn);
}

export function clearCustomMessages(
  connections: Connection[],
  onlyPending = false
): Connection[] {
  return connections.map((c) => {
    if (onlyPending && c.status !== "pending") return c;
    return { ...c, customMessage: "" };
  });
}
