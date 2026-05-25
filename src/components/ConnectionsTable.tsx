import {
  ArrowUpDown,
  Bell,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Connection, OutreachStatus, UserProfile } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../types";
import {
  FOLLOW_UP_MIN_DAYS,
  formatRelativeDays,
  getLastActionAt,
  needsFollowUp,
  sortConnections,
  type SortKey,
} from "../lib/connectionUtils";
import {
  generateMessage,
  getGeneratedMessage,
  getMessageMeta,
  isUsingCustomMessage,
} from "../lib/messages";
import { Card, EmptyState, inputClass, textareaClass } from "./ui";

type StatusFilter = OutreachStatus | "all" | "followup";

interface ConnectionsTableProps {
  connections: Connection[];
  profile: UserProfile;
  onUpdate: (id: string, updates: Partial<Connection>) => void;
  onSetStatus: (id: string, status: OutreachStatus) => void;
  onSetBulkStatus: (ids: string[], status: OutreachStatus) => void;
  filterPreset?: StatusFilter | null;
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
  onSetBulkStatus,
  filterPreset,
}: ConnectionsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("last_action");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (filterPreset) setStatusFilter(filterPreset);
  }, [filterPreset]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = connections.filter((c) => {
      const matchFollowUp =
        statusFilter !== "followup" || needsFollowUp(c);
      const matchStatus =
        statusFilter === "all" ||
        statusFilter === "followup" ||
        c.status === statusFilter;
      const matchSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q);
      return matchFollowUp && matchStatus && matchSearch;
    });
    return sortConnections(list, sortKey, sortDir);
  }, [connections, search, statusFilter, sortKey, sortDir]);

  const selectedInView = useMemo(
    () => filtered.filter((c) => selected.has(c.id)),
    [filtered, selected]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map((c) => c.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const getMessage = (conn: Connection) =>
    conn.customMessage || generateMessage(profile, conn);

  const copyMessage = async (conn: Connection) => {
    await navigator.clipboard.writeText(getMessage(conn));
    setCopiedId(conn.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAndOpenLinkedIn = async (conn: Connection) => {
    await navigator.clipboard.writeText(getMessage(conn));
    if (conn.url) {
      window.open(conn.url, "_blank", "noopener,noreferrer");
    }
    setCopiedId(conn.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyOpenAndContact = async (conn: Connection) => {
    await copyAndOpenLinkedIn(conn);
    if (conn.status === "pending") {
      onSetStatus(conn.id, "contacted");
    }
  };

  const applyBulk = (status: OutreachStatus) => {
    onSetBulkStatus(
      selectedInView.map((c) => c.id),
      status
    );
    clearSelection();
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
            placeholder="Search name, company, role, notes…"
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
              setStatusFilter(e.target.value as StatusFilter)
            }
            className={`${inputClass} pl-10 pr-9 appearance-none min-w-[200px]`}
          >
            <option value="all">All statuses</option>
            <option value="followup">
              Needs follow-up ({FOLLOW_UP_MIN_DAYS}+ days)
            </option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <select
            value={`${sortKey}-${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split("-") as [SortKey, "asc" | "desc"];
              setSortKey(k);
              setSortDir(d);
            }}
            className={`${inputClass} pl-10 pr-9 appearance-none min-w-[200px]`}
          >
            <option value="last_action-desc">Last action (newest)</option>
            <option value="last_action-asc">Last action (oldest)</option>
            <option value="name-asc">Name A–Z</option>
            <option value="company-asc">Company A–Z</option>
            <option value="status-asc">Status</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#0a66c2]/5 border border-[#0a66c2]/15">
          <span className="text-sm font-medium text-zinc-800 mr-1">
            {selectedInView.length} selected
          </span>
          <button
            type="button"
            onClick={() => applyBulk("contacted")}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#0a66c2] text-white hover:bg-[#004182] font-medium"
          >
            Mark contacted
          </button>
          <button
            type="button"
            onClick={() => applyBulk("replied")}
            className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          >
            Mark replied
          </button>
          <button
            type="button"
            onClick={() => applyBulk("no_response")}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            No response
          </button>
          <button
            type="button"
            onClick={() => applyBulk("pending")}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          >
            Reset to pending
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs px-2 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 ml-auto flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
        <p>
          {filtered.length} of {connections.length} connections
        </p>
        <button
          type="button"
          onClick={
            selected.size === filtered.length && filtered.length > 0
              ? clearSelection
              : selectAllFiltered
          }
          className="text-xs text-[#0a66c2] hover:underline font-medium"
        >
          {selected.size === filtered.length && filtered.length > 0
            ? "Deselect all"
            : "Select all shown"}
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((conn) => {
          const expanded = expandedId === conn.id;
          const generated = getGeneratedMessage(profile, conn);
          const meta = getMessageMeta(profile, conn);
          const isCustom = isUsingCustomMessage(conn);
          const followUp = needsFollowUp(conn);
          const lastAction = getLastActionAt(conn);
          const isSelected = selected.has(conn.id);

          return (
            <Card
              key={conn.id}
              padding={false}
              className={`overflow-hidden ${isSelected ? "ring-2 ring-[#0a66c2]/30" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-3 p-4 hover:bg-zinc-50/80 transition-colors">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(conn.id)}
                  className="w-4 h-4 rounded border-zinc-300 text-[#0a66c2] focus:ring-[#0a66c2]/30 shrink-0"
                  aria-label={`Select ${conn.fullName}`}
                />
                <div
                  className="flex-1 min-w-[180px] cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : conn.id)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-900">{conn.fullName}</p>
                    {followUp && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <Bell className="w-3 h-3" />
                        Follow up
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 truncate">
                    {[conn.position, conn.company].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                  {(lastAction || conn.notes) && (
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {lastAction && (
                        <span>Last: {formatRelativeDays(lastAction)}</span>
                      )}
                      {lastAction && conn.notes && " · "}
                      {conn.notes && <span>{conn.notes}</span>}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[conn.status]}`}
                >
                  {STATUS_LABELS[conn.status]}
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => copyMessage(conn)}
                    title="Copy message only"
                    className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:text-[#0a66c2] hover:border-[#0a66c2]/40 hover:bg-[#0a66c2]/5 transition-all"
                  >
                    {copiedId === conn.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {conn.url ? (
                    <button
                      type="button"
                      onClick={() => copyAndOpenLinkedIn(conn)}
                      title="Copy message and open LinkedIn profile"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#0a66c2]/30 bg-[#0a66c2]/5 text-[#0a66c2] text-xs font-medium hover:bg-[#0a66c2]/10 transition-all"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      Copy & open
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400 px-2 py-2">No URL</span>
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
                    {lastAction && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-0.5">Last action</p>
                        <p className="text-zinc-800">
                          {new Date(lastAction).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="text-xs font-medium text-zinc-500">
                        Message for {conn.firstName || "them"}
                      </label>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isCustom
                            ? "bg-violet-100 text-violet-800"
                            : generated.source === "template"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isCustom
                          ? "Custom"
                          : generated.source === "template"
                            ? "Your template"
                            : "Auto-generated"}
                      </span>
                    </div>
                    <textarea
                      value={isCustom ? conn.customMessage : generated.message}
                      onChange={(e) =>
                        onUpdate(conn.id, { customMessage: e.target.value })
                      }
                      rows={12}
                      className={textareaClass}
                      placeholder="Edit to create a custom message for this person only…"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[11px] text-zinc-400">
                        {(isCustom ? conn.customMessage : generated.message).length}{" "}
                        chars
                      </span>
                      {isCustom ? (
                        <button
                          type="button"
                          onClick={() => onUpdate(conn.id, { customMessage: "" })}
                          className="text-xs text-[#0a66c2] hover:underline font-medium"
                        >
                          Reset to {generated.source === "template" ? "template" : "auto"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdate(conn.id, {
                              customMessage: generated.message,
                            })
                          }
                          className="text-xs text-zinc-500 hover:text-[#0a66c2] hover:underline"
                        >
                          Pin as custom (edit freely)
                        </button>
                      )}
                    </div>
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
                          type="button"
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
                      {conn.url && (
                        <button
                          type="button"
                          onClick={() => copyOpenAndContact(conn)}
                          className="text-xs px-4 py-1.5 rounded-lg bg-[#0a66c2] text-white hover:bg-[#004182] transition-colors ml-auto font-medium"
                        >
                          Copy, open & mark contacted
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
