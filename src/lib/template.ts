import type { Connection, UserProfile } from "../types";
import {
  type ConnectionPersona,
  detectPersona,
  getPersonalizationNote,
} from "./personalize";

function firstName(conn: Connection): string {
  return conn.firstName || conn.fullName.split(" ")[0] || "there";
}

function shortHook(conn: Connection, persona: ConnectionPersona): string {
  const { company, position } = conn;
  const at = company ? ` at ${company}` : "";

  switch (persona) {
    case "hr":
    case "recruiter":
      if (position && company)
        return `Given your role as ${position}${at}, I thought you might be the right person to reach out to.`;
      if (company)
        return `I noticed you're at ${company} and wanted to connect.`;
      break;
    case "leadership":
      if (position && company)
        return `I respect the work you've done as ${position}${at}.`;
      break;
    default:
      if (position && company)
        return `I came across your profile — ${position}${at} — and wanted to reach out.`;
      if (company) return `I noticed you're at ${company}.`;
      if (position) return `I saw your work as ${position}.`;
  }
  return "";
}

export const TEMPLATE_PLACEHOLDERS = [
  { key: "{firstName}", desc: "Their first name" },
  { key: "{lastName}", desc: "Their last name" },
  { key: "{fullName}", desc: "Full name" },
  { key: "{company}", desc: "Company (if available)" },
  { key: "{position}", desc: "Job title (if available)" },
  { key: "{roleAtCompany}", desc: "e.g. “Senior HR at Amazon”" },
  { key: "{hook}", desc: "One-line opener about their role" },
  { key: "{yourName}", desc: "Your name from profile" },
] as const;

function buildReplacements(
  profile: UserProfile,
  conn: Connection,
  persona: ConnectionPersona
): Record<string, string> {
  const company = conn.company.trim();
  const position = conn.position.trim();
  const hook = shortHook(conn, persona);

  let roleAtCompany = "";
  if (position && company) roleAtCompany = `${position} at ${company}`;
  else if (position) roleAtCompany = position;
  else if (company) roleAtCompany = company;

  return {
    "{firstName}": firstName(conn),
    "{lastName}": conn.lastName.trim(),
    "{fullName}": conn.fullName.trim() || firstName(conn),
    "{name}": firstName(conn),
    "{company}": company,
    "{position}": position,
    "{roleAtCompany}": roleAtCompany,
    "{hook}": hook,
    "{yourName}": profile.name.trim() || "—",
  };
}

function applyReplacements(text: string, map: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(map)) {
    result = result.split(key).join(value);
  }
  return result;
}

/** Remove lines that are only a leftover placeholder or empty hook line */
function cleanupMessage(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^\{[a-zA-Z]+\}$/.test(t)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function maybeInsertAutoHook(
  message: string,
  hook: string,
  autoTweak: boolean
): string {
  if (!autoTweak || !hook.trim()) return message;
  if (message.includes("{hook}")) return message;
  if (message.toLowerCase().includes(hook.toLowerCase().slice(0, 20)))
    return message;

  const lines = message.split("\n");
  const greetIdx = lines.findIndex((l) =>
    /^hi\s/i.test(l.trim())
  );
  if (greetIdx >= 0) {
    const insertAt = greetIdx + 1;
    const next = lines[insertAt]?.trim() ?? "";
    if (!next) return message;
    lines.splice(insertAt, 0, "", hook);
    return lines.join("\n");
  }

  return `${message}\n\n${hook}`;
}

export function buildFromTemplate(
  profile: UserProfile,
  conn: Connection
): { message: string; note: string; persona: ConnectionPersona } {
  const persona = detectPersona(conn.position, conn.company);
  const template = profile.messageTemplate.trim();

  if (!template) {
    return {
      message: `Hi ${firstName(conn)},\n\n[Write your message template in Message setup]`,
      note: "Template empty — add your message",
      persona,
    };
  }

  const replacements = buildReplacements(profile, conn, persona);
  let message = applyReplacements(template, replacements);
  message = maybeInsertAutoHook(
    message,
    replacements["{hook}"],
    profile.templateAutoTweak
  );
  message = cleanupMessage(message);

  const noteParts = ["Your template"];
  if (replacements["{hook}"] && template.includes("{hook}")) {
    noteParts.push("with role hook");
  } else if (profile.templateAutoTweak && replacements["{hook}"]) {
    noteParts.push("+ auto role line");
  }
  noteParts.push(`· ${getPersonalizationNote(conn, persona).split(" · ").pop()}`);

  return {
    message,
    note: noteParts.join(" "),
    persona,
  };
}
