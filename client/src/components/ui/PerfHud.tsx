import { useEffect, useMemo, useRef, useState } from "react";

type PerfMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

function getMemory(): PerfMemory | null {
  const anyPerf = performance as unknown as { memory?: PerfMemory };
  return anyPerf.memory ?? null;
}

function mb(n: number): number {
  return Math.round((n / (1024 * 1024)) * 10) / 10;
}

export function PerfHud() {
  const [fps, setFps] = useState<number>(0);
  const [memMb, setMemMb] = useState<{ used: number; total: number; limit: number } | null>(null);
  const framesRef = useRef(0);
  const lastRef = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      framesRef.current += 1;
      const dt = t - lastRef.current;
      if (dt >= 500) {
        const f = Math.round((framesRef.current * 1000) / dt);
        framesRef.current = 0;
        lastRef.current = t;
        setFps(f);
        const m = getMemory();
        if (m) setMemMb({ used: mb(m.usedJSHeapSize), total: mb(m.totalJSHeapSize), limit: mb(m.jsHeapSizeLimit) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const memLine = useMemo(() => {
    if (!memMb) return "mem: n/a";
    return `mem: ${memMb.used} / ${memMb.total} MB (limit ${memMb.limit})`;
  }, [memMb]);

  return (
    <div
      className="fixed bottom-3 right-3 z-[9999] pointer-events-none select-none"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
    >
      <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur px-3 py-2 text-[11px] text-white/85">
        <div>fps: {fps}</div>
        <div>{memLine}</div>
        <div className="text-white/50">add `?perf=1` to toggle</div>
      </div>
    </div>
  );
}

