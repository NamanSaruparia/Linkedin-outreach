import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";
import type { AppData } from "../types";
import { STATUS_LABELS } from "../types";
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
  };
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

export function Dashboard({ data, stats }: DashboardProps) {
  const progress =
    stats.total > 0
      ? Math.round((stats.outreachDone / stats.total) * 100)
      : 0;

  const recentReplied = data.connections
    .filter((c) => c.status === "replied")
    .sort((a, b) => (b.repliedAt ?? "").localeCompare(a.repliedAt ?? ""))
    .slice(0, 5);

  const awaiting = data.connections
    .filter((c) => c.status === "contacted")
    .sort((a, b) => (b.contactedAt ?? "").localeCompare(a.contactedAt ?? ""))
    .slice(0, 5);

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
                    {c.company || "—"}
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
          {awaiting.length === 0 ? (
            <p className="text-sm text-zinc-400">None waiting.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {awaiting.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <span className="text-zinc-800 font-medium truncate">
                    {c.fullName}
                  </span>
                  <span className="text-zinc-400 shrink-0 text-xs">
                    {c.contactedAt
                      ? new Date(c.contactedAt).toLocaleDateString()
                      : "—"}
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
