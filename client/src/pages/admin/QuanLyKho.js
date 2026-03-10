import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchCoXacThuc } from "../../utils/fetchAPI";

export default function QuanLyKho() {
    // --- STATE DỮ LIỆU ---
    const [inventory, setInventory] = useState([]);
    const [fishTypes, setFishTypes] = useState([]); 
    const [suppliers, setSuppliers] = useState([]); 
    const [sizes, setSizes] = useState([]); 
    const [priceList, setPriceList] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    const [sortConfig, setSortConfig] = useState({ key: 'tenLoaiCa', direction: 'asc' }); 

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    // --- Form Master ---
    const [importForm, setImportForm] = useState({
        idloaica: "",
        idncc: "",
        ngaynhap: new Date().toISOString().split('T')[0],
        trangthaithanhtoan: "CHUA_THANH_TOAN",
        tongsoluongnhap: "", 
        ghichu: ""
    });

    const [currentDetail, setCurrentDetail] = useState({
        idsizeca: "",
        sizeName: "",
        soluongnhap: 10,
        gianhap: 0,
        giabanledukien: 0,
        giabansidukien: 0
    });

    const [addedDetails, setAddedDetails] = useState([]);

    // --- LOAD DỮ LIỆU ---
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [resInventory, resFish, resSuppliers, resSizes, resPrices] = await Promise.all([
                fetchCoXacThuc("/Chitietcabans"),
                fetchCoXacThuc("/Loaicas"),
                fetchCoXacThuc("/Nhacungcaps"),
                fetchCoXacThuc("/Sizecas"),
                fetchCoXacThuc("/Banggias") 
            ]);

            if (resInventory.ok) setInventory((await resInventory.json()).result || []);
            if (resFish.ok) setFishTypes((await resFish.json()).result || []);
            if (resSuppliers.ok) {
                const data = await resSuppliers.json();
                setSuppliers(data.result || []); 
            };
            if (resSizes.ok) setSizes((await resSizes.json()).result || []);
            
            if (resPrices.ok) {
                const data = await resPrices.json();
                const allPrices = data.result || [];
                const active = allPrices.filter(p => p.trangThai === "Đang áp dụng" || !p.ngayKetThuc);
                setPriceList(active);
            }

        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // --- LOGIC SẮP XẾP ---
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedInventory = [...inventory].sort((a, b) => {
        const key = sortConfig.key;
        let valA = a[key];
        let valB = b[key];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (key === 'soluongton') {
            valA = Number(valA || 0);
            valB = Number(valB || 0);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return <span className="material-symbols-outlined text-[16px] text-slate-300">unfold_more</span>;
        return sortConfig.direction === 'asc' 
            ? <span className="material-symbols-outlined text-[16px] text-blue-600">arrow_upward</span> 
            : <span className="material-symbols-outlined text-[16px] text-blue-600">arrow_downward</span>;
    };

    // --- HELPER: TÌM GIÁ HIỆN TẠI ---
    const findCurrentPrice = (fishId, sizeId) => {
        const invItem = inventory.find(i => i.idLoaiCa == fishId && i.idSizeCa == sizeId);
        if (!invItem) return null; 

        const priceItem = priceList.find(p => {
            const pIdKho = p.idChitietcaban || (p.chitietcaban && p.chitietcaban.id);
            return Number(pIdKho) === Number(invItem.id);
        });

        return priceItem; 
    };

    // --- LOGIC MODAL ---
    const handleSelectFishImport = (fishId) => {
        setImportForm(prev => ({ ...prev, idloaica: fishId }));
        setCurrentDetail(prev => ({ ...prev, idsizeca: "", sizeName: "" }));
    };

    // Hàm giữ nguyên theo yêu cầu
    const availableSizes = importForm.idloaica 
        ? inventory
            .filter(item => item.idLoaiCa == importForm.idloaica) 
            .map(item => ({
                id: item.idSizeCa, 
                sizeca: item.tenSize
            }))
            .reduce((unique, item) => {
                return unique.some(u => u.id === item.id) ? unique : [...unique, item];
            }, [])
        : [];

    const handleSelectSize = (e) => {
        const sizeId = e.target.value;
        
        // [SỬA LỖI] Ưu tiên tìm trong availableSizes (list đang hiển thị), nếu không thấy mới tìm trong sizes gốc
        const sizeObj = availableSizes.find(s => s.id == sizeId) || sizes.find(s => s.id == sizeId);
        
        // Tự động điền giá cũ nếu có
        const currentPriceObj = findCurrentPrice(importForm.idloaica, sizeId);
        const autoLe = currentPriceObj ? (currentPriceObj.giaBanLe || currentPriceObj.giabanle) : 0;
        const autoSi = currentPriceObj ? (currentPriceObj.giaBanSi || currentPriceObj.giabansi) : 0;

        setCurrentDetail(prev => ({
            ...prev,
            idsizeca: sizeId,
            // Nếu tìm thấy sizeObj thì lấy tên, nếu không thì để rỗng (tránh lỗi null)
            sizeName: sizeObj ? sizeObj.sizeca : "", 
            giabanledukien: autoLe,
            giabansidukien: autoSi
        }));
    };

    // --- LOGIC THÊM CHI TIẾT ---
    const handleAddDetail = () => {
        if (!importForm.tongsoluongnhap || importForm.tongsoluongnhap <= 0) {
            return alert("Vui lòng nhập Tổng số lượng dự kiến ở cột bên trái trước!");
        }
        if (!currentDetail.idsizeca) return alert("Vui lòng chọn Size!");
        if (currentDetail.soluongnhap <= 0) return alert("Số lượng nhập phải > 0");
        if (currentDetail.gianhap <= 0) return alert("Giá nhập phải > 0");

        const currentSum = addedDetails.reduce((sum, item) => sum + Number(item.soluongnhap), 0);
        const newSum = currentSum + Number(currentDetail.soluongnhap);
        if (newSum > Number(importForm.tongsoluongnhap)) {
            return alert(`Không thể thêm! Tổng lượng nhập (${newSum}kg) sẽ vượt quá tổng dự kiến (${importForm.tongsoluongnhap}kg).`);
        }

        // Xử lý Giá bán
        let finalLe = Number(currentDetail.giabanledukien);
        let finalSi = Number(currentDetail.giabansidukien);

        if (finalLe === 0 || finalSi === 0) {
            const currentPriceObj = findCurrentPrice(importForm.idloaica, currentDetail.idsizeca);
            if (currentPriceObj) {
                if (finalLe === 0) finalLe = Number(currentPriceObj.giaBanLe || currentPriceObj.giabanle || 0);
                if (finalSi === 0) finalSi = Number(currentPriceObj.giaBanSi || currentPriceObj.giabansi || 0);
            }
        }

        // Validate Giá bán > Giá nhập
        if (finalLe > 0 && finalLe <= Number(currentDetail.gianhap)) {
            return alert(`Giá Bán Lẻ (${finalLe.toLocaleString()}) phải lớn hơn Giá Nhập (${Number(currentDetail.gianhap).toLocaleString()})!`);
        }
        if (finalSi > 0 && finalSi <= Number(currentDetail.gianhap)) {
            return alert(`Giá Bán Sỉ (${finalSi.toLocaleString()}) phải lớn hơn Giá Nhập (${Number(currentDetail.gianhap).toLocaleString()})!`);
        }
        
        if (finalLe === 0 || finalSi === 0) {
            if(!window.confirm("Cảnh báo: Bạn chưa thiết lập giá bán cho mặt hàng này. Bạn có chắc muốn tiếp tục (Giá bán sẽ là 0)?")) {
                return;
            }
        }

        const newItem = { 
            ...currentDetail, 
            giabanledukien: finalLe,
            giabansidukien: finalSi,
            idTemp: Date.now() 
        };

        setAddedDetails(prev => [...prev, newItem]);
        
        setCurrentDetail(prev => ({ 
            ...prev, 
            idsizeca: "", 
            sizeName: "", 
            giabanledukien: 0, 
            giabansidukien: 0 
        }));
    };

    const handleRemoveDetail = (idTemp) => {
        setAddedDetails(prev => prev.filter(item => item.idTemp !== idTemp));
    };

    const calculateTotalImportMoney = () => {
        return addedDetails.reduce((sum, item) => sum + (item.soluongnhap * item.gianhap), 0);
    };

    const calculateTotalWeight = () => {
        return addedDetails.reduce((sum, item) => sum + Number(item.soluongnhap), 0);
    };

    // --- [SỬA ĐỔI] SUBMIT VÀ CẬP NHẬT GIÁ ---
    const handleSubmitImport = async () => {
        if (!importForm.idloaica || !importForm.idncc) return alert("Vui lòng chọn Loại cá và Nhà cung cấp!");
        if (!importForm.tongsoluongnhap) return alert("Vui lòng nhập Tổng số lượng nhập!");
        if (addedDetails.length === 0) return alert("Phiếu nhập chưa có chi tiết lô hàng nào!");

        const totalDetails = calculateTotalWeight();
        if (totalDetails !== Number(importForm.tongsoluongnhap)) {
            return alert(`Lỗi logic: Tổng chi tiết (${totalDetails}kg) chưa khớp với Tổng khai báo ban đầu (${importForm.tongsoluongnhap}kg).`);
        }

        const payload = {
            idloaica: parseInt(importForm.idloaica),
            idncc: parseInt(importForm.idncc),
            ngaynhap: importForm.ngaynhap,
            trangthaithanhtoan: importForm.trangthaithanhtoan,
            ghichu: importForm.ghichu,
            listChiTiet: addedDetails.map(d => ({
                idsizeca: parseInt(d.idsizeca),
                soluongnhap: parseFloat(d.soluongnhap),
                gianhap: parseFloat(d.gianhap),
                giabanledukien: parseFloat(d.giabanledukien), 
                giabansidukien: parseFloat(d.giabansidukien)
            }))
        };

        try {
            // 1. Gọi API Nhập Hàng (Tạo phiếu, cập nhật kho)
            const res = await fetchCoXacThuc("/Phieunhaps", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                // 2. [MỚI] GỌI API CẬP NHẬT GIÁ (GIỐNG TRANG QUẢN LÝ BẢNG GIÁ)
                // Chỉ gọi khi giá nhập vào KHÁC giá hiện tại để tránh spam lịch sử giá
                const priceUpdatePromises = addedDetails.map(async (detail) => {
                    // Tìm ID Kho của mặt hàng này
                    const invItem = inventory.find(i => 
                        Number(i.idLoaiCa) === Number(importForm.idloaica) && 
                        Number(i.idSizeCa) === Number(detail.idsizeca)
                    );

                    if (invItem && invItem.id) {
                        // Lấy giá hiện tại để so sánh
                        const currentPriceObj = findCurrentPrice(importForm.idloaica, detail.idsizeca);
                        const currentLe = currentPriceObj ? (currentPriceObj.giaBanLe || currentPriceObj.giabanle) : 0;
                        const currentSi = currentPriceObj ? (currentPriceObj.giaBanSi || currentPriceObj.giabansi) : 0;
                        
                        const newLe = parseFloat(detail.giabanledukien);
                        const newSi = parseFloat(detail.giabansidukien);

                        // Nếu giá thay đổi, gọi API Bảng giá để cập nhật (Backend sẽ tự đóng giá cũ)
                        if (newLe !== currentLe || newSi !== currentSi) {
                            try {
                                await fetchCoXacThuc("/Banggias", {
                                    method: "POST",
                                    body: JSON.stringify({
                                        idchitietcaban: parseInt(invItem.id),
                                        giabanle: newLe,
                                        giabansi: newSi
                                    })
                                });
                            } catch (err) {
                                console.error("Lỗi cập nhật giá cho sản phẩm kho ID:", invItem.id, err);
                            }
                        }
                    }
                });

                // Đợi tất cả các request cập nhật giá hoàn tất
                await Promise.all(priceUpdatePromises);

                alert("Nhập hàng thành công! Kho và Bảng giá đã được cập nhật.");
                setIsImportModalOpen(false);
                fetchInitialData(); 
                setImportForm({ ...importForm, idloaica: "", ghichu: "", tongsoluongnhap: "" });
                setAddedDetails([]);
            } else {
                alert("Lỗi nhập hàng: " + data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối server");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn chắc chắn muốn ngừng kinh doanh mặt hàng này?")) return;
        try {
            const res = await fetchCoXacThuc(`/Chitietcabans/${id}`, { method: "DELETE" });
            if (res.ok) {
                alert("Đã xóa!");
                setInventory(inventory.filter(item => item.id !== id));
            }
        } catch (error) { console.error(error); }
    };
    
    const handleImportFromRow = (item) => {
        setIsImportModalOpen(true);
        setImportForm(prev => ({
            ...prev,
            idloaica: item.idLoaiCa
        }));
        
        const currentPriceObj = findCurrentPrice(item.idLoaiCa, item.idSizeCa);
        const autoLe = currentPriceObj ? (currentPriceObj.giaBanLe || currentPriceObj.giabanle) : 0;
        const autoSi = currentPriceObj ? (currentPriceObj.giaBanSi || currentPriceObj.giabansi) : 0;

        setCurrentDetail({
            idsizeca: item.idSizeCa,
            sizeName: item.tenSize,
            soluongnhap: 10,
            gianhap: 0,
            giabanledukien: autoLe,
            giabansidukien: autoSi
        });
    };

    return (
        <AdminLayout title="Quản Lý Kho Hàng">
            
            <div className="flex justify-between items-center mb-6">
                <div className="text-slate-500 text-sm">
                    Theo dõi tồn kho, nhập hàng và cập nhật giá tự động.
                </div>
                <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">input</span>
                    Tạo Phiếu Nhập
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('tenLoaiCa')}>
                                <div className="flex items-center gap-1">Tên sản phẩm {getSortIcon('tenLoaiCa')}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('tenSize')}>
                                <div className="flex items-center gap-1">Size {getSortIcon('tenSize')}</div>
                            </th>
                            <th className="p-4 text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('soluongton')}>
                                <div className="flex items-center justify-center gap-1">Tồn kho (kg) {getSortIcon('soluongton')}</div>
                            </th>
                            <th className="p-4 text-center">Trạng thái</th>
                            <th className="p-4 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center">Đang tải dữ liệu...</td></tr>
                        ) : sortedInventory.length > 0 ? (
                            sortedInventory.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-bold text-slate-700">{item.tenLoaiCa}</td>
                                    <td className="p-4 text-slate-600">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold border border-slate-200">{item.tenSize}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                                            item.soluongton > 10 ? 'bg-green-100 text-green-700' : 
                                            item.soluongton > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {item.soluongton} kg
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-xs font-bold text-blue-600 flex items-center justify-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Đang bán
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleImportFromRow(item)} 
                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg mr-2"
                                            title="Nhập thêm hàng này"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">input</span>
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Kho hàng trống.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL NHẬP HÀNG --- */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden max-h-[90vh] flex flex-col">
                        
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-green-50">
                            <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                                <span className="material-symbols-outlined">inventory_2</span> Tạo Phiếu Nhập Hàng
                            </h3>
                            <button onClick={() => setIsImportModalOpen(false)}><span className="material-symbols-outlined text-slate-400">close</span></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* CỘT TRÁI */}
                            <div className="lg:col-span-4 space-y-5 border-r border-slate-100 pr-6">
                                <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-blue-600">looks_one</span>
                                    Thông tin chung
                                </h4>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nhà cung cấp</label>
                                    <select
                                        className="w-full p-2.5 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-green-500 outline-none"
                                        value={importForm.idncc}
                                        onChange={e => setImportForm({ ...importForm, idncc: e.target.value })}
                                    >
                                        <option value="">-- Chọn NCC --</option>
                                        {suppliers.map(s => <option key={s.idncc || s.id} value={s.idncc || s.id}>{s.tenncc}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Loại cá nhập</label>
                                    <select 
                                        className="w-full p-2.5 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-green-500 outline-none"
                                        value={importForm.idloaica}
                                        onChange={e => handleSelectFishImport(e.target.value)}
                                    >
                                        <option value="">-- Chọn Loại Cá --</option>
                                        {fishTypes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                                    </select>
                                </div>

                                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                    <label className="block text-xs font-bold text-yellow-800 uppercase mb-1">
                                        Tổng Số Lượng Nhập (kg)
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2.5 border border-yellow-300 rounded-xl text-lg font-bold text-yellow-900 focus:ring-2 focus:ring-yellow-500 outline-none"
                                        placeholder="VD: 100"
                                        value={importForm.tongsoluongnhap}
                                        onChange={e => setImportForm({...importForm, tongsoluongnhap: e.target.value})} 
                                    />
                                    <p className="text-[10px] text-yellow-600 mt-1">
                                        * Phải nhập tổng trước khi chia lô chi tiết.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày nhập</label>
                                        <input type="date" className="w-full p-2.5 border rounded-xl" value={importForm.ngaynhap} onChange={e => setImportForm({...importForm, ngaynhap: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thanh toán</label>
                                        <select 
                                            className={`w-full p-2.5 border rounded-xl font-bold ${importForm.trangthaithanhtoan === 'DA_THANH_TOAN' ? 'text-green-600 bg-green-50 border-green-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}
                                            value={importForm.trangthaithanhtoan} 
                                            onChange={e => setImportForm({...importForm, trangthaithanhtoan: e.target.value})}
                                        >
                                            <option value="CHUA_THANH_TOAN">Chưa TT</option>
                                            <option value="DA_THANH_TOAN">Đã Thanh Toán</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú</label>
                                    <textarea className="w-full p-2.5 border rounded-xl resize-none h-20" placeholder="Ghi chú nhập hàng..." value={importForm.ghichu} onChange={e => setImportForm({...importForm, ghichu: e.target.value})}></textarea>
                                </div>
                            </div>

                            {/* CỘT PHẢI */}
                            <div className="lg:col-span-8 flex flex-col h-full">
                                <div className="flex justify-between items-center border-b pb-2 mb-4">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-blue-600">looks_two</span>
                                        Phân Bổ Chi Tiết (Lô)
                                    </h4>
                                    
                                    <div className="text-sm font-bold">
                                        Đã phân bổ: <span className={`${calculateTotalWeight() === Number(importForm.tongsoluongnhap) ? 'text-green-600' : 'text-red-500'}`}>
                                            {calculateTotalWeight()}
                                        </span> 
                                        <span className="text-slate-400"> / </span> 
                                        <span>{importForm.tongsoluongnhap || 0} kg</span>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-3">
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Size</label>
                                        <select
                                            className="w-full p-2 border rounded-lg text-sm"
                                            value={currentDetail.idsizeca}
                                            onChange={handleSelectSize}
                                            disabled={!importForm.idloaica}
                                        >
                                            <option value="">
                                                {!importForm.idloaica ? "Chọn cá trước" : (availableSizes.length > 0 ? "Chọn Size" : "Chưa có size")}
                                            </option>
                                            {availableSizes.map(s => (
                                                <option key={s.id} value={s.id}>{s.sizeca}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 block mb-1">SL Nhập</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm" value={currentDetail.soluongnhap} onChange={e => setCurrentDetail({...currentDetail, soluongnhap: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 block mb-1">Giá Nhập</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm" placeholder="VNĐ" value={currentDetail.gianhap} onChange={e => setCurrentDetail({...currentDetail, gianhap: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-blue-600 block mb-1">Giá Bán Lẻ</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm border-blue-200 bg-blue-50" placeholder="Dự kiến" value={currentDetail.giabanledukien} onChange={e => setCurrentDetail({...currentDetail, giabanledukien: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-blue-600 block mb-1">Giá Bán Sỉ</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm border-blue-200 bg-blue-50" placeholder="Dự kiến" value={currentDetail.giabansidukien} onChange={e => setCurrentDetail({...currentDetail, giabansidukien: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        <button onClick={handleAddDetail} className="w-full p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex justify-center"><span className="material-symbols-outlined">add</span></button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto border rounded-xl bg-white">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 text-slate-500 sticky top-0">
                                            <tr>
                                                <th className="p-3">Size</th>
                                                <th className="p-3 text-right">SL (kg)</th>
                                                <th className="p-3 text-right">Giá nhập</th>
                                                <th className="p-3 text-right">Thành tiền</th>
                                                <th className="p-3 text-right text-blue-600">Giá Bán Lẻ</th>
                                                <th className="p-3 text-right text-blue-600">Giá Bán Sỉ</th>
                                                <th className="p-3 text-center">Xóa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {addedDetails.map(item => (
                                                <tr key={item.idTemp}>
                                                    <td className="p-3 font-bold">{item.sizeName}</td>
                                                    <td className="p-3 text-right">{item.soluongnhap}</td>
                                                    <td className="p-3 text-right">{Number(item.gianhap).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-bold">{(item.soluongnhap * item.gianhap).toLocaleString()}</td>
                                                    <td className="p-3 text-right text-blue-600">{Number(item.giabanledukien).toLocaleString()}</td>
                                                    <td className="p-3 text-right text-blue-600">{Number(item.giabansidukien).toLocaleString()}</td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleRemoveDetail(item.idTemp)} className="text-red-500 hover:bg-red-50 p-1 rounded"><span className="material-symbols-outlined text-sm">delete</span></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {addedDetails.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Chưa có lô hàng nào.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex justify-between items-center pt-4 border-t">
                                    <div className="text-slate-600">
                                        Tổng tiền nhập: <span className="text-xl font-bold text-slate-800">{calculateTotalImportMoney().toLocaleString()} VNĐ</span>
                                    </div>
                                    <button 
                                        onClick={handleSubmitImport} 
                                        disabled={calculateTotalWeight() !== Number(importForm.tongsoluongnhap)}
                                        className={`px-6 py-3 font-bold rounded-xl shadow-lg transition-all ${
                                            calculateTotalWeight() === Number(importForm.tongsoluongnhap)
                                            ? "bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                                            : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                                        }`}
                                    >
                                        Hoàn tất nhập kho
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}