import type { Connection, UserProfile } from "../types";

export type ConnectionPersona =
  | "hr"
  | "recruiter"
  | "leadership"
  | "technical"
  | "academic"
  | "consulting"
  | "sales"
  | "product"
  | "finance"
  | "operations"
  | "intern"
  | "general";

const PERSONA_LABELS: Record<ConnectionPersona, string> = {
  hr: "HR / people ops",
  recruiter: "Recruiter / talent",
  leadership: "Leadership",
  technical: "Technical",
  academic: "Academic",
  consulting: "Consulting",
  sales: "Sales / BD",
  product: "Product",
  finance: "Finance",
  operations: "Operations",
  intern: "Peer / early career",
  general: "General",
};

function pickVariant(variants: string[], seed: string): string {
  if (variants.length === 0) return "";
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return variants[h % variants.length];
}

export function detectPersona(position: string, company: string): ConnectionPersona {
  const p = `${position} ${company}`.toLowerCase();

  if (/recruiter|talent acquisition|ta manager|staffing|hiring manager|campus hiring/i.test(p))
    return "recruiter";
  if (/hr\b|human resource|people ops|people partner|chief people|employee experience/i.test(p))
    return "hr";
  if (/professor|faculty|academic|dean|lecturer|phd|research scholar/i.test(p))
    return "academic";
  if (/intern\b|trainee|graduate trainee|management trainee|fresher|campus ambassador/i.test(p))
    return "intern";
  if (/founder|co-founder|\bceo\b|\bcto\b|\bcfo\b|\bcoo\b|director|vp |vice president|head of|managing partner/i.test(p))
    return "leadership";
  if (/consultant|consulting|advisory|strategy&|deloitte|accenture|kpmg|pwc|ey\b|mckinsey|bcg|bain/i.test(p))
    return "consulting";
  if (/product manager|product owner|product lead|pm\b|growth product/i.test(p))
    return "product";
  if (/sales|business development|\bbd\b|account executive|account manager|revenue/i.test(p))
    return "sales";
  if (/finance|financial analyst|investment|banking|controller|treasury/i.test(p))
    return "finance";
  if (/operations|supply chain|logistics|program manager|project manager(?!.*product)/i.test(p))
    return "operations";
  if (
    /engineer|developer|analyst|data|software|product designer|architect|devops|ml |machine learning|ai |cloud|sre\b/i.test(
      p
    )
  )
    return "technical";

  return "general";
}

function firstName(conn: Connection): string {
  const n = conn.firstName?.trim();
  if (n) return n;
  const fromFull = conn.fullName?.trim().split(/\s+/)[0];
  return fromFull || "there";
}

function alumniHook(profile: UserProfile, conn: Connection): string | null {
  const edu = `${profile.education} ${profile.about}`.toLowerCase();
  const their = `${conn.company} ${conn.position}`.toLowerCase();
  const schools = [
    "iim",
    "iit",
    "nit",
    "bits",
    "xlri",
    "fms",
    "isb",
    "spjimr",
  ];
  for (const s of schools) {
    if (edu.includes(s) && their.includes(s)) {
      return `I noticed we share a connection to the ${s.toUpperCase()} ecosystem — that made your profile stand out to me.`;
    }
  }
  return null;
}

function toneOpener(profile: UserProfile, conn: Connection): string {
  switch (profile.tone) {
    case "friendly":
      return pickVariant(
        [
          "Hope you're doing well!",
          "Hope your week's going well!",
          "Hope you're having a good week!",
        ],
        conn.id
      );
    case "concise":
      return "";
    default:
      return pickVariant(
        [
          "I hope you're doing well.",
          "I hope this message finds you well.",
        ],
        conn.id
      );
  }
}

function personaHook(conn: Connection, persona: ConnectionPersona): string {
  const { company, position } = conn;
  const at = company ? ` at ${company}` : "";
  const seed = conn.id + persona;

  const hooks: Partial<Record<ConnectionPersona, string[]>> = {
    hr: [
      `I came across your profile and saw your work as ${position}${at}. Given your experience in people and talent, I felt you'd be the right person to reach out to.`,
      `Your role as ${position}${at} caught my attention — I'm exploring opportunities and thought connecting with someone in HR/people would be valuable.`,
      company
        ? `I've been researching teams at ${company}, and your work in ${position || "people operations"} seemed like the right place to start a conversation.`
        : `Given your background in HR and people operations, I wanted to reach out respectfully.`,
    ],
    recruiter: [
      `I saw your role as ${position}${at} and thought you might have visibility into openings or be able to point me in the right direction.`,
      `As someone working in talent${at ? ` at ${company}` : ""}, I hoped you might be open to a brief note from someone actively exploring roles.`,
      `Your recruiting experience${at} stood out — I'm looking for guidance on where my profile might fit.`,
    ],
    leadership: [
      `I've been following paths like yours — ${position}${at} — and would value learning from someone with your experience.`,
      company
        ? `I admire the work happening at ${company} and wanted to reach out to someone senior there for perspective.`
        : `I respect the career you've built and would value any brief guidance you could share.`,
      `Your journey as ${position || "a leader"}${at} is genuinely inspiring for someone early in their career.`,
    ],
    technical: [
      `I noticed your work as ${position}${at} and thought it would be meaningful to connect with someone in a similar professional space.`,
      company
        ? `The technical work at ${company} — especially your path as ${position || "an engineer"} — aligns with what I'm building toward.`
        : `I came across your technical background and wanted to reach out thoughtfully.`,
      `I'm building skills in areas related to your work as ${position}${at}, and your profile seemed like a great connection.`,
    ],
    academic: [
      `I came across your profile — ${position}${at} — and would really value guidance from someone in academia.`,
      `I respect the mentoring and academic work you do and wanted to reach out respectfully.`,
      `Your experience in ${position || "academia"}${at} is exactly the kind of perspective I'm hoping to learn from.`,
    ],
    consulting: [
      `Your experience as ${position}${at} stood out — especially the exposure you likely have across teams and clients.`,
      `I noticed your consulting background${at ? ` at ${company}` : ""} and thought you might have useful perspective on breaking into meaningful work.`,
      company
        ? `I've been interested in firms like ${company}; your role as ${position || "consultant"} seemed like a thoughtful connection.`
        : `Given your consulting path, I'd value any perspective on how to position myself for similar opportunities.`,
    ],
    sales: [
      `Your work in ${position || "sales"}${at} shows strong relationship-building — a skill I'm actively developing.`,
      company
        ? `I noticed your role at ${company} and thought connecting with someone on the business side could be insightful.`
        : `I wanted to reach out to someone with a client-facing background for career advice.`,
    ],
    product: [
      `I'm interested in product thinking, and your path as ${position}${at} really stood out.`,
      company
        ? `The product work at ${company} is something I follow — I'd value connecting with you.`
        : `As someone exploring product-adjacent roles, I thought reaching out would be worthwhile.`,
    ],
    finance: [
      `Your background in ${position || "finance"}${at} aligns with directions I'm exploring.`,
      company
        ? `I've been learning about teams at ${company} and your profile seemed like a meaningful connection.`
        : `I wanted to connect with someone in finance for perspective on breaking in.`,
    ],
    operations: [
      `Your experience in ${position || "operations"}${at} reflects the kind of cross-functional exposure I'm aiming for.`,
      company
        ? `I noticed your work at ${company} and wanted to learn from someone in ops/program roles.`
        : `I thought connecting with someone in operations would help me understand how teams scale.`,
    ],
    intern: [
      `I saw you're also early in your journey as ${position}${at} — I thought it could be great to connect peer-to-peer.`,
      company
        ? `I noticed we're both building our paths — you at ${company} as ${position || "a professional"}.`
        : `As someone at a similar career stage, I wanted to reach out and exchange perspectives.`,
    ],
    general: [
      position && company
        ? `I came across your profile and saw you're working as ${position}${at}.`
        : company
          ? `I noticed you're at ${company} and wanted to connect.`
          : position
            ? `I saw your role as ${position} and wanted to reach out.`
            : `I came across your profile on LinkedIn and wanted to connect.`,
      company
        ? `I've been following ${company} and your work as ${position || "a professional"} resonated with me.`
        : `Your professional background stood out when I was researching people to connect with.`,
    ],
  };

  const list = hooks[persona] ?? hooks.general ?? [];
  return pickVariant(list, seed);
}

function personalizeWhy(
  profile: UserProfile,
  conn: Connection,
  persona: ConnectionPersona
): string {
  const base = profile.outreachWhy.trim();
  const company = conn.company?.trim() || "your organization";
  const position = conn.position?.trim() || "your field";
  const fn = firstName(conn);

  if (!base) {
    return personaWhyFallback(persona, company, position);
  }

  let text = base
    .replace(/\{company\}/gi, company)
    .replace(/\{position\}/gi, position)
    .replace(/\{firstName\}/gi, fn)
    .replace(/\{fullName\}/gi, conn.fullName?.trim() || fn);

  const companyMentioned =
    text.toLowerCase().includes(company.toLowerCase()) ||
    base.toLowerCase().includes("company");

  if (!companyMentioned && conn.company) {
    const suffix = pickVariant(
      [
        persona === "hr" || persona === "recruiter"
          ? ` I'm especially interested in opportunities or culture at ${company}.`
          : persona === "leadership"
            ? ` I'd especially appreciate perspective from someone at ${company}.`
            : ` Your work at ${company} particularly resonated with me.`,
      ],
      conn.id + "why"
    );
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
    case "technical":
      return `I'm strengthening my technical portfolio and would value perspective from someone working as ${position} at ${company}.`;
    case "consulting":
      return `I'm interested in how consultants at ${company} approach problems — and whether you'd have advice for someone targeting this space.`;
    case "intern":
      return `I'm building my early career path and thought connecting with someone at ${company} could help me learn faster.`;
    default:
      return `I'm reaching out because your experience in ${position} at ${company} aligns with the direction I'm pursuing, and I'd value your perspective.`;
  }
}

function purposeBlock(profile: UserProfile): string {
  const purpose = profile.outreachPurpose.trim();
  if (!purpose) return "";
  return pickVariant(
    [
      `I'm currently looking for ${purpose}.`,
      `Right now I'm focused on ${purpose}.`,
      `My goal is to find ${purpose}.`,
    ],
    purpose
  );
}

function aboutYouBlock(profile: UserProfile, concise: boolean): string {
  const parts: string[] = [];
  const name = profile.name.trim();

  if (name) {
    let intro = `I'm ${name}`;
    if (profile.headline.trim()) intro += `, ${profile.headline.trim()}`;
    parts.push(intro + ".");
  }

  if (!concise && profile.education.trim()) {
    parts.push(`I'm ${profile.education.trim()}.`);
  }

  if (!concise && profile.skills.trim()) {
    parts.push(`My strengths include ${profile.skills.trim()}.`);
  }

  if (!concise && profile.about.trim()) {
    parts.push(profile.about.trim());
  } else if (concise && profile.about.trim()) {
    const short = profile.about.trim().split(/[.!?]/)[0];
    if (short) parts.push(short.trim() + ".");
  }

  return parts.join(" ");
}

function ctaBlock(profile: UserProfile, persona: ConnectionPersona): string {
  const custom = profile.callToAction.trim();
  if (custom) return custom;

  const defaults: Partial<Record<ConnectionPersona, string>> = {
    hr: "If there are openings, referrals, or someone else I should speak with, I'd really appreciate any pointer.",
    recruiter: "I'd be grateful for any roles you think fit my profile, or a quick redirect to the right contact.",
    leadership: "If you'd be open to a brief chat or async advice, it would mean a lot.",
    academic: "I'd truly value any guidance you could share, even a short reply would help.",
    technical: "Happy to share my work or resume if helpful — would love any feedback or direction.",
  };

  return (
    defaults[persona] ??
    "I'd be grateful for any guidance, referral, or short conversation if your schedule allows."
  );
}

function signOff(profile: UserProfile): string {
  const name = profile.name.trim();
  if (profile.tone === "concise") {
    return name ? `Thanks,\n${name}` : "Thanks";
  }
  return name ? `Thank you for your time.\n\nBest regards,\n${name}` : "Thank you for your time.";
}

export function getPersonalizationNote(
  conn: Connection,
  persona: ConnectionPersona
): string {
  const bits: string[] = [];

  if (conn.company && conn.position) {
    bits.push(`${conn.position} @ ${conn.company}`);
  } else if (conn.position) {
    bits.push(conn.position);
  } else if (conn.company) {
    bits.push(conn.company);
  }

  bits.push(PERSONA_LABELS[persona]);
  return bits.join(" · ");
}

export function buildPersonalizedMessage(
  profile: UserProfile,
  conn: Connection
): { message: string; note: string; persona: ConnectionPersona } {
  const persona = detectPersona(conn.position, conn.company);
  const concise = profile.tone === "concise";
  const greeting = `Hi ${firstName(conn)},`;
  const opener = toneOpener(profile, conn);
  const alumni = alumniHook(profile, conn);
  const hook = alumni ?? personaHook(conn, persona);
  const about = aboutYouBlock(profile, concise);
  const why = personalizeWhy(profile, conn, persona);
  const purpose = purposeBlock(profile);
  const cta = ctaBlock(profile, persona);

  const paragraphs: string[] = [greeting];
  if (opener) paragraphs.push(opener);
  paragraphs.push(hook);
  if (about) paragraphs.push(about);
  if (why) paragraphs.push(why);
  if (purpose) paragraphs.push(purpose);
  paragraphs.push(cta);
  paragraphs.push(signOff(profile));

  let message = paragraphs.join("\n\n");
  if (concise) {
    message = message.replace(/\n{3,}/g, "\n\n");
  }

  const noteParts = [getPersonalizationNote(conn, persona)];
  if (alumni) noteParts.push("shared school signal");
  if (concise) noteParts.push("concise tone");

  return {
    message,
    note: noteParts.join(" · "),
    persona,
  };
}
