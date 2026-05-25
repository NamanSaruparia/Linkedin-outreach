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
        return `Given your role as ${position}${at}, I thought you might be the right person to reach out to regarding opportunities.`;
      if (company)
        return `I noticed you're at ${company} and wanted to connect about potential openings or referrals.`;
      return `Given your work in talent and hiring, I wanted to reach out with a brief, respectful note.`;
    case "leadership":
      if (position && company)
        return `I respect the work you've done as ${position}${at} and would value any perspective you could share.`;
      return `I admire your career path and wanted to reach out respectfully.`;
    case "academic":
      if (position && company)
        return `I came across your profile — ${position}${at} — and would value guidance from someone in academia.`;
      return `I respect your academic work and wanted to reach out thoughtfully.`;
    case "technical":
      if (position && company)
        return `I noticed your work as ${position}${at} and wanted to connect with someone in a similar space.`;
      return `Your technical background stood out to me on LinkedIn.`;
    case "consulting":
      if (position && company)
        return `Your experience as ${position}${at} caught my attention — especially the client exposure that comes with consulting.`;
      return `I noticed your consulting background and wanted to reach out.`;
    case "sales":
    case "product":
    case "finance":
    case "operations":
      if (position && company)
        return `I saw your work as ${position}${at} and thought connecting would be worthwhile.`;
      break;
    case "intern":
      if (position && company)
        return `I saw you're building your path as ${position}${at} — I thought a peer connection could be valuable.`;
      break;
    default:
      if (position && company)
        return `I came across your profile — ${position}${at} — and wanted to reach out.`;
      if (company) return `I noticed you're at ${company} and wanted to connect.`;
      if (position) return `I saw your work as ${position} and wanted to reach out.`;
  }
  return `I came across your profile on LinkedIn and wanted to connect.`;
}

export const TEMPLATE_PLACEHOLDERS = [
  { key: "{firstName}", desc: "Their first name" },
  { key: "{lastName}", desc: "Their last name" },
  { key: "{fullName}", desc: "Full name" },
  { key: "{company}", desc: "Company" },
  { key: "{position}", desc: "Job title" },
  { key: "{roleAtCompany}", desc: "e.g. “Senior HR at Amazon”" },
  { key: "{hook}", desc: "Smart opener for their role" },
  { key: "{purpose}", desc: "What you're looking for" },
  { key: "{why}", desc: "Why you're reaching out (short)" },
  { key: "{cta}", desc: "Your call to action" },
  { key: "{yourName}", desc: "Your name" },
  { key: "{education}", desc: "Your education line" },
  { key: "{skills}", desc: "Your skills line" },
  { key: "{connectedOn}", desc: "LinkedIn connected date" },
] as const;

function trimWhy(text: string, maxLen = 280): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const last = cut.lastIndexOf(" ");
  return (last > 120 ? cut.slice(0, last) : cut).trim() + "…";
}

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

  const purpose = profile.outreachPurpose.trim();
  const why = trimWhy(
    profile.outreachWhy.trim() ||
      `I'm reaching out because your experience${company ? ` at ${company}` : ""} aligns with what I'm exploring.`
  );
  const cta =
    profile.callToAction.trim() ||
    "I'd be grateful for any guidance or a brief conversation if you're open to it.";

  return {
    "{firstName}": firstName(conn),
    "{lastName}": conn.lastName.trim(),
    "{fullName}": conn.fullName.trim() || firstName(conn),
    "{name}": firstName(conn),
    "{company}": company,
    "{position}": position,
    "{roleAtCompany}": roleAtCompany,
    "{hook}": hook,
    "{purpose}": purpose,
    "{why}": why,
    "{cta}": cta,
    "{yourName}": profile.name.trim() || "—",
    "{education}": profile.education.trim(),
    "{skills}": profile.skills.trim(),
    "{connectedOn}": conn.connectedOn.trim(),
    "{greeting}": `Hi ${firstName(conn)},`,
  };
}

function applyReplacements(text: string, map: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(map)) {
    const bare = key.replace(/[{}]/g, "");
    const re = new RegExp(`\\{${bare}\\}`, "gi");
    result = result.replace(re, value);
  }
  return result;
}

function cleanupMessage(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^\{[a-zA-Z]+\}$/.test(t)) return false;
      if (t === "—" || t === "-") return false;
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
  if (/\{hook\}/i.test(message)) return message;
  const hookStart = hook.toLowerCase().slice(0, 24);
  if (hookStart && message.toLowerCase().includes(hookStart)) return message;

  const lines = message.split("\n");
  const greetIdx = lines.findIndex((l) => /^hi\s/i.test(l.trim()));
  if (greetIdx >= 0) {
    let insertAt = greetIdx + 1;
    while (insertAt < lines.length && !lines[insertAt]?.trim()) insertAt++;
    if (insertAt < lines.length) {
      lines.splice(insertAt, 0, "", hook);
      return lines.join("\n");
    }
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
      message: `Hi ${firstName(conn)},\n\n[Add your message template in Message setup — use placeholders like {firstName} and {hook}]`,
      note: "Template empty",
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
  if (template.match(/\{hook\}/i) && replacements["{hook}"]) {
    noteParts.push("role hook");
  } else if (profile.templateAutoTweak && replacements["{hook}"]) {
    noteParts.push("auto role line");
  }
  noteParts.push(getPersonalizationNote(conn, persona));

  return {
    message,
    note: noteParts.join(" · "),
    persona,
  };
}
