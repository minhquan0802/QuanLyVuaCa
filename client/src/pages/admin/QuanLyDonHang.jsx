import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const ORDER_STATUS = {
    CHO_XAC_NHAN:          { label: "Chờ xác nhận",     dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    DA_THANH_TOAN:          { label: "Đã thanh toán",    dot: "bg-teal-500",   badge: "bg-teal-50 text-teal-700 border-teal-200" },
    DANG_DONG_HANG:         { label: "Đang đóng hàng",   dot: "bg-cyan-500",   badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    DANG_VAN_CHUYEN:        { label: "Đang vận chuyển",  dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    GIAO_HANG_THANH_CONG:   { label: "Giao thành công",  dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200" },
    HUY:                    { label: "Đã hủy",           dot: "bg-red-500",    badge: "bg-red-50 text-red-700 border-red-200" },
};


export default function QuanLyDonHang() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("ALL");

    useEffect(() => {
        api.get("/Donhangs")
            .then(res => setOrders(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách đơn hàng!", "error"))
            .finally(() => setLoading(false));
    }, []);

    const filteredOrders = useMemo(() =>
        filterStatus === "ALL" ? orders : orders.filter(o => o.trangthaidonhang === filterStatus),
        [orders, filterStatus]
    );

    return (
        <AdminLayout title="Quản Lý Đơn Hàng">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-1.5 w-full xl:w-auto">
                    <button
                        onClick={() => setFilterStatus("ALL")}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${filterStatus === "ALL" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                        Tất cả
                    </button>
                    {Object.entries(ORDER_STATUS).map(([status, cfg]) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border ${filterStatus === status ? "bg-cyan-50 text-cyan-700 border-cyan-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                            <span className={`size-2 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => navigate("/admin/QuanLyDonHang/tao-don")}
                    className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md transition-all active:scale-95 text-sm"
                >
                    Tạo đơn hàng
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px] border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Mã Đơn</th>
                                <th className="p-4">Khách Hàng</th>
                                <th className="p-4">SĐT</th>
                                <th className="p-4">Ngày Đặt</th>
                                <th className="p-4">Trạng Thái</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : filteredOrders.length > 0 ? filteredOrders.map(item => {
                                const cfg = ORDER_STATUS[item.trangthaidonhang] || { label: item.trangthaidonhang, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                return (
                                    <tr key={item.iddonhang} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-mono font-medium text-cyan-700">
                                            #{item.iddonhang.substring(0, 8).toUpperCase()}
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">
                                            {item.tenKhachHang || "Khách vãng lai"}
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {item.sdtKhachHang || "—"}
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {new Date(item.ngaydat).toLocaleString("vi-VN")}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${cfg.badge}`}>
                                                {cfg.label}
                                            </span>
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
                            }) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Không tìm thấy đơn hàng nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
