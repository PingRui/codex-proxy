import { describe, expect, it } from "vitest";
import { resolveListenHost } from "@src/server-options.js";

describe("resolveListenHost", () => {
  it("forces desktop manual-account mode to the explicit loopback host", () => {
    expect(resolveListenHost("0.0.0.0", true, {
      host: "127.0.0.1",
      manualAccountMode: true,
    })).toBe("127.0.0.1");
  });

  it("defaults desktop manual-account mode to loopback", () => {
    expect(resolveListenHost("0.0.0.0", true, {
      manualAccountMode: true,
    })).toBe("127.0.0.1");
  });

  it("preserves local.yaml precedence outside desktop manual mode", () => {
    expect(resolveListenHost("0.0.0.0", true, {
      host: "127.0.0.1",
    })).toBe("0.0.0.0");
  });
});
