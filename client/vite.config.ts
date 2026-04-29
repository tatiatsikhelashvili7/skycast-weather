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
  build: {
    // Split the heaviest third-party libraries into their own chunks so
    // repeat visitors hit cache for everything except our own code and
    // the initial parse cost is spread across parallel HTTP requests.
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          socket: ["socket.io-client"],
          leaflet: ["leaflet", "react-leaflet"],
        },
      },
    },
    // Tighten the warning limit — our individual chunks should stay
    // under 300 kB; anything larger deserves a second look.
    chunkSizeWarningLimit: 300,
  },
});
