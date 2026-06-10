import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";

export default function TaoDonHang() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [customers, setCustomers] = useState([]);
    const [fishes, setFishes] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [units, setUnits] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [conversionList, setConversionList] = useState([]);

    const [newOrder, setNewOrder] = useState({ idthongtinkhachhang: "", tenKhachLe: "", sdtKhachLe: "", items: [] });
    const [currentItem, setCurrentItem] = useState({ fishId: "", sizeId: "", repoId: "", unitId: "", unitName: "", factor: 0, quantity: 1, estimatedKg: 0, pricePerKg: 0 });

    const [orderDone, setOrderDone] = useState(false);
    const [completedOrderTotal, setCompletedOrderTotal] = useState(0);

    useEffect(() => {
        Promise.all([
            api.get("/tai-khoan"),
            api.get("/Loaicas"),
            api.get("/Donvitinhs"),
            api.get("/Banggias"),
            api.get("/Quydois"),
        ]).then(([resCust, resFish, resUnits, resPrices, resConversions]) => {
            setCustomers((resCust.data?.result || []).filter(u => u.vaitro === "CUSTOMER"));
            setFishes(resFish.data?.result || []);
            setUnits(resUnits.data?.result || []);
            setPriceList(resPrices.data?.result || []);
            setConversionList(resConversions.data?.result || resConversions.data?.data || []);
        }).catch(() => showToast("Không thể tải dữ liệu!", "error"));
    }, []);

    const getConversionFactor = useCallback((repoId) => {
        if (!repoId) return 0;
        const conversion = conversionList.find(c => Number(c.idchitietcaban?.id || c.idchitietcaban || c.idChiTietCaBan) === Number(repoId));
        return conversion ? (conversion.sokgtuongung || conversion.soKgTuongUng || 0) : 0;
    }, [conversionList]);

    const getAutoPrice = useCallback((repoId, customerId) => {
        if (!repoId) return 0;
        const activePrice = priceList.find(p => p.idChitietcaban == repoId && p.trangThai === "Đang áp dụng");
        if (!activePrice) return 0;
        if (!customerId) return activePrice.giaBanLe ?? 0;
        const customer = customers.find(c => c.idtaikhoan == customerId);
        if (!customer) return activePrice.giaBanLe ?? 0;
        return customer.vaitro === "WHOLESALE_CUSTOMER" ? activePrice.giaBanSi : activePrice.giaBanLe;
    }, [priceList, customers]);

    const handleCustomerChange = (customerId) => {
        setNewOrder(prev => ({ ...prev, idthongtinkhachhang: customerId }));
        if (currentItem.repoId) {
            setCurrentItem(prev => ({ ...prev, pricePerKg: getAutoPrice(currentItem.repoId, customerId) }));
        }
    };

    const handleFishChange = async (fishId) => {
        setCurrentItem(prev => ({ ...prev, fishId, sizeId: "", repoId: "", pricePerKg: 0 }));
        setSizes([]);
        if (!fishId) return;
        try {
            const { data } = await api.get("/Chitietcabans");
            const allInventory = data.result || data.data || [];
            const validSizes = allInventory
                .filter(item => Number(item.idLoaiCa || item.idloaica?.id || item.idloaica) === Number(fishId))
                .map(item => ({ idsizeca: item.idSizeCa || item.idsizeca, sizeca: item.tenSize || item.sizeca, repoId: item.id }));
            setSizes(validSizes);
        } catch { /* ignore */ }
    };

    const handleSizeChange = (selectedSizeId) => {
        const selectedSizeObj = sizes.find(s => s.idsizeca == selectedSizeId);
        const repoId = selectedSizeObj ? selectedSizeObj.repoId : "";
        let newFactor = currentItem.factor;
        if (currentItem.unitId) {
            const selectedUnit = units.find(u => (u.iddvt || u.id) == currentItem.unitId);
            newFactor = selectedUnit?.hesokg || getConversionFactor(repoId) || 0;
        }
        setCurrentItem(prev => ({
            ...prev, sizeId: selectedSizeId, repoId,
            pricePerKg: getAutoPrice(repoId, newOrder.idthongtinkhachhang),
            factor: newFactor,
            estimatedKg: newFactor > 0 ? parseFloat((currentItem.quantity * newFactor).toFixed(2)) : 0,
        }));
    };

    const handleUnitChange = (val) => {
        const selectedUnit = units.find(u => (u.iddvt || u.id) == Number(val));
        if (!selectedUnit) return;
        const factor = selectedUnit.hesokg || getConversionFactor(currentItem.repoId) || 0;
        setCurrentItem(prev => ({
            ...prev, unitId: Number(val), unitName: selectedUnit.tendvt, factor,
            estimatedKg: factor > 0 ? parseFloat((prev.quantity * factor).toFixed(2)) : prev.estimatedKg,
        }));
    };

    const handleQuantityChange = (qty) => {
        const quantity = parseFloat(qty) || 0;
        setCurrentItem(prev => ({ ...prev, quantity, estimatedKg: prev.factor > 0 ? quantity * prev.factor : prev.estimatedKg }));
    };

    const handleAddItem = () => {
        if (!currentItem.fishId || !currentItem.sizeId || !currentItem.unitId) { alert("Vui lòng chọn đầy đủ thông tin!"); return; }
        if (currentItem.pricePerKg === 0) { alert("Sản phẩm này chưa được thiết lập giá bán!"); return; }
        const fish = fishes.find(f => f.id == currentItem.fishId);
        const size = sizes.find(s => s.idsizeca == currentItem.sizeId);
        const newItem = {
            id: Date.now(), repoId: currentItem.repoId, fishId: currentItem.fishId, sizeId: currentItem.sizeId,
            fishName: fish?.tenloaica, sizeName: size?.sizeca, unitId: currentItem.unitId, unitName: currentItem.unitName,
            quantity: currentItem.quantity, estimatedKg: currentItem.estimatedKg, pricePerKg: currentItem.pricePerKg,
            total: currentItem.estimatedKg * currentItem.pricePerKg,
        };
        setNewOrder(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setCurrentItem(prev => ({ ...prev, quantity: 1, estimatedKg: 0 }));
    };

    const handleRemoveItem = (id) => setNewOrder(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

    const newOrderTotal = useMemo(() => newOrder.items.reduce((sum, i) => sum + i.total, 0), [newOrder.items]);

    const handleSubmitOrder = async () => {
        if (newOrder.items.length === 0) { alert("Đơn hàng rỗng!"); return; }
        const isKhachLe = !newOrder.idthongtinkhachhang;
        const payload = {
            idthongtinkhachhang: isKhachLe ? null : newOrder.idthongtinkhachhang,
            tenKhachLe: isKhachLe ? newOrder.tenKhachLe : null,
            sdtKhachLe: isKhachLe ? newOrder.sdtKhachLe : null,
            trangthaidonhang: "DA_THANH_TOAN", ghichu: "[POS]",
            chiTietDonHang: newOrder.items.map(item => ({
                idchitietcaban: item.repoId, iddonvitinh: item.unitId, soluong: item.quantity,
                soluongkgthucte: item.estimatedKg, soluongkgthuctequydoi: item.estimatedKg,
                tongtiendukien: item.total, tongtienthucte: item.total,
            })),
        };
        try {
            await api.post("/Donhangs", payload);
            showToast("Tạo đơn hàng POS thành công!", "success");
            setCompletedOrderTotal(newOrderTotal);
            setOrderDone(true);
        } catch {
            showToast("Không thể tạo đơn hàng!", "error");
        }
    };

    if (orderDone) {
        return (
            <AdminLayout title="Đơn hàng đã ghi nhận">
                <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-cyan-100 bg-cyan-50 text-center">
                        <h3 className="font-bold text-lg text-cyan-800">Đơn hàng đã ghi nhận!</h3>
                        <p className="text-sm text-cyan-600 font-semibold mt-1">Tổng tiền thu: {formatCurrency(completedOrderTotal)}</p>
                    </div>
                    <div className="p-6">
                        <p className="text-center font-bold text-slate-600 mb-4 text-xs uppercase">Hình thức thu ngân</p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 transition-all font-bold text-slate-700 cursor-pointer text-sm">
                                Tiền mặt
                            </button>
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 transition-all font-bold text-slate-700 cursor-pointer text-sm">
                                Quét QR
                            </button>
                        </div>
                        <button onClick={() => navigate("/admin/QuanLyDonHang")} className="w-full py-2 text-slate-400 text-xs hover:text-slate-600 transition-colors cursor-pointer">
                            Quay lại danh sách đơn hàng
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Tạo đơn hàng (Admin POS)">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">
                <div className="lg:col-span-4 space-y-5 bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-5">
                    <div>
                        <label className="block text-slate-700 font-bold mb-1.5">Khách hàng</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" value={newOrder.idthongtinkhachhang} onChange={(e) => handleCustomerChange(e.target.value)}>
                            <option value="">Khách lẻ (Vãng lai)</option>
                            {customers.map(c => <option key={c.idtaikhoan} value={c.idtaikhoan}>{c.ho} {c.ten} ({c.vaitro === "CUSTOMER" ? "Khách sỉ" : "Khách lẻ"})</option>)}
                        </select>
                    </div>

                    {!newOrder.idthongtinkhachhang && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tên khách hàng</label>
                                <input type="text" placeholder="Khách vãng lai" className="w-full p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-cyan-500 text-sm" value={newOrder.tenKhachLe} onChange={(e) => setNewOrder({ ...newOrder, tenKhachLe: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số điện thoại</label>
                                <input type="text" placeholder="Không bắt buộc" className="w-full p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-cyan-500 text-sm" value={newOrder.sdtKhachLe} onChange={(e) => setNewOrder({ ...newOrder, sdtKhachLe: e.target.value })} />
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-200 pt-4 space-y-3">
                        <h4 className="font-bold text-slate-700">Thông tin sản phẩm</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Loại cá</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-cyan-500 text-sm" value={currentItem.fishId} onChange={(e) => handleFishChange(e.target.value)}>
                                    <option value="">-- Chọn --</option>
                                    {fishes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Size</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-cyan-500 text-sm" value={currentItem.sizeId} onChange={(e) => handleSizeChange(e.target.value)}>
                                    <option value="">-- Chọn --</option>
                                    {sizes.map(s => <option key={s.idsizeca} value={s.idsizeca}>{s.sizeca}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cyan-50/40 p-4 rounded-xl border border-cyan-100 space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Đơn vị tính</label>
                            <select className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-cyan-500 text-sm" value={currentItem.unitId} onChange={(e) => handleUnitChange(e.target.value)}>
                                <option value="">-- Chọn ĐVT --</option>
                                {units.map(u => <option key={u.iddvt || u.id} value={u.iddvt || u.id}>{u.tendvt} (HS: {u.hesokg})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số lượng</label>
                                <input type="number" min="1" className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold bg-white focus:border-cyan-500 outline-none text-sm" value={currentItem.quantity} onChange={(e) => handleQuantityChange(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số Kg</label>
                                <input type="number" disabled={currentItem.factor > 0} className={`w-full p-2 border rounded-lg text-center font-bold outline-none text-sm ${currentItem.factor > 0 ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-white text-cyan-600 border-cyan-200 focus:border-cyan-500"}`} value={currentItem.estimatedKg} onChange={(e) => setCurrentItem({ ...currentItem, estimatedKg: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Giá bán (VNĐ/Kg)</label>
                            <input type="text" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-100 font-bold text-slate-600 outline-none text-sm" value={formatCurrency(currentItem.pricePerKg)} readOnly />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-cyan-200/50">
                            <span className="font-medium text-cyan-800">Tạm tính:</span>
                            <span className="text-lg font-bold text-cyan-700">{formatCurrency(currentItem.estimatedKg * currentItem.pricePerKg)}</span>
                        </div>
                    </div>

                    <button onClick={handleAddItem} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-xs active:scale-95 cursor-pointer text-sm">
                        + Thêm vào đơn
                    </button>
                </div>

                <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700">Danh sách món đã chọn</h4>
                        <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold">{newOrder.items.length} mặt hàng</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-sm min-w-max">
                            <thead className="bg-slate-100 text-slate-500 sticky top-0 font-bold text-xs uppercase">
                                <tr>
                                    <th className="p-3">Tên cá</th>
                                    <th className="p-3">ĐVT</th>
                                    <th className="p-3 text-center">SL</th>
                                    <th className="p-3 text-center">Kg</th>
                                    <th className="p-3 text-right">Giá/Kg</th>
                                    <th className="p-3 text-right">Thành tiền</th>
                                    <th className="p-3 text-center">Xóa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {newOrder.items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="p-3"><div className="font-bold text-slate-700">{item.fishName}</div><div className="text-xs text-slate-400 mt-0.5">{item.sizeName}</div></td>
                                        <td className="p-3"><span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-600">{item.unitName}</span></td>
                                        <td className="p-3 text-center font-medium">{item.quantity}</td>
                                        <td className="p-3 text-center text-cyan-600 font-bold">{item.estimatedKg}</td>
                                        <td className="p-3 text-right text-slate-500">{formatCurrency(item.pricePerKg)}</td>
                                        <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(item.total)}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 px-2 py-1 border border-transparent hover:border-red-100 hover:bg-red-50 rounded font-bold text-xs cursor-pointer">Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                                {newOrder.items.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-slate-400 italic">Chưa có sản phẩm nào trong giỏ</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-white border-t border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 font-medium">Tổng hóa đơn dự kiến:</span>
                            <span className="text-2xl font-bold text-cyan-700">{formatCurrency(newOrderTotal)}</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm cursor-pointer">Hủy</button>
                            <button onClick={handleSubmitOrder} className="flex-1 py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 text-base transition-all active:scale-95 cursor-pointer">
                                Hoàn tất đơn hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
