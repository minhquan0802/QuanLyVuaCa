import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchCoXacThuc } from "../../utils/fetchAPI"; 

export default function QuanLyLoaiCa() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const APP_BASE_URL = "http://localhost:8080/QuanLyVuaCa";

    // --- STATES CHO MODAL SIZE ---
    const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
    const [selectedFish, setSelectedFish] = useState(null); 
    const [fishInventory, setFishInventory] = useState([]); // List size của cá hiện tại
    
    // LOGIC COMBOBOX ---
    const [allGlobalSizes, setAllGlobalSizes] = useState([]); // Tất cả size trong DB (để đổ vào Select)
    const [selectedSizeId, setSelectedSizeId] = useState(""); // ID size được chọn từ Select
    const [isCreatingNew, setIsCreatingNew] = useState(false); // Chế độ: false=Chọn có sẵn, true=Tạo mới
    const [newSizeName, setNewSizeName] = useState("");       // Input tên size mới

    // 1. Fetch Data Loại Cá
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetchCoXacThuc("/Loaicas");
            if (!res.ok) throw new Error("Lỗi kết nối server");
            const data = await res.json();
            
            let realData = [];
            if (Array.isArray(data)) realData = data;
            else if (data.result && Array.isArray(data.result)) realData = data.result;
            else if (data.data && Array.isArray(data.data)) realData = data.data;

            setCategories(realData);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    
    const getImageUrl = (imageName) => {
        if (!imageName) return 'https://placehold.co/100x100?text=No+Image';
        if (imageName.startsWith('http')) return imageName;
        if (imageName.startsWith('/')) return `${APP_BASE_URL}${imageName}`;
        return `${APP_BASE_URL}/images/loaica/${imageName}`;
    };

    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ id: null, tenloaica: "", mieuta: "", hinhanhurl: "" });

    const handleMoTabThemMoi = () => {
        setIsEditing(false);
        setCurrentCategory({ id: null, tenloaica: "", mieuta: "", hinhanhurl: "" });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("tenloaica", currentCategory.tenloaica);
            formData.append("mieuta", currentCategory.mieuta);
            if (currentCategory.hinhanhFile) formData.append("hinhanh", currentCategory.hinhanhFile);

            const res = await fetchCoXacThuc("/Loaicas", { method: "POST", body: formData });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Lỗi server"); }
            
            const data = await res.json();
            setCategories([...categories, data.result]);
            alert("Thêm thành công!");
            setIsModalOpen(false);
        } catch (error) { alert("Lỗi: " + error.message); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("tenloaica", currentCategory.tenloaica);
            formData.append("mieuta", currentCategory.mieuta);
            if (currentCategory.hinhanhFile) formData.append("hinhanh", currentCategory.hinhanhFile);

            const res = await fetchCoXacThuc(`/Loaicas/${currentCategory.id}`, { method: "PUT", body: formData });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Lỗi cập nhật"); }

            const data = await res.json();
            setCategories(categories.map(item => item.id === data.result.id ? data.result : item));
            alert("Cập nhật thành công!");
            setIsModalOpen(false);
            setCurrentCategory(prev => ({ ...prev, hinhanhFile: null }));
        } catch (error) { alert("Lỗi: " + error.message); }
    };

    const handleEdit = (category) => {
        setIsEditing(true);
        setCurrentCategory(category);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn muốn xóa loại cá này?")) {
            try {
                const res = await fetchCoXacThuc(`/Loaicas/${id}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Không thể xóa (có thể do ràng buộc dữ liệu)");
                setCategories(categories.filter(item => item.id !== id));
                alert("Đã xóa!");
            } catch (error) { alert(error.message); }
        }
    };

    // --- LOGIC QUẢN LÝ SIZE (ĐÃ SỬA THEO YÊU CẦU MỚI) ---
    
    // 1. Mở Modal: Load tồn kho cá + Load tất cả Size global
    const handleOpenSize = async (fish) => {
        setSelectedFish(fish);
        setIsSizeModalOpen(true);
        setFishInventory([]);
        setAllGlobalSizes([]);
        
        // Reset form states
        setIsCreatingNew(false);
        setNewSizeName("");
        setSelectedSizeId("");

        try {
            // Gọi song song 2 API
            const [resInventory, resAllSizes] = await Promise.all([
                fetchCoXacThuc(`/Chitietcabans`), // Lấy danh sách đang có của cá
                fetchCoXacThuc(`/Sizecas`)       // Lấy danh sách tất cả size (cho combobox)
            ]);

            // Xử lý danh sách tồn kho của cá
            if (resInventory.ok) {
                const data = await resInventory.json();
                const allItems = data.result || [];
                // Lọc ra các dòng thuộc loại cá này
                const itemsForThisFish = allItems.filter(item => item.tenLoaiCa === fish.tenloaica);
                setFishInventory(itemsForThisFish);
            }

            // Xử lý danh sách Size global
            if (resAllSizes.ok) {
                const data = await resAllSizes.json();
                setAllGlobalSizes(data.result || []);
            }

        } catch (error) {
            console.error("Lỗi load dữ liệu:", error);
        }
    };

    // 2. Hàm xử lý thêm (Chung cho cả 2 trường hợp)
    const handleAddSize = async () => {
        try {
            let sizeIdToAdd = selectedSizeId;

            // TRƯỜNG HỢP 1: Tạo size mới (Nếu người dùng chọn nhập tay)
            if (isCreatingNew) {
                if (!newSizeName.trim()) { alert("Vui lòng nhập tên size!"); return; }
                
                const resSize = await fetchCoXacThuc("/Sizecas", {
                    method: "POST",
                    body: JSON.stringify({ sizeca: newSizeName })
                });

                if (!resSize.ok) {
                    const err = await resSize.json();
                    throw new Error(err.message || "Lỗi tạo Size mới");
                }
                const sizeData = await resSize.json();
                sizeIdToAdd = sizeData.result.idsizeca;
            } else {
                // TRƯỜNG HỢP 2: Chọn từ list có sẵn
                if (!sizeIdToAdd) { alert("Vui lòng chọn size!"); return; }
            }

            // --- BƯỚC CUỐI: Tạo liên kết trong bảng chitietcaban ---
            const chitietPayload = {
                idloaica: selectedFish.id,
                idsizeca: sizeIdToAdd,
                soluongton: 0
            };

            const resChitiet = await fetchCoXacThuc("/Chitietcabans", {
                method: "POST",
                body: JSON.stringify(chitietPayload)
            });

            if (resChitiet.ok) {
                handleOpenSize(selectedFish); // Reload lại dữ liệu
            } else {
                const err = await resChitiet.json();
                alert("Lỗi: " + (err.message || "Có thể size này đã được thêm cho cá này rồi!"));
            }

        } catch (error) {
            console.error(error);
            alert("Lỗi: " + error.message);
        }
    };

    const handleDeleteSize = async (chitietId) => {
        if (!window.confirm("Xóa size này khỏi loại cá?")) return;
        try {
            const res = await fetchCoXacThuc(`/Chitietcabans/${chitietId}`, { method: "DELETE" });
            if (res.ok) {
                setFishInventory(fishInventory.filter(s => s.id !== chitietId));
            } else {
                const err = await res.json();
                alert("Lỗi xóa: " + err.message);
            }
        } catch (error) { console.error(error); }
    };

    return (
        <AdminLayout title="Quản Lý Loại Cá & Kích Thước">
            {/* Toolbar giữ nguyên */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="relative w-full md:w-96">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input type="text" placeholder="Tìm kiếm loại cá..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <button onClick={handleMoTabThemMoi} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95">
                    <span className="material-symbols-outlined">add</span> Thêm Loại Cá
                </button>
            </div>

            {/* Bảng danh sách Loại cá giữ nguyên */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <th className="p-4 w-16 text-center">ID</th>
                            <th className="p-4 w-24">Hình ảnh</th>
                            <th className="p-4">Tên Loại Cá</th>
                            <th className="p-4">Miêu tả</th>
                            <th className="p-4 text-center w-40">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {loading ? <tr><td colSpan="5" className="p-8 text-center">Đang tải...</td></tr> : categories.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 text-center text-slate-500">#{item.id}</td>
                                <td className="p-4">
                                    <div className="size-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                                        <img src={getImageUrl(item.hinhanhurl)} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error' }} />
                                    </div>
                                </td>
                                <td className="p-4 font-bold text-blue-900">{item.tenloaica}</td>
                                <td className="p-4 text-slate-500 truncate max-w-xs">{item.mieuta}</td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button onClick={() => handleOpenSize(item)} className="size-8 flex items-center justify-center rounded-lg text-purple-600 hover:bg-purple-50" title="Cấu hình Size">
                                        <span className="material-symbols-outlined text-[20px]">straighten</span>
                                    </button>
                                    <button onClick={() => handleEdit(item)} className="size-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50" title="Chỉnh sửa loại cá">
                                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="size-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50" title="Xóa loại cá">
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL QUẢN LÝ SIZE (UPDATE MỚI) --- */}
            {isSizeModalOpen && selectedFish && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-purple-50">
                            <div>
                                <h3 className="font-bold text-lg text-purple-900">Quản lý Size</h3>
                                <p className="text-xs text-purple-600">Cho cá: <strong>{selectedFish.tenloaica}</strong></p>
                            </div>
                            <button onClick={() => setIsSizeModalOpen(false)} className="text-slate-400 hover:text-red-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            
                            {/* KHU VỰC THÊM SIZE */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thêm size mới vào cá này</label>
                                
                                <div className="flex gap-2 mb-2">
                                    {isCreatingNew ? (
                                        // --- Mode 2: Nhập tay (Tạo mới hoàn toàn) ---
                                        <input 
                                            type="text" 
                                            value={newSizeName}
                                            onChange={(e) => setNewSizeName(e.target.value)}
                                            placeholder="VD: Siêu to, 5kg..."
                                            className="flex-1 px-3 py-2 rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-200 outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        // --- Mode 1: ComboBox (Chọn có sẵn) ---
                                        <select 
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-purple-500 outline-none bg-white"
                                            value={selectedSizeId}
                                            onChange={(e) => setSelectedSizeId(e.target.value)}
                                        >
                                            <option value="">-- Chọn size có sẵn --</option>
                                            {allGlobalSizes.map(size => (
                                                <option key={size.idsizeca} value={size.idsizeca}>
                                                    {size.sizeca}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <button 
                                        onClick={handleAddSize}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-sm whitespace-nowrap"
                                    >
                                        {isCreatingNew ? "Lưu & Thêm" : "Thêm"}
                                    </button>
                                </div>

                                {/* Nút chuyển đổi chế độ */}
                                <div className="text-center">
                                    {isCreatingNew ? (
                                        <button onClick={() => setIsCreatingNew(false)} className="text-xs text-slate-500 hover:text-blue-600 underline">
                                            « Quay lại chọn size có sẵn
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                                            <span>Không có size bạn cần?</span>
                                            <button onClick={() => setIsCreatingNew(true)} className="font-bold text-blue-600 hover:text-blue-800 underline">
                                                + Thêm size mới vào hệ thống
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* DANH SÁCH SIZE HIỆN CÓ */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Danh sách size đang áp dụng</label>
                                {fishInventory.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                                        {fishInventory.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium shadow-sm">
                                                <span>{item.tenSize}</span>
                                                <button 
                                                    onClick={() => handleDeleteSize(item.id)}
                                                    className="size-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                    title="Xóa"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                        <span className="material-symbols-outlined text-slate-300 text-3xl">inbox</span>
                                        <p className="text-sm text-slate-400 mt-1">Chưa cấu hình size nào.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Modal Loại cá giữ nguyên... */}
            {isModalOpen && ( /* ... */ <div className="hidden">Placeholder</div>)} 
            {/* (Phần Modal thêm loại cá ở cuối file bạn giữ nguyên như cũ nhé) */}
             {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">{isEditing ? "Cập nhật Loại Cá" : "Thêm Loại Cá Mới"}</h3>
                            <button onClick={() => setIsModalOpen(false)}><span className="material-symbols-outlined text-slate-400">close</span></button>
                        </div>
                        <form onSubmit={isEditing ? handleUpdate : handleSave} className="p-6 space-y-4">
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Tên loại cá</label><input type="text" required value={currentCategory.tenloaica} onChange={(e) => setCurrentCategory({ ...currentCategory, tenloaica: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none" /></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Hình ảnh</label><input type="file" onChange={(e) => setCurrentCategory({ ...currentCategory, hinhanhFile: e.target.files[0] })} className="w-full px-4 py-2 rounded-lg border" /></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Miêu tả</label><textarea rows="3" value={currentCategory.mieuta} onChange={(e) => setCurrentCategory({ ...currentCategory, mieuta: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"></textarea></div>
                            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Hủy</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg">{isEditing ? "Lưu thay đổi" : "Thêm mới"}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}