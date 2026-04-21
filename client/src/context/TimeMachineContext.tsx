import { createContext, useContext, useMemo, useState, ReactNode } from "react";

/**
 * One preview frame emitted by the Time Machine slider. Everything the
 * Dynamic Background needs to paint a "what the sky would look like then"
 * snapshot lives on this object.
 */
export interface TimeMachineFrame {
  /** Hour of day (0–24, fractional allowed) for the previewed moment. */
  hour: number;
  /** Weather main condition of the frame (e.g. `"Clear"`, `"Rain"`). */
  condition: string;
  /** Icon code of the frame (e.g. `"01d"`, `"10n"`). */
  icon: string;
}

interface TimeMachineContextValue {
  /**
   * Currently-previewed frame, or `null` when nothing is being scrubbed.
   * Consumers should treat `null` as "show the real current weather".
   */
  frame: TimeMachineFrame | null;
  /** Set or clear the active preview frame. Pass `null` to deactivate. */
  setFrame: (frame: TimeMachineFrame | null) => void;
}

const TimeMachineContext = createContext<TimeMachineContextValue | null>(null);

/**
 * Provider for the Time Machine slider. Any component (most notably
 * `DynamicBackground`) subscribes via `useTimeMachine()` and re-renders
 * when the user scrubs through the forecast.
 */
export function TimeMachineProvider({ children }: { children: ReactNode }) {
  const [frame, setFrame] = useState<TimeMachineFrame | null>(null);
  const value = useMemo(() => ({ frame, setFrame }), [frame]);
  return (
    <TimeMachineContext.Provider value={value}>
      {children}
    </TimeMachineContext.Provider>
  );
}

/**
 * Read the current preview frame. Must be called inside
 * `<TimeMachineProvider>` — throws otherwise so we catch missed wraps
 * during development.
 */
export function useTimeMachine(): TimeMachineContextValue {
  const ctx = useContext(TimeMachineContext);
  if (!ctx) {
    throw new Error(
      "useTimeMachine must be used inside <TimeMachineProvider>"
    );
  }
  return ctx;
}
