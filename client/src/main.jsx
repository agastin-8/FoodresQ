import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DonationProvider } from './context/DonationContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DonationProvider>
          <App />
        </DonationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
