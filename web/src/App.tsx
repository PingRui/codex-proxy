import { createContext, type ComponentChildren } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { APP_BRAND, APP_DESCRIPTOR } from "../../shared/brand";
import { I18nProvider, useI18n } from "../../shared/i18n/context";
import { useAccounts } from "../../shared/hooks/use-accounts";
import { useDashboardAuth } from "../../shared/hooks/use-dashboard-auth";
import { useErrorLogsCount } from "../../shared/hooks/use-error-logs";
import { useProxies } from "../../shared/hooks/use-proxies";
import { useStatus } from "../../shared/hooks/use-status";
import { useUpdateStatus } from "../../shared/hooks/use-update-status";
import { ThemeProvider } from "../../shared/theme/context";
import { AddAccount } from "./components/AddAccount";
import { ApiKeyManager } from "./components/ApiKeyManager";
import { AppShell } from "./components/AppShell";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { PageHeader } from "./components/PageHeader";
import { ProxyPool } from "./components/ProxyPool";
import { SettingsTab } from "./components/SettingsTab";
import { UpdateModal } from "./components/UpdateModal";
import { deriveGatewayState } from "./lib/gateway-state";
import { migrateLegacyLayoutMode } from "./lib/layout-preferences";
import { LEGACY_HASH_REDIRECTS, NAV_ITEMS, resolveAppRouteHash } from "./navigation";
import { AccountManagement } from "./pages/AccountManagement";
import { AboutPage } from "./pages/AboutPage";
import { ActivityPage, type ActivityTab } from "./pages/ActivityPage";
import { ApiAccessPage } from "./pages/ApiAccessPage";
import { ClientKeysPage } from "./pages/ClientKeysPage";
import { GatewayOverview } from "./pages/GatewayOverview";
import { ProxySettings } from "./pages/ProxySettings";
import { getShowUpdateDialogPreference, shouldAutoOpenUpdateModal } from "./update-modal-policy";

export { shouldAutoOpenUpdateModal };

const DashboardAuthCtx = createContext<{ onLogout?: () => void }>({});

function useDashboardAuthCtx() {
  return useContext(DashboardAuthCtx);
}

function useUpdateMessage() {
  const { t } = useI18n();
  const update = useUpdateStatus();

  let msg: string | null = null;
  let color = "text-primary";

  if (!update.checking && update.result) {
    const parts: string[] = [];
    const result = update.result;
    if (result.proxy?.error) {
      parts.push(`Proxy: ${result.proxy.error}`);
      color = "text-red-500";
    } else if (result.proxy?.update_available) {
      parts.push(t("updateAvailable"));
      color = "text-amber-500";
    }
    if (result.codex?.error) {
      parts.push(`Codex: ${result.codex.error}`);
      color = "text-red-500";
    } else if (result.codex_update_in_progress) {
      parts.push(t("fingerprintUpdating"));
    } else if (result.codex?.version_changed) {
      parts.push(`Codex: v${result.codex.current_version}`);
      color = "text-blue-500";
    }
    msg = parts.length > 0 ? parts.join(" · ") : t("upToDate");
  } else if (!update.checking && update.error) {
    msg = update.error;
    color = "text-red-500";
  }

  const hasUpdate = update.status?.proxy.update_available ?? false;
  const showUpdateDialog = getShowUpdateDialogPreference(update.status);
  const proxyUpdateInfo = hasUpdate
    ? {
        mode: update.status!.proxy.mode,
        commits: update.status!.proxy.commits,
        changelog: update.status!.proxy.changelog ?? null,
        release: update.status!.proxy.release,
      }
    : null;

  return { ...update, msg, color, hasUpdate, showUpdateDialog, proxyUpdateInfo };
}

function Dashboard() {
  const { t } = useI18n();
  const accounts = useAccounts();
  const proxies = useProxies();
  const status = useStatus(accounts.list.length);
  const update = useUpdateMessage();
  const { onLogout } = useDashboardAuthCtx();
  const [showModal, setShowModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const prevUpdateAvailable = useRef(false);
  const hash = useHash();
  const errorCount = useErrorLogsCount();

  useEffect(() => {
    migrateLegacyLayoutMode();
  }, []);

  useEffect(() => {
    if (shouldAutoOpenUpdateModal({
      hasUpdate: update.hasUpdate,
      previousHasUpdate: prevUpdateAvailable.current,
      mode: update.proxyUpdateInfo?.mode ?? null,
      showUpdateDialog: update.showUpdateDialog,
    })) {
      setShowModal(true);
    }
    prevUpdateAvailable.current = update.hasUpdate;
  }, [update.hasUpdate, update.proxyUpdateInfo?.mode, update.showUpdateDialog]);

  const normalizedHash = hash === "#/" ? "" : hash;
  const requestedHash = LEGACY_HASH_REDIRECTS[normalizedHash] ?? normalizedHash;
  const routeHash = resolveAppRouteHash(hash);

  useEffect(() => {
    const redirect = LEGACY_HASH_REDIRECTS[normalizedHash];
    if (redirect && location.hash !== redirect) {
      location.hash = redirect;
    } else if (normalizedHash && resolveAppRouteHash(requestedHash) === "") {
      location.hash = "#/";
    }
  }, [normalizedHash, requestedHash]);

  const activeHash = NAV_ITEMS.some((item) => item.hash === routeHash)
    ? routeHash
    : routeHash === "#/errors" || routeHash === "#/usage-stats"
      ? "#/activity"
      : routeHash === "#/client-keys" || routeHash === "#/api-keys" || routeHash === "#/proxies"
        ? "#/settings"
        : "";
  const pageTitle = NAV_ITEMS.find((item) => item.hash === activeHash);
  const visibleErrorCount = errorCount.unread;
  const gatewayReady = deriveGatewayState(accounts.list, accounts.selectedAccountId).kind === "ready"
    && status.baseUrl !== "Loading...";
  const activityTab: ActivityTab = routeHash === "#/errors"
    ? "errors"
    : routeHash === "#/usage-stats"
      ? "usage"
      : "requests";

  const toolbar = (
    <Header
      onAddAccount={accounts.startAdd}
      onCheckUpdate={update.checkForUpdate}
      onOpenUpdateModal={() => setShowModal(true)}
      checking={update.checking}
      updateStatusMsg={update.msg}
      updateStatusColor={update.color}
      version={update.status?.proxy.version ?? null}
      commit={update.status?.proxy.commit ?? null}
      hasUpdate={update.hasUpdate}
      onLogout={onLogout}
      unreadErrors={visibleErrorCount}
    />
  );

  return (
    <AppShell
      activeHash={activeHash}
      unreadErrors={visibleErrorCount}
      uptimeSeconds={status.uptimeSeconds}
      mobileSidebarOpen={mobileSidebarOpen}
      onOpenSidebar={() => setMobileSidebarOpen(true)}
      onCloseSidebar={() => setMobileSidebarOpen(false)}
      toolbar={toolbar}
      footer={<Footer updateStatus={update.status} gatewayReady={gatewayReady} />}
    >
      <div class="flex w-full flex-col">
        {pageTitle && routeHash !== "" && routeHash !== "#/accounts" && <PageHeader title={t(pageTitle.label)} />}

        <AddAccount
          visible={accounts.addVisible}
          onCancel={accounts.cancelAdd}
          onSubmitRelay={accounts.submitRelay}
          onAddByRefreshToken={accounts.addByRefreshToken}
          addInfo={accounts.addInfo}
          addError={accounts.addError}
          authUrl={accounts.addAuthUrl}
          fallbackConfigured={!!accounts.fallbackUpstream}
          onAddFallbackUpstream={accounts.addFallbackUpstream}
        />

        {routeHash === "" && <GatewayOverview accounts={accounts} status={status} onAddAccount={accounts.startAdd} />}

        {routeHash === "#/accounts" && <AccountManagement accounts={accounts} onAddAccount={accounts.startAdd} />}
        {routeHash === "#/client-keys" && <ClientKeysPage masterApiKey={status.apiKey} />}
        {routeHash === "#/api-keys" && <ApiKeyManager />}
        {routeHash === "#/proxies" && (
          <div class="flex flex-col gap-6">
            <ProxyPool proxies={proxies} />
            <ProxySettings embedded />
          </div>
        )}
        {(routeHash === "#/activity" || routeHash === "#/errors" || routeHash === "#/usage-stats") && (
          <ActivityPage initialTab={activityTab} unreadErrors={visibleErrorCount} />
        )}
        {routeHash === "#/api" && (
          <ApiAccessPage
            baseUrl={status.baseUrl}
            apiKey={status.apiKey}
            models={status.models}
            selectedModel={status.selectedModel}
            onModelChange={status.setSelectedModel}
            modelFamilies={status.modelFamilies}
            selectedEffort={status.selectedEffort}
            onEffortChange={status.setSelectedEffort}
            selectedSpeed={status.selectedSpeed}
            onSpeedChange={status.setSelectedSpeed}
          />
        )}
        {routeHash === "#/settings" && <SettingsTab models={status.models} />}
        {routeHash === "#/about" && <AboutPage version={update.status?.proxy.version ?? null} commit={update.status?.proxy.commit ?? null} />}
      </div>

      {update.proxyUpdateInfo && (
        <UpdateModal
          open={showModal}
          onClose={() => setShowModal(false)}
          mode={update.proxyUpdateInfo.mode}
          commits={update.proxyUpdateInfo.commits}
          changelog={update.proxyUpdateInfo.changelog}
          release={update.proxyUpdateInfo.release}
          onApply={update.applyUpdate}
          applying={update.applying}
          restarting={update.restarting}
          restartFailed={update.restartFailed}
          updateSteps={update.updateSteps}
        />
      )}
    </AppShell>
  );
}

function useHash(): string {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const handler = () => setHash(location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return hash;
}

function LoginGate({ children }: { children: ComponentChildren }) {
  const { t } = useI18n();
  const auth = useDashboardAuth();
  const [password, setPassword] = useState("");

  if (auth.status === "loading") {
    return (
      <div class="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        {t("loadingAccounts")}
      </div>
    );
  }

  if (auth.status === "login") {
    const handleSubmit = (event: Event) => {
      event.preventDefault();
      if (password.trim()) auth.login(password.trim());
    };
    return (
      <div class="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div class="w-full max-w-sm border border-nx-border bg-surface p-8">
          <p class="text-xs font-medium text-muted">{APP_DESCRIPTOR}</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">{APP_BRAND}</h1>
          <p class="mt-3 text-sm text-muted">{t("dashboardLoginRequired")}</p>
          <form onSubmit={handleSubmit} class="mt-6 flex flex-col gap-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted">{t("dashboardPassword")}</label>
              <input
                type="password"
                value={password}
                onInput={(event) => setPassword((event.target as HTMLInputElement).value)}
                class="w-full rounded-lg border border-nx-border bg-canvas px-3 py-2 text-sm text-ink focus:border-accent"
                placeholder="proxy_api_key"
                autofocus
              />
            </div>
            {auth.error && (
              <p class="text-xs font-medium text-danger">
                {auth.error.includes("Too many") ? t("dashboardTooManyAttempts") : t("dashboardLoginError")}
              </p>
            )}
            <button type="submit" class="w-full rounded-lg bg-accent-strong py-2.5 text-sm font-semibold text-white hover:bg-accent">
              {t("dashboardLoginBtn")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const ctxValue = auth.isRemoteSession ? { onLogout: auth.logout } : {};
  return <DashboardAuthCtx.Provider value={ctxValue}>{children}</DashboardAuthCtx.Provider>;
}

export function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <LoginGate>
          <Dashboard />
        </LoginGate>
      </ThemeProvider>
    </I18nProvider>
  );
}
