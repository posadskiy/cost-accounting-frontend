import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import faroUploader from "@grafana/faro-rollup-plugin";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Upload source maps to Grafana Cloud only during production builds.
    // Requires GRAFANA_FARO_API_KEY to be set in the build environment.
    // In Docker: pass via --build-arg GRAFANA_FARO_API_KEY=<key>
    // In CI: set as a secret env var before running the build.
    mode === "production" && !!process.env.GRAFANA_OBSERVABILITY_FARO_TOKEN
      ? faroUploader({
        appName: "costy",
        endpoint: "https://faro-api-prod-eu-west-2.grafana.net/faro/api/v1",
        appId: "5466",
        stackId: "1586681",
        verbose: true,
        apiKey: process.env.GRAFANA_OBSERVABILITY_FARO_TOKEN,
        gzipContents: true,
      })
      : false,
  ],
  build: {
    // 'hidden' generates .map files (picked up by faroUploader) but does NOT
    // add sourceMappingURL comments to the JS bundles, so browsers never
    // download the maps — source stays private.
    sourcemap: "hidden",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
}));
