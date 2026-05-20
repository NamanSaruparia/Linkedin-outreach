export type OutreachStatus =
  | "pending"
  | "contacted"
  | "replied"
  | "no_response"
  | "not_interested";

export type MessageMode = "auto" | "template";

export interface UserProfile {
  name: string;
  headline: string;
  education: string;
  skills: string;
  about: string;
  /** What you want — internships, live projects, referrals, etc. */
  outreachPurpose: string;
  /** Why you're reaching out — your general intent */
  outreachWhy: string;
  /** How you want to close the message */
  callToAction: string;
  tone: "professional" | "friendly" | "concise";
  /** Auto-build messages vs use your own template */
  messageMode: MessageMode;
  /** Your message — use {firstName}, {company}, {hook}, etc. */
  messageTemplate: string;
  /** Insert a short role-based line after greeting when template has no {hook} */
  templateAutoTweak: boolean;
  /** @deprecated migrated to outreachPurpose */
  lookingFor?: string;
}

export interface Connection {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  url: string;
  email: string;
  company: string;
  position: string;
  connectedOn: string;
  status: OutreachStatus;
  contactedAt: string | null;
  repliedAt: string | null;
  notes: string;
  customMessage: string;
  raw: Record<string, string>;
}

export interface AppData {
  profile: UserProfile;
  connections: Connection[];
  lastImportedAt: string | null;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  headline: "",
  education: "",
  skills: "",
  about: "",
  outreachPurpose:
    "live projects, internships, and hands-on opportunities where I can contribute and learn",
  outreachWhy:
    "I'm building my career and would value guidance from people whose work and journey I respect — especially those in roles or companies where I hope to grow.",
  callToAction:
    "If you have anything coming up, know of openings, or would be open to a brief chat, I'd truly appreciate it.",
  tone: "professional",
  messageMode: "auto",
  messageTemplate: `Hi {firstName},

{hook}

I'm {yourName}, and I'm currently exploring opportunities to learn and contribute through live projects and internships.

I'd love to hear if you have anything coming up or could point me in the right direction.

Thank you for your time!

Best regards,
{yourName}`,
  templateAutoTweak: true,
};

export const STATUS_LABELS: Record<OutreachStatus, string> = {
  pending: "Not contacted",
  contacted: "Contacted",
  replied: "Replied",
  no_response: "No response",
  not_interested: "Not interested",
};

export const STATUS_COLORS: Record<OutreachStatus, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  contacted: "bg-amber-50 text-amber-700",
  replied: "bg-emerald-50 text-emerald-700",
  no_response: "bg-rose-50 text-rose-700",
  not_interested: "bg-zinc-100 text-zinc-500",
};
