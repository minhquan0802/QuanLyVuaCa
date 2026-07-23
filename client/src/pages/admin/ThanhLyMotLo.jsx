import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

// Trang thanh lý 1 lô hàng duy nhất (thay cho popup cũ).
// idLo lấy từ URL, ví dụ /admin/QuanLyThanhLy/thanh-ly/abc-123
export default function ThanhLyMotLo() {
    const navigate = useNavigate();
    const { idLo } = useParams();
    const { showToast } = useToast();

    const [lot, setLot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        kieu: "toanbo",
        soluongthanhly: 0,
        dongia: 0,
        lydothanhly: "",
        trangthai: "DA_TIEU_HUY",
        ghichu: "",
    });

    // Tải danh sách lô còn hàng rồi tìm đúng lô theo ID trên URL
    useEffect(() => {
        api.get("/Phieuthanhlys/tat-ca-lo-con-hang")
            .then(res => {
                const list = res.data.result || [];
                const found = list.find(l => l.idchitietphieunhap === idLo);
                setLot(found || null);
                if (found) {
                    setForm(prev => ({ ...prev, soluongthanhly: found.soluongconlai }));
                }
            })
            .catch(() => showToast("Không thể tải thông tin lô hàng!", "error"))
            .finally(() => setLoading(false));
    }, [idLo]);

    const handleKieuChange = (kieu) => {
        setForm(prev => ({
            ...prev,
            kieu,
            soluongthanhly: kieu === "toanbo" ? lot.soluongconlai : prev.soluongthanhly,
        }));
    };

    const handleSubmit = async () => {
        if (!lot) return;
        if (!form.lydothanhly.trim()) { showToast("Vui lòng nhập lý do thanh lý!", "error"); return; }

        const soLuong = Number(form.soluongthanhly);
        if (soLuong <= 0) { showToast("Số lượng thanh lý phải > 0!", "error"); return; }
        if (soLuong > Number(lot.soluongconlai)) { showToast(`Lô này chỉ còn ${lot.soluongconlai}kg!`, "error"); return; }
        const donGia = Number(form.dongia);
        if (!Number.isFinite(donGia) || donGia < 0) { showToast("Đơn giá không được âm!", "error"); return; }
        if (form.trangthai === "DA_BAN_THANH_LY" && donGia <= 0) { showToast("Bán thanh lý phải có đơn giá lớn hơn 0!", "error"); return; }
        if (form.trangthai === "DA_TIEU_HUY" && donGia !== 0) { showToast("Tiêu hủy phải có đơn giá bằng 0!", "error"); return; }

        const payload = {
            lydothanhly: form.lydothanhly,
            trangthai: form.trangthai,
            ghichu: form.ghichu,
            listChiTiet: [{
                idchitietphieunhap: lot.idchitietphieunhap,
                soluongthanhly: soLuong,
                dongia: donGia,
            }],
        };

        setSubmitting(true);
        try {
            await api.post("/Phieuthanhlys", payload);
            showToast("Thanh lý lô hàng thành công!", "success");
            navigate("/admin/QuanLyThanhLy");
        } catch {
            showToast("Lỗi hệ thống hoặc kết nối thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Thanh Lý Lô Hàng">
                <div className="p-8 text-center text-slate-400">Đang tải dữ liệu...</div>
            </AdminLayout>
        );
    }

    if (!lot) {
        return (
            <AdminLayout title="Thanh Lý Lô Hàng">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl ring-1 ring-slate-200 p-8 text-center text-slate-500">
                    Không tìm thấy lô hàng này (có thể đã được thanh lý hoặc không còn tồn tại).
                    <div className="mt-4">
                        <button onClick={() => navigate("/admin/QuanLyThanhLy")} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Thanh Lý Lô Hàng">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{lot.tenLoaiCa} ({lot.tenSize})</h3>
                    <p className="text-xs text-slate-500">Nhập ngày {lot.ngaynhap}</p>
                </div>

                <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center bg-cyan-50 border border-cyan-100 rounded-xl p-2.5 text-sm">
                        <span className="text-slate-600">Số lượng còn lại trong lô</span>
                        <span className="font-bold text-cyan-700 text-lg">{lot.soluongconlai} kg</span>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phạm vi thanh lý</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleKieuChange("toanbo")}
                                className={`flex-1 p-2 rounded-xl border text-sm font-bold transition-colors ${form.kieu === "toanbo" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            >
                                Toàn bộ lô
                            </button>
                            <button
                                type="button"
                                onClick={() => handleKieuChange("motphan")}
                                className={`flex-1 p-2 rounded-xl border text-sm font-bold transition-colors ${form.kieu === "motphan" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            >
                                Một phần
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Số lượng thanh lý (kg)</label>
                            <input
                                type="number"
                                disabled={form.kieu === "toanbo"}
                                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                value={form.soluongthanhly}
                                onChange={e => setForm({ ...form, soluongthanhly: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Đơn giá (0 nếu tiêu hủy)</label>
                            <input
                                type="number"
                                min="0"
                                disabled={form.trangthai === "DA_TIEU_HUY"}
                                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                value={form.dongia}
                                onChange={e => setForm({ ...form, dongia: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trạng thái xử lý</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                                value={form.trangthai}
                                onChange={e => {
                                    const trangthai = e.target.value;
                                    setForm({ ...form, trangthai, ...(trangthai === "DA_TIEU_HUY" ? { dongia: 0 } : {}) });
                                }}
                            >
                                <option value="DA_TIEU_HUY">Đã tiêu hủy</option>
                                <option value="DA_BAN_THANH_LY">Đã bán thanh lý</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lý do thanh lý</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                                placeholder="Cá chết, hao hụt lúc nhập, sự cố..."
                                value={form.lydothanhly}
                                onChange={e => setForm({ ...form, lydothanhly: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ghi chú</label>
                        <textarea
                            className="w-full p-2 border border-slate-200 rounded-xl resize-none h-14 text-sm outline-none"
                            placeholder="Ghi chú thêm..."
                            value={form.ghichu}
                            onChange={e => setForm({ ...form, ghichu: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-sm">
                        <span className="text-slate-500">Thành tiền</span>
                        <span className="font-bold text-slate-800 text-lg">{(Number(form.soluongthanhly || 0) * Number(form.dongia || 0)).toLocaleString()} VNĐ</span>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={() => navigate("/admin/QuanLyThanhLy")} disabled={submitting} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`px-6 py-2.5 font-bold rounded-xl text-sm ${submitting ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-cyan-600 text-white hover:bg-cyan-700"}`}
                    >
                        {submitting ? "Đang xử lý..." : "Xác nhận thanh lý"}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
