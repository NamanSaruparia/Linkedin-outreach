import type { Connection, UserProfile } from "../types";

export type ConnectionPersona =
  | "hr"
  | "recruiter"
  | "leadership"
  | "technical"
  | "academic"
  | "consulting"
  | "general";

export function detectPersona(position: string, company: string): ConnectionPersona {
  const p = `${position} ${company}`.toLowerCase();

  if (/recruiter|talent acquisition|ta\b|staffing|hiring/i.test(p)) return "recruiter";
  if (/hr\b|human resource|people ops|people partner|chief people/i.test(p))
    return "hr";
  if (/professor|faculty|academic|dean|lecturer|iim|institute/i.test(p))
    return "academic";
  if (/founder|co-founder|ceo|cto|director|vp |vice president|head of|partner/i.test(p))
    return "leadership";
  if (/consultant|consulting|advisory|strategy/i.test(p)) return "consulting";
  if (
    /engineer|developer|analyst|data|software|product|designer|architect|scientist/i.test(
      p
    )
  )
    return "technical";

  return "general";
}

export function getPersonalizationNote(
  conn: Connection,
  persona: ConnectionPersona
): string {
  const bits: string[] = [];

  if (conn.company && conn.position) {
    bits.push(`Referenced their role at ${conn.company}`);
  } else if (conn.position) {
    bits.push(`Referenced their position`);
  } else if (conn.company) {
    bits.push(`Referenced ${conn.company}`);
  }

  const personaNotes: Record<ConnectionPersona, string> = {
    hr: "HR-focused angle — opportunities & hiring",
    recruiter: "Recruiter angle — openings & referrals",
    leadership: "Leadership angle — learning & network",
    technical: "Technical peer angle — projects & collaboration",
    academic: "Academic angle — guidance & learning",
    consulting: "Consulting angle — exposure & referrals",
    general: "General professional outreach",
  };

  bits.push(personaNotes[persona]);
  return bits.join(" · ");
}

function firstName(conn: Connection): string {
  return conn.firstName || conn.fullName.split(" ")[0] || "there";
}

function toneOpener(profile: UserProfile): string {
  switch (profile.tone) {
    case "friendly":
      return "Hope you're doing well!";
    case "concise":
      return "";
    default:
      return "I hope you're doing well.";
  }
}

function personaHook(conn: Connection, persona: ConnectionPersona): string {
  const { company, position } = conn;
  const at = company ? ` at ${company}` : "";

  switch (persona) {
    case "hr":
      if (position && company)
        return `I came across your profile and saw your work as ${position}${at}. Given your experience in people and talent, I felt you'd be a great person to reach out to.`;
      if (company)
        return `I noticed you're part of the team at ${company} and thought you might be the right person to connect with regarding opportunities.`;
      return `I came across your profile and, given your background in HR and people operations, I wanted to reach out.`;

    case "recruiter":
      if (position && company)
        return `I saw your role as ${position}${at} and thought you might have visibility into opportunities or be able to point me in the right direction.`;
      return `Given your work in talent and hiring, I wanted to connect with a brief, respectful note.`;

    case "leadership":
      if (position && company)
        return `I've been following paths like yours — ${position}${at} — and would value learning from someone with your experience.`;
      if (company)
        return `I admire the work happening at ${company} and wanted to reach out to someone senior there for guidance.`;
      return `I came across your profile and respect the career path you've built — I'd value any perspective you could share.`;

    case "technical":
      if (position && company)
        return `I noticed your work as ${position}${at} and thought it would be meaningful to connect with someone in a similar professional space.`;
      return `I came across your technical background on LinkedIn and wanted to reach out thoughtfully.`;

    case "academic":
      if (position && company)
        return `I came across your profile — ${position}${at} — and would really value guidance from someone in academia.`;
      return `I respect the academic and mentoring work you do and wanted to reach out respectfully.`;

    case "consulting":
      if (position && company)
        return `Your experience as ${position}${at} stood out to me, especially the exposure you likely have across teams and clients.`;
      return `I noticed your consulting background and thought you might have useful perspective on breaking into meaningful work.`;

    default:
      if (position && company)
        return `I came across your profile and saw you're working as ${position}${at}.`;
      if (company) return `I noticed you're at ${company} and wanted to connect.`;
      if (position) return `I saw your role as ${position} and wanted to reach out.`;
      return `I came across your profile on LinkedIn and wanted to connect.`;
  }
}

function personalizeWhy(profile: UserProfile, conn: Connection, persona: ConnectionPersona): string {
  const base = profile.outreachWhy.trim();
  const company = conn.company || "your organization";
  const position = conn.position || "your field";

  if (!base) {
    return personaWhyFallback(persona, company, position);
  }

  let text = base
    .replace(/\{company\}/gi, company)
    .replace(/\{position\}/gi, position)
    .replace(/\{firstName\}/gi, firstName(conn));

  if (!text.includes(company) && conn.company && !base.toLowerCase().includes("company")) {
    const suffix =
      persona === "hr" || persona === "recruiter"
        ? ` I'm especially interested in learning about opportunities or culture at ${company}.`
        : persona === "leadership"
          ? ` I'd especially appreciate any perspective from someone at ${company}.`
          : ` Your work at ${company} particularly resonated with me.`;
    text += suffix;
  }

  return text;
}

function personaWhyFallback(
  persona: ConnectionPersona,
  company: string,
  position: string
): string {
  switch (persona) {
    case "hr":
    case "recruiter":
      return `I'm actively exploring opportunities and believe someone in your position at ${company} could help me understand what's possible — whether openings, referrals, or the right person to speak with.`;
    case "leadership":
      return `I'm at a stage where guidance from experienced professionals — especially in roles like ${position} — would help me make better career decisions.`;
    case "academic":
      return `I'm looking for mentorship and direction from people who've built depth in ${position} and academia.`;
    default:
      return `I'm reaching out because your experience in ${position} at ${company} aligns with the direction I'm pursuing, and I'd value your perspective.`;
  }
}

function purposeBlock(profile: UserProfile): string {
  const purpose = profile.outreachPurpose.trim();
  if (!purpose) return "";
  return `I'm currently looking for ${purpose}.`;
}

function aboutYouBlock(profile: UserProfile): string {
  const parts: string[] = [];
  const name = profile.name.trim();

  if (name) {
    let intro = `I'm ${name}`;
    if (profile.headline.trim()) intro += `, ${profile.headline.trim()}`;
    parts.push(intro + ".");
  }

  if (profile.education.trim()) {
    parts.push(`I'm ${profile.education.trim()}.`);
  }

  if (profile.skills.trim()) {
    parts.push(`My strengths include ${profile.skills.trim()}.`);
  }

  if (profile.about.trim()) {
    parts.push(profile.about.trim());
  }

  return parts.join(" ");
}

function ctaBlock(profile: UserProfile): string {
  return (
    profile.callToAction.trim() ||
    "I'd be grateful for any guidance, referral, or short conversation if your schedule allows."
  );
}

export function buildPersonalizedMessage(
  profile: UserProfile,
  conn: Connection
): { message: string; note: string; persona: ConnectionPersona } {
  const persona = detectPersona(conn.position, conn.company);
  const greeting = `Hi ${firstName(conn)},`;
  const opener = toneOpener(profile);
  const hook = personaHook(conn, persona);
  const about = aboutYouBlock(profile);
  const why = personalizeWhy(profile, conn, persona);
  const purpose = purposeBlock(profile);
  const cta = ctaBlock(profile);
  const signOff = profile.name.trim() || "—";

  const paragraphs: string[] = [greeting];

  if (opener) paragraphs.push(opener);
  paragraphs.push(hook);

  if (about) paragraphs.push(about);
  if (why) paragraphs.push(why);
  if (purpose) paragraphs.push(purpose);
  paragraphs.push(cta);
  paragraphs.push(`Thank you for your time.\n\nBest regards,\n${signOff}`);

  const message = paragraphs.join("\n\n");
  const note = getPersonalizationNote(conn, persona);

  return { message, note, persona };
}
