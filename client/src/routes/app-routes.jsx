import { Routes, Route, Outlet } from "react-router-dom";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";
import XacThucEmail from "../pages/auth/XacThucEmail";
import QuenMatKhau from "../pages/auth/QuenMatKhau";
import DatLaiMatKhau from "../pages/auth/DatLaiMatKhau";

// Customer pages
import Home from "../pages/customer/home";
import ProductDetail from "../pages/customer/product-detail";
import Cart from "../pages/customer/cart";
import Checkout from "../pages/customer/checkout";
import Profile from "../pages/customer/Profile";
import OrderSuccess from "../pages/customer/OrderSuccess";
import OrderFailed from "../pages/customer/OrderFailed";
import ThongTinDonHang from "../pages/customer/ThongTinDonHang";

// Admin pages
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import QuanLyLoaiCa from "../pages/admin/quan-ly-loai-ca/QuanLyLoaiCa";
import QuanLyTaiKhoan from "../pages/admin/quan-ly-tai-khoan/QuanLyTaiKhoan";
import QuanLyDonHang from "../pages/admin/quan-ly-don-hang/QuanLyDonHang";
import QuanLyBangGia from "../pages/admin/quan-ly-bang-gia/QuanLyBangGia";
import QuanLyKho from "../pages/admin/quan-ly-kho/QuanLyKho";
import ThemSuaLoaiCa from "../pages/admin/quan-ly-loai-ca/them-sua-loai-ca/ThemSuaLoaiCa";
import KichCoLoaiCa from "../pages/admin/quan-ly-loai-ca/kich-co-loai-ca/KichCoLoaiCa";
import ThemSuaTaiKhoan from "../pages/admin/quan-ly-tai-khoan/them-sua-tai-khoan/ThemSuaTaiKhoan";
import ThemBangGia from "../pages/admin/quan-ly-bang-gia/them-bang-gia/ThemBangGia";
import TaoDonHang from "../pages/admin/quan-ly-don-hang/tao-don-hang/TaoDonHang";
import ChiTietDonHang from "../pages/admin/quan-ly-don-hang/chi-tiet-don-hang/ChiTietDonHang";
import NhapHang from "../pages/admin/quan-ly-kho/nhap-hang/NhapHang";
import QuanLyThanhLy from "../pages/admin/quan-ly-thanh-ly/QuanLyThanhLy";
import TaoPhieuThanhLy from "../pages/admin/quan-ly-thanh-ly/tao-phieu-thanh-ly/TaoPhieuThanhLy";
import QuanLyCongNo from "../pages/admin/quan-ly-cong-no/QuanLyCongNo";

// Components
import ProtectedRoute from "./ProtectedRoute";
import Header from "../components/header";
import Footer from "../components/footer";

function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/xac-thuc-email" element={<XacThucEmail />} />
      <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
      <Route path="/dat-lai-mat-khau" element={<DatLaiMatKhau />} />

      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/product-detail" element={<ProductDetail />} />
        <Route path="/product-detail/:product_id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/order-failed" element={<OrderFailed />} />
        <Route path="/my-orders" element={<ThongTinDonHang />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/QuanLyLoaiCa" element={<QuanLyLoaiCa />} />
        <Route path="/admin/QuanLyLoaiCa/them" element={<ThemSuaLoaiCa />} />
        <Route path="/admin/QuanLyLoaiCa/sua/:id" element={<ThemSuaLoaiCa />} />
        <Route
          path="/admin/QuanLyLoaiCa/kich-co/:loaicaId"
          element={<KichCoLoaiCa />}
        />
        <Route path="/admin/QuanLyTaiKhoan" element={<QuanLyTaiKhoan />} />
        <Route
          path="/admin/QuanLyTaiKhoan/them"
          element={<ThemSuaTaiKhoan />}
        />
        <Route
          path="/admin/QuanLyTaiKhoan/sua/:id"
          element={<ThemSuaTaiKhoan />}
        />
        <Route path="/admin/QuanLyDonHang" element={<QuanLyDonHang />} />
        <Route path="/admin/QuanLyDonHang/tao-don" element={<TaoDonHang />} />
        <Route
          path="/admin/QuanLyDonHang/chi-tiet/:id"
          element={<ChiTietDonHang />}
        />
        <Route path="/admin/QuanLyBangGia" element={<QuanLyBangGia />} />
        <Route path="/admin/QuanLyBangGia/them" element={<ThemBangGia />} />
        <Route path="/admin/QuanLyKho" element={<QuanLyKho />} />
        <Route path="/admin/QuanLyKho/nhap-hang" element={<NhapHang />} />
        <Route path="/admin/QuanLyThanhLy" element={<QuanLyThanhLy />} />
        <Route
          path="/admin/QuanLyThanhLy/tao-phieu"
          element={<TaoPhieuThanhLy />}
        />
        <Route path="/admin/QuanLyCongNo" element={<QuanLyCongNo />} />
      </Route>
    </Routes>
  );
}
