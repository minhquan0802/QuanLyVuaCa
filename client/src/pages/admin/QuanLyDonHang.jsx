import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

// Cấu hình nhãn hiển thị và màu sắc của từng trạng thái đơn hàng
const ORDER_STATUS = {
    "CHO_XAC_NHAN": { label: "Chờ xác nhận", dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    "DANG_DONG_HANG": { label: "Đang đóng hàng", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    "DANG_VAN_CHUYEN": { label: "Đang vận chuyển", dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    "GIAO_HANG_THANH_CONG": { label: "Giao thành công", dot: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200" },
    "HUY": { label: "Đã hủy", dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" }
};

export default function QuanLyDonHang() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- 1. STATE DỮ LIỆU GỐC ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 2. STATE ĐIỀU KHIỂN TÍNH NĂNG ---
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterPayment, setFilterPayment] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // --- 3. GỌI API ---
    useEffect(() => {
        api.get("/Donhangs")
            .then(res => setOrders(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách đơn hàng!", "error"))
            .finally(() => setLoading(false));
    }, []);

    // Reset về trang 1 khi thay đổi bất kỳ bộ lọc nào
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filterPayment, searchTerm]);

    // --- 4. XỬ LÝ LỌC ---
    const processedOrders = useMemo(() => {
        let result = orders.filter(o =>
            (filterStatus === "ALL" || o.trangthaidonhang === filterStatus) &&
            (filterPayment === "ALL" || o.trangthaithanhtoan === filterPayment)
        );

        // Bước 2: Lọc theo Từ khóa tìm kiếm (Mã đơn, Tên KH, SĐT)
        if (searchTerm.trim() !== "") {
            const search = searchTerm.toLowerCase();
            result = result.filter(o =>
                (o.iddonhang || "").toLowerCase().includes(search) ||
                (o.tenKhachHang || "").toLowerCase().includes(search) ||
                (o.sdtKhachHang || "").toLowerCase().includes(search)
            );
        }

        return result;
    }, [orders, filterStatus, filterPayment, searchTerm]);

    // --- 5. XỬ LÝ PHÂN TRANG ---
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return processedOrders.slice(startIndex, startIndex + pageSize);
    }, [processedOrders, currentPage]);

    const totalPages = Math.ceil(processedOrders.length / pageSize);

    return (
        <AdminLayout title="Quản Lý Đơn Hàng">

            {/* THANH CÔNG CỤ: TÌM KIẾM & TẠO ĐƠN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-md flex items-center">
                    <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn, khách hàng, sđt..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-xs transition-all text-sm bg-white"
                    />
                </div>
                <button
                    onClick={() => navigate("/admin/QuanLyDonHang/tao-don")}
                    className="admin-primary-action"
                >
                    Tạo đơn hàng
                </button>
            </div>

            {/* BỘ LỌC TRẠNG THÁI ĐƠN HÀNG VÀ THANH TOÁN */}
            <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-2xl mb-6 flex flex-col gap-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="text-xs font-bold text-slate-500 uppercase lg:w-36 shrink-0 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        Trạng thái đơn
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setFilterStatus("ALL")}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                filterStatus === "ALL"
                                    ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-cyan-50 hover:text-cyan-800"
                            }`}
                        >
                            Tất cả
                        </button>
                        {Object.entries(ORDER_STATUS).map(([status, config]) => (
                            <button
                                type="button"
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border ${
                                    filterStatus === status
                                        ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-cyan-50 hover:text-cyan-800"
                                }`}
                            >
                                <span className={`size-2 rounded-full ${config.dot}`}></span>
                                {config.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px w-full bg-slate-200/80 hidden lg:block"></div>

                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="text-xs font-bold text-slate-500 uppercase lg:w-36 shrink-0 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        Thanh toán
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: "ALL", label: "Tất cả" },
                            { value: "DA_THANH_TOAN", label: "Đã thanh toán" },
                            { value: "CHUA_THANH_TOAN", label: "Chưa thanh toán" },
                        ].map(({ value, label }) => (
                            <button
                                type="button"
                                key={value}
                                onClick={() => setFilterPayment(value)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                    filterPayment === value
                                        ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-cyan-50 hover:text-cyan-800"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* BẢNG HIỂN THỊ DANH SÁCH ĐƠN HÀNG */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[850px] border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Mã Đơn</th>
                                <th className="p-4">Khách Hàng</th>
                                <th className="p-4">Ngày Đặt</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4">Thanh toán</th>
                                <th className="p-4 text-center w-40">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : paginatedOrders.length > 0 ? (
                                paginatedOrders.map((item) => {
                                    const statusConfig = ORDER_STATUS[item.trangthaidonhang] || { label: item.trangthaidonhang, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                    return (
                                        <tr key={item.iddonhang} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-mono font-medium text-slate-500">
                                                #{item.iddonhang.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="p-4 font-semibold text-slate-800">
                                                <div className="flex flex-col">
                                                    <span>{item.tenKhachHang || "Khách vãng lai"}</span>
                                                    {item.sdtKhachHang && <span className="font-normal text-xs text-slate-500 mt-0.5">{item.sdtKhachHang}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {new Date(item.ngaydat).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center justify-center w-fit ${statusConfig.badge}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {item.trangthaithanhtoan === "DA_THANH_TOAN"
                                                    ? <span className="px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center justify-center bg-emerald-50 text-emerald-700 border-emerald-200">Đã thanh toán</span>
                                                    : <span className="px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center justify-center bg-slate-50 text-slate-500 border-slate-200">Chưa thanh toán</span>
                                                }
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/QuanLyDonHang/chi-tiet/${item.iddonhang}`)}
                                                        className="w-full inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 font-bold hover:bg-cyan-100 border border-cyan-200 transition-colors text-xs cursor-pointer"
                                                    >
                                                        Xử lý đơn
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Không tìm thấy đơn hàng nào phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* KHỐI ĐIỀU HƯỚNG PHÂN TRANG */}
                {!loading && processedOrders.length > 0 && (
                    <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trước
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`size-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${currentPage === page
                                                ? "bg-cyan-600 text-white shadow-sm"
                                                : "text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
