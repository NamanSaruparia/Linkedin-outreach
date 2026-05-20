import type { Connection, UserProfile } from "../types";
import { buildPersonalizedMessage } from "./personalize";
import { buildFromTemplate } from "./template";

export function generateMessage(
  profile: UserProfile,
  conn: Connection
): string {
  if (conn.customMessage.trim()) return conn.customMessage;
  if (profile.messageMode === "template") {
    return buildFromTemplate(profile, conn).message;
  }
  return buildPersonalizedMessage(profile, conn).message;
}

export function getMessageMeta(profile: UserProfile, conn: Connection) {
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
