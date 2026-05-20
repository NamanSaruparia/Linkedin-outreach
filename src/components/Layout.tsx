import {
  BarChart3,
  LogOut,
  MessageSquareText,
  Settings2,
  Upload,
  Users,
} from "lucide-react";

export type Tab = "dashboard" | "connections" | "setup" | "import";

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
  setupComplete?: number;
  displayMobile: string;
  onLogout: () => void;
  saving?: boolean;
  syncError?: string | null;
}

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "dashboard", label: "Overview", icon: BarChart3 },
  { id: "connections", label: "Connections", icon: Users },
  { id: "setup", label: "Message setup", icon: Settings2 },
  { id: "import", label: "Import", icon: Upload },
];

export function Layout({
  activeTab,
  onTabChange,
  children,
  setupComplete = 0,
  displayMobile,
  onLogout,
  saving = false,
  syncError = null,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white border-r border-zinc-200/80 fixed h-full">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0a66c2] flex items-center justify-center shadow-sm">
              <MessageSquareText className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 text-sm leading-tight">
                Outreach
              </p>
              <p className="text-[11px] text-zinc-400 truncate">{displayMobile}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-[#0a66c2] text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {id === "setup" && setupComplete < 100 && (
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-md ${
                    activeTab === id
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {setupComplete}%
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Use another number
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-200/80">
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-zinc-900 text-sm">Outreach</p>
              <p className="text-xs text-zinc-400">{displayMobile}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-zinc-500 hover:bg-rose-50 hover:text-rose-600"
              title="Use another number"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <nav className="flex gap-1 px-2 pb-2 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === id
                    ? "bg-[#0a66c2] text-white"
                    : "text-zinc-500 bg-zinc-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl w-full">
          {(saving || syncError) && (
            <div
              className={`mb-4 text-xs px-3 py-2 rounded-lg flex items-center justify-between ${
                syncError
                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                  : "bg-blue-50 text-blue-700 border border-blue-100"
              }`}
            >
              <span>
                {syncError ?? "Saving to cloud…"}
              </span>
              {saving && !syncError && (
                <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
