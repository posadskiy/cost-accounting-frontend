import { initFaro } from "@/lib/observability/faro";
initFaro();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { withFaroRouterInstrumentation } from "@grafana/faro-react";
import App from "./App";
import RequireAuth from "./components/RequireAuth";

// Lazy-load page components for smaller initial bundle
import Home from "./app/page";
import LoginPage from "./app/login/page";
import RegisterPage from "./app/register/page";
import ProjectSelectionPage from "./app/project-selection/page";
import DashboardPage from "./app/dashboard/page";
import AddPage from "./app/add/page";
import StatisticsEventsPage from "./app/statistics/events/page";
import StatisticsChartPage from "./app/statistics/chart/page";
import SettingsLayout from "./app/settings/SettingsLayout";
import SettingsProfilePage from "./app/settings/profile/page";
import SettingsCategoriesPage from "./app/settings/categories/page";
import SettingsLimitsPage from "./app/settings/limits/page";
import SettingsGeneralPage from "./app/settings/general/page";
import SettingsMembersPage from "./app/settings/members/page";
import SettingsInvitesPage from "./app/settings/invites/page";

const router = withFaroRouterInstrumentation(createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "project-selection", element: <ProjectSelectionPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "add", element: <AddPage /> },
          { path: "statistics/events", element: <StatisticsEventsPage /> },
          { path: "statistics/chart", element: <StatisticsChartPage /> },
          {
            path: "settings",
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="/settings/profile" replace /> },
              { path: "profile", element: <SettingsProfilePage /> },
              { path: "categories", element: <SettingsCategoriesPage /> },
              { path: "limits", element: <SettingsLimitsPage /> },
              { path: "general", element: <SettingsGeneralPage /> },
              { path: "members", element: <SettingsMembersPage /> },
              { path: "invites", element: <SettingsInvitesPage /> },
            ],
          },
          { path: "me/profile", element: <Navigate to="/settings/profile" replace /> },
          { path: "me/categories", element: <Navigate to="/settings/categories" replace /> },
          { path: "purchase/new", element: <Navigate to="/add" replace /> },
          { path: "income/new", element: <Navigate to="/add" replace /> },
        ],
      },
    ],
  },
]));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
