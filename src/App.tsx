import { RouterProvider } from '@tanstack/react-router';
import { MantineProvider } from '@mantine/core';
import { router } from './routes/AppRoutes';

import '@mantine/core/styles.css'; 
import './App.css';

function App() {
  return (
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  );
}

export default App;