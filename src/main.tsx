// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css'; // Your global styles

// Create a client for TanStack Query
const queryClient = new QueryClient();

// This async function allows us to wait for dev-only setup to complete
// before rendering the application.
const startApp = async () => {
  // Only run development-specific code in development mode.
  // This block will be completely removed in production builds.
  if (import.meta.env.DEV) {
    // For robust mocking, dynamically import and start MSW.
    // The seeder will likely make API calls, so the mock server
    // must be running first.
    const { worker } = await import('./mocks/browser');
    await worker.start();

    // Dynamically import the seeder to keep it out of the production bundle.
    const { seedDatabase } = await import('./seed.ts');
    await seedDatabase();
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
};

// Start the application
startApp();