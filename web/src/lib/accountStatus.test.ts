import { describe, expect, it } from "vitest";
import type { AccountQuota } from "../../../shared/types";
import { isQuotaExhausted } from "./accountStatus";

describe("isQuotaExhausted", () => {
  it("detects top-level secondary quota exhaustion", () => {
    const quota: AccountQuota = {
      rate_limit: { remaining_percent: 80 },
      secondary_rate_limit: { limit_reached: true },
    };

    expect(isQuotaExhausted(quota)).toBe(true);
  });

  it("detects model-specific primary and nested secondary exhaustion", () => {
    expect(isQuotaExhausted({
      rate_limits_by_limit_id: {
        image_generation: { limit_reached: true },
      },
    })).toBe(true);

    expect(isQuotaExhausted({
      rate_limits_by_limit_id: {
        image_generation: {
          remaining_percent: 100,
          secondary_rate_limit: { limit_reached: true },
        },
      },
    })).toBe(true);
  });

  it("does not treat healthy model-specific buckets as exhausted", () => {
    expect(isQuotaExhausted({
      rate_limits_by_limit_id: {
        image_generation: {
          remaining_percent: 100,
          secondary_rate_limit: { remaining_percent: 50 },
        },
      },
    })).toBe(false);
  });
});
