import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  StickyNote,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import type { AppData } from "../types";
import { STATUS_LABELS } from "../types";
import {
  FOLLOW_UP_MIN_DAYS,
  formatRelativeDays,
  getLastActionAt,
  needsFollowUp,
  sortConnections,
} from "../lib/connectionUtils";
import { Card, EmptyState, PageHeader } from "./ui";

interface DashboardProps {
  data: AppData;
  stats: {
    total: number;
    pending: number;
    contacted: number;
    replied: number;
    noResponse: number;
    notInterested: number;
    outreachDone: number;
    responseRate: number;
    followUpCount: number;
  };
  onGoToConnections?: () => void;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl font-semibold text-zinc-900 mt-1 tabular-nums">
            {value}
          </p>
          {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

export function Dashboard({ data, stats, onGoToConnections }: DashboardProps) {
  const progress =
    stats.total > 0
      ? Math.round((stats.outreachDone / stats.total) * 100)
      : 0;

  const followUps = useMemo(
    () =>
      sortConnections(
        data.connections.filter(needsFollowUp),
        "last_action",
        "asc"
      ),
    [data.connections]
  );

  const recentActivity = useMemo(
    () =>
      sortConnections(
        data.connections.filter((c) => getLastActionAt(c)),
        "last_action",
        "desc"
      ).slice(0, 12),
    [data.connections]
  );

  const recentReplied = useMemo(
    () =>
      data.connections
        .filter((c) => c.status === "replied")
        .sort((a, b) => (b.repliedAt ?? "").localeCompare(a.repliedAt ?? ""))
        .slice(0, 5),
    [data.connections]
  );

  if (stats.total === 0) {
    return (
      <>
        <PageHeader
          title="Overview"
          description="Track outreach progress once you import connections."
        />
        <Card>
          <EmptyState
            icon={Users}
            title="No connections yet"
            description="Import your Connections.csv from LinkedIn, then set up your message in Message setup."
          />
        </Card>
      </>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Your outreach progress at a glance."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Users}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Contacted"
          value={stats.contacted + stats.replied + stats.noResponse}
          sub={`${stats.pending} pending`}
          icon={Send}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Replied"
          value={stats.replied}
          sub={
            stats.contacted + stats.replied + stats.noResponse > 0
              ? `${stats.responseRate}% response rate`
              : undefined
          }
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Progress"
          value={`${progress}%`}
          sub={`${stats.outreachDone} of ${stats.total}`}
          icon={MessageCircle}
          accent="bg-violet-50 text-violet-600"
        />
      </div>

      {stats.followUpCount > 0 && (
        <Card className="border-amber-200/80 bg-amber-50/40">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  Follow-up reminders
                </h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Contacted {FOLLOW_UP_MIN_DAYS}+ days ago with no reply yet
                </p>
              </div>
            </div>
            {onGoToConnections && (
              <button
                type="button"
                onClick={onGoToConnections}
                className="text-xs font-medium text-amber-900 flex items-center gap-1 hover:underline"
              >
                View in Connections
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <ul className="divide-y divide-amber-200/60">
            {followUps.slice(0, 8).map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <span className="font-medium text-zinc-900">{c.fullName}</span>
                  <span className="text-zinc-500 text-xs block truncate">
                    {[c.position, c.company].filter(Boolean).join(" · ") || "—"}
                  </span>
                  {c.notes && (
                    <span className="text-xs text-amber-900/70 flex items-center gap-1 mt-0.5">
                      <StickyNote className="w-3 h-3 shrink-0" />
                      {c.notes}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded-md shrink-0">
                  {formatRelativeDays(c.contactedAt)} since contact
                </span>
              </li>
            ))}
          </ul>
          {followUps.length > 8 && (
            <p className="text-xs text-amber-800/70 mt-3">
              +{followUps.length - 8} more in Connections (filter: Needs follow-up)
            </p>
          )}
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 mb-5">
          Status breakdown
        </h3>
        <div className="space-y-4">
          {(
            [
              ["pending", stats.pending, "bg-zinc-300"],
              ["contacted", stats.contacted, "bg-amber-400"],
              ["replied", stats.replied, "bg-emerald-500"],
              ["no_response", stats.noResponse, "bg-rose-400"],
              ["not_interested", stats.notInterested, "bg-zinc-400"],
            ] as const
          ).map(([status, count, barColor]) => {
            const pct = stats.total ? (count / stats.total) * 100 : 0;
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-zinc-600">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-zinc-400 tabular-nums">
                    {count}{" "}
                    <span className="text-zinc-300">({Math.round(pct)}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#0a66c2]" />
          Recent activity
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          Sorted by last action (status change, notes, or message edit)
        </p>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-zinc-400">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recentActivity.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-900">
                      {c.fullName}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        c.status === "replied"
                          ? "bg-emerald-50 text-emerald-700"
                          : c.status === "contacted"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  {c.notes ? (
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {c.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 mt-1 italic">
                      No notes
                    </p>
                  )}
                </div>
                <span className="text-xs text-zinc-400 shrink-0 tabular-nums">
                  {formatRelativeDays(getLastActionAt(c))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Recent replies
          </h3>
          {recentReplied.length === 0 ? (
            <p className="text-sm text-zinc-400">No replies yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recentReplied.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <span className="text-zinc-800 font-medium truncate">
                    {c.fullName}
                  </span>
                  <span className="text-zinc-400 shrink-0 text-xs">
                    {formatRelativeDays(c.repliedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Awaiting response
          </h3>
          {stats.contacted === 0 ? (
            <p className="text-sm text-zinc-400">None waiting.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {data.connections
                .filter((c) => c.status === "contacted")
                .sort((a, b) =>
                  (a.contactedAt ?? "").localeCompare(b.contactedAt ?? "")
                )
                .slice(0, 5)
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="text-zinc-800 font-medium truncate">
                      {c.fullName}
                    </span>
                    <span className="text-zinc-400 shrink-0 text-xs">
                      {formatRelativeDays(c.contactedAt)}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
