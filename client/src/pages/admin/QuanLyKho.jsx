import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

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

    const { showToast } = useToast();

    // --- LOAD DỮ LIỆU ---
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [resInventory, resFish, resSuppliers, resSizes, resPrices] = await Promise.all([
                api.get("/Chitietcabans"),
                api.get("/Loaicas"),
                api.get("/Nhacungcaps"),
                api.get("/Sizecas"),
                api.get("/Banggias")
            ]);

            setInventory(resInventory.data.result || []);
            setFishTypes(resFish.data.result || []);
            setSuppliers(resSuppliers.data.result || []);
            setSizes(resSizes.data.result || []);

            const allPrices = resPrices.data.result || [];
            const active = allPrices.filter(p => p.trangThai === "Đang áp dụng" || !p.ngayKetThuc);
            setPriceList(active);

        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải dữ liệu kho hàng!", "error");
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
        if (sortConfig.key !== columnKey) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5 text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5 text-cyan-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5 text-cyan-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
        );
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
        const sizeObj = availableSizes.find(s => s.id == sizeId) || sizes.find(s => s.id == sizeId);
        
        const currentPriceObj = findCurrentPrice(importForm.idloaica, sizeId);
        const autoLe = currentPriceObj ? (currentPriceObj.giaBanLe || currentPriceObj.giabanle) : 0;
        const autoSi = currentPriceObj ? (currentPriceObj.giaBanSi || currentPriceObj.giabansi) : 0;

        setCurrentDetail(prev => ({
            ...prev,
            idsizeca: sizeId,
            sizeName: sizeObj ? sizeObj.sizeca : "", 
            giabanledukien: autoLe,
            giabansidukien: autoSi
        }));
    };

    // --- LOGIC THÊM CHI TIẾT ---
    const handleAddDetail = () => {
        if (!importForm.tongsoluongnhap || importForm.tongsoluongnhap <= 0) {
            showToast("Vui lòng nhập Tổng số lượng dự kiến ở cột bên trái trước!", "error");
            return;
        }
        if (!currentDetail.idsizeca) return showToast("Vui lòng chọn Size!", "error");
        if (currentDetail.soluongnhap <= 0) return showToast("Số lượng nhập phải > 0", "error");
        if (currentDetail.gianhap <= 0) return showToast("Giá nhập phải > 0", "error");

        const currentSum = addedDetails.reduce((sum, item) => sum + Number(item.soluongnhap), 0);
        const newSum = currentSum + Number(currentDetail.soluongnhap);
        if (newSum > Number(importForm.tongsoluongnhap)) {
            showToast(`Tổng lượng nhập (${newSum}kg) sẽ vượt quá tổng dự kiến (${importForm.tongsoluongnhap}kg).`, "error");
            return;
        }

        let finalLe = Number(currentDetail.giabanledukien);
        let finalSi = Number(currentDetail.giabansidukien);

        if (finalLe === 0 || finalSi === 0) {
            const currentPriceObj = findCurrentPrice(importForm.idloaica, currentDetail.idsizeca);
            if (currentPriceObj) {
                if (finalLe === 0) finalLe = Number(currentPriceObj.giaBanLe || currentPriceObj.giabanle || 0);
                if (finalSi === 0) finalSi = Number(currentPriceObj.giaBanSi || currentPriceObj.giabansi || 0);
            }
        }

        if (finalLe > 0 && finalLe <= Number(currentDetail.gianhap)) {
            showToast(`Giá Bán Lẻ (${finalLe.toLocaleString()}) phải lớn hơn Giá Nhập!`, "error");
            return;
        }
        if (finalSi > 0 && finalSi <= Number(currentDetail.gianhap)) {
            showToast(`Giá Bán Sỉ (${finalSi.toLocaleString()}) phải lớn hơn Giá Nhập!`, "error");
            return;
        }
        
        if (finalLe === 0 || finalSi === 0) {
            if(!window.confirm("Cảnh báo: Bạn chưa thiết lập giá bán cho mặt hàng này. Tiếp tục (Giá bán sẽ là 0)?")) {
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
            ...prev, idsizeca: "", sizeName: "", giabanledukien: 0, giabansidukien: 0 
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

    // --- SUBMIT VÀ CẬP NHẬT GIÁ ---
    const handleSubmitImport = async () => {
        if (!importForm.idloaica || !importForm.idncc) return showToast("Vui lòng chọn Loại cá và Nhà cung cấp!", "error");
        if (!importForm.tongsoluongnhap) return showToast("Vui lòng nhập Tổng số lượng nhập!", "error");
        if (addedDetails.length === 0) return showToast("Phiếu nhập chưa có chi tiết lô hàng nào!", "error");

        const totalDetails = calculateTotalWeight();
        if (totalDetails !== Number(importForm.tongsoluongnhap)) {
            showToast(`Tổng chi tiết (${totalDetails}kg) chưa khớp với Tổng khai báo (${importForm.tongsoluongnhap}kg).`, "error");
            return;
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
            await api.post("/Phieunhaps", payload);

            const priceUpdatePromises = addedDetails.map(async (detail) => {
                const invItem = inventory.find(i =>
                    Number(i.idLoaiCa) === Number(importForm.idloaica) &&
                    Number(i.idSizeCa) === Number(detail.idsizeca)
                );

                if (invItem && invItem.id) {
                    const currentPriceObj = findCurrentPrice(importForm.idloaica, detail.idsizeca);
                    const currentLe = currentPriceObj ? (currentPriceObj.giaBanLe || currentPriceObj.giabanle) : 0;
                    const currentSi = currentPriceObj ? (currentPriceObj.giaBanSi || currentPriceObj.giabansi) : 0;

                    const newLe = parseFloat(detail.giabanledukien);
                    const newSi = parseFloat(detail.giabansidukien);

                    if (newLe !== currentLe || newSi !== currentSi) {
                        try {
                            await api.post("/Banggias", {
                                idchitietcaban: parseInt(invItem.id),
                                giabanle: newLe,
                                giabansi: newSi
                            });
                        } catch (err) {
                            console.error("Lỗi cập nhật giá:", invItem.id, err);
                        }
                    }
                }
            });

            await Promise.all(priceUpdatePromises);

            showToast("Nhập hàng thành công! Kho và Bảng giá đã được cập nhật.", "success");
            setIsImportModalOpen(false);
            fetchInitialData();
            setImportForm({ ...importForm, idloaica: "", ghichu: "", tongsoluongnhap: "" });
            setAddedDetails([]);
        } catch (error) {
            console.error(error);
            showToast("Lỗi hệ thống hoặc kết nối thất bại!", "error");
        }
    };

    const handleImportFromRow = (item) => {
        setIsImportModalOpen(true);
        setImportForm(prev => ({ ...prev, idloaica: item.idLoaiCa }));
        
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
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="text-slate-500 text-sm">
                    Theo dõi tồn kho, nhập hàng và cập nhật giá tự động.
                </div>
                {/* Đổi màu nút Tạo Phiếu Nhập sang Cyan */}
                <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 text-sm cursor-pointer w-full sm:w-auto"
                >
                    Tạo Phiếu Nhập
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('tenLoaiCa')}>
                                    <div className="flex items-center gap-1.5">Tên sản phẩm {getSortIcon('tenLoaiCa')}</div>
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('tenSize')}>
                                    <div className="flex items-center gap-1.5">Size {getSortIcon('tenSize')}</div>
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('soluongton')}>
                                    <div className="flex items-center justify-center gap-1.5">Tồn kho {getSortIcon('soluongton')}</div>
                                </th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center">Nhập hàng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : sortedInventory.length > 0 ? (
                                sortedInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        {/* Đổi màu highlight text tên cá sang Cyan */}
                                        <td className="p-4 font-bold text-cyan-950">{item.tenLoaiCa}</td>
                                        <td className="p-4 text-slate-600">
                                            <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">{item.tenSize}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`font-bold px-3 py-1 rounded-full text-xs border ${
                                                item.soluongton > 10 ? 'bg-green-50 text-green-700 border-green-200' : 
                                                item.soluongton > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {item.soluongton} kg
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-xs font-bold text-blue-600 flex items-center justify-center gap-1.5">
                                                <span className="size-1.5 rounded-full bg-blue-500"></span> Đang bán
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {/* Đổi màu icon nút nhập trực tiếp trên dòng sang Cyan */}
                                            <button 
                                                onClick={() => handleImportFromRow(item)} 
                                                className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 border border-transparent hover:border-cyan-100 rounded-lg transition-all cursor-pointer"
                                                title="Nhập thêm hàng này"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
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
            </div>

            {/* --- MODAL NHẬP HÀNG --- */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden max-h-[90vh] flex flex-col">
                        
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {/* Đổi màu icon tiêu đề Modal sang Cyan */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5 text-cyan-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18M2.25 13.5a2.25 2.25 0 0 0-2.25 2.25v3.75A2.25 2.25 0 0 0 2.25 21h19.5a2.25 2.25 0 0 0 2.25-2.25v-3.75a2.25 2.25 0 0 0-2.25-2.25M2.25 13.5V9A2.25 2.25 0 0 1 4.5 6.75h15A2.25 2.25 0 0 1 21 9v4.5m-9-9.75V3" />
                                </svg>
                                Tạo Phiếu Nhập Hàng
                            </h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 flex items-center cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* CỘT TRÁI */}
                            <div className="lg:col-span-4 space-y-5 border-r border-slate-100 pr-6">
                                <h4 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                                    {/* Đổi badge số thứ tự sang Cyan */}
                                    <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">1</span>
                                    Thông tin chung
                                </h4>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nhà cung cấp</label>
                                    <select
                                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm outline-none transition-all"
                                        value={importForm.idncc}
                                        onChange={e => setImportForm({ ...importForm, idncc: e.target.value })}
                                    >
                                        <option value="">-- Chọn NCC --</option>
                                        {suppliers.map(s => <option key={s.idncc || s.id} value={s.idncc || s.id}>{s.tenncc}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Loại cá nhập</label>
                                    <select 
                                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm outline-none transition-all"
                                        value={importForm.idloaica}
                                        onChange={e => handleSelectFishImport(e.target.value)}
                                    >
                                        <option value="">-- Chọn Loại Cá --</option>
                                        {fishTypes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                                    </select>
                                </div>

                                <div className="p-4 bg-yellow-50/60 rounded-xl border border-yellow-200">
                                    <label className="block text-xs font-bold text-yellow-800 uppercase mb-1.5">
                                        Tổng Số Lượng Nhập (kg)
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2.5 border border-yellow-300 rounded-xl text-lg font-bold text-yellow-900 bg-white focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                                        placeholder="VD: 100"
                                        value={importForm.tongsoluongnhap}
                                        onChange={e => setImportForm({...importForm, tongsoluongnhap: e.target.value})} 
                                    />
                                    <p className="text-[10px] text-yellow-600 mt-1.5 font-medium">
                                        * Phải nhập tổng trước khi chia lô chi tiết.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ngày nhập</label>
                                        <input type="date" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-cyan-500" value={importForm.ngaynhap} onChange={e => setImportForm({...importForm, ngaynhap: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Thanh toán</label>
                                        <select 
                                            className={`w-full p-2.5 border rounded-xl text-sm font-bold outline-none transition-all ${importForm.trangthaithanhtoan === 'DA_THANH_TOAN' ? 'text-green-600 bg-green-50 border-green-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}
                                            value={importForm.trangthaithanhtoan} 
                                            onChange={e => setImportForm({...importForm, trangthaithanhtoan: e.target.value})}
                                        >
                                            <option value="CHUA_THANH_TOAN">Chưa TT</option>
                                            <option value="DA_THANH_TOAN">Đã xong</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ghi chú</label>
                                    <textarea className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none bg-white focus:border-cyan-500" placeholder="Ghi chú nhập hàng..." value={importForm.ghichu} onChange={e => setImportForm({...importForm, ghichu: e.target.value})}></textarea>
                                </div>
                            </div>

                            {/* CỘT PHẢI */}
                            <div className="lg:col-span-8 flex flex-col h-full">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                        {/* Đổi badge số thứ tự sang Cyan */}
                                        <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">2</span>
                                        Phân Bổ Chi Tiết (Lô)
                                    </h4>
                                    
                                    <div className="text-sm font-bold">
                                        Đã phân bổ: <span className={`${calculateTotalWeight() === Number(importForm.tongsoluongnhap) ? 'text-green-600' : 'text-red-500'}`}>
                                            {calculateTotalWeight()}
                                        </span> 
                                        <span className="text-slate-300 mx-1">/</span> 
                                        <span className="text-slate-600">{importForm.tongsoluongnhap || 0} kg</span>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-3">
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Size</label>
                                        <select
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-cyan-500"
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
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5">SL Nhập</label>
                                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-cyan-500" value={currentDetail.soluongnhap} onChange={e => setCurrentDetail({...currentDetail, soluongnhap: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Giá Nhập</label>
                                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-cyan-500" placeholder="đ" value={currentDetail.gianhap} onChange={e => setCurrentDetail({...currentDetail, gianhap: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-cyan-600 block mb-1.5">Giá Bán Lẻ</label>
                                        {/* Đổi màu nền input dự kiến sang Cyan nhạt */}
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm border-cyan-200 bg-cyan-50/50 text-cyan-700 outline-none focus:border-cyan-500" placeholder="Dự kiến" value={currentDetail.giabanledukien} onChange={e => setCurrentDetail({...currentDetail, giabanledukien: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-cyan-600 block mb-1.5">Giá Bán Sỉ</label>
                                        {/* Đổi màu nền input dự kiến sang Cyan nhạt */}
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm border-cyan-200 bg-cyan-50/50 text-cyan-700 outline-none focus:border-cyan-500" placeholder="Dự kiến" value={currentDetail.giabansidukien} onChange={e => setCurrentDetail({...currentDetail, giabansidukien: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        {/* Đổi nút thêm dòng lô chi tiết sang Cyan */}
                                        <button onClick={handleAddDetail} className="w-full p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex justify-center cursor-pointer transition-colors shadow-xs">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-inner">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 text-slate-500 sticky top-0 font-bold text-xs uppercase shadow-xs">
                                            <tr>
                                                <th className="p-3">Size</th>
                                                <th className="p-3 text-right">SL (kg)</th>
                                                <th className="p-3 text-right">Giá nhập</th>
                                                <th className="p-3 text-right">Thành tiền</th>
                                                <th className="p-3 text-right text-cyan-600">Giá Bán Lẻ</th>
                                                <th className="p-3 text-right text-cyan-600">Giá Bán Sỉ</th>
                                                <th className="p-3 text-center">Xóa Lô</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {addedDetails.map(item => (
                                                <tr key={item.idTemp} className="hover:bg-slate-50/50">
                                                    <td className="p-3 font-bold text-slate-700">{item.sizeName}</td>
                                                    <td className="p-3 text-right font-medium">{item.soluongnhap}</td>
                                                    <td className="p-3 text-right font-mono text-slate-500">{Number(item.gianhap).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-bold text-slate-800">{(item.soluongnhap * item.gianhap).toLocaleString()}</td>
                                                    {/* Đổi màu hiển thị text giá bán sang Cyan */}
                                                    <td className="p-3 text-right font-mono text-cyan-600 font-bold">{Number(item.giabanledukien).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-mono text-cyan-600 font-bold">{Number(item.giabansidukien).toLocaleString()}</td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleRemoveDetail(item.idTemp)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center mx-auto">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.74 0-.34-6m4.74-6-.342 3.376m0 0h-4.244m4.244 0v1.542m0 0a2.25 2.25 0 0 1-2.244 2.244H9c-1.183 0-2.244-.97-2.244-2.244V6.75m12 0h-11.25M18 6.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V4.5m-3 0h3" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {addedDetails.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-slate-400 italic">Chưa có chi tiết lô hàng nào được phân bổ.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-slate-100 gap-4">
                                    <div className="text-slate-500 font-medium text-sm">
                                        Tổng tiền nhập phiếu: <span className="text-xl font-bold text-slate-800 ml-1">{calculateTotalImportMoney().toLocaleString()} VNĐ</span>
                                    </div>
                                    {/* Đổi màu nút Hoàn tất nhập kho sang Cyan */}
                                    <button 
                                        onClick={handleSubmitImport} 
                                        disabled={calculateTotalWeight() !== Number(importForm.tongsoluongnhap)}
                                        className={`px-6 py-3 font-bold rounded-xl shadow-md transition-all text-sm w-full sm:w-auto ${
                                            calculateTotalWeight() === Number(importForm.tongsoluongnhap)
                                            ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-100 cursor-pointer"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
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