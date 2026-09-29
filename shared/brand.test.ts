import { describe, expect, it } from "vitest";
import {
  APP_BRAND,
  APP_DISPLAY_NAME,
  APP_DESCRIPTOR,
  APP_REPOSITORY,
  APP_REPOSITORY_URL,
} from "./brand";

describe("NEXORA brand identity", () => {
  it("exposes one canonical product identity", () => {
    expect(APP_BRAND).toBe("NEXORA");
    expect(APP_DISPLAY_NAME).toBe("NEXORA · 星枢");
    expect(APP_DESCRIPTOR).toBe("Multi-Account AI Gateway");
    expect(APP_REPOSITORY).toBe("PingRui/codex-proxy");
    expect(APP_REPOSITORY_URL).toBe("https://github.com/PingRui/codex-proxy");
  });
});
