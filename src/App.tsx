import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useBootstrapFromERP } from "./hooks/Accounting/useBootstrapFromERP";
import { router } from "./routes/AppRoutes";
import { queryClient } from "./config/queryClient";
import { GlobalModalHandler } from "./components/GlobalModal/GlobalModalHandler";
import "./App.css";
import { MinimizedTaskbar } from "./components/shared/MinimizedTaskbar";

function App() {
  useBootstrapFromERP();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <GlobalModalHandler />
      <MinimizedTaskbar />
    </QueryClientProvider>
  );
}

export default App;