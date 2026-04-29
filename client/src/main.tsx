import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { WeatherProvider } from "./hooks/useWeather";
import "./styles/index.css";
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WeatherProvider>
          <App />
        </WeatherProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>);
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => { }));
    });
}
