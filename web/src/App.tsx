import { Outlet } from "react-router-dom";
import Providers from "./app/providers";
import ConditionalShell from "./components/ConditionalShell";
import "./app/globals.css";

export default function App() {
  return (
    <Providers>
      <ConditionalShell>
        <Outlet />
      </ConditionalShell>
    </Providers>
  );
}
