import { useMemo, useState } from "react";
import { Layout, type Tab } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { ConnectionsTable } from "./components/ConnectionsTable";
import { MessageSetup } from "./components/MessageSetup";
import { ImportPanel } from "./components/ImportPanel";
import { PageHeader } from "./components/ui";
import { useAuth } from "./hooks/useAuth";
import { useAppStore } from "./hooks/useAppStore";
import { profileCompleteness } from "./lib/storage";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#0a66c2] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-500 mt-4">Loading your data…</p>
      </div>
    </div>
  );
}

function AuthenticatedApp({
  mobile,
  token,
  displayMobile,
  onLogout,
}: {
  mobile: string;
  token: string;
  displayMobile: string;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("setup");
  const store = useAppStore(mobile, token);

  const setupComplete = useMemo(
    () => profileCompleteness(store.data.profile),
    [store.data.profile]
  );

  if (store.loading) {
    return <LoadingScreen />;
  }

  return (
    <Layout
      activeTab={tab}
      onTabChange={setTab}
      setupComplete={setupComplete}
      displayMobile={displayMobile}
      onLogout={onLogout}
      saving={store.saving}
      syncError={store.syncError}
    >
      {tab === "dashboard" && (
        <Dashboard data={store.data} stats={store.stats} />
      )}
      {tab === "connections" && (
        <>
          <PageHeader
            title="Connections"
            description="Each person gets a unique message based on their role, company, and your outreach goals."
          />
          <ConnectionsTable
            connections={store.data.connections}
            profile={store.data.profile}
            onUpdate={store.updateConnection}
            onSetStatus={store.setStatus}
          />
        </>
      )}
      {tab === "import" && (
        <ImportPanel
          onImport={store.importFile}
          importing={store.importing}
          error={store.error}
          lastImportedAt={store.data.lastImportedAt}
          connectionCount={store.data.connections.length}
          onBackup={store.backup}
          onClear={store.clearAll}
          mobile={mobile}
          onSyncBrowser={store.syncBrowserToCloud}
        />
      )}
      {tab === "setup" && (
        <MessageSetup
          profile={store.data.profile}
          onChange={store.updateProfile}
          onRegenerateAll={store.regeneratePendingMessages}
          pendingCount={store.stats.pending}
        />
      )}
    </Layout>
  );
}

function App() {
  const auth = useAuth();

  if (!auth.isLoggedIn || !auth.mobile || !auth.token) {
    return (
      <LoginPage
        onLogin={auth.login}
        loginError={auth.loginError}
        loggingIn={auth.loggingIn}
        recentUsers={auth.recentUsers}
      />
    );
  }

  return (
    <AuthenticatedApp
      mobile={auth.mobile}
      token={auth.token}
      displayMobile={auth.displayMobile}
      onLogout={auth.logout}
    />
  );
}

export default App;
