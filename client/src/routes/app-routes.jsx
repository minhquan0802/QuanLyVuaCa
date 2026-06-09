import { Routes, Route } from 'react-router-dom';
import Login from '../pages/auth/login';
import Home from '../pages/customer/home';
import ProductDetail from '../pages/customer/product-detail';
import Cart from '../pages/customer/cart';
import Checkout from '../pages/customer/checkout';
import Register from '../pages/auth/register';
import OrderSuccess from '../pages/customer/OrderSuccess';
import OrderFailed from '../pages/customer/OrderFailed';
import ThongTinDonHang from '../pages/customer/ThongTinDonHang';
import Profile from '../pages/customer/Profile';

// Import Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import QuanLyLoaiCa from '../pages/admin/QuanLyLoaiCa';
import QuanLyTaiKhoan from '../pages/admin/QuanLyTaiKhoan';
import QuanLyDonHang from '../pages/admin/QuanLyDonHang';
import QuanLyBangGia from '../pages/admin/QuanLyBangGia';
import QuanLyKho from '../pages/admin/QuanLyKho';
// Import Component bảo vệ vừa tạo
import PrivateAdminRoute from './PrivateAdminRoute';
import ProtectedRoute from './ProtectedRoute';
export default function AppRoutes() {
    return (
        <Routes>
            {/* --- Public Routes (Ai cũng vào được) --- */}
            <Route path='/' element={<Login />} />
            <Route path='/register' element={<Register />} />



            <Route element={<ProtectedRoute />}>
                <Route path='/home' element={<Home />} />
                <Route path='/product-detail' element={<ProductDetail />} />
                <Route path='/product-detail/:product_id' element={<ProductDetail />} />
                <Route path='/cart' element={<Cart />} />
                <Route path='/checkout' element={<Checkout />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/order-success' element={<OrderSuccess />} />
                <Route path='/order-failed' element={<OrderFailed />} />
                <Route path='/my-orders' element={<ThongTinDonHang />} />
            </Route>

            
            {/* --- Protected Admin Routes (Phải là Admin mới vào được) --- */}
            {/* Bọc tất cả route admin bên trong Route này */}
            <Route element={<PrivateAdminRoute />}>
                <Route path='/admin' element={<AdminDashboard />} />
                <Route path='/admin/QuanLyLoaiCa' element={<QuanLyLoaiCa />} />
                <Route path='/admin/QuanLyTaiKhoan' element={<QuanLyTaiKhoan />} />
                <Route path='/admin/QuanLyDonHang' element={<QuanLyDonHang />} />
                <Route path='/admin/QuanLyBangGia' element={<QuanLyBangGia />} />
                <Route path='/admin/QuanLyKho' element={<QuanLyKho />} />
            </Route>

        </Routes>
    )
}