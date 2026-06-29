import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const THANHLY_STATUS = {
    "DA_TIEU_HUY": { label: "Đã tiêu hủy", badge: "bg-red-50 text-red-700 border-red-200" },
    "DA_BAN_THANH_LY": { label: "Đã bán thanh lý", badge: "bg-green-50 text-green-700 border-green-200" },
};

const LO_TRANGTHAI = {
    "CON_HANG": { label: "Còn hàng", badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    "HET_HANG": { label: "Hết hàng", badge: "bg-gray-50 text-gray-600 border-slate-200" },
    "THANH_LY": { label: "Đã thanh lý", badge: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default function QuanLyThanhLy() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [tab, setTab] = useState("lo"); // "lo" | "phieu"

    const [phieus, setPhieus] = useState([]);
    const [loadingPhieus, setLoadingPhieus] = useState(true);

    const [lots, setLots] = useState([]);
    const [loadingLots, setLoadingLots] = useState(true);

    const [selectedLot, setSelectedLot] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        kieu: "toanbo", // "toanbo" | "motphan"
        soluongthanhly: 0,
        dongia: 0,
        lydothanhly: "",
        trangthai: "DA_TIEU_HUY",
        ghichu: "",
    });

    const fetchPhieus = () => {
        setLoadingPhieus(true);
        api.get("/Phieuthanhlys")
            .then(res => setPhieus(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách phiếu thanh lý!", "error"))
            .finally(() => setLoadingPhieus(false));
    };

    const fetchLots = () => {
        setLoadingLots(true);
        api.get("/Phieuthanhlys/tat-ca-lo-con-hang")
            .then(res => setLots(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách lô hàng!", "error"))
            .finally(() => setLoadingLots(false));
    };

    useEffect(() => {
        fetchPhieus();
        fetchLots();
    }, []);

    const tinhTongSoLuong = (listChiTiet) =>
        (listChiTiet || []).reduce((sum, ct) => sum + Number(ct.soluongthanhly), 0);

    const tinhTongTien = (listChiTiet) =>
        (listChiTiet || []).reduce((sum, ct) => sum + Number(ct.thanhtien), 0);

    const tenSanPham = (listChiTiet) => {
        const ten = [...new Set((listChiTiet || []).map(ct => `${ct.tenLoaiCa} (${ct.tenSize})`))];
        return ten.join(", ");
    };

    const openThanhLyModal = (lot) => {
        setSelectedLot(lot);
        setForm({
            kieu: "toanbo",
            soluongthanhly: lot.soluongconlai,
            dongia: 0,
            lydothanhly: "",
            trangthai: "DA_TIEU_HUY",
            ghichu: "",
        });
    };

    const closeModal = () => {
        if (submitting) return;
        setSelectedLot(null);
    };

    const handleKieuChange = (kieu) => {
        setForm(prev => ({
            ...prev,
            kieu,
            soluongthanhly: kieu === "toanbo" ? selectedLot.soluongconlai : prev.soluongthanhly,
        }));
    };

    const handleSubmitThanhLy = async () => {
        if (!selectedLot) return;
        if (!form.lydothanhly.trim()) { showToast("Vui lòng nhập lý do thanh lý!", "error"); return; }

        const soLuong = Number(form.soluongthanhly);
        if (soLuong <= 0) { showToast("Số lượng thanh lý phải > 0!", "error"); return; }
        if (soLuong > Number(selectedLot.soluongconlai)) { showToast(`Lô này chỉ còn ${selectedLot.soluongconlai}kg!`, "error"); return; }
        if (Number(form.dongia) < 0) { showToast("Đơn giá không được âm!", "error"); return; }

        const payload = {
            lydothanhly: form.lydothanhly,
            trangthai: form.trangthai,
            ghichu: form.ghichu,
            listChiTiet: [{
                idchitietphieunhap: selectedLot.idchitietphieunhap,
                soluongthanhly: soLuong,
                dongia: Number(form.dongia),
            }],
        };

        setSubmitting(true);
        try {
            await api.post("/Phieuthanhlys", payload);
            showToast("Thanh lý lô hàng thành công!", "success");
            setSelectedLot(null);
            fetchLots();
            fetchPhieus();
        } catch {
            showToast("Lỗi hệ thống hoặc kết nối thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout title="Quản Lý Thanh Lý">
            <div className="flex justify-between items-center mb-6">
                <p className="text-slate-500 text-sm">Theo dõi các phiếu thanh lý do hao hụt (cá chết, hao hụt lúc nhập, sự cố...).</p>
                <button
                    onClick={() => navigate("/admin/QuanLyThanhLy/tao-phieu")}
                    className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl text-sm hover:bg-cyan-700"
                >
                    Lập phiếu nhiều lô
                </button>
            </div>

            <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-5">
                <button
                    onClick={() => setTab("lo")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "lo" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Lô hàng tồn
                </button>
                <button
                    onClick={() => setTab("phieu")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "phieu" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Phiếu thanh lý đã lập
                </button>
            </div>

            {tab === "lo" ? (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4">Loại cá</th>
                                    <th className="p-4">Size</th>
                                    <th className="p-4">Ngày nhập</th>
                                    <th className="p-4 text-right">SL nhập (kg)</th>
                                    <th className="p-4 text-right">Còn lại (kg)</th>
                                    <th className="p-4">Trạng thái</th>
                                    <th className="p-4 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingLots ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : lots.length > 0 ? (
                                    lots.map((lot) => {
                                        const statusConfig = LO_TRANGTHAI[lot.trangthaica] || { label: lot.trangthaica, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                        return (
                                            <tr key={lot.idchitietphieunhap} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-800">{lot.tenLoaiCa}</td>
                                                <td className="p-4">{lot.tenSize}</td>
                                                <td className="p-4 text-slate-500">{lot.ngaynhap}</td>
                                                <td className="p-4 text-right">{lot.soluongnhap}</td>
                                                <td className="p-4 text-right font-bold text-cyan-700">{lot.soluongconlai}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${statusConfig.badge}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => openThanhLyModal(lot)}
                                                        className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg text-xs hover:bg-red-100"
                                                    >
                                                        Thanh lý
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Không có lô hàng nào còn tồn.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4">Ngày thanh lý</th>
                                    <th className="p-4">Người tạo</th>
                                    <th className="p-4">Sản phẩm</th>
                                    <th className="p-4">Lý do</th>
                                    <th className="p-4 text-right">Tổng SL (kg)</th>
                                    <th className="p-4 text-right">Tổng tiền</th>
                                    <th className="p-4">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingPhieus ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : phieus.length > 0 ? (
                                    phieus.map((item) => {
                                        const statusConfig = THANHLY_STATUS[item.trangthai] || { label: item.trangthai, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                        return (
                                            <tr key={item.idphieuthanhly} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 text-slate-500">{new Date(item.ngaythanhly).toLocaleString('vi-VN')}</td>
                                                <td className="p-4 font-bold text-slate-800">{item.tenNguoiTaoPhieu}</td>
                                                <td className="p-4">{tenSanPham(item.listChiTiet)}</td>
                                                <td className="p-4">{item.lydothanhly}</td>
                                                <td className="p-4 text-right font-medium">{tinhTongSoLuong(item.listChiTiet)}</td>
                                                <td className="p-4 text-right font-bold text-slate-800">{tinhTongTien(item.listChiTiet).toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${statusConfig.badge}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Chưa có phiếu thanh lý nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedLot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Thanh lý lô hàng</h3>
                                <p className="text-xs text-slate-500">{selectedLot.tenLoaiCa} ({selectedLot.tenSize}) — nhập ngày {selectedLot.ngaynhap}</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex justify-between items-center bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-sm">
                                <span className="text-slate-600">Số lượng còn lại trong lô</span>
                                <span className="font-bold text-cyan-700 text-lg">{selectedLot.soluongconlai} kg</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phạm vi thanh lý</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleKieuChange("toanbo")}
                                        className={`flex-1 p-2.5 rounded-xl border text-sm font-bold transition-colors ${form.kieu === "toanbo" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                    >
                                        Toàn bộ lô
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleKieuChange("motphan")}
                                        className={`flex-1 p-2.5 rounded-xl border text-sm font-bold transition-colors ${form.kieu === "motphan" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                    >
                                        Một phần
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Số lượng thanh lý (kg)</label>
                                <input
                                    type="number"
                                    disabled={form.kieu === "toanbo"}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                    value={form.soluongthanhly}
                                    onChange={e => setForm({ ...form, soluongthanhly: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Đơn giá (0 nếu tiêu hủy)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                                    value={form.dongia}
                                    onChange={e => setForm({ ...form, dongia: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trạng thái xử lý</label>
                                <select
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                                    value={form.trangthai}
                                    onChange={e => setForm({ ...form, trangthai: e.target.value })}
                                >
                                    <option value="DA_TIEU_HUY">Đã tiêu hủy</option>
                                    <option value="DA_BAN_THANH_LY">Đã bán thanh lý</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lý do thanh lý</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                                    placeholder="Cá chết, hao hụt lúc nhập, sự cố..."
                                    value={form.lydothanhly}
                                    onChange={e => setForm({ ...form, lydothanhly: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ghi chú</label>
                                <textarea
                                    className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none"
                                    placeholder="Ghi chú thêm..."
                                    value={form.ghichu}
                                    onChange={e => setForm({ ...form, ghichu: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm">
                                <span className="text-slate-500">Thành tiền</span>
                                <span className="font-bold text-slate-800 text-lg">{(Number(form.soluongthanhly || 0) * Number(form.dongia || 0)).toLocaleString()} VNĐ</span>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={closeModal} disabled={submitting} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmitThanhLy}
                                disabled={submitting}
                                className={`px-6 py-2.5 font-bold rounded-xl text-sm ${submitting ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-cyan-600 text-white hover:bg-cyan-700"}`}
                            >
                                {submitting ? "Đang xử lý..." : "Xác nhận thanh lý"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
