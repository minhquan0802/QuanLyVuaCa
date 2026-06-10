import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function ThemBangGia() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({ idchitietcaban: "", giabanle: "", gibansi: "" });

    useEffect(() => {
        api.get("/Chitietcabans")
            .then(({ data }) => setProducts(data.result || []))
            .catch(() => showToast("Không thể tải danh sách sản phẩm!", "error"));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.idchitietcaban) { showToast("Vui lòng chọn sản phẩm!", "error"); return; }
        try {
            await api.post("/Banggias", {
                idchitietcaban: parseInt(formData.idchitietcaban),
                giabanle: parseFloat(formData.giabanle),
                giabansi: parseFloat(formData.gibansi),
            });
            showToast("Thiết lập giá thành công! Giá cũ đã được lưu vào lịch sử.", "success");
            navigate("/admin/QuanLyBangGia");
        } catch (error) {
            showToast(`Lỗi: ${error.response?.data?.message || "Không thể lưu giá"}`, "error");
        }
    };

    return (
        <AdminLayout title="Thiết lập giá bán mới">
            <div className="max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Chọn sản phẩm (Cá + Size)</label>
                        <select
                            required
                            className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none shadow-xs text-sm transition-all"
                            value={formData.idchitietcaban}
                            onChange={e => setFormData({ ...formData, idchitietcaban: e.target.value })}
                        >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.tenLoaiCa} - {p.tenSize} (Mã kho: #{p.id})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Giá Bán Lẻ</label>
                            <div className="relative flex items-center">
                                <input
                                    type="number" required min="0" placeholder="0"
                                    className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono font-bold text-slate-700 shadow-xs text-sm transition-all"
                                    value={formData.giabanle}
                                    onChange={e => setFormData({ ...formData, giabanle: e.target.value })}
                                />
                                <span className="absolute left-3.5 font-bold text-slate-400 select-none text-sm">₫</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Giá Bán Sỉ</label>
                            <div className="relative flex items-center">
                                <input
                                    type="number" required min="0" placeholder="0"
                                    className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono font-bold text-slate-700 shadow-xs text-sm transition-all"
                                    value={formData.gibansi}
                                    onChange={e => setFormData({ ...formData, gibansi: e.target.value })}
                                />
                                <span className="absolute left-3.5 font-bold text-slate-400 select-none text-sm">₫</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cyan-50/70 p-4 rounded-xl border border-cyan-100 flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5 text-cyan-600 shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 0-.551-.657l-.403-.087a48 48 0 0 0-.195 0m0 0a9 9 0 1 1 12.728 0M12 20.25a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Zm-1.352-12.006A1.5 1.5 0 1 1 12 9.75a1.5 1.5 0 0 1-1.352-1.506Z" />
                        </svg>
                        <p className="text-sm text-cyan-800 leading-relaxed">
                            <strong>Lưu ý:</strong> Giá mới sẽ có hiệu lực ngay từ <strong>Hôm nay</strong>.
                            Nếu sản phẩm này đang có giá cũ, hệ thống sẽ tự động đóng lại.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => navigate("/admin/QuanLyBangGia")} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm cursor-pointer">Hủy</button>
                        <button type="submit" className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all active:scale-95 cursor-pointer text-sm">
                            Xác nhận & Lưu Giá
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
