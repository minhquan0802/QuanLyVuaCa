import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const ORDER_STATUS = {
    CHO_XAC_NHAN:          { label: "Chờ xác nhận",     color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    DA_THANH_TOAN:         { label: "Đã thanh toán",    color: "bg-teal-50 text-teal-700 border-teal-200" },
    DANG_DONG_HANG:        { label: "Đang đóng hàng",   color: "bg-blue-50 text-blue-700 border-blue-200" },
    DANG_VAN_CHUYEN:       { label: "Đang vận chuyển",  color: "bg-purple-50 text-purple-700 border-purple-200" },
    GIAO_HANG_THANH_CONG:  { label: "Giao thành công",  color: "bg-green-50 text-green-700 border-green-200" },
    HUY:                   { label: "Đã hủy",           color: "bg-red-50 text-red-700 border-red-200" },
};

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";

export default function ChiTietDonHang() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [viewDetails, setViewDetails] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEdited, setIsEdited] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get("/Donvitinhs"),
            api.get("/Donhangs"),
        ]).then(([resUnits, resOrders]) => {
            setUnits(resUnits.data?.result || []);
            const list = resOrders.data?.result || resOrders.data?.data || (Array.isArray(resOrders.data) ? resOrders.data : []);
            const found = list.find(o => o.iddonhang === id);
            if (found) setOrder(found);
        }).catch(() => showToast("Không thể tải thông tin đơn hàng!", "error"));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        api.get(`/Donhangs/${id}/chitiet`)
            .then(({ data }) => {
                const rawDetails = data.result || [];
                setViewDetails(rawDetails.map(d => {
                    const valThucTe = d.soluongkgthucte ?? d.soLuongKgThucTe ?? d.khoiluongthucte ?? 0;
                    const valDuKien = d.soluongkgthuctequydoi ?? d.soLuongKgThucTeQuyDoi ?? d.khoiluongdukien ?? 0;
                    const valTienDuKien = d.tongtiendukien ?? d.tongTienDuKien ?? d.thanhtiendukien ?? 0;
                    const valTienThucTe = d.tongtienthucte ?? d.tongTienThucTe ?? d.thanhtienthucte ?? 0;
                    return {
                        ...d,
                        finalSoluongKgThucTe: valThucTe,
                        finalSoluongKgDuKien: valDuKien,
                        finalTienDuKien: valTienDuKien,
                        finalTienThucTe: valTienThucTe,
                        editWeight: valThucTe > 0 ? valThucTe : valDuKien,
                        calculatedPrice: valDuKien > 0 ? (valTienDuKien / valDuKien) : 0,
                    };
                }));
            })
            .catch(() => showToast("Không thể tải chi tiết đơn hàng!", "error"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleWeightInputChange = useCallback((idDetail, newVal) => {
        const val = parseFloat(newVal) || 0;
        setViewDetails(prev => prev.map(item =>
            item.idchitietdonhang === idDetail
                ? { ...item, editWeight: val, finalTienThucTe: val * item.calculatedPrice }
                : item
        ));
        setIsEdited(true);
    }, []);

    const handleSaveRealWeight = async () => {
        const payload = viewDetails.map(item => ({ idChitietdonhang: item.idchitietdonhang, soluongkgthucte: item.editWeight }));
        try {
            await api.put(`/Donhangs/${id}/cap-nhat-can-nang`, payload);
            showToast("Đã cập nhật cân nặng thực tế!", "success");
            setIsEdited(false);
        } catch {
            showToast("Cập nhật cân nặng thất bại!", "error");
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (isEdited && !window.confirm("Bạn đã sửa cân nặng nhưng chưa Lưu. Tiếp tục đổi trạng thái?")) return;
        if (!window.confirm(`Xác nhận chuyển trạng thái sang: ${ORDER_STATUS[newStatus].label}?`)) return;
        try {
            await api.put(`/Donhangs/${id}/status`, { trangthaidonhang: newStatus });
            setOrder(prev => ({ ...prev, trangthaidonhang: newStatus }));
            showToast("Chuyển trạng thái thành công!", "success");
        } catch {
            showToast("Lỗi thao tác!", "error");
        }
    };

    const calculateTotal = (details) => details.reduce((sum, item) => sum + ((item.finalTienThucTe > 0 ? item.finalTienThucTe : item.finalTienDuKien) || 0), 0);

    if (!order && !loading) return (
        <AdminLayout title="Chi tiết đơn hàng">
            <div className="text-center py-20 text-slate-400">Không tìm thấy đơn hàng.</div>
        </AdminLayout>
    );

    const statusConfig = order ? (ORDER_STATUS[order.trangthaidonhang] || { label: order.trangthaidonhang, color: "bg-gray-50 text-gray-600 border-slate-200" }) : null;

    return (
        <AdminLayout title={order ? `${order.trangthaidonhang === "DANG_DONG_HANG" ? "Cân & Đóng Hàng" : "Chi tiết đơn"} — #${id.substring(0, 8).toUpperCase()}` : "Chi tiết đơn hàng"}>
            {loading ? (
                <div className="text-center py-20 text-slate-400">Đang tải...</div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                            <h4 className="font-bold mb-2.5 text-cyan-900 uppercase text-xs tracking-wider">Thông tin người mua</h4>
                            <p className="text-slate-600 text-sm"><span className="font-medium text-slate-400">Họ tên:</span> {order?.tenKhachHang || "Khách lẻ vãng lai"}</p>
                            <p className="text-slate-600 text-sm mt-1"><span className="font-medium text-slate-400">SĐT:</span> {order?.sdtKhachHang || "..."}</p>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase">Trạng thái:</span>
                                {statusConfig && (
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusConfig.color}`}>{statusConfig.label}</span>
                                )}
                            </div>

                            {order?.trangthaidonhang === "DANG_DONG_HANG" && (
                                <button onClick={handleSaveRealWeight} disabled={!isEdited} className={`w-full py-2 rounded-lg font-bold transition-all text-xs cursor-pointer mb-3 ${isEdited ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                    {isEdited ? "Xác nhận & Lưu Kg thực tế" : "Cân nặng đã đồng bộ"}
                                </button>
                            )}

                            <div className="flex gap-2 flex-wrap">
                                {order?.trangthaidonhang === "CHO_XAC_NHAN" && (
                                    <button onClick={() => handleUpdateStatus("DANG_DONG_HANG")} className="flex-1 py-1.5 bg-cyan-600 text-white rounded-lg font-bold text-xs hover:bg-cyan-700 whitespace-nowrap cursor-pointer">Bắt đầu đóng hàng</button>
                                )}
                                {order?.trangthaidonhang === "DANG_DONG_HANG" && (
                                    <button onClick={() => handleUpdateStatus("DANG_VAN_CHUYEN")} className="flex-1 py-1.5 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 whitespace-nowrap cursor-pointer">Giao đơn vị vận chuyển</button>
                                )}
                                {order?.trangthaidonhang === "DANG_VAN_CHUYEN" && (
                                    <button onClick={() => handleUpdateStatus("GIAO_HANG_THANH_CONG")} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 whitespace-nowrap cursor-pointer">Xác nhận giao thành công</button>
                                )}
                                {["CHO_XAC_NHAN", "DANG_DONG_HANG"].includes(order?.trangthaidonhang) && (
                                    <button onClick={() => handleUpdateStatus("HUY")} className="px-4 py-1.5 border border-red-200 text-red-600 rounded-lg font-bold text-xs hover:bg-red-50 cursor-pointer">Hủy đơn</button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200">
                            <h4 className="font-bold text-slate-800 text-sm">Danh sách chi tiết mặt hàng</h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[700px]">
                                <thead className="bg-cyan-50/60 border-b border-slate-200 text-cyan-900 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="p-3">Sản phẩm</th>
                                        <th className="p-3">Size</th>
                                        <th className="p-3 text-center">ĐVT</th>
                                        <th className="p-3 text-center">SL</th>
                                        <th className="p-3 text-center text-slate-400">Dự kiến (Kg)</th>
                                        <th className="p-3 text-center bg-yellow-50 text-yellow-800 border-x border-slate-200 w-[140px]">
                                            {order?.trangthaidonhang === "DANG_DONG_HANG" ? "✏️ Gõ Số Kg Thật" : "Kg Thực tế"}
                                        </th>
                                        <th className="p-3 text-right">Đơn giá</th>
                                        <th className="p-3 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {viewDetails.map(d => {
                                        const isEditingMode = order?.trangthaidonhang === "DANG_DONG_HANG";
                                        const hienThiTien = d.finalTienThucTe > 0 ? d.finalTienThucTe : d.finalTienDuKien;
                                        const detailUnitId = d.iddonvitinh || d.idDonViTinh || (d.donvitinh && (d.donvitinh.id || d.donvitinh.iddvt));
                                        const foundUnit = units.find(u => Number(u.id || u.iddvt) === Number(detailUnitId));
                                        const tenDVT = foundUnit ? foundUnit.tendvt : (d.tenDonViTinh || d.donvitinh?.tendvt || "-");
                                        return (
                                            <tr key={d.idchitietdonhang} className="hover:bg-slate-50/30">
                                                <td className="p-3 font-bold text-slate-700">{d.tenLoaiCa || d.chitietcaban?.tenloaica}</td>
                                                <td className="p-3 text-slate-500 text-xs">{d.tenSize || d.chitietcaban?.tensize}</td>
                                                <td className="p-3 text-center"><span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-500">{tenDVT}</span></td>
                                                <td className="p-3 text-center font-bold text-slate-800">{d.soluong}</td>
                                                <td className="p-3 text-center text-slate-400 font-medium">{d.finalSoluongKgDuKien ? d.finalSoluongKgDuKien.toLocaleString() : "-"}</td>
                                                <td className={`p-1 text-center border-x border-slate-200 ${isEditingMode ? "bg-yellow-50/50" : ""}`}>
                                                    {isEditingMode ? (
                                                        <input type="number" step="0.1" className="w-full text-center font-bold text-cyan-700 bg-white border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none py-1 text-sm" value={d.editWeight} onChange={(e) => handleWeightInputChange(d.idchitietdonhang, e.target.value)} />
                                                    ) : (
                                                        <span className="font-bold text-slate-800">{d.finalSoluongKgThucTe ? d.finalSoluongKgThucTe.toLocaleString() : "-"}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right text-slate-400 text-xs">{formatCurrency(d.calculatedPrice)}</td>
                                                <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(hienThiTien)}</td>
                                            </tr>
                                        );
                                    })}
                                    {viewDetails.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-slate-400">Trống</td></tr>}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                    <tr>
                                        <td colSpan="7" className="p-4 text-right text-slate-500 text-xs uppercase tracking-wider">Tổng cộng hóa đơn thực tế:</td>
                                        <td className="p-4 text-right font-black text-cyan-600 text-xl">{formatCurrency(calculateTotal(viewDetails))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <button onClick={() => navigate("/admin/QuanLyDonHang")} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm cursor-pointer">
                            ← Quay lại danh sách
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
