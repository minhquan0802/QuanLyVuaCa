import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './styles/index.css';

// Tầng quản lý trạng thái Đăng nhập tập trung (Không dùng localStorage)
import { AuthProvider, useAuth } from './context/AuthContext';

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

// Giao diện chung cho Khách hàng & Khách vãng lai
const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Header />
    <main className="flex-grow flex flex-col w-full">
      <Outlet />
    </main>
    <Footer />
  </div>
);

// Màn hình chờ đồng bộ khi ứng dụng đang quét Cookie hệ thống
const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-2">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      <p className="text-gray-600 font-medium">Đang kiểm tra phiên đăng nhập...</p>
    </div>
  </div>
);

// 🔒 CHỐT CHẶN 1: Bảo vệ các trang nội bộ bắt buộc phải ĐĂNG NHẬP
const ProtectedUserRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// 🔒 CHỐT CHẶN 2: Bảo vệ khu vực Quản trị tối cao (Yêu cầu vai trò ADMIN)
const ProtectedAdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  // Kiểm tra chính xác chuỗi hoa thường từ hệ thống Backend
  return user.vaitro?.toString().toUpperCase() === 'ADMIN' 
    ? <Outlet /> 
    : <Navigate to="/home" replace />;
};

// 🔓 CHỐT CHẶN 3: Chống việc quay lại trang Login/Register sau khi đã có Session đăng nhập ổn định
const AnonymousRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // Trả về rỗng để nhường luồng xử lý cho API login nội bộ chuyển hướng trực tiếp

  if (user) {
    return user.vaitro?.toString().toUpperCase() === 'ADMIN' 
      ? <Navigate to="/admin/dashboard" replace /> 
      : <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ================= AREA 1: KHU VỰC PUBLIC LAYOUT (USER & GUEST) ================= */}
          <Route element={<PublicLayout />}>

            {/* Điều hướng gốc mặc định sang màn hình Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Nhóm các trang CHƯA đăng nhập mới được vào */}
            <Route element={<AnonymousRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Các trang Công khai hoàn toàn (Khách và User đều xem được độc lập) */}
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />

            {/* Các trang Nghiệp vụ Mua hàng & Hồ sơ tư cá nhân (BẮT BUỘC ĐĂNG NHẬP) */}
            <Route element={<ProtectedUserRoute />}>
              <Route path="/home" element={<Home />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failure" element={<PaymentFailure />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<OrderTracking />} />
            </Route>

          </Route>

          {/* ================= AREA 2: KHU VỰC BACKOFFICE (ADMIN MANAGEMENT) ================= */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="prices" element={<PriceListManagement />} />
              <Route path="accounts" element={<AccountManagement />} />
            </Route>
          </Route>

          {/* 404 Emergency Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);