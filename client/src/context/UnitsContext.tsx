import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Unit = "C" | "F";

interface UnitsValue {
  unit: Unit;
  setUnit: (u: Unit) => void;
  toUnit: (tempC: number) => number;
  formatTemp: (tempC: number, withDegree?: boolean) => string;
  windUnit: "m/s" | "km/h" | "mph";
  formatWind: (msSpeed: number) => string;
}

const UnitsContext = createContext<UnitsValue | null>(null);

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<Unit>(() => {
    const stored = localStorage.getItem("skycast_unit");
    return stored === "F" ? "F" : "C";
  });

  useEffect(() => {
    localStorage.setItem("skycast_unit", unit);
  }, [unit]);

  const toUnit = (tempC: number) =>
    unit === "F" ? tempC * 9 / 5 + 32 : tempC;

  const formatTemp = (tempC: number, withDegree = true) => {
    const v = Math.round(toUnit(tempC));
    return withDegree ? `${v}°` : String(v);
  };

  const windUnit = unit === "F" ? "mph" : "km/h";

  const formatWind = (ms: number) => {
    const v = unit === "F" ? ms * 2.23694 : ms * 3.6;
    return `${v.toFixed(1)} ${windUnit}`;
  };

  return (
    <UnitsContext.Provider
      value={{ unit, setUnit: setUnitState, toUnit, formatTemp, windUnit, formatWind }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits(): UnitsValue {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used within UnitsProvider");
  return ctx;
}
