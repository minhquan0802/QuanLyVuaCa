import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import AppRoutes from './routes/app-routes';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);
