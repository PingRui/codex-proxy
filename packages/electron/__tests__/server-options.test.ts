import { describe, expect, it } from "vitest";
import {
  DESKTOP_SERVER_OPTIONS,
  desktopServerOptionsWithRandomPort,
} from "../electron/server-options.js";

describe("Electron server options", () => {
  it("starts the desktop app in loopback-only manual account mode", () => {
    expect(DESKTOP_SERVER_OPTIONS).toEqual({
      host: "127.0.0.1",
      manualAccountMode: true,
    });
  });

  it("keeps the same security and routing settings for the random-port fallback", () => {
    expect(desktopServerOptionsWithRandomPort()).toEqual({
      host: "127.0.0.1",
      manualAccountMode: true,
      port: 0,
    });
  });
});
