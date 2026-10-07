import { Injectable } from "@nestjs/common";

@Injectable()
export class MetricsService {
  private requests = 0;
  private errors = 0;
  private durationTotalMs = 0;
  private durationBuckets = { le50: 0, le200: 0, le1000: 0, over1000: 0 };

  record(status: number, durationMs: number) {
    this.requests++;
    if (status >= 400) this.errors++;
    this.durationTotalMs += durationMs;
    if (durationMs <= 50) this.durationBuckets.le50++;
    else if (durationMs <= 200) this.durationBuckets.le200++;
    else if (durationMs <= 1000) this.durationBuckets.le1000++;
    else this.durationBuckets.over1000++;
  }
  snapshot() {
    return {
      requests: this.requests,
      errors: this.errors,
      averageDurationMs: this.requests
        ? Math.round(this.durationTotalMs / this.requests)
        : 0,
      durationBucketsMs: { ...this.durationBuckets },
    };
  }
}
