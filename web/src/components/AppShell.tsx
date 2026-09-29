import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { APP_BRAND } from "../../../shared/brand";
import { useT } from "../../../shared/i18n/context";
import { Sidebar } from "./Sidebar";

export interface AppShellProps {
  activeHash: string;
  unreadErrors: number;
  children: ComponentChildren;
  onOpenSidebar: () => void;
  mobileSidebarOpen?: boolean;
  onCloseSidebar?: () => void;
  uptimeSeconds?: number | null;
  toolbar?: ComponentChildren;
  footer?: ComponentChildren;
}

export function AppShell({
  activeHash,
  unreadErrors,
  children,
  onOpenSidebar,
  mobileSidebarOpen = false,
  onCloseSidebar,
  uptimeSeconds = null,
  toolbar,
  footer,
}: AppShellProps) {
  const t = useT();
  const sidebarTriggerRef = useRef<HTMLButtonElement>(null);
  const wasSidebarOpenRef = useRef(mobileSidebarOpen);

  useEffect(() => {
    if (wasSidebarOpenRef.current && !mobileSidebarOpen) {
      sidebarTriggerRef.current?.focus();
    }
    wasSidebarOpenRef.current = mobileSidebarOpen;
  }, [mobileSidebarOpen]);

  return (
    <div class="min-h-screen bg-canvas text-ink">
      <Sidebar
        activeHash={activeHash}
        unreadErrors={unreadErrors}
        uptimeSeconds={uptimeSeconds}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={onCloseSidebar}
      />

      <div class="flex min-h-screen min-w-0 flex-col lg:pl-60">
        <header class="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-nx-border bg-surface px-3 sm:px-5">
          <button
            ref={sidebarTriggerRef}
            type="button"
            onClick={onOpenSidebar}
            class="mr-2 inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-ink lg:hidden"
            aria-label={t("openSidebar")}
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span class="text-sm font-semibold tracking-[-0.01em] text-ink lg:hidden">{APP_BRAND}</span>
          <div class="ml-auto flex min-w-0 items-center justify-end">{toolbar}</div>
        </header>

        <main class="flex-1 px-4 py-7 sm:px-7 lg:px-9 lg:py-9 xl:px-12">
          <div class="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
        {footer}
      </div>
    </div>
  );
}
