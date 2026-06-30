import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

// Cấu hình nhãn hiển thị và màu sắc của từng trạng thái đơn hàng
const ORDER_STATUS = {
    "CHO_XAC_NHAN":          { label: "Chờ xác nhận",    dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    "DANG_DONG_HANG":         { label: "Đang đóng hàng",  dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
    "DANG_VAN_CHUYEN":        { label: "Đang vận chuyển", dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    "GIAO_HANG_THANH_CONG":   { label: "Giao thành công", dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200" },
    "HUY":                    { label: "Đã hủy",          dot: "bg-red-500",    badge: "bg-red-50 text-red-700 border-red-200" }
};

const STATUS_PRIORITY = {
    "CHO_XAC_NHAN": 1, "DANG_DONG_HANG": 2, "DANG_VAN_CHUYEN": 3,
    "GIAO_HANG_THANH_CONG": 4, "HUY": 5
};

export default function QuanLyDonHang() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const { showToast } = useToast();

    useEffect(() => {
        api.get("/Donhangs")
            .then(res => {
                let realData = res.data.result || [];
                // Sắp xếp đơn hàng theo thứ tự ưu tiên trạng thái, sau đó đến ngày đặt mới nhất
                realData.sort((a, b) => {
                    const pa = STATUS_PRIORITY[a.trangthaidonhang] || 99;
                    const pb = STATUS_PRIORITY[b.trangthaidonhang] || 99;
                    if (pa !== pb) return pa - pb;
                    return new Date(b.ngaydat) - new Date(a.ngaydat);
                });
                setOrders(realData);
            })
            .catch(() => showToast("Không thể tải danh sách đơn hàng!", "error"))
            .finally(() => setLoading(false));
    }, []);

    // Lọc danh sách đơn hàng theo Tab được chọn
    const filteredOrders = useMemo(() => {
        return filterStatus === "ALL" ? orders : orders.filter(o => o.trangthaidonhang === filterStatus);
    }, [orders, filterStatus]);

    return (
        <AdminLayout title="Quản Lý Đơn Hàng">
            {/* THANH ĐIỀU HƯỚNG BỘ LỌC TABS & NÚT TẠO ĐƠN */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-1.5 w-full xl:w-auto">
                    <button
                        onClick={() => setFilterStatus("ALL")}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border shadow-2xs ${filterStatus === "ALL" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"}`}
                    >
                        Tất cả
                    </button>
                    {Object.keys(ORDER_STATUS).map(status => {
                        const isCurrent = filterStatus === status;
                        return (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border ${isCurrent ? "bg-white border-cyan-500 text-cyan-700 ring-2 ring-cyan-500/20 shadow-2xs" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"}`}
                            >
                                <span className={`size-2 rounded-full ${ORDER_STATUS[status].dot}`}></span>
                                {ORDER_STATUS[status].label}
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={() => navigate("/admin/QuanLyDonHang/tao-don")}
                    className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md transition-all active:scale-95 text-sm"
                >
                    Tạo đơn hàng
                </button>
            </div>

            {/* BẢNG HIỂN THỊ DANH SÁCH ĐƠN HÀNG */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px] border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Mã Đơn</th>
                                <th className="p-4">Khách Hàng</th>
                                <th className="p-4">Ngày Đặt</th>
                                <th className="p-4">Đơn hàng</th>
                                <th className="p-4">Thanh toán</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((item) => {
                                    const statusConfig = ORDER_STATUS[item.trangthaidonhang] || { label: item.trangthaidonhang, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                    return (
                                        <tr key={item.iddonhang} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-mono font-medium text-cyan-700">
                                                #{item.iddonhang.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">
                                                {item.tenKhachHang || "Khách vãng lai"}
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {new Date(item.ngaydat).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${statusConfig.badge}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {item.trangthaithanhtoan === "DA_THANH_TOAN"
                                                    ? <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">Đã thanh toán</span>
                                                    : <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-slate-50 text-slate-500 border-slate-200">Chưa thanh toán</span>
                                                }
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/admin/QuanLyDonHang/chi-tiet/${item.iddonhang}`)}
                                                    className="px-4 py-2 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs"
                                                >
                                                    Xử lý đơn
                                                </button>
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