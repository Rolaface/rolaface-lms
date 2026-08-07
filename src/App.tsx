import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useBootstrapFromERP } from "./hooks/Accounting/useBootstrapFromERP";
import { router } from "./routes/AppRoutes";
import { queryClient } from "./config/queryClient";

import "./App.css";

function App() {
  useBootstrapFromERP();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

export default App;