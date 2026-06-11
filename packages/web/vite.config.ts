import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    //temporary for cloudflare tunnel
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/.well-known": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // moved to /api/oauth
      "/register": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/token": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
})
