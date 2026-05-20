import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppData, Connection, OutreachStatus, UserProfile } from "../types";
import { DEFAULT_PROFILE } from "../types";
import { apiFetchData, apiForceSync, apiSaveData } from "../lib/api";
import { PRIMARY_MOBILE } from "../lib/config";
import {
  clearAllLocalSnapshots,
  getBestLocalSnapshot,
  getLocalSnapshotForMobile,
  mergeAppData,
} from "../lib/localMigration";
import { mergeConnections, parseConnectionsFile } from "../lib/parser";
import { clearCustomMessages } from "../lib/messages";
import { exportDataBackup } from "../lib/storage";

const emptyData = (): AppData => ({
  profile: { ...DEFAULT_PROFILE },
  connections: [],
  lastImportedAt: null,
});

export function useAppStore(mobile: string, token: string) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSyncError(null);
      skipSave.current = true;

      try {
        let cloud = await apiFetchData(token);

        const ownLocal = getLocalSnapshotForMobile(mobile);
        const bestLocal =
          mobile === PRIMARY_MOBILE
            ? getBestLocalSnapshot() ?? ownLocal
            : ownLocal;

        if (bestLocal && bestLocal.connections.length > 0) {
          const shouldMerge =
            cloud.connections.length === 0 ||
            bestLocal.connections.length > cloud.connections.length;

          if (shouldMerge) {
            cloud = mergeAppData(cloud, bestLocal);
            await apiSaveData(token, cloud);
            if (mobile === PRIMARY_MOBILE) {
              clearAllLocalSnapshots();
            }
          }
        }

        if (!cancelled) {
          setData(cloud);
        }
      } catch (e) {
        if (!cancelled) {
          setSyncError(
            e instanceof Error ? e.message : "Failed to load from cloud"
          );
          setData(emptyData());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTimeout(() => {
            skipSave.current = false;
          }, 100);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [mobile, token]);

  useEffect(() => {
    if (skipSave.current || loading) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setSyncError(null);
      try {
        await apiSaveData(token, data);
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : "Failed to save");
      } finally {
        setSaving(false);
      }
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, token, loading]);

  const stats = useMemo(() => {
    const total = data.connections.length;
    const pending = data.connections.filter((c) => c.status === "pending").length;
    const contacted = data.connections.filter((c) => c.status === "contacted").length;
    const replied = data.connections.filter((c) => c.status === "replied").length;
    const noResponse = data.connections.filter((c) => c.status === "no_response").length;
    const notInterested = data.connections.filter(
      (c) => c.status === "not_interested"
    ).length;
    const outreachDone = total - pending;
    const responseRate =
      contacted + replied + noResponse > 0
        ? Math.round((replied / (contacted + replied + noResponse)) * 100)
        : 0;

    return {
      total,
      pending,
      contacted,
      replied,
      noResponse,
      notInterested,
      outreachDone,
      responseRate,
    };
  }, [data.connections]);

  const updateProfile = useCallback((profile: Partial<UserProfile>) => {
    setData((d) => ({ ...d, profile: { ...d.profile, ...profile } }));
  }, []);

  const importFile = useCallback(async (file: File) => {
    setImporting(true);
    setError(null);
    try {
      const parsed = await parseConnectionsFile(file);
      setData((d) => ({
        ...d,
        connections: mergeConnections(d.connections, parsed),
        lastImportedAt: new Date().toISOString(),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }, []);

  const updateConnection = useCallback(
    (id: string, updates: Partial<Connection>) => {
      setData((d) => ({
        ...d,
        connections: d.connections.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
    },
    []
  );

  const setStatus = useCallback(
    (id: string, status: OutreachStatus) => {
      const now = new Date().toISOString();
      setData((d) => ({
        ...d,
        connections: d.connections.map((c) => {
          if (c.id !== id) return c;
          const updates: Partial<Connection> = { status };
          if (status === "contacted" && !c.contactedAt) {
            updates.contactedAt = now;
          }
          if (status === "replied" && !c.repliedAt) {
            updates.repliedAt = now;
            if (!c.contactedAt) updates.contactedAt = now;
          }
          return { ...c, ...updates };
        }),
      }));
    },
    []
  );

  const clearAll = useCallback(() => {
    if (confirm("Delete all connections and reset? Your profile will be kept.")) {
      setData((d) => ({
        ...d,
        connections: [],
        lastImportedAt: null,
      }));
    }
  }, []);

  const backup = useCallback(
    () => exportDataBackup(data, mobile),
    [data, mobile]
  );

  const regeneratePendingMessages = useCallback(() => {
    setData((d) => ({
      ...d,
      connections: clearCustomMessages(d.connections, true),
    }));
  }, []);

  const syncBrowserToCloud = useCallback(async () => {
    const best = getBestLocalSnapshot();
    if (!best?.connections.length) return;

    setSaving(true);
    setSyncError(null);
    try {
      const merged = mergeAppData(data, best);
      await apiForceSync(token, merged);
      setData(merged);
      clearAllLocalSnapshots();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
      throw e;
    } finally {
      setSaving(false);
    }
  }, [data, token]);

  return {
    data,
    stats,
    loading,
    saving,
    syncError,
    importing,
    error,
    setError,
    updateProfile,
    importFile,
    updateConnection,
    setStatus,
    clearAll,
    backup,
    regeneratePendingMessages,
    syncBrowserToCloud,
    setData,
  };
}
