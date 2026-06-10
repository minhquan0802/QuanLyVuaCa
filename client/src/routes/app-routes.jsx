import { Routes, Route, Outlet } from 'react-router-dom';
import Login from '../pages/auth/login';
import Register from '../pages/auth/register';

// Customer pages
import Home from '../pages/customer/home';
import ProductDetail from '../pages/customer/product-detail';
import Cart from '../pages/customer/cart';
import Checkout from '../pages/customer/checkout';
import Profile from '../pages/customer/Profile';
import OrderSuccess from '../pages/customer/OrderSuccess';
import OrderFailed from '../pages/customer/OrderFailed';
import ThongTinDonHang from '../pages/customer/ThongTinDonHang';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import QuanLyLoaiCa from '../pages/admin/QuanLyLoaiCa';
import QuanLyTaiKhoan from '../pages/admin/QuanLyTaiKhoan';
import QuanLyDonHang from '../pages/admin/QuanLyDonHang';
import QuanLyBangGia from '../pages/admin/QuanLyBangGia';
import QuanLyKho from '../pages/admin/QuanLyKho';

// Components
import ProtectedRoute from './ProtectedRoute';
import Header from '../components/header';

function CustomerLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/register' element={<Register />} />

            <Route element={<CustomerLayout />}>
                <Route path='/home' element={<Home />} />
                <Route path='/product-detail' element={<ProductDetail />} />
                <Route path='/product-detail/:product_id' element={<ProductDetail />} />
            </Route>

            <Route element={<CustomerLayout />}>
                <Route path='/cart' element={<Cart />} />
                <Route path='/checkout' element={<Checkout />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/order-success' element={<OrderSuccess />} />
                <Route path='/order-failed' element={<OrderFailed />} />
                <Route path='/my-orders' element={<ThongTinDonHang />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route path='/admin' element={<AdminDashboard />} />
                <Route path='/admin/QuanLyLoaiCa' element={<QuanLyLoaiCa />} />
                <Route path='/admin/QuanLyTaiKhoan' element={<QuanLyTaiKhoan />} />
                <Route path='/admin/QuanLyDonHang' element={<QuanLyDonHang />} />
                <Route path='/admin/QuanLyBangGia' element={<QuanLyBangGia />} />
                <Route path='/admin/QuanLyKho' element={<QuanLyKho />} />
            </Route>
        </Routes>
    );
}