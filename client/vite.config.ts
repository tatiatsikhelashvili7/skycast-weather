import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // `host: true` makes Vite listen on all network interfaces (0.0.0.0)
    // so tunnel services (cloudflared / localtunnel) can reach it.
    host: true,
    // Accept any Host header — required when the app is reached through
    // a tunnel that rewrites the hostname (e.g. `*.trycloudflare.com`).
    // Safe for dev; production uses the static build served by Express.
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:5000",
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
