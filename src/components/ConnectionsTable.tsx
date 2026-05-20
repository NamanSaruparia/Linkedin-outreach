import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Connection, OutreachStatus, UserProfile } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../types";
import { generateMessage, getMessageMeta } from "../lib/messages";
import { Card, EmptyState, inputClass, textareaClass } from "./ui";

interface ConnectionsTableProps {
  connections: Connection[];
  profile: UserProfile;
  onUpdate: (id: string, updates: Partial<Connection>) => void;
  onSetStatus: (id: string, status: OutreachStatus) => void;
}

const ALL_STATUSES: OutreachStatus[] = [
  "pending",
  "contacted",
  "replied",
  "no_response",
  "not_interested",
];

export function ConnectionsTable({
  connections,
  profile,
  onUpdate,
  onSetStatus,
}: ConnectionsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OutreachStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return connections.filter((c) => {
      const matchStatus =
        statusFilter === "all" || c.status === statusFilter;
      const matchSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [connections, search, statusFilter]);

  const copyMessage = async (conn: Connection) => {
    const msg = generateMessage(profile, conn);
    await navigator.clipboard.writeText(msg);
    setCopiedId(conn.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markContactedAndCopy = async (conn: Connection) => {
    const msg = generateMessage(profile, conn);
    await navigator.clipboard.writeText(msg);
    onSetStatus(conn.id, "contacted");
    setCopiedId(conn.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (connections.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Search}
          title="No connections"
          description="Import Connections.csv from LinkedIn, then configure your message in Message setup."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search name, company, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OutreachStatus | "all")
            }
            className={`${inputClass} pl-10 pr-9 appearance-none min-w-[170px]`}
          >
            <option value="all">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      <p className="text-sm text-zinc-500">
        {filtered.length} of {connections.length} connections
      </p>

      <div className="space-y-2">
        {filtered.map((conn) => {
          const expanded = expandedId === conn.id;
          const message = generateMessage(profile, conn);
          const meta = getMessageMeta(profile, conn);

          return (
            <Card key={conn.id} padding={false} className="overflow-hidden">
              <div
                className="flex flex-wrap items-center gap-3 p-4 cursor-pointer hover:bg-zinc-50/80 transition-colors"
                onClick={() => setExpandedId(expanded ? null : conn.id)}
              >
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium text-zinc-900">{conn.fullName}</p>
                  <p className="text-sm text-zinc-500 truncate">
                    {[conn.position, conn.company].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[conn.status]}`}
                >
                  {STATUS_LABELS[conn.status]}
                </span>
                <div
                  className="flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => copyMessage(conn)}
                    title="Copy message"
                    className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:text-[#0a66c2] hover:border-[#0a66c2]/40 hover:bg-[#0a66c2]/5 transition-all"
                  >
                    {copiedId === conn.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {conn.url && (
                    <a
                      href={conn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {expanded && (
                <div
                  className="border-t border-zinc-100 p-5 space-y-5 bg-zinc-50/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start gap-2 text-xs text-[#0a66c2] bg-[#0a66c2]/5 border border-[#0a66c2]/10 rounded-xl px-3 py-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{meta.note}</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {conn.email && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Email</p>
                        <p className="text-zinc-800">{conn.email}</p>
                      </div>
                    )}
                    {conn.connectedOn && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Connected</p>
                        <p className="text-zinc-800">{conn.connectedOn}</p>
                      </div>
                    )}
                    {conn.contactedAt && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Contacted</p>
                        <p className="text-zinc-800">
                          {new Date(conn.contactedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {conn.repliedAt && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Replied</p>
                        <p className="text-zinc-800">
                          {new Date(conn.repliedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-2">
                      Personalized message
                    </label>
                    <textarea
                      value={conn.customMessage || message}
                      onChange={(e) =>
                        onUpdate(conn.id, { customMessage: e.target.value })
                      }
                      rows={10}
                      className={textareaClass}
                    />
                    <button
                      onClick={() => onUpdate(conn.id, { customMessage: "" })}
                      className="text-xs text-zinc-400 hover:text-[#0a66c2] mt-2 transition-colors"
                    >
                      Reset to auto-generated
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={conn.notes}
                      onChange={(e) =>
                        onUpdate(conn.id, { notes: e.target.value })
                      }
                      placeholder="Follow up Friday…"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">
                      Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => onSetStatus(conn.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            conn.status === s
                              ? "border-[#0a66c2] bg-[#0a66c2] text-white"
                              : "border-zinc-200 text-zinc-600 hover:border-zinc-300 bg-white"
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                      {conn.status === "pending" && (
                        <button
                          onClick={() => markContactedAndCopy(conn)}
                          className="text-xs px-4 py-1.5 rounded-lg bg-[#0a66c2] text-white hover:bg-[#004182] transition-colors ml-auto font-medium"
                        >
                          Copy & mark contacted
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
