import { Eye, PenLine, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useMemo } from "react";
import type { Connection, MessageMode, UserProfile } from "../types";
import { getMessageMeta } from "../lib/messages";
import { TEMPLATE_PLACEHOLDERS } from "../lib/template";
import { profileCompleteness } from "../lib/storage";
import { Card, Field, PageHeader, SectionTitle, inputClass, textareaClass } from "./ui";

const SAMPLE_HR: Connection = {
  id: "preview-hr",
  firstName: "Priya",
  lastName: "Sharma",
  fullName: "Priya Sharma",
  url: "https://www.linkedin.com/in/example",
  email: "",
  company: "Amazon",
  position: "Senior HR Business Partner",
  connectedOn: "19 May 2026",
  status: "pending",
  contactedAt: null,
  repliedAt: null,
  updatedAt: null,
  notes: "",
  customMessage: "",
  raw: {},
};

const SAMPLE_TECH: Connection = {
  id: "preview-tech",
  firstName: "Arjun",
  lastName: "Mehta",
  fullName: "Arjun Mehta",
  url: "https://www.linkedin.com/in/example2",
  email: "",
  company: "Google",
  position: "Senior Software Engineer",
  connectedOn: "12 May 2026",
  status: "pending",
  contactedAt: null,
  repliedAt: null,
  updatedAt: null,
  notes: "",
  customMessage: "",
  raw: {},
};

const STARTER_TEMPLATE = `Hi {firstName},

{hook}

I'm {yourName}. {education}

{why}

I'm looking for {purpose}

{cta}

Best regards,
{yourName}`;

interface MessageSetupProps {
  profile: UserProfile;
  onChange: (updates: Partial<UserProfile>) => void;
  onRegenerateAll?: () => void;
  pendingCount?: number;
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wand2;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-left p-4 rounded-xl border-2 transition-all ${
        active
          ? "border-[#0a66c2] bg-[#0a66c2]/5 shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <Icon
        className={`w-5 h-5 mb-2 ${active ? "text-[#0a66c2]" : "text-zinc-400"}`}
      />
      <p className={`text-sm font-semibold ${active ? "text-[#0a66c2]" : "text-zinc-800"}`}>
        {title}
      </p>
      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
    </button>
  );
}

export function MessageSetup({
  profile,
  onChange,
  onRegenerateAll,
  pendingCount = 0,
}: MessageSetupProps) {
  const completeness = profileCompleteness(profile);
  const isTemplate = profile.messageMode === "template";

  const previewHr = useMemo(
    () => getMessageMeta(profile, SAMPLE_HR),
    [profile]
  );
  const previewTech = useMemo(
    () => getMessageMeta(profile, SAMPLE_TECH),
    [profile]
  );

  const setMode = (messageMode: MessageMode) => onChange({ messageMode });

  const insertPlaceholder = (key: string) => {
    onChange({ messageTemplate: profile.messageTemplate + key });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Message setup"
        description={
          isTemplate
            ? "Write one message — the tool fills in names and light tweaks per person."
            : "The tool builds each message from your goals and each person's role."
        }
        action={
          completeness < 100 ? (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-24 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0a66c2] rounded-full transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-zinc-500">{completeness}% ready</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Ready
            </span>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <ModeButton
          active={!isTemplate}
          onClick={() => setMode("auto")}
          icon={Wand2}
          title="Auto-generate"
          description="Full messages built from your goals, their role & company"
        />
        <ModeButton
          active={isTemplate}
          onClick={() => setMode("template")}
          icon={PenLine}
          title="My message"
          description="You write it once — names & small tweaks applied per person"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {isTemplate ? (
            <>
              <Card className="border-[#0a66c2]/20">
                <SectionTitle
                  title="Your message"
                  hint="Write exactly what you want to send. Use placeholders below — they change per connection."
                />
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => onChange({ messageTemplate: STARTER_TEMPLATE })}
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:border-[#0a66c2]/40 text-zinc-700"
                  >
                    Use recommended starter
                  </button>
                </div>
                <Field label="Message template">
                  <textarea
                    className={`${textareaClass} min-h-[220px] font-mono text-[13px]`}
                    rows={12}
                    value={profile.messageTemplate}
                    onChange={(e) =>
                      onChange({ messageTemplate: e.target.value })
                    }
                    placeholder={`Hi {firstName},\n\n{hook}\n\n{why}\n\n{purpose}\n\n{cta}\n\nBest,\n{yourName}`}
                  />
                </Field>

                <div className="mt-4">
                  <p className="text-xs font-medium text-zinc-500 mb-2">
                    Insert placeholder
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_PLACEHOLDERS.map(({ key, desc }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => insertPlaceholder(key)}
                        title={desc}
                        className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-[#0a66c2]/10 hover:text-[#0a66c2] transition-colors font-mono"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.templateAutoTweak}
                    onChange={(e) =>
                      onChange({ templateAutoTweak: e.target.checked })
                    }
                    className="mt-1 rounded border-zinc-300 text-[#0a66c2] focus:ring-[#0a66c2]"
                  />
                  <span className="text-sm text-zinc-600">
                    <span className="font-medium text-zinc-800">
                      Add a short role line
                    </span>{" "}
                    after your greeting when you don't use {"{hook}"} — e.g.
                    mentions their position at their company
                  </span>
                </label>
              </Card>

              <Card>
                <SectionTitle title="Sign-off" hint="Used for {yourName}" />
                <Field label="Your name">
                  <input
                    className={inputClass}
                    value={profile.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                  />
                </Field>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <SectionTitle
                  title="About you"
                  hint="Woven into every auto-generated message"
                />
                <div className="space-y-4">
                  <Field label="Your name">
                    <input
                      className={inputClass}
                      value={profile.name}
                      onChange={(e) => onChange({ name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                    />
                  </Field>
                  <Field label="Headline / current role">
                    <input
                      className={inputClass}
                      value={profile.headline}
                      onChange={(e) => onChange({ headline: e.target.value })}
                      placeholder="e.g. B.Tech student | Aspiring developer"
                    />
                  </Field>
                  <Field label="Education">
                    <input
                      className={inputClass}
                      value={profile.education}
                      onChange={(e) => onChange({ education: e.target.value })}
                      placeholder="e.g. pursuing B.Tech (3rd year)"
                    />
                  </Field>
                  <Field label="Key skills">
                    <input
                      className={inputClass}
                      value={profile.skills}
                      onChange={(e) => onChange({ skills: e.target.value })}
                      placeholder="e.g. Python, React, SQL"
                    />
                  </Field>
                  <Field label="Short intro (optional)">
                    <textarea
                      className={textareaClass}
                      rows={3}
                      value={profile.about}
                      onChange={(e) => onChange({ about: e.target.value })}
                      placeholder="2–3 sentences about your background."
                    />
                  </Field>
                </div>
              </Card>

              <Card className="border-[#0a66c2]/20 bg-gradient-to-b from-[#0a66c2]/[0.03] to-white">
                <SectionTitle title="What you want" />
                <Field label="What are you looking for?">
                  <textarea
                    className={textareaClass}
                    rows={3}
                    value={profile.outreachPurpose}
                    onChange={(e) =>
                      onChange({ outreachPurpose: e.target.value })
                    }
                    placeholder="e.g. live projects, internships, mentorship…"
                  />
                </Field>
              </Card>

              <Card className="border-violet-200/60 bg-gradient-to-b from-violet-50/50 to-white">
                <SectionTitle title="Why you're reaching out" />
                <Field
                  label="Why connect?"
                  hint="Use {company} or {position} — replaced per person"
                >
                  <textarea
                    className={textareaClass}
                    rows={4}
                    value={profile.outreachWhy}
                    onChange={(e) => onChange({ outreachWhy: e.target.value })}
                    placeholder="Your reason for reaching out…"
                  />
                </Field>
                <Field label="Call to action">
                  <textarea
                    className={textareaClass}
                    rows={2}
                    value={profile.callToAction}
                    onChange={(e) => onChange({ callToAction: e.target.value })}
                    placeholder="How you want to close the message"
                  />
                </Field>
              </Card>

              <Card>
                <SectionTitle title="Style" />
                <Field label="Tone">
                  <select
                    value={profile.tone}
                    onChange={(e) =>
                      onChange({ tone: e.target.value as UserProfile["tone"] })
                    }
                    className={inputClass}
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="concise">Concise & direct</option>
                  </select>
                </Field>
              </Card>
            </>
          )}

          {onRegenerateAll && pendingCount > 0 && (
            <button
              onClick={onRegenerateAll}
              className="flex items-center gap-2 text-sm font-medium text-[#0a66c2] hover:text-[#004182] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset {pendingCount} pending to latest template
            </button>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <Card className="!p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/80">
                <Eye className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700">
                  Preview · {isTemplate ? "My message" : "Auto"}
                </span>
              </div>
              <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
                {[
                  { label: "HR example", conn: SAMPLE_HR, meta: previewHr },
                  { label: "Tech example", conn: SAMPLE_TECH, meta: previewTech },
                ].map(({ label, conn, meta }) => (
                  <div key={conn.id}>
                    <p className="text-xs font-medium text-zinc-700 mb-1">
                      {label}: {conn.fullName}
                    </p>
                    <p className="text-[11px] text-zinc-500 mb-2">
                      {conn.position} at {conn.company}
                    </p>
                    <p className="text-[11px] text-[#0a66c2] bg-[#0a66c2]/5 rounded-lg px-2.5 py-1.5 mb-3">
                      {meta.note}
                    </p>
                    <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed border-t border-zinc-100 pt-3">
                      {meta.message}
                    </pre>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="!p-4 bg-zinc-50 border-zinc-100">
              <p className="text-xs font-medium text-zinc-700 mb-2">
                {isTemplate ? "Placeholder guide" : "Auto mode"}
              </p>
              {isTemplate ? (
                <ul className="text-xs text-zinc-500 space-y-2">
                  {TEMPLATE_PLACEHOLDERS.map(({ key, desc }) => (
                    <li key={key}>
                      <code className="text-[11px] bg-white px-1 py-0.5 rounded border border-zinc-200">
                        {key}
                      </code>{" "}
                      — {desc}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="text-xs text-zinc-500 space-y-1.5 list-disc list-inside">
                  <li>Detects HR, recruiters, leaders, tech, consulting, sales, etc.</li>
                  <li>Uses company, role, tone & your goals</li>
                  <li>Works offline with npm run dev (saved in browser)</li>
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
