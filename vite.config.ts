import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/bosch": {
        target: "https://hmi-demo.remote-manager.us-1.bosch-iot-suite.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bosch/, ""),
      },
      "/api/modbus": {
        target: "http://10.189.230.81:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/modbus/, ""),
      },
      "/api/camera": {
        target: "http://10.189.230.71",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/camera/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
