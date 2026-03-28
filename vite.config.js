import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["lewis-uncondoled-kolton.ngrok-free.dev","10.175.60.114"],
  },
  preview: {
    allowedHosts: ["lewis-uncondoled-kolton.ngrok-free.dev","10.175.60.114"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
