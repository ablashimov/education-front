import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom-v5-compat';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import './index.css';

import { NotificationProvider } from './context/NotificationContext';

createRoot(document.getElementById('root')!).render(
  <Router>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </Router>,
);
