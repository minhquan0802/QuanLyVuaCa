import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyBangGia() {
    const [priceList, setPriceList] = useState([]);
    const [products, setProducts] = useState([]); // Danh sách cá trong kho
    const [loading, setLoading] = useState(true);
    
    // State Modal & Tìm kiếm
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); // State lưu từ khóa tìm kiếm

    // Form Data
    const [formData, setFormData] = useState({
        idchitietcaban: "",
        giabanle: "",
        gibansi: "" 
    });

    const { showToast } = useToast();

    // 1. Fetch dữ liệu
    const fetchData = async () => {
        try {
            setLoading(true);
            const [resPrices, resProducts] = await Promise.all([
                api.get("/Banggias"),
                api.get("/Chitietcabans")
            ]);

            // Sắp xếp: Cái nào "Đang áp dụng" lên đầu, sau đó đến mới nhất
            const sortedData = (resPrices.data.result || []).sort((a, b) => {
                if (a.trangThai === "Đang áp dụng") return -1;
                if (b.trangThai === "Đang áp dụng") return 1;
                return new Date(b.ngayBatDau) - new Date(a.ngayBatDau);
            });
            setPriceList(sortedData);
            setProducts(resProducts.data.result || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải dữ liệu bảng giá!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. Xử lý Submit (Lưu giá mới)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.idchitietcaban) {
            showToast("Vui lòng chọn sản phẩm!", "error");
            return;
        }

        try {
            const payload = {
                idchitietcaban: parseInt(formData.idchitietcaban),
                giabanle: parseFloat(formData.giabanle),
                giabansi: parseFloat(formData.gibansi)
            };

            await api.post("/Banggias", payload);
            showToast("Thiết lập giá thành công! Giá cũ đã được lưu vào lịch sử.", "success");
            setIsModalOpen(false);
            fetchData(); // Reload lại bảng
            setFormData({ idchitietcaban: "", giabanle: "", gibansi: "" }); // Reset form
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message || "Không thể lưu giá";
            showToast(`Lỗi: ${errorMsg}`, "error");
        }
    };

    // Logic lọc danh sách bảng giá theo từ khóa tìm kiếm (Tên cá hoặc Kích thước)
    const filteredPriceList = priceList.filter(item => {
        const fishName = (item.tenLoaiCa || "").toLowerCase();
        const sizeName = (item.tenSize || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return fishName.includes(search) || sizeName.includes(search);
    });

    // Helper: Badge trạng thái
    const renderStatusBadge = (status) => {
        if (status === "Đang áp dụng") {
            return <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-green-500"></span>Đang áp dụng</span>;
        }
        if (status === "Sắp áp dụng") {
            return <span className="bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full text-xs font-bold border border-cyan-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-cyan-500"></span>Sắp áp dụng</span>;
        }
        return <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-slate-400"></span>Đã hết hạn</span>;
    };

    return (
        <AdminLayout title="Quản Lý Bảng Giá">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-md flex items-center">
                    <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
                        </svg>
                    </div>
                    {/* Bổ sung value và onChange kết nối với state searchTerm */}
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên cá..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder-slate-400 shadow-xs transition-all text-sm bg-white" 
                    />
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all active:scale-95 w-full sm:w-auto text-sm cursor-pointer">
                    Thiết lập giá mới
                </button>
            </div>

            {/* BẢNG DANH SÁCH GIÁ */}
            <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Sản phẩm</th>
                                <th className="p-4">Kích thước</th>
                                <th className="p-4 text-right">Giá Bán Lẻ (vnđ)</th>
                                <th className="p-4 text-right">Giá Bán Sỉ (vnđ)</th>
                                <th className="p-4 text-center">Hiệu lực</th>
                                <th className="p-4 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-6 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : filteredPriceList.length > 0 ? (
                                // Render dựa trên mảng đã được lọc filteredPriceList
                                filteredPriceList.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${item.trangThai === "Đang áp dụng" ? "bg-cyan-50/10" : ""}`}>
                                        <td className="p-4 font-bold text-cyan-950">{item.tenLoaiCa}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 whitespace-nowrap">{item.tenSize}</span>
                                        </td>
                                        <td className="p-4 text-right font-mono font-medium text-slate-700">
                                            {Number(item.giaBanLe).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-right font-mono font-medium text-slate-700">
                                            {Number(item.giaBanSi).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-center text-xs text-slate-500">
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <span>Từ: <span className="font-medium text-slate-700">{new Date(item.ngayBatDau).toLocaleDateString('vi-VN')}</span></span>
                                                {item.ngayKetThuc ? (
                                                    <span>Đến: <span className="font-medium text-slate-700">{new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')}</span></span>
                                                ) : (
                                                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-0.5">Hiện tại</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {renderStatusBadge(item.trangThai)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Không tìm thấy kết quả phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL THÊM GIÁ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Thiết lập giá bán mới</h3>
                                <p className="text-xs text-slate-500">Giá cũ sẽ tự động chốt vào ngày hôm qua</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Chọn sản phẩm trong kho */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Chọn sản phẩm (Cá + Size)</label>
                                <select 
                                    required 
                                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none shadow-xs text-sm transition-all"
                                    value={formData.idchitietcaban}
                                    onChange={e => setFormData({...formData, idchitietcaban: e.target.value})}
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.tenLoaiCa} - {p.tenSize} (Mã kho: #{p.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Giá Bán Lẻ</label>
                                    <div className="relative flex items-center">
                                        <input 
                                            type="number" required min="0"
                                            placeholder="0"
                                            className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono font-bold text-slate-700 shadow-xs text-sm transition-all"
                                            value={formData.giabanle}
                                            onChange={e => setFormData({...formData, giabanle: e.target.value})}
                                        />
                                        <span className="absolute left-3.5 font-bold text-slate-400 select-none text-sm">₫</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Giá Bán Sỉ</label>
                                    <div className="relative flex items-center">
                                        <input 
                                            type="number" required min="0"
                                            placeholder="0"
                                            className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono font-bold text-slate-700 shadow-xs text-sm transition-all"
                                            value={formData.gibansi}
                                            onChange={e => setFormData({...formData, gibansi: e.target.value})}
                                        />
                                        <span className="absolute left-3.5 font-bold text-slate-400 select-none text-sm">₫</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-cyan-50/70 p-4 rounded-xl border border-cyan-100 flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5 text-cyan-600 shrink-0 mt-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 0-.551-.657l-.403-.087c-.302-.065-.605-.13-.907-.195m0 0a9 9 0 1 1 12.728 0M12 20.25a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Zm-1.352-12.006A1.5 1.5 0 1 1 12 9.75a1.5 1.5 0 0 1-1.352-1.506Z" />
                                </svg>
                                <p className="text-sm text-cyan-800 leading-relaxed">
                                    <strong>Lưu ý:</strong> Giá mới sẽ có hiệu lực ngay từ <strong>Hôm nay</strong>. 
                                    Nếu sản phẩm này đang có giá cũ, hệ thống sẽ tự động đóng lại (Hết hạn vào hôm qua).
                                </p>
                            </div>

                            <button type="submit" className="w-full py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all active:scale-95 mt-2 cursor-pointer text-sm">
                                Xác nhận & Lưu Giá
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* STYLE UTILITIES FOR TAILWIND V4 COMPATIBILITY */}
            <style>{`
                .label-text { display: block; font-size: 0.875rem; font-weight: 700; color: #334155; margin-bottom: 0.375rem; }
                .input-field { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; transition: all 0.2s; font-size: 0.875rem; bg: #ffffff; }
                .input-field:focus { border-color: #0891b2; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2); }
            `}</style>
        </AdminLayout>
    );
}