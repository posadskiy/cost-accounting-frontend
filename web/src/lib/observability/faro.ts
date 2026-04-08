import { matchRoutes } from "react-router-dom";
import {
  ReactIntegration,
  createReactRouterV6DataOptions,
  faro,
  getWebInstrumentations,
  initializeFaro,
} from "@grafana/faro-react";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

const faroUrl = import.meta.env.VITE_FARO_URL as string | undefined;

/**
 * Initialise Grafana Faro RUM.
 *
 * Must be called once at the very top of main.tsx, before React renders, so
 * that page-load performance entries and early JS errors are captured.
 *
 * When VITE_FARO_URL is not set (local dev without a collector) the function
 * is a no-op — no network calls are made.
 */
export function initFaro(): void {
  if (!faroUrl) {
    return;
  }

  initializeFaro({
    url: faroUrl,
    app: {
      name: "costy",
      version: (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "dev",
      environment: import.meta.env.MODE,
    },

    sessionTracking: {
      // SessionInstrumentation's beforeSend hook drops every signal unless the session is
      // sampled. At 0.1, ~90% of browsers never send RUM — Grafana Frontend Observability
      // looks empty. Use 1 unless you deliberately want sparse ingestion.
      samplingRate: 1,
    },

    instrumentations: [
      // Default set: errors, console, performance, Web Vitals (LCP, CLS, INP).
      ...getWebInstrumentations(),

      // Injects W3C traceparent header into fetch/XHR so backend Micronaut OTel
      // spans are linked to the browser trace root in Grafana Cloud Tempo.
      new TracingInstrumentation(),

      // Tracks React Router v6 navigations as Faro view-change events.
      new ReactIntegration({
        router: createReactRouterV6DataOptions({
          matchRoutes,
        }),
      }),
    ],
  });
}

export { faro };
