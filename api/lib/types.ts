export interface UserProfile {
  name: string;
  headline: string;
  education: string;
  skills: string;
  about: string;
  outreachPurpose: string;
  outreachWhy: string;
  callToAction: string;
  tone: "professional" | "friendly" | "concise";
  messageMode: "auto" | "template";
  messageTemplate: string;
  templateAutoTweak: boolean;
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
  status: string;
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
    "I'm building my career and would value guidance from people whose work and journey I respect.",
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

export interface UserDocument {
  mobile: string;
  profile: UserProfile;
  connections: Connection[];
  lastImportedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}
