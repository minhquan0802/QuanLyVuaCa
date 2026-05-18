import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './styles/index.css';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import OrderManagement from './pages/admin/OrderManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import PriceListManagement from './pages/admin/PriceListManagement';
import AccountManagement from './pages/admin/AccountManagement';

import Home from './pages/customer/Home';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import PaymentSuccess from './pages/customer/PaymentSuccess';
import PaymentFailure from './pages/customer/PaymentFailure';
import Profile from './pages/customer/Profile';
import OrderTracking from './pages/customer/OrderTracking';

const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Header />
    <main className="flex-grow flex flex-col w-full">
      <Outlet />
    </main>
    <Footer />
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failure" element={<PaymentFailure />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<OrderTracking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="prices" element={<PriceListManagement />} />
          <Route path="accounts" element={<AccountManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
