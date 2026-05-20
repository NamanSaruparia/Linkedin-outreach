import { AlertCircle, CloudUpload, Download, FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { PRIMARY_MOBILE } from "../lib/config";
import {
  collectAllLocalSnapshots,
  getBestLocalSnapshot,
} from "../lib/localMigration";
import { Card, PageHeader } from "./ui";

interface ImportPanelProps {
  onImport: (file: File) => void;
  importing: boolean;
  error: string | null;
  lastImportedAt: string | null;
  connectionCount: number;
  onBackup: () => void;
  onClear: () => void;
  mobile?: string;
  onSyncBrowser?: () => Promise<void>;
}

export function ImportPanel({
  onImport,
  importing,
  error,
  lastImportedAt,
  connectionCount,
  onBackup,
  onClear,
  mobile,
  onSyncBrowser,
}: ImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);
  const localCount = getBestLocalSnapshot()?.connections.length ?? 0;
  const localSnapshots = collectAllLocalSnapshots().length;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Import"
        description="Upload Connections.csv from LinkedIn. Re-importing keeps your outreach status."
      />

      <Card
        padding={false}
        className={`overflow-hidden ${importing ? "opacity-80" : ""}`}
      >
        <div
          onClick={() => !importing && inputRef.current?.click()}
          className={`p-12 text-center cursor-pointer transition-colors ${
            importing ? "cursor-wait" : "hover:bg-zinc-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFile}
            className="hidden"
          />
          {importing ? (
            <Loader2 className="w-10 h-10 text-[#0a66c2] mx-auto animate-spin" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-7 h-7 text-zinc-400" />
            </div>
          )}
          <p className="text-zinc-900 font-medium mt-4">
            {importing ? "Importing…" : "Upload Connections.csv"}
          </p>
          <p className="text-zinc-500 text-sm mt-1">CSV or Excel from LinkedIn export</p>
        </div>
      </Card>

      {error && (
        <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {connectionCount > 0 && (
        <Card>
          <p className="font-semibold text-zinc-900">
            {connectionCount.toLocaleString()} connections
          </p>
          {lastImportedAt && (
            <p className="text-sm text-zinc-500 mt-1">
              Last import: {new Date(lastImportedAt).toLocaleString()}
            </p>
          )}
          {mobile === PRIMARY_MOBILE && onSyncBrowser && localCount > 0 && (
            <button
              onClick={async () => {
                setSyncing(true);
                try {
                  await onSyncBrowser();
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a66c2] text-white text-sm hover:bg-[#004182] transition-colors mt-3 disabled:opacity-60"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              Link browser data to {PRIMARY_MOBILE.slice(0, 5)}…
              ({localCount} connections, {localSnapshots} local save
              {localSnapshots === 1 ? "" : "s"})
            </button>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={onBackup}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Backup JSON
            </button>
            <button
              onClick={onClear}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
        </Card>
      )}

      <Card className="!p-5 bg-zinc-50/50">
        <p className="text-sm font-medium text-zinc-800 mb-2">Export from LinkedIn</p>
        <code className="block text-xs bg-white border border-zinc-200 p-3 rounded-xl text-zinc-600 mb-3">
          First Name, Last Name, URL, Email Address, Company, Position, Connected On
        </code>
        <ol className="text-sm text-zinc-500 space-y-1 list-decimal list-inside">
          <li>Settings & Privacy → Data privacy</li>
          <li>Get a copy of your data → Connections</li>
          <li>Extract Connections.csv from the ZIP</li>
        </ol>
      </Card>
    </div>
  );
}
