import { RouterProvider } from "@tanstack/react-router";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from '@mantine/modals';
import {
  QueryClientProvider,
} from "@tanstack/react-query";

// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { router } from "./routes/AppRoutes";
import { queryClient } from "../src/config/queryClient";

import "@mantine/core/styles.css";
import "./App.css";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <ModalsProvider>
        <RouterProvider router={router} />
</ModalsProvider>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;