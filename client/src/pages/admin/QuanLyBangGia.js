import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchCoXacThuc } from "../../utils/fetchAPI";

export default function QuanLyBangGia() {
    const [priceList, setPriceList] = useState([]);
    const [products, setProducts] = useState([]); // Danh sách cá trong kho
    const [loading, setLoading] = useState(true);
    
    // State Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form Data: Đã xóa trường ngaybatdau (vì Backend tự xử lý)
    const [formData, setFormData] = useState({
        idchitietcaban: "",
        giabanle: "",
        giabansi: ""
    });

    // 1. Fetch dữ liệu
    const fetchData = async () => {
        try {
            setLoading(true);
            const [resPrices, resProducts] = await Promise.all([
                fetchCoXacThuc("/Banggias"),
                fetchCoXacThuc("/Chitietcabans") // Lấy danh sách sản phẩm trong kho để dropdown
            ]);

            if (resPrices.ok) {
                const data = await resPrices.json();
                // Sắp xếp: Cái nào "Đang áp dụng" lên đầu, sau đó đến mới nhất
                const sortedData = (data.result || []).sort((a, b) => {
                    if (a.trangThai === "Đang áp dụng") return -1;
                    if (b.trangThai === "Đang áp dụng") return 1;
                    return new Date(b.ngayBatDau) - new Date(a.ngayBatDau);
                });
                setPriceList(sortedData);
            }
            
            if (resProducts.ok) {
                const data = await resProducts.json();
                setProducts(data.result || []);
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
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
            alert("Vui lòng chọn sản phẩm!");
            return;
        }

        try {
            // Payload chuẩn gửi về Backend (Không gửi ngày)
            const payload = {
                idchitietcaban: parseInt(formData.idchitietcaban),
                giabanle: parseFloat(formData.giabanle),
                giabansi: parseFloat(formData.giabansi)
            };

            const res = await fetchCoXacThuc("/Banggias", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Thiết lập giá thành công! Giá cũ đã được lưu vào lịch sử.");
                setIsModalOpen(false);
                fetchData(); // Reload lại bảng
                setFormData({ idchitietcaban: "", giabanle: "", giabansi: "" }); // Reset form
            } else {
                const err = await res.json();
                alert("Lỗi: " + (err.message || "Không thể lưu giá"));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // 3. Xử lý Xóa
    const handleDelete = async (id) => {
        if(!window.confirm("Bạn có chắc muốn xóa dòng lịch sử giá này không?")) return;
        try {
            const res = await fetchCoXacThuc(`/Banggias/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPriceList(priceList.filter(p => p.id !== id)); // Lưu ý: Backend trả về field là 'id' (theo BanggiaResponse)
                alert("Đã xóa!");
            } else {
                alert("Không thể xóa!");
            }
        } catch (e) { alert("Lỗi kết nối"); }
    };

    // Helper: Badge trạng thái
    const renderStatusBadge = (status) => {
        if (status === "Đang áp dụng") {
            return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">● Đang áp dụng</span>;
        }
        if (status === "Sắp áp dụng") {
            return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">● Sắp áp dụng</span>;
        }
        return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold border border-slate-200">Đã hết hạn</span>;
    };

    return (
        <AdminLayout title="Quản Lý Bảng Giá">
            {/* TOOLBAR */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-96">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input type="text" placeholder="Tìm theo tên cá..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
                    <span className="material-symbols-outlined">add_circle</span>
                    Thiết lập giá mới
                </button>
            </div>

            {/* BẢNG DANH SÁCH GIÁ */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                            <th className="p-4">Sản phẩm</th>
                            <th className="p-4">Kích thước</th>
                            <th className="p-4 text-right">Giá Bán Lẻ (vnđ)</th>
                            <th className="p-4 text-right">Giá Bán Sỉ (vnđ)</th>
                            <th className="p-4 text-center">Hiệu lực</th>
                            <th className="p-4 text-center">Trạng thái</th>
                            <th className="p-4 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-6 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                        ) : priceList.length > 0 ? (
                            priceList.map((item) => (
                                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.trangThai === "Đang áp dụng" ? "bg-green-50/30" : ""}`}>
                                    <td className="p-4 font-bold text-blue-900">{item.tenLoaiCa}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">{item.tenSize}</span>
                                    </td>
                                    <td className="p-4 text-right font-mono font-medium text-slate-700">
                                        {Number(item.giaBanLe).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="p-4 text-right font-mono font-medium text-slate-700">
                                        {Number(item.giaBanSi).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="p-4 text-center text-xs text-slate-500">
                                        <div className="flex flex-col gap-1">
                                            <span>Từ: {new Date(item.ngayBatDau).toLocaleDateString('vi-VN')}</span>
                                            {item.ngayKetThuc ? (
                                                <span>Đến: {new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')}</span>
                                            ) : (
                                                <span className="text-green-600 font-bold">Nay</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {renderStatusBadge(item.trangThai)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {/* Chỉ cho phép xóa nếu là nhập sai (hoặc tùy logic), ở đây ta cứ để nút xóa */}
                                        <button 
                                            onClick={() => handleDelete(item.id)} 
                                            className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa lịch sử giá này"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Chưa có bảng giá nào được thiết lập.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL THÊM GIÁ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Thiết lập giá bán mới</h3>
                                <p className="text-xs text-slate-500">Giá cũ sẽ tự động chốt vào ngày hôm qua</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}><span className="material-symbols-outlined text-slate-400">close</span></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            
                            {/* Chọn sản phẩm trong kho */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Chọn sản phẩm (Cá + Size)</label>
                                <select 
                                    required 
                                    className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Giá Bán Lẻ</label>
                                    <div className="relative">
                                        <input 
                                            type="number" required min="0"
                                            placeholder="0"
                                            className="w-full p-3 pl-8 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-700"
                                            value={formData.giabanle}
                                            onChange={e => setFormData({...formData, giabanle: e.target.value})}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₫</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Giá Bán Sỉ</label>
                                    <div className="relative">
                                        <input 
                                            type="number" required min="0"
                                            placeholder="0"
                                            className="w-full p-3 pl-8 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-700"
                                            value={formData.giabansi}
                                            onChange={e => setFormData({...formData, giabansi: e.target.value})}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₫</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5">info</span>
                                <p className="text-sm text-blue-800">
                                    <strong>Lưu ý:</strong> Giá mới sẽ có hiệu lực ngay từ <strong>Hôm nay</strong>. 
                                    Nếu sản phẩm này đang có giá cũ, hệ thống sẽ tự động đóng lại (Hết hạn vào hôm qua).
                                </p>
                            </div>

                            <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                                Xác nhận & Lưu Giá
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}