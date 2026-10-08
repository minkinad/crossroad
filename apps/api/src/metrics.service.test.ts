import { describe, expect, it } from "vitest";
import { MetricsService } from "./metrics.service";

describe("HTTP metrics", () => {
  it("counts errors and duration buckets without storing request paths", () => {
    const metrics = new MetricsService();
    metrics.record(200, 40);
    metrics.record(404, 180);
    metrics.record(500, 1100);
    expect(metrics.snapshot()).toEqual({
      requests: 3,
      errors: 2,
      averageDurationMs: 440,
      durationBucketsMs: { le50: 1, le200: 1, le1000: 0, over1000: 1 },
    });
  });
});
