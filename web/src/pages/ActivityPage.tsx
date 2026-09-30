import { useEffect, useState } from "preact/hooks";
import { useT } from "../../../shared/i18n/context";
import { ErrorsPage } from "./ErrorsPage";
import { LogsPage } from "./LogsPage";
import { UsageStats } from "./UsageStats";

export type ActivityTab = "requests" | "errors" | "usage";

interface ActivityPageProps {
  initialTab?: ActivityTab;
  unreadErrors?: number;
}

export function ActivityPage({ initialTab = "requests", unreadErrors = 0 }: ActivityPageProps) {
  const t = useT();
  const [tab, setTab] = useState<ActivityTab>(initialTab);

  useEffect(() => setTab(initialTab), [initialTab]);

  const tabs: Array<{ id: ActivityTab; label: string }> = [
    { id: "requests", label: t("activityRequests") },
    { id: "errors", label: `${t("errorsTab")}${unreadErrors > 0 ? ` ${unreadErrors}` : ""}` },
    { id: "usage", label: t("activityUsage") },
  ];

  return (
    <div class="flex flex-col gap-5">
      <div role="tablist" aria-label={t("activity")} class="flex border-b border-nx-border">
        {tabs.map((item) => (
          <button
            type="button"
            role="tab"
            id={`activity-${item.id}`}
            aria-controls="activity-panel"
            tabIndex={tab === item.id ? 0 : -1}
            aria-selected={tab === item.id}
            key={item.id}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => {
              const index = tabs.findIndex((entry) => entry.id === item.id);
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault();
              setTab(tabs[next].id);
              document.getElementById(`activity-${tabs[next].id}`)?.focus();
            }}
            class={`border-b-2 px-4 py-2.5 text-sm font-medium ${tab === item.id ? "border-accent text-accent-strong" : "border-transparent text-muted hover:text-ink"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="activity-panel" aria-labelledby={`activity-${tab}`}>
        {tab === "requests" && <LogsPage embedded />}
        {tab === "errors" && <ErrorsPage />}
        {tab === "usage" && <UsageStats embedded />}
      </div>
    </div>
  );
}
