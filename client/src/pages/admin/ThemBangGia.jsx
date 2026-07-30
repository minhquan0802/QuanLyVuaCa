import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

export default function ThemBangGia() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const returnTo = location.state?.returnTo || "/admin/QuanLyBangGia";
    const isSizeSetup = location.state?.source === "size-setup";

    const [products, setProducts] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        idchitietcaban: location.state?.idchitietcaban
            ? String(location.state.idchitietcaban)
            : "",
        giabanle: location.state?.giaBanLe != null ? String(location.state.giaBanLe) : "",
        gibansi: location.state?.giaBanSi != null ? String(location.state.giaBanSi) : ""
    });

    useEffect(() => {
        api.get("/Chitietcabans")
            .then(({ data }) => setProducts(data.result || []))
            .catch(() => showToast("Không thể tải danh sách sản phẩm!", "error"));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.idchitietcaban) { showToast("Vui lòng chọn sản phẩm!", "error"); return; }
        const accepted = await confirm({
            title: "Thiết lập giá bán mới",
            message: "Lưu bảng giá mới và kết thúc hiệu lực của bảng giá hiện tại?",
            confirmText: "Lưu bảng giá",
            variant: "primary",
        });
        if (!accepted) return;
        try {
            setSubmitting(true);
            await api.post("/Banggias", {
                idchitietcaban: parseInt(formData.idchitietcaban),
                giabanle: parseFloat(formData.giabanle),
                giabansi: parseFloat(formData.gibansi),
            });
            showToast(
                isSizeSetup
                    ? "Đã thêm kích thước và thiết lập giá bán thành công!"
                    : "Thiết lập giá thành công! Giá cũ đã được lưu vào lịch sử.",
                "success"
            );
            navigate(returnTo);
        } catch (error) {
            showToast(`Lỗi: ${error.response?.data?.message || "Không thể lưu giá"}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!isSizeSetup) {
            navigate(returnTo);
            return;
        }

        const accepted = await confirm({
            title: "Hủy thiết lập giá?",
            message: "Kích cỡ vừa áp dụng sẽ được gỡ lại để tránh tồn tại sản phẩm chưa có bảng giá. Bạn vẫn muốn hủy?",
            confirmText: "Hủy và gỡ kích cỡ",
            variant: "danger",
        });
        if (!accepted) return;

        try {
            setSubmitting(true);
            await api.delete(`/Chitietcabans/${formData.idchitietcaban}`);
            showToast("Đã hủy thiết lập giá và gỡ lại kích cỡ.", "success");
            navigate(returnTo);
        } catch (error) {
            showToast(
                error.response?.data?.message || "Không thể hoàn tác kích cỡ. Vui lòng thử lại!",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout title="Thiết lập giá bán mới">
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-black overflow-hidden">
                    <div className="px-6 py-4 border-b border-black bg-cyan-600">
                        <h3 className="font-bold text-lg text-white">
                            {isSizeSetup ? "Hoàn tất thiết lập kích cỡ" : "Thiết lập giá bán mới"}
                        </h3>
                        <p className="text-xs text-cyan-50">
                            {isSizeSetup
                                ? `Thiết lập giá cho ${location.state?.productName || "kích cỡ vừa áp dụng"} trước khi bán.`
                                : "Chọn sản phẩm và nhập mức giá có hiệu lực từ hôm nay."}
                        </p>
                    </div>

                    <div className="p-5 space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Chọn sản phẩm (Cá + Size)</label>
                        <select
                            required
                            className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm transition-all"
                            value={formData.idchitietcaban}
                            onChange={e => setFormData({ ...formData, idchitietcaban: e.target.value })}
                        >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.tenLoaiCa} - {p.tenSize}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Giá bán lẻ</label>
                            <div className="relative flex items-center">
                                <input
                                    type="number" required min="1001" placeholder="0"
                                    className="w-full p-2 pr-14 border border-slate-200 rounded-xl bg-slate-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono font-bold text-slate-700 text-sm transition-all"
                                    value={formData.giabanle}
                                    onChange={e => setFormData({ ...formData, giabanle: e.target.value })}
                                />
                                <span className="absolute right-3 font-bold text-slate-400 select-none text-xs pointer-events-none">VNĐ</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Giá bán sỉ</label>
                            <div className="relative flex items-center">
                                <input
                                    type="number" required min="1001" placeholder="0"
                                    className="w-full p-2 pr-14 border border-slate-200 rounded-xl bg-slate-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono font-bold text-slate-700 text-sm transition-all"
                                    value={formData.gibansi}
                                    onChange={e => setFormData({ ...formData, gibansi: e.target.value })}
                                />
                                <span className="absolute right-3 font-bold text-slate-400 select-none text-xs pointer-events-none">VNĐ</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cyan-50 p-3 rounded-xl border border-black flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5 text-cyan-600 shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 0-.551-.657l-.403-.087a48 48 0 0 0-.195 0m0 0a9 9 0 1 1 12.728 0M12 20.25a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Zm-1.352-12.006A1.5 1.5 0 1 1 12 9.75a1.5 1.5 0 0 1-1.352-1.506Z" />
                        </svg>
                        <p className="text-sm text-cyan-800 leading-relaxed">
                            <strong>Lưu ý:</strong> Giá mới sẽ có hiệu lực ngay từ <strong>Hôm nay</strong>.
                            Nếu sản phẩm này đang có giá cũ, hệ thống sẽ tự động đóng lại.
                        </p>
                    </div>

                    </div>

                    <div className="p-4 border-t border-black bg-cyan-600 flex justify-end gap-3">
                        <button type="button" disabled={submitting} onClick={handleCancel} className="px-5 py-2.5 rounded-xl border border-red-700 bg-red-50 text-red-700 font-bold hover:bg-red-100 disabled:opacity-50 text-sm cursor-pointer">
                            {isSizeSetup ? "Hủy thiết lập" : "Hủy"}
                        </button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 border border-black bg-white text-cyan-800 font-bold rounded-xl hover:bg-cyan-50 shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed text-sm">
                            {submitting ? "Đang lưu..." : "Xác nhận & Lưu giá"}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
