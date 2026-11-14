export type RateLimiter = {
  check(key: string): boolean;
};

export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const now = opts.now ?? Date.now;
  const entries = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): boolean {
      const current = now();
      const entry = entries.get(key);

      if (!entry || current >= entry.resetAt) {
        entries.set(key, { count: 1, resetAt: current + opts.windowMs });
        return true;
      }

      if (entry.count >= opts.limit) {
        return false;
      }

      entry.count += 1;
      return true;
    },
  };
}
