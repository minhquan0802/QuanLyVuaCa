import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

// Định nghĩa cấu trúc Trạng thái hoàn toàn bằng màu sắc, KHÔNG dùng Icon
const ORDER_STATUS = {
    "CHO_XAC_NHAN": { label: "Chờ xác nhận", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    "DA_THANH_TOAN": { label: "Đã thanh toán", color: "bg-teal-50 text-teal-700 border-teal-200" },
    "DANG_DONG_HANG": { label: "Đang đóng hàng", color: "bg-blue-50 text-blue-700 border-blue-200" },
    "DANG_VAN_CHUYEN": { label: "Đang vận chuyển", color: "bg-purple-50 text-purple-700 border-purple-200" },
    "GIAO_HANG_THANH_CONG": { label: "Giao thành công", color: "bg-green-50 text-green-700 border-green-200" },
    "HUY": { label: "Đã hủy", color: "bg-red-50 text-red-700 border-red-200" }
};

const STATUS_PRIORITY = {
    "CHO_XAC_NHAN": 1, "DANG_DONG_HANG": 2, "DANG_VAN_CHUYEN": 3,
    "GIAO_HANG_THANH_CONG": 4, "DA_THANH_TOAN": 5, "HUY": 6
};

// Helper: Format tiền tệ chuẩn
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
};

export default function QuanLyDonHang() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const { showToast } = useToast();

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/Donhangs");
            let realData = data.result || data.data || (Array.isArray(data) ? data : []);
            realData.sort((a, b) => {
                const pa = STATUS_PRIORITY[a.trangthaidonhang] || 99;
                const pb = STATUS_PRIORITY[b.trangthaidonhang] || 99;
                if (pa !== pb) return pa - pb;
                return new Date(b.ngaydat) - new Date(a.ngaydat);
            });
            setOrders(realData);
        } catch {
            showToast("Không thể tải danh sách đơn hàng!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

    const filteredOrders = useMemo(() => {
        return filterStatus === "ALL" ? orders : orders.filter(o => o.trangthaidonhang === filterStatus);
    }, [orders, filterStatus]);

    // --- GIAO DIỆN DANH SÁCH CHÍNH ---
    return (
        <AdminLayout title="Quản Lý Đơn Hàng">
            {/* TOOLBAR TÌM KIẾM & BỘ LỌC TABS */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-1.5 w-full xl:w-auto">
                    <button onClick={() => setFilterStatus("ALL")} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border shadow-2xs cursor-pointer ${filterStatus === "ALL" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"}`}>Tất cả</button>
                    {Object.keys(ORDER_STATUS).map(status => {
                        const isCurrent = filterStatus === status;
                        return (
                            <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 border cursor-pointer ${isCurrent ? "bg-white border-cyan-500 text-cyan-700 ring-2 ring-cyan-500/20 shadow-2xs" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"}`}>
                                <span className={`size-2 rounded-full ${ORDER_STATUS[status].color.split(' ')[0].replace('50', '500').replace('100', '500')}`}></span>
                                {ORDER_STATUS[status].label}
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => navigate("/admin/QuanLyDonHang/tao-don")} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer text-sm">
                    Tạo đơn hàng
                </button>
            </div>

            {/* BẢNG THÔNG TIN ĐƠN HÀNG */}
            <div className="bg-white rounded-2xl shadow-2xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Mã Đơn</th><th className="p-4">Khách Hàng</th><th className="p-4">Ngày Đặt</th><th className="p-4">Trạng Thái</th><th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((item) => {
                                    const statusConfig = ORDER_STATUS[item.trangthaidonhang] || { label: item.trangthaidonhang, color: "bg-gray-50 text-gray-600 border-slate-200" };
                                    return (
                                        <tr key={item.iddonhang} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-mono font-medium text-cyan-700">#{item.iddonhang.substring(0, 8).toUpperCase()}</td>
                                            <td className="p-4 font-bold text-slate-800">{item.tenKhachHang || "Khách lẻ"}</td>
                                            <td className="p-4 text-slate-500">{new Date(item.ngaydat).toLocaleString('vi-VN')}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex w-fit items-center ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => navigate(`/admin/QuanLyDonHang/chi-tiet/${item.iddonhang}`)} className="px-4 py-2 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer">Xử lý đơn</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Không tìm thấy đơn hàng nào phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </AdminLayout>
    );
}