import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const ORDER_STATUS = {
    CHO_XAC_NHAN:          { label: "Chờ xác nhận",    badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    DA_THANH_TOAN:          { label: "Đã thanh toán",   badge: "bg-teal-50 text-teal-700 border-teal-200" },
    DANG_DONG_HANG:         { label: "Đang đóng hàng",  badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    DANG_VAN_CHUYEN:        { label: "Đang vận chuyển", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    GIAO_HANG_THANH_CONG:   { label: "Giao thành công", badge: "bg-green-50 text-green-700 border-green-200" },
    HUY:                    { label: "Đã hủy",          badge: "bg-red-50 text-red-700 border-red-200" },
};

const fmt = (val) => new Intl.NumberFormat("vi-VN").format(val || 0) + "đ";

export default function ChiTietDonHang() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/Donhangs"),
            api.get(`/Donhangs/${id}/chitiet`)
        ]).then(([resOrders, resDetails]) => {
            const found = (resOrders.data?.result || []).find(o => o.iddonhang === id);
            if (found) setOrder(found);
            setDetails((resDetails.data?.result || []).map(d => ({
                ...d,
                editWeight: d.soluongkgthucte || d.soluongkgthuctequydoi || 0
            })));
        }).catch(() => showToast("Không thể tải thông tin đơn hàng!", "error"))
          .finally(() => setLoading(false));
    }, [id]);

    const handleWeightChange = (idDetail, val) => {
        const kg = parseFloat(val) || 0;
        setDetails(prev => prev.map(d =>
            d.idchitietdonhang === idDetail
                ? { ...d, editWeight: kg, tongtienthucte: kg * d.dongia }
                : d
        ));
    };

    const handleSaveWeight = async () => {
        try {
            await api.put(`/Donhangs/${id}/cap-nhat-can-nang`, details.map(d => ({
                idChitietdonhang: d.idchitietdonhang,
                soluongkgthucte: d.editWeight
            })));
            showToast("Đã cập nhật cân nặng thực tế!", "success");
        } catch {
            showToast("Cập nhật cân nặng thất bại!", "error");
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!window.confirm(`Xác nhận chuyển sang: ${ORDER_STATUS[newStatus]?.label}?`)) return;
        try {
            await api.put(`/Donhangs/${id}/status`, { trangthaidonhang: newStatus });
            setOrder(prev => ({ ...prev, trangthaidonhang: newStatus }));
            showToast("Chuyển trạng thái thành công!", "success");
        } catch {
            showToast("Thao tác thất bại!", "error");
        }
    };

    const total = details.reduce((sum, d) => sum + (d.tongtienthucte || d.tongtiendukien || 0), 0);
    const isPackaging = order?.trangthaidonhang === "DANG_DONG_HANG";

    if (loading) return <AdminLayout title="Chi Tiết Đơn Hàng"><div className="p-8 text-center text-slate-400">Đang tải...</div></AdminLayout>;
    if (!order) return <AdminLayout title="Chi Tiết Đơn Hàng"><div className="p-8 text-center text-slate-400">Không tìm thấy đơn hàng.</div></AdminLayout>;

    const statusCfg = ORDER_STATUS[order.trangthaidonhang] || { label: order.trangthaidonhang, badge: "bg-slate-50 text-slate-600 border-slate-200" };

    return (
        <AdminLayout title="Chi Tiết Đơn Hàng">
            <div className="space-y-5">

                {/* ── THÔNG TIN ĐƠN ── */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <p className="font-bold text-slate-700">
                            Mã đơn: <span className="font-mono text-cyan-600">#{id.substring(0, 8).toUpperCase()}</span>
                        </p>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusCfg.badge}`}>
                            {statusCfg.label}
                        </span>
                    </div>

                    <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-5">
                            <div>
                                <p className="text-xs text-slate-500 font-bold mb-0.5">Khách hàng</p>
                                <p className="font-bold text-slate-800">{order.tenKhachHang || "Khách vãng lai"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold mb-0.5">Số điện thoại</p>
                                <p className="font-bold text-slate-800">{order.sdtKhachHang || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold mb-0.5">Ngày đặt</p>
                                <p className="font-bold text-slate-800">{new Date(order.ngaydat).toLocaleString("vi-VN")}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {order.trangthaidonhang === "CHO_XAC_NHAN" && (
                                <button onClick={() => handleUpdateStatus("DANG_DONG_HANG")} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm transition-colors cursor-pointer">
                                    Bắt đầu đóng hàng
                                </button>
                            )}
                            {order.trangthaidonhang === "DANG_DONG_HANG" && (
                                <>
                                    <button onClick={handleSaveWeight} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm transition-colors cursor-pointer">
                                        Lưu Kg thực tế
                                    </button>
                                    <button onClick={() => handleUpdateStatus("DANG_VAN_CHUYEN")} className="px-4 py-2 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 font-bold text-sm transition-colors cursor-pointer border border-cyan-200">
                                        Giao vận chuyển
                                    </button>
                                </>
                            )}
                            {order.trangthaidonhang === "DANG_VAN_CHUYEN" && (
                                <button onClick={() => handleUpdateStatus("GIAO_HANG_THANH_CONG")} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm transition-colors cursor-pointer">
                                    Xác nhận giao thành công
                                </button>
                            )}
                            {["CHO_XAC_NHAN", "DANG_DONG_HANG"].includes(order.trangthaidonhang) && (
                                <button onClick={() => handleUpdateStatus("HUY")} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm transition-colors cursor-pointer border border-red-200">
                                    Hủy đơn
                                </button>
                            )}
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer ml-auto">
                                ← Quay lại
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── BẢNG CHI TIẾT ── */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                        <p className="font-bold text-slate-700">Danh sách mặt hàng</p>
                        {isPackaging && <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-yellow-50 text-yellow-700 border-yellow-200">Chế độ nhập Kg thực tế</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[680px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4">Sản phẩm</th>
                                    <th className="p-4">Size</th>
                                    <th className="p-4 text-center">SL (con)</th>
                                    <th className="p-4 text-center">Dự kiến (kg)</th>
                                    <th className="p-4 text-center">Thực tế (kg)</th>
                                    <th className="p-4 text-right">Đơn giá</th>
                                    <th className="p-4 text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {details.map(d => (
                                    <tr key={d.idchitietdonhang} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-900">{d.tenLoaiCa}</td>
                                        <td className="p-4 text-slate-600">{d.tenSize}</td>
                                        <td className="p-4 text-center font-bold text-slate-700">{d.soluong}</td>
                                        <td className="p-4 text-center text-slate-500">{d.soluongkgthuctequydoi} kg</td>
                                        <td className="p-4 text-center">
                                            {isPackaging ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={d.editWeight}
                                                    onChange={e => handleWeightChange(d.idchitietdonhang, e.target.value)}
                                                    className="w-24 text-center font-bold text-cyan-700 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            ) : (
                                                <span className="font-bold text-slate-700">{d.soluongkgthucte ?? "—"} kg</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-slate-500">{fmt(d.dongia)}</td>
                                        <td className="p-4 text-right font-bold text-slate-900">{fmt(d.tongtienthucte || d.tongtiendukien)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                                    <td colSpan="6" className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng cộng</td>
                                    <td className="p-4 text-right font-bold text-xl text-cyan-600">{fmt(total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
