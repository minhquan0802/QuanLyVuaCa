import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function NhapHang() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [inventory, setInventory] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [priceList, setPriceList] = useState([]); // Lưu danh sách giá bán hiện hành
    const [loading, setLoading] = useState(true);

    const [importForm, setImportForm] = useState({
        idloaica: location.state?.initialLoaicaId || "",
        idncc: "",
        ngaynhap: new Date().toISOString().split("T")[0],
        trangthaithanhtoan: "CHUA_THANH_TOAN",
        ghichu: "",
    });

    const [currentDetail, setCurrentDetail] = useState({
        idsizeca: location.state?.initialSizeId || "",
        sizeName: location.state?.initialSizeName || "",
        soluongnhap: 10,
        gianhap: 0,
        giabanledukien: location.state?.initialAutoLe || 0,
        giabansidukien: location.state?.initialAutoSi || 0,
    });

    const [addedDetails, setAddedDetails] = useState([]);

    // Gọi 3 API cần thiết: Kho hàng, Nhà cung cấp và Bảng giá
    useEffect(() => {
        Promise.all([
            api.get("/Chitietcabans"),
            api.get("/Nhacungcaps"),
            api.get("/Banggias")
        ])
            .then(([resInventory, resSuppliers, resPrices]) => {
                setInventory(resInventory.data.result || []);
                setSuppliers(resSuppliers.data.result || []);
                
                // Chỉ giữ lại các mức giá đang áp dụng
                const allPrices = resPrices.data.result || [];
                setPriceList(allPrices.filter(p => p.trangThai === "Đang áp dụng"));
            })
            .catch(() => showToast("Không thể tải dữ liệu!", "error"))
            .finally(() => setLoading(false));
    }, []);

    // Tự động cập nhật giá bán dự kiến khi dữ liệu bảng giá hoặc thông tin chuyển trang đã sẵn sàng
    useEffect(() => {
        if (priceList.length > 0 && location.state?.id) {
            // Tìm giá hiện hành dựa trên id chi tiết cá bán được truyền sang
            const matchPrice = priceList.find(p => Number(p.idChitietcaban) === Number(location.state.id));
            if (matchPrice) {
                setCurrentDetail(prev => ({
                    ...prev,
                    giabanledukien: matchPrice.giaBanLe || 0,
                    giabansidukien: matchPrice.giaBanSi || 0
                }));
            }
        }
    }, [priceList, location.state]);

    // Gom loại cá duy nhất từ kho hàng
    const fishTypes = inventory.reduce((acc, item) => {
        if (!acc.some(f => f.id === item.idLoaiCa)) {
            acc.push({ id: item.idLoaiCa, tenloaica: item.tenLoaiCa });
        }
        return acc;
    }, []);

    // Lọc size cá theo loại cá đang chọn
    const availableSizes = importForm.idloaica
        ? inventory
              .filter(item => item.idLoaiCa == importForm.idloaica)
              .map(item => ({ id: item.idSizeCa, sizeca: item.tenSize }))
        : [];

    const handleSelectFishImport = (fishId) => {
        setImportForm(prev => ({ ...prev, idloaica: fishId }));
        setCurrentDetail(prev => ({ ...prev, idsizeca: "", sizeName: "", giabanledukien: 0, giabansidukien: 0 }));
    };

    // Khi người dùng tự tay chọn Size cá trên giao diện
    const handleSelectSize = (e) => {
        const sizeId = e.target.value;
        const sizeObj = availableSizes.find(s => s.id == sizeId);
        
        // Tìm dòng kho tương ứng để lấy ra idChitietcaban
        const invItem = inventory.find(i => i.idLoaiCa == importForm.idloaica && i.idSizeCa == sizeId);
        // Dò giá hiện hành từ bảng giá
        const matchPrice = invItem ? priceList.find(p => Number(p.idChitietcaban) === Number(invItem.id)) : null;

        setCurrentDetail(prev => ({
            ...prev,
            idsizeca: sizeId,
            sizeName: sizeObj ? sizeObj.sizeca : "",
            giabanledukien: matchPrice ? matchPrice.giaBanLe : 0,
            giabansidukien: matchPrice ? matchPrice.giaBanSi : 0
        }));
    };

    const handleAddDetail = () => {
        if (!currentDetail.idsizeca) { showToast("Vui lòng chọn Size!", "error"); return; }
        if (currentDetail.soluongnhap <= 0) { showToast("Số lượng nhập phải > 0", "error"); return; }
        if (currentDetail.gianhap <= 0) { showToast("Giá nhập phải > 0", "error"); return; }

        const finalLe = Number(currentDetail.giabanledukien);
        const finalSi = Number(currentDetail.giabansidukien);

        if (finalLe > 0 && finalLe <= Number(currentDetail.gianhap)) { showToast(`Giá Bán Lẻ phải lớn hơn Giá Nhập!`, "error"); return; }
        if (finalSi > 0 && finalSi <= Number(currentDetail.gianhap)) { showToast(`Giá Bán Sỉ phải lớn hơn Giá Nhập!`, "error"); return; }

        setAddedDetails(prev => [...prev, { ...currentDetail, giabanledukien: finalLe, giabansidukien: finalSi, idTemp: Date.now() }]);
        setCurrentDetail(prev => ({ ...prev, idsizeca: "", sizeName: "", giabanledukien: 0, giabansidukien: 0 }));
    };

    const handleRemoveDetail = (idTemp) => setAddedDetails(prev => prev.filter(item => item.idTemp !== idTemp));
    const calculateTotalImportMoney = () => addedDetails.reduce((sum, item) => sum + (item.soluongnhap * item.gianhap), 0);
    const calculateTotalWeight = () => addedDetails.reduce((sum, item) => sum + Number(item.soluongnhap), 0);

    const handleSubmitImport = async () => {
        if (!importForm.idloaica || !importForm.idncc) { showToast("Vui lòng chọn Loại cá và Nhà cung cấp!", "error"); return; }
        if (addedDetails.length === 0) { showToast("Phiếu nhập chưa có chi tiết lô hàng nào!", "error"); return; }

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
                giabanletaithoidiemnhap: parseFloat(d.giabanledukien),
                giabansitaithoidiemnhap: parseFloat(d.giabansidukien),
            })),
        };

        try {
            await api.post("/Phieunhaps", payload);
            showToast("Nhập hàng thành công!", "success");
            navigate("/admin/QuanLyKho");
        } catch {
            showToast("Lỗi hệ thống hoặc kết nối thất bại!", "error");
        }
    };

    if (loading) return <AdminLayout title="Tạo Phiếu Nhập Hàng"><div className="p-8 text-center text-slate-400">Đang tải dữ liệu...</div></AdminLayout>;

    return (
        <AdminLayout title="Tạo Phiếu Nhập Hàng">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Cột trái: Thông tin chung */}
                <div className="lg:col-span-4 space-y-5 bg-white rounded-2xl border border-slate-200 p-5">
                    <h4 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                        <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">1</span>
                        Thông tin chung
                    </h4>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nhà cung cấp</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" value={importForm.idncc} onChange={e => setImportForm({ ...importForm, idncc: e.target.value })}>
                            <option value="">-- Chọn NCC --</option>
                            {suppliers.map(s => <option key={s.idncc || s.id} value={s.idncc || s.id}>{s.tenncc}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Loại cá nhập</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" value={importForm.idloaica} onChange={e => handleSelectFishImport(e.target.value)}>
                            <option value="">-- Chọn Loại Cá --</option>
                            {fishTypes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ngày nhập</label>
                            <input type="date" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" value={importForm.ngaynhap} onChange={e => setImportForm({ ...importForm, ngaynhap: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Thanh toán</label>
                            <select className={`w-full p-2.5 border rounded-xl text-sm font-bold outline-none ${importForm.trangthaithanhtoan === "DA_THANH_TOAN" ? "text-green-600 bg-green-50 border-green-200" : "text-orange-600 bg-orange-50 border-orange-200"}`} value={importForm.trangthaithanhtoan} onChange={e => setImportForm({ ...importForm, trangthaithanhtoan: e.target.value })}>
                                <option value="CHUA_THANH_TOAN">Chưa TT</option>
                                <option value="DA_THANH_TOAN">Đã xong</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ghi chú</label>
                        <textarea className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none" placeholder="Ghi chú nhập hàng..." value={importForm.ghichu} onChange={e => setImportForm({ ...importForm, ghichu: e.target.value })} />
                    </div>
                </div>

                {/* Cột phải: Phân bổ lô chi tiết */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">2</span>
                            Phân Bổ Chi Tiết (Lô)
                        </h4>
                        <div className="text-sm font-bold text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-100">
                            Tổng: <span className="text-lg ml-1">{calculateTotalWeight()}</span> kg
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-3">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Size</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={currentDetail.idsizeca} onChange={handleSelectSize} disabled={!importForm.idloaica}>
                                    <option value="">{!importForm.idloaica ? "Chọn cá trước" : (availableSizes.length > 0 ? "Chọn Size" : "Chưa có size")}</option>
                                    {availableSizes.map(s => <option key={s.id} value={s.id}>{s.sizeca}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">SL Nhập</label>
                                <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={currentDetail.soluongnhap} onChange={e => setCurrentDetail({ ...currentDetail, soluongnhap: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Giá Nhập</label>
                                <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" placeholder="đ" value={currentDetail.gianhap} onChange={e => setCurrentDetail({ ...currentDetail, gianhap: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-cyan-600 block mb-1.5">Giá Bán Lẻ</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-sm border-cyan-200 bg-cyan-50/50 text-cyan-700 outline-none" placeholder="Dự kiến" value={currentDetail.giabanledukien} onChange={e => setCurrentDetail({ ...currentDetail, giabanledukien: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-cyan-600 block mb-1.5">Giá Bán Sỉ</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-sm border-cyan-200 bg-cyan-50/50 text-cyan-700 outline-none" placeholder="Dự kiến" value={currentDetail.giabansidukien} onChange={e => setCurrentDetail({ ...currentDetail, giabansidukien: e.target.value })} />
                            </div>
                            <div className="col-span-1">
                                <button onClick={handleAddDetail} className="w-full p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex justify-center cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase shadow-xs">
                                <tr>
                                    <th className="p-3">Size</th>
                                    <th className="p-3 text-right">SL (kg)</th>
                                    <th className="p-3 text-right">Giá nhập</th>
                                    <th className="p-3 text-right">Thành tiền</th>
                                    <th className="p-3 text-right text-cyan-600">Giá Bán Lẻ</th>
                                    <th className="p-3 text-right text-cyan-600">Giá Bán Sỉ</th>
                                    <th className="p-3 text-center">Xóa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {addedDetails.map(item => (
                                    <tr key={item.idTemp} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-bold text-slate-700">{item.sizeName}</td>
                                        <td className="p-3 text-right font-medium">{item.soluongnhap}</td>
                                        <td className="p-3 text-right text-slate-500">{Number(item.gianhap).toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold text-slate-800">{(item.soluongnhap * item.gianhap).toLocaleString()}</td>
                                        <td className="p-3 text-right text-cyan-600 font-bold">{Number(item.giabanledukien).toLocaleString()}</td>
                                        <td className="p-3 text-right text-cyan-600 font-bold">{Number(item.giabansidukien).toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handleRemoveDetail(item.idTemp)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-md mx-auto flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.74 0-.34-6M4.5 6.75h15m-1.5 0a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {addedDetails.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-slate-400 italic">Chưa có chi tiết lô hàng nào được phân bổ.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-slate-500 font-medium text-sm">
                            Tổng tiền nhập phiếu: <span className="text-xl font-bold text-slate-800 ml-1">{calculateTotalImportMoney().toLocaleString()} VNĐ</span>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button onClick={() => navigate("/admin/QuanLyKho")} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">Hủy</button>
                            <button onClick={handleSubmitImport} disabled={addedDetails.length === 0} className={`px-6 py-3 font-bold rounded-xl shadow-md text-sm ${addedDetails.length > 0 ? "bg-cyan-600 text-white hover:bg-cyan-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                Hoàn tất nhập kho
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}