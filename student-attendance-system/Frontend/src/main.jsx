import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './FrontEnd/contexts/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider>
      <GoogleOAuthProvider clientId='309879207863-ocn08411r2lba5ej9ma8393jseof9b96.apps.googleusercontent.com'>
        <App />
      </GoogleOAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)