import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import RequireAuth from "./components/RequireAuth";

// Lazy-load page components for smaller initial bundle
import Home from "./app/page";
import LoginPage from "./app/login/page";
import RegisterPage from "./app/register/page";
import ProfilePage from "./app/me/profile/page";
import CategoriesPage from "./app/me/categories/page";
import StatisticsEventsPage from "./app/statistics/events/page";
import StatisticsChartPage from "./app/statistics/chart/page";
import NewIncomePage from "./app/income/new/page";
import NewPurchasePage from "./app/purchase/new/page";

const router = createBrowserRouter([
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
          { path: "me/profile", element: <ProfilePage /> },
          { path: "me/categories", element: <CategoriesPage /> },
          { path: "statistics/events", element: <StatisticsEventsPage /> },
          { path: "statistics/chart", element: <StatisticsChartPage /> },
          { path: "income/new", element: <NewIncomePage /> },
          { path: "purchase/new", element: <NewPurchasePage /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
