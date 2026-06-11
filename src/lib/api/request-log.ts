const ENABLED =
  process.env.VORTEX_DEBUG_API === "1" ||
  process.env.NODE_ENV !== "production";

export type RequestLog = {
  step: (phase: string, detail?: Record<string, unknown>) => void;
  done: (status: number, detail?: Record<string, unknown>) => void;
};

export function createRequestLog(scope: string): RequestLog {
  const startedAt = performance.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  const prefix = `[vortex:${scope}:${requestId}]`;

  const step = (phase: string, detail?: Record<string, unknown>) => {
    if (!ENABLED) return;
    const ms = Math.round(performance.now() - startedAt);
    if (detail) {
      console.log(`${prefix} +${ms}ms ${phase}`, detail);
    } else {
      console.log(`${prefix} +${ms}ms ${phase}`);
    }
  };

  const done = (status: number, detail?: Record<string, unknown>) => {
    if (!ENABLED) return;
    const ms = Math.round(performance.now() - startedAt);
    if (detail) {
      console.log(`${prefix} +${ms}ms done status=${status}`, detail);
    } else {
      console.log(`${prefix} +${ms}ms done status=${status}`);
    }
  };

  return { step, done };
}
