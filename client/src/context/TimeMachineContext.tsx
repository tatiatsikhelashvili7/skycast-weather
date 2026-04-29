import { createContext, useContext, useMemo, useState, ReactNode } from "react";
export interface TimeMachineFrame {
    hour: number;
    condition: string;
    icon: string;
    isDay: boolean;
}
interface TimeMachineContextValue {
    frame: TimeMachineFrame | null;
    setFrame: (frame: TimeMachineFrame | null) => void;
}
const TimeMachineContext = createContext<TimeMachineContextValue | null>(null);
export function TimeMachineProvider({ children }: {
    children: ReactNode;
}) {
    const [frame, setFrame] = useState<TimeMachineFrame | null>(null);
    const value = useMemo(() => ({ frame, setFrame }), [frame]);
    return (<TimeMachineContext.Provider value={value}>
      {children}
    </TimeMachineContext.Provider>);
}
export function useTimeMachine(): TimeMachineContextValue {
    const ctx = useContext(TimeMachineContext);
    if (!ctx) {
        throw new Error("useTimeMachine must be used inside <TimeMachineProvider>");
    }
    return ctx;
}
