import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { PerfHud } from "./components/ui/PerfHud";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
function RouteFallback() {
    return (<div className="min-h-[100svh] flex items-center justify-center">
      <div className="text-white/50 text-sm tracking-wider uppercase">
        Loading…
      </div>
    </div>);
}
export default function App() {
    const perf = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("perf") === "1";
    return (<>
      {import.meta.env.DEV && perf && <PerfHud />}
      <Routes>
        <Route path="/" element={<Dashboard />}/>
        <Route path="/login" element={<Suspense fallback={<RouteFallback />}>
              <Login />
            </Suspense>}/>
        <Route path="/register" element={<Suspense fallback={<RouteFallback />}>
              <Register />
            </Suspense>}/>
      </Routes>
    </>);
}
