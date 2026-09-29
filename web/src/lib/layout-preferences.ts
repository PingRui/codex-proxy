export type LayoutMode = "sidebar" | "top";

const LAYOUT_MODE_KEY = "codex-proxy-layout-mode";

export function getLayoutMode(): LayoutMode {
  migrateLegacyLayoutMode();
  return "sidebar";
}

export function migrateLegacyLayoutMode(): void {
  try {
    const saved = localStorage.getItem(LAYOUT_MODE_KEY);
    if (saved === "top" || saved === "tabs") {
      localStorage.setItem(LAYOUT_MODE_KEY, "sidebar");
    }
  } catch {
  }
}

export function saveLayoutMode(_mode: LayoutMode): void {
  try {
    localStorage.setItem(LAYOUT_MODE_KEY, "sidebar");
  } catch {
  }
}
