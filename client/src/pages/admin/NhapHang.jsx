import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const formatCurrency = (value) =>
    `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const formatPreviousCurrency = (value) =>
    value == null ? "—" : formatCurrency(value);
const getLocalToday = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
};

export default function NhapHang() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.vaitro === "ADMIN";
    const isQuickImport = Boolean(location.state?.id);
    const today = getLocalToday();

    const [inventory, setInventory] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [importHistory, setImportHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddNcc, setShowAddNcc] = useState(false);
    const [nccForm, setNccForm] = useState({ tenncc: "", sodienthoai: "" });
    const [savingNcc, setSavingNcc] = useState(false);

    const [importForm, setImportForm] = useState({
        idloaica: location.state?.initialLoaicaId || "",
        idncc: "",
        ngaynhap: today,
        trangthaithanhtoan: "CHUA_THANH_TOAN",
        ghichu: "",
    });

    const [currentDetail, setCurrentDetail] = useState({
        idsizeca: location.state?.initialSizeId || "",
        sizeName: location.state?.initialSizeName || "",
        soluongnhap: 10,
        gianhap: 0,
        giabanledukien: "",
        giabansidukien: "",
    });

    const [addedDetails, setAddedDetails] = useState([]);

    // Tải kho, nhà cung cấp, bảng giá hiện hành và lịch sử nhập gần nhất.
    useEffect(() => {
        Promise.all([
            api.get("/Chitietcabans"),
            api.get("/Nhacungcaps"),
            api.get("/Banggias"),
            api.get("/Phieunhaps"),
        ])
            .then(([resInventory, resSuppliers, resPrices, resHistory]) => {
                setInventory(resInventory.data.result || []);
                setSuppliers(resSuppliers.data.result || []);
                setPriceList(resPrices.data.result || []);
                setImportHistory(resHistory.data.result || []);
            })
            .catch(() => showToast("Không thể tải dữ liệu!", "error"))
            .finally(() => setLoading(false));
    }, []);

    // Tự động điền Loại cá + Size khi được điều hướng chỉ kèm "id" (idchitietcaban) mà chưa biết
    // trước idLoaiCa/idSizeCa — ví dụ từ nút "Nhập hàng ngay" khi báo thiếu tồn kho ở màn xử lý đơn.
    useEffect(() => {
        if (inventory.length > 0 && location.state?.id && !location.state?.initialLoaicaId) {
            const invItem = inventory.find(i => Number(i.id) === Number(location.state.id));
            if (invItem) {
                setImportForm(prev => ({ ...prev, idloaica: String(invItem.idLoaiCa) }));
                setCurrentDetail(prev => ({ ...prev, idsizeca: String(invItem.idSizeCa), sizeName: invItem.tenSize }));
            }
        }
    }, [inventory, location.state]);

    // Gom loại cá duy nhất từ kho hàng
    const fishTypes = inventory.reduce((acc, item) => {
        if (!acc.some(f => f.id === item.idLoaiCa)) {
            acc.push({ id: item.idLoaiCa, tenloaica: item.tenLoaiCa });
        }
        return acc;
    }, []);

    const previousPriceByProduct = useMemo(() => {
        const result = new Map();
        const sortedHistory = [...importHistory].sort((a, b) => {
            const dateCompare = String(b.ngaynhap || "").localeCompare(String(a.ngaynhap || ""));
            if (dateCompare !== 0) return dateCompare;
            return String(b.idphieunhap || "").localeCompare(String(a.idphieunhap || ""));
        });

        sortedHistory.forEach(phieu => {
            (phieu.listChiTiet || []).forEach(detail => {
                const key = `${phieu.tenLoaiCa || ""}::${detail.tenSize || ""}`;
                if (!result.has(key)) {
                    result.set(key, {
                        ngaynhap: phieu.ngaynhap,
                        gianhap: detail.gianhap,
                        giabanle: detail.giabanletaithoidiemnhap,
                        giabansi: detail.giabansitaithoidiemnhap,
                    });
                }
            });
        });
        return result;
    }, [importHistory]);

    const getPreviousPrice = (fishId, sizeName) => {
        const fishName = inventory.find(item => Number(item.idLoaiCa) === Number(fishId))?.tenLoaiCa;
        return previousPriceByProduct.get(`${fishName || ""}::${sizeName || ""}`) || null;
    };

    // Lọc size cá theo loại cá đang chọn
    const availableSizes = importForm.idloaica
        ? inventory
              .filter(item => item.idLoaiCa == importForm.idloaica)
              .map(item => ({ id: item.idSizeCa, sizeca: item.tenSize }))
        : [];

    const getAutomaticSalePrices = (fishId, sizeId, sizeName) => {
        const inventoryItem = inventory.find(item =>
            Number(item.idLoaiCa) === Number(fishId)
            && Number(item.idSizeCa) === Number(sizeId)
        );
        const currentPrice = inventoryItem
            ? priceList.find(price =>
                Number(price.idChitietcaban) === Number(inventoryItem.id)
                && (price.trangThai === "Đang áp dụng" || !price.ngayKetThuc)
                && (!price.ngayBatDau || price.ngayBatDau <= today)
            )
            : null;
        const previousPrice = getPreviousPrice(fishId, sizeName);

        return {
            retail: currentPrice?.giaBanLe ?? previousPrice?.giabanle ?? "",
            wholesale: currentPrice?.giaBanSi ?? previousPrice?.giabansi ?? "",
        };
    };

    // Điền giá cho kích thước được truyền sẵn từ trang kho sau khi các nguồn giá tải xong.
    useEffect(() => {
        if (!importForm.idloaica || !currentDetail.idsizeca || !currentDetail.sizeName) return;

        const automaticPrices = getAutomaticSalePrices(
            importForm.idloaica,
            currentDetail.idsizeca,
            currentDetail.sizeName,
        );
        setCurrentDetail(previous => ({
            ...previous,
            giabanledukien: automaticPrices.retail,
            giabansidukien: automaticPrices.wholesale,
        }));
    }, [
        importForm.idloaica,
        currentDetail.idsizeca,
        currentDetail.sizeName,
        inventory,
        priceList,
        importHistory,
    ]);

    const handleSelectFishImport = (fishId) => {
        if (addedDetails.length > 0) {
            showToast("Hãy xóa các dòng đã thêm trước khi đổi loại cá!", "error");
            return;
        }
        setImportForm(prev => ({ ...prev, idloaica: fishId }));
        setCurrentDetail(prev => ({ ...prev, idsizeca: "", sizeName: "", giabanledukien: "", giabansidukien: "" }));
    };

    // Khi người dùng tự tay chọn Size cá trên giao diện
    const handleSelectSize = (e) => {
        const sizeId = e.target.value;
        const sizeObj = availableSizes.find(s => s.id == sizeId);
        const automaticPrices = getAutomaticSalePrices(
            importForm.idloaica,
            sizeId,
            sizeObj?.sizeca || "",
        );

        setCurrentDetail(prev => ({
            ...prev,
            idsizeca: sizeId,
            sizeName: sizeObj ? sizeObj.sizeca : "",
            giabanledukien: automaticPrices.retail,
            giabansidukien: automaticPrices.wholesale,
        }));
    };

    const handleAddDetail = () => {
        if (!currentDetail.idsizeca) { showToast("Vui lòng chọn Size!", "error"); return; }
        if (currentDetail.soluongnhap <= 0) { showToast("Số lượng nhập phải > 0", "error"); return; }
        if (currentDetail.gianhap <= 0) { showToast("Giá nhập phải > 0", "error"); return; }

        const finalLe = Number(currentDetail.giabanledukien);
        const finalSi = Number(currentDetail.giabansidukien);

        if (finalLe <= 0 || finalSi <= 0) {
            showToast("Vui lòng nhập đầy đủ giá bán lẻ và giá bán sỉ!", "error");
            return;
        }
        if (finalLe > 0 && finalLe <= Number(currentDetail.gianhap)) { showToast(`Giá Bán Lẻ phải lớn hơn Giá Nhập!`, "error"); return; }
        if (finalSi > 0 && finalSi <= Number(currentDetail.gianhap)) { showToast(`Giá Bán Sỉ phải lớn hơn Giá Nhập!`, "error"); return; }

        const existing = addedDetails.find(d => Number(d.idsizeca) === Number(currentDetail.idsizeca));
        if (existing) {
            if (parseFloat(existing.gianhap) !== parseFloat(currentDetail.gianhap)) {
                showToast(`Size này đã có giá nhập ${Number(existing.gianhap).toLocaleString()}đ. Không thể nhập cùng size với giá khác trong 1 phiếu!`, "error");
                return;
            }
            setAddedDetails(prev => prev.map(d =>
                Number(d.idsizeca) === Number(currentDetail.idsizeca)
                    ? { ...d, soluongnhap: Number(d.soluongnhap) + Number(currentDetail.soluongnhap) }
                    : d
            ));
        } else {
            setAddedDetails(prev => [...prev, {
                ...currentDetail,
                giabanledukien: finalLe,
                giabansidukien: finalSi,
                idTemp: Date.now(),
            }]);
        }
        setCurrentDetail(prev => ({
            ...prev,
            idsizeca: isQuickImport ? prev.idsizeca : "",
            sizeName: isQuickImport ? prev.sizeName : "",
            soluongnhap: 10,
            gianhap: 0,
            giabanledukien: isQuickImport ? prev.giabanledukien : "",
            giabansidukien: isQuickImport ? prev.giabansidukien : "",
        }));
    };

    const handleRemoveDetail = (idTemp) => setAddedDetails(prev => prev.filter(item => item.idTemp !== idTemp));

    const handleAddNcc = async () => {
        if (!nccForm.tenncc.trim()) { showToast("Vui lòng nhập tên nhà cung cấp!", "error"); return; }
        setSavingNcc(true);
        try {
            const res = await api.post("/Nhacungcaps", nccForm);
            const newNcc = res.data.result;
            setSuppliers(prev => [...prev, newNcc]);
            setImportForm(prev => ({ ...prev, idncc: String(newNcc.id) }));
            setNccForm({ tenncc: "", sodienthoai: "" });
            setShowAddNcc(false);
            showToast("Đã thêm nhà cung cấp mới!", "success");
        } catch { showToast("Thêm nhà cung cấp thất bại!", "error"); }
        finally { setSavingNcc(false); }
    };
    const calculateTotalImportMoney = () => addedDetails.reduce((sum, item) => sum + (item.soluongnhap * item.gianhap), 0);
    const calculateTotalWeight = () => addedDetails.reduce((sum, item) => sum + Number(item.soluongnhap), 0);
    const previousPricesBySize = availableSizes.map(size => ({
        ...size,
        previousPrice: getPreviousPrice(importForm.idloaica, size.sizeca),
    }));

    const handleSubmitImport = async () => {
        if (!importForm.idloaica || !importForm.idncc) { showToast("Vui lòng chọn Loại cá và Nhà cung cấp!", "error"); return; }
        if (!importForm.ngaynhap || importForm.ngaynhap < today) {
            showToast("Ngày nhập không được nằm trong quá khứ!", "error");
            return;
        }
        if (addedDetails.length === 0) { showToast("Phiếu nhập chưa có chi tiết lô hàng nào!", "error"); return; }
        if (addedDetails.some(detail =>
            Number(detail.giabanledukien) <= 0
            || Number(detail.giabansidukien) <= 0
            || Number(detail.giabansidukien) > Number(detail.giabanledukien)
        )) {
            showToast("Mỗi dòng nhập phải có đủ giá lẻ, giá sỉ và giá sỉ không được lớn hơn giá lẻ!", "error");
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
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Cột trái: Thông tin chung */}
                <div className="xl:col-span-4 space-y-5 bg-white rounded-2xl border border-black p-5 h-fit">
                    <h4 className="font-bold text-white text-sm bg-cyan-600 border border-black rounded-xl p-3 flex items-center gap-2">
                        <span className="size-5 rounded-full bg-white text-cyan-700 flex items-center justify-center font-bold text-xs">1</span>
                        {isQuickImport ? "Thông tin nhập thêm" : "Thông tin chung"}
                    </h4>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nhà cung cấp</label>
                        <div className="flex gap-2">
                            <select className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" value={importForm.idncc} onChange={e => setImportForm({ ...importForm, idncc: e.target.value })}>
                                <option value="">-- Chọn NCC --</option>
                                {suppliers.map(s => <option key={s.idncc || s.id} value={s.idncc || s.id}>{s.tenncc}</option>)}
                            </select>
                            <button onClick={() => setShowAddNcc(v => !v)} className="px-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 text-lg font-bold flex-shrink-0" title="Thêm nhà cung cấp mới">+</button>
                        </div>
                        {showAddNcc && (
                            <div className="mt-2 p-3 border border-cyan-200 bg-cyan-50/50 rounded-xl space-y-2">
                                <input
                                    type="text" placeholder="Tên nhà cung cấp *"
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                                    value={nccForm.tenncc} onChange={e => setNccForm(f => ({ ...f, tenncc: e.target.value }))}
                                />
                                <input
                                    type="text" placeholder="Số điện thoại"
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                                    value={nccForm.sodienthoai} onChange={e => setNccForm(f => ({ ...f, sodienthoai: e.target.value }))}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowAddNcc(false)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Hủy</button>
                                    <button onClick={handleAddNcc} disabled={savingNcc} className="px-3 py-1.5 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                                        {savingNcc ? "Đang lưu..." : "Lưu NCC"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Loại cá nhập</label>
                        {isQuickImport ? (
                            <div className="w-full p-2.5 border border-cyan-200 rounded-xl bg-cyan-50 text-sm font-bold text-cyan-800">
                                {fishTypes.find(f => Number(f.id) === Number(importForm.idloaica))?.tenloaica || "Đang tải loại cá..."}
                            </div>
                        ) : (
                            <select
                                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                value={importForm.idloaica}
                                onChange={e => handleSelectFishImport(e.target.value)}
                                disabled={addedDetails.length > 0}
                            >
                                <option value="">-- Chọn Loại Cá --</option>
                                {fishTypes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                            </select>
                        )}
                        {isQuickImport && (
                            <p className="mt-1.5 text-xs text-slate-400">
                                Loại cá được cố định; có thể nhập thêm một hoặc nhiều kích thước thuộc loại cá này.
                            </p>
                        )}
                        {!isQuickImport && addedDetails.length > 0 && (
                            <p className="mt-1.5 text-xs text-slate-400">
                                Loại cá được khóa khi phiếu đã có chi tiết.
                            </p>
                        )}
                    </div>

                    <div className={isAdmin ? "grid grid-cols-2 gap-4" : ""}>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ngày nhập</label>
                            <input
                                type="date"
                                min={today}
                                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none"
                                value={importForm.ngaynhap}
                                onChange={e => setImportForm({ ...importForm, ngaynhap: e.target.value })}
                            />
                        </div>
                        {isAdmin && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Thanh toán</label>
                                <select className={`w-full p-2.5 border rounded-xl text-sm font-bold outline-none ${importForm.trangthaithanhtoan === "DA_THANH_TOAN" ? "text-green-600 bg-green-50 border-green-200" : "text-orange-600 bg-orange-50 border-orange-200"}`} value={importForm.trangthaithanhtoan} onChange={e => setImportForm({ ...importForm, trangthaithanhtoan: e.target.value })}>
                                    <option value="CHUA_THANH_TOAN">Chưa TT</option>
                                    <option value="DA_THANH_TOAN">Đã xong</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ghi chú</label>
                        <textarea className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none" placeholder="Ghi chú nhập hàng..." value={importForm.ghichu} onChange={e => setImportForm({ ...importForm, ghichu: e.target.value })} />
                    </div>

                    <div className="rounded-xl border border-black bg-cyan-50 p-4 space-y-1">
                        <p className="text-sm text-cyan-800">
                            Số dòng nhập: <strong>{addedDetails.length}</strong>
                        </p>
                        <p className="text-sm text-cyan-800">
                            Tổng khối lượng: <strong>{calculateTotalWeight().toLocaleString("vi-VN")} kg</strong>
                        </p>
                        <p className="text-sm text-cyan-800">
                            Tổng tiền nhập: <strong>{formatCurrency(calculateTotalImportMoney())}</strong>
                        </p>
                    </div>
                </div>

                {/* Cột phải: Phân bổ lô chi tiết */}
                <div className="xl:col-span-8 flex flex-col bg-white rounded-2xl border border-black overflow-hidden">
                    <div className="p-4 border-b border-black bg-cyan-600 flex justify-between items-center gap-3">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <span className="size-5 rounded-full bg-white text-cyan-700 flex items-center justify-center font-bold text-xs">2</span>
                            {isQuickImport ? "Nhập mặt hàng đã chọn" : "Phân bổ chi tiết lô"}
                        </h4>
                        <div className="text-sm font-bold text-cyan-800 bg-white px-3 py-1.5 rounded-lg border border-black">
                            Tổng: <span className="text-lg ml-1">{calculateTotalWeight()}</span> kg
                        </div>
                    </div>

                    <div className="p-4 bg-cyan-50 border-b border-black">
                        <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-3">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Kích thước</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
                                    value={currentDetail.idsizeca}
                                    onChange={handleSelectSize}
                                    disabled={!importForm.idloaica}
                                >
                                    <option value="">
                                        {!importForm.idloaica
                                            ? "Chọn cá trước"
                                            : (availableSizes.length > 0 ? "Chọn kích thước" : "Chưa có kích thước")}
                                    </option>
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
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Giá Bán Lẻ</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none"
                                    placeholder="Nhập giá bán lẻ"
                                    value={currentDetail.giabanledukien}
                                    onChange={e => setCurrentDetail({
                                        ...currentDetail,
                                        giabanledukien: e.target.value,
                                    })}
                                    title="Được gợi ý tự động và có thể chỉnh sửa"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Giá Bán Sỉ</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none"
                                    placeholder="Nhập giá bán sỉ"
                                    value={currentDetail.giabansidukien}
                                    onChange={e => setCurrentDetail({
                                        ...currentDetail,
                                        giabansidukien: e.target.value,
                                    })}
                                    title="Được gợi ý tự động và có thể chỉnh sửa"
                                />
                            </div>
                            <div className="col-span-1">
                                <button onClick={handleAddDetail} className="w-full p-2 bg-cyan-600 text-white border border-black rounded-lg hover:bg-cyan-700 flex justify-center cursor-pointer" title="Thêm vào phiếu">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-black bg-white p-3">
                            <p className="text-xs font-bold uppercase text-slate-500 mb-2">Giá nhập gần nhất theo kích thước</p>
                            {previousPricesBySize.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full min-w-[420px] text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                            <tr>
                                                <th className="p-2.5 text-left">Kích thước</th>
                                                <th className="p-2.5 text-center">Ngày nhập</th>
                                                <th className="p-2.5 text-right">Giá nhập</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previousPricesBySize.map(size => (
                                                <tr key={size.id} className="bg-white">
                                                    <td className="p-2.5 font-semibold text-slate-800">{size.sizeca}</td>
                                                    <td className="p-2.5 text-center text-slate-500">{size.previousPrice?.ngaynhap || "—"}</td>
                                                    <td className="p-2.5 text-right font-semibold tabular-nums text-slate-700">{formatPreviousCurrency(size.previousPrice?.gianhap)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">
                                    Chọn loại cá để xem giá lần nhập gần nhất theo từng kích thước.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full min-w-[900px] text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase shadow-xs">
                                <tr>
                                    <th className="p-3">Kích thước</th>
                                    <th className="p-3 text-right">SL (kg)</th>
                                    <th className="p-3 text-right">Giá nhập</th>
                                    <th className="p-3 text-right">Giá bán lẻ</th>
                                    <th className="p-3 text-right">Giá bán sỉ</th>
                                    <th className="p-3 text-right">Thành tiền</th>
                                    <th className="p-3 text-center w-32">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {addedDetails.map(item => (
                                    <tr key={item.idTemp} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-semibold text-slate-800">{item.sizeName}</td>
                                        <td className="p-3 text-right font-semibold tabular-nums text-slate-700">{item.soluongnhap}</td>
                                        <td className="p-3 text-right font-semibold tabular-nums text-slate-700">{Number(item.gianhap).toLocaleString()}</td>
                                        <td className="p-3 text-right font-semibold tabular-nums text-slate-700">{Number(item.giabanledukien).toLocaleString()}</td>
                                        <td className="p-3 text-right font-semibold tabular-nums text-slate-700">{Number(item.giabansidukien).toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold tabular-nums text-cyan-700">{formatCurrency(item.soluongnhap * item.gianhap)}</td>
                                        <td className="p-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDetail(item.idTemp)}
                                                className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 border border-red-200 transition-colors text-xs cursor-pointer"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {addedDetails.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-slate-400 italic">Chưa có chi tiết lô hàng nào được phân bổ.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-black bg-cyan-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-cyan-50 font-medium text-sm">
                            Tổng tiền nhập phiếu: <span className="text-xl font-bold text-white ml-1">{formatCurrency(calculateTotalImportMoney())}</span>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button onClick={() => navigate("/admin/QuanLyKho")} className="liquidation-action px-5 py-2.5 rounded-xl border border-red-700 bg-red-50 text-red-700 font-bold hover:bg-red-100 text-sm">Hủy</button>
                            <button onClick={handleSubmitImport} disabled={addedDetails.length === 0} className={`liquidation-action px-6 py-3 font-bold rounded-xl border shadow-sm text-sm ${addedDetails.length > 0 ? "bg-white text-cyan-800 border-black hover:bg-cyan-50" : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"}`}>
                                Hoàn tất nhập kho
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
