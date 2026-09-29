export const DESKTOP_SERVER_OPTIONS = Object.freeze({
  host: "127.0.0.1",
  manualAccountMode: true,
});

export function desktopServerOptionsWithRandomPort() {
  return {
    ...DESKTOP_SERVER_OPTIONS,
    port: 0,
  };
}
