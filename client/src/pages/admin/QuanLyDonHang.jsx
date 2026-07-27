import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ColumnFilter from "../../components/admin/ColumnFilter";
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

const PAYMENT_STATUS = [
    { value: "DA_THANH_TOAN", label: "Đã thanh toán" },
    { value: "CHUA_THANH_TOAN", label: "Chưa thanh toán" },
];

export default function QuanLyDonHang() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- 1. STATE DỮ LIỆU GỐC ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 2. STATE ĐIỀU KHIỂN TÍNH NĂNG ---
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedPayments, setSelectedPayments] = useState([]);
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
    }, [selectedStatuses, selectedPayments, searchTerm]);

    // --- 4. XỬ LÝ LỌC ---
    const processedOrders = useMemo(() => {
        let result = orders.filter(o =>
            (selectedStatuses.length === 0 || selectedStatuses.includes(o.trangthaidonhang)) &&
            (selectedPayments.length === 0 || selectedPayments.includes(o.trangthaithanhtoan))
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
    }, [orders, selectedStatuses, selectedPayments, searchTerm]);

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

            {/* BẢNG HIỂN THỊ DANH SÁCH ĐƠN HÀNG */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[850px] border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Mã Đơn</th>
                                <th className="p-4">Khách Hàng</th>
                                <th className="p-4">Ngày Đặt</th>
                                <th className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span>Trạng thái</span>
                                        <ColumnFilter
                                            label="Trạng thái đơn"
                                            options={Object.entries(ORDER_STATUS).map(([value, config]) => ({
                                                value,
                                                label: config.label,
                                            }))}
                                            selectedValues={selectedStatuses}
                                            onChange={setSelectedStatuses}
                                        />
                                    </div>
                                </th>
                                <th className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span>Thanh toán</span>
                                        <ColumnFilter
                                            label="Thanh toán"
                                            options={PAYMENT_STATUS}
                                            selectedValues={selectedPayments}
                                            onChange={setSelectedPayments}
                                        />
                                    </div>
                                </th>
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
                                            <td className="p-4 font-mono font-medium text-cyan-700">
                                                #{item.iddonhang.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">
                                                <div className="flex flex-col">
                                                    <span>{item.tenKhachHang || "Khách vãng lai"}</span>
                                                    {item.sdtKhachHang && <span className="font-normal text-xs text-slate-500 mt-0.5">{item.sdtKhachHang}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {new Date(item.ngaydat).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-flex items-center w-fit ${statusConfig.badge}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {item.trangthaithanhtoan === "DA_THANH_TOAN"
                                                    ? <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">Đã thanh toán</span>
                                                    : <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-slate-50 text-slate-500 border-slate-200">Chưa thanh toán</span>
                                                }
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/QuanLyDonHang/chi-tiet/${item.iddonhang}`)}
                                                        className="w-full inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer"
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
