import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { DesktopUpdateBridge, DesktopUpdateStatus } from "../../../shared/desktop-updates";
import { useT } from "../../../shared/i18n/context";
import { UpdateModal } from "./UpdateModal";

export function DesktopUpdateControl({ bridge }: { bridge: DesktopUpdateBridge }) {
  const t = useT();
  const [state, setState] = useState<DesktopUpdateStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const mounted = useRef(false);
  const commandBusy = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let reading = false;
    const load = async () => {
      if (reading) return;
      reading = true;
      try { const next = await bridge.status(); if (mounted.current) setState(next); }
      catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : String(cause)); }
      finally { reading = false; }
    };
    void load();
    const timer = setInterval(load, 1000);
    return () => { mounted.current = false; clearInterval(timer); };
  }, [bridge]);

  const run = useCallback(async (action: "check" | "download" | "install") => {
    if (commandBusy.current) return;
    commandBusy.current = true;
    setPending(true);
    setError(null);
    try { const next = await bridge[action](); if (mounted.current) setState(next); }
    catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { commandBusy.current = false; if (mounted.current) setPending(false); }
  }, [bridge]);

  const checking = pending || state?.checking;
  return <>
    <button type="button" class="nx-button" onClick={() => { setOpen(true); if (state?.supported && !state.updateAvailable && !state.downloading && !state.downloaded) void run("check"); }}>
      {state?.downloaded ? t("desktopRestartUpdate") : state?.downloading ? `${t("desktopDownloading")} ${state.progress}%` : state?.updateAvailable ? t("updateAvailable") : t("checkForUpdates")}
    </button>
    <UpdateModal open={open} onClose={() => setOpen(false)} mode="electron" commits={[]} changelog={null} release={null}
      onApply={() => {}} applying={false} restarting={state?.installing ?? false} restartFailed={false}
      desktopUpdate={state} desktopError={error} desktopBusy={!!checking}
      onDesktopCheck={() => void run("check")} onDesktopDownload={() => void run("download")} onDesktopInstall={() => void run("install")} />
  </>;
}
