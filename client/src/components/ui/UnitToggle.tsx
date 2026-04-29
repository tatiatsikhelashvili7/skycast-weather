import { useUnits } from "../../context/UnitsContext";
export function UnitToggle() {
    const { unit, setUnit } = useUnits();
    return (<div className="glass rounded-2xl p-1 flex text-sm">
      {(["C", "F"] as const).map((u) => (<button key={u} onClick={() => setUnit(u)} className={`px-3 py-2 rounded-xl transition-all ${unit === u
                ? "bg-white/20 text-white font-semibold"
                : "text-white/60 hover:text-white"}`} aria-label={`Switch to ${u === "C" ? "Celsius" : "Fahrenheit"}`}>
          °{u}
        </button>))}
    </div>);
}
