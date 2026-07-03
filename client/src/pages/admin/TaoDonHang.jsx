import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";

export default function TaoDonHang() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [customerType, setCustomerType] = useState("LE"); // "LE" hoặc "SI"
    const [customerConfirmed, setCustomerConfirmed] = useState(false);

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

    // Kéo toàn bộ dữ liệu cấu hình ban đầu
    useEffect(() => {
        Promise.all([
            api.get("/tai-khoan"),
            api.get("/Chitietcabans"),
            api.get("/Donvitinhs"),
            api.get("/Banggias"),
            api.get("/Quydois"),
        ]).then(([resCust, resRepo, resUnits, resPrices, resConversions]) => {
            setCustomers((resCust.data?.result || []).filter(u => u.vaitro === "CUSTOMER"));
            setFishes(resRepo.data?.result || []); // Dùng thẳng Chitietcabans để map loại cá & size nhằm bỏ qua API Loaicas/Sizecas
            setUnits(resUnits.data?.result || []);
            setPriceList(resPrices.data?.result || []);
            setConversionList(resConversions.data?.result || []);
        }).catch(() => showToast("Không thể tải dữ liệu!", "error"));
    }, []);

    // Tồn kho khả dụng của size đang chọn = tồn kho thực - phần đã đưa vào giỏ nháp cho cùng size (mọi ĐVT)
    const currentStock = useMemo(() => {
        if (!currentItem.repoId) return null;
        const fish = fishes.find(f => Number(f.id) === Number(currentItem.repoId));
        const baseStock = fish?.soluongton ?? 0;
        const reserved = newOrder.items
            .filter(i => Number(i.repoId) === Number(currentItem.repoId))
            .reduce((s, i) => s + i.estimatedKg, 0);
        return parseFloat((baseStock - reserved).toFixed(2));
    }, [fishes, newOrder.items, currentItem.repoId]);

    // Lọc danh sách loại cá duy nhất từ kho
    const fishTypes = useMemo(() => {
        return fishes.reduce((acc, item) => {
            if (!acc.some(f => f.id === item.idLoaiCa)) {
                acc.push({ id: item.idLoaiCa, tenloaica: item.tenLoaiCa });
            }
            return acc;
        }, []);
    }, [fishes]);

    // Lấy hệ số quy đổi dựa trên cấu trúc object lồng nhau của API /Quydois
    const getConversionFactor = useCallback((repoId) => {
        const match = conversionList.find(c => Number(c.idchitietcaban?.id) === Number(repoId));
        return match ? match.sokgtuongung : 0;
    }, [conversionList]);

    // Dò giá bán sỉ/lẻ hiện hành
    const getAutoPrice = useCallback((repoId, isWholesale) => {
        const activePrice = priceList.find(p => Number(p.idChitietcaban) === Number(repoId) && p.trangThai === "Đang áp dụng");
        if (!activePrice) return 0;
        return isWholesale ? activePrice.giaBanSi : activePrice.giaBanLe;
    }, [priceList]);

    const handleConfirmCustomer = () => {
        if (customerType === "LE" && !newOrder.tenKhachLe.trim()) {
            showToast("Vui lòng nhập tên khách lẻ!", "error");
            return;
        }
        if (customerType === "SI" && !newOrder.idthongtinkhachhang) {
            showToast("Vui lòng chọn khách sỉ!", "error");
            return;
        }
        setCustomerConfirmed(true);
    };

    const handleFishChange = (fishId) => {
        setCurrentItem(prev => ({ ...prev, fishId, sizeId: "", repoId: "", pricePerKg: 0 }));
        const validSizes = fishes
            .filter(item => Number(item.idLoaiCa) === Number(fishId))
            .map(item => ({ idsizeca: item.idSizeCa, sizeca: item.tenSize, repoId: item.id }));
        setSizes(validSizes);
    };

    const handleSizeChange = (selectedSizeId) => {
        const selectedSizeObj = sizes.find(s => s.idsizeca == selectedSizeId);
        const repoId = selectedSizeObj ? selectedSizeObj.repoId : "";

        let factor = currentItem.factor;
        if (currentItem.unitId) {
            const selectedUnit = units.find(u => u.id == currentItem.unitId);
            factor = selectedUnit?.hesokg || getConversionFactor(repoId) || 0;
        }

        setCurrentItem(prev => ({
            ...prev, sizeId: selectedSizeId, repoId,
            pricePerKg: getAutoPrice(repoId, customerType === "SI"),
            factor,
            estimatedKg: factor > 0 ? parseFloat((currentItem.quantity * factor).toFixed(2)) : 0,
        }));
    };

    const handleUnitChange = (val) => {
        const selectedUnit = units.find(u => u.id == Number(val));
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
        if (!currentItem.fishId || !currentItem.sizeId || !currentItem.unitId) { showToast("Điền thiếu thông tin!", "error"); return; }
        if (currentItem.pricePerKg === 0) { showToast("Chưa có giá bán!", "error"); return; }

        const fish = fishTypes.find(f => f.id == currentItem.fishId);
        const size = sizes.find(s => s.idsizeca == currentItem.sizeId);

        const existing = newOrder.items.find(i => Number(i.repoId) === Number(currentItem.repoId) && Number(i.unitId) === Number(currentItem.unitId));

        if (existing) {
            setNewOrder(prev => ({
                ...prev,
                items: prev.items.map(i => i.id === existing.id ? {
                    ...i,
                    quantity: i.quantity + currentItem.quantity,
                    estimatedKg: parseFloat((i.estimatedKg + currentItem.estimatedKg).toFixed(2)),
                    total: i.total + currentItem.estimatedKg * currentItem.pricePerKg,
                } : i),
            }));
        } else {
            const newItem = {
                id: Date.now(), repoId: currentItem.repoId, unitId: currentItem.unitId, unitName: currentItem.unitName,
                fishName: fish?.tenloaica, sizeName: size?.sizeca, quantity: currentItem.quantity,
                estimatedKg: currentItem.estimatedKg, pricePerKg: currentItem.pricePerKg,
                total: currentItem.estimatedKg * currentItem.pricePerKg,
            };
            setNewOrder(prev => ({ ...prev, items: [...prev.items, newItem] }));
        }
        setCurrentItem(prev => ({ ...prev, quantity: 1, estimatedKg: prev.factor > 0 ? prev.factor : 0 }));
    };

    const handleRemoveItem = (id) => setNewOrder(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

    const newOrderTotal = useMemo(() => newOrder.items.reduce((sum, i) => sum + i.total, 0), [newOrder.items]);

    const handleSubmitOrder = async () => {
        if (newOrder.items.length === 0) { showToast("Đơn hàng rỗng!", "error"); return; }
        const isKhachLe = customerType === "LE";
        const selectedSi = customers.find(c => c.idtaikhoan === newOrder.idthongtinkhachhang);

        const payload = {
            idthongtinkhachhang: isKhachLe ? null : newOrder.idthongtinkhachhang,
            tenKhachHang: isKhachLe ? newOrder.tenKhachLe : `${selectedSi?.ho} ${selectedSi?.ten}`,
            sdtKhachHang: isKhachLe ? newOrder.sdtKhachLe : selectedSi?.sodienthoai,
            // Khách lẻ: trả tiền tại chỗ, giao dịch xong ngay -> GIAO_HANG_THANH_CONG + DA_THANH_TOAN.
            // Khách sỉ: thanh toán sau (chuyển khoản), hàng lên xe khách ngay -> DANG_DONG_HANG.
            trangthaidonhang: isKhachLe ? "GIAO_HANG_THANH_CONG" : "DANG_DONG_HANG",
            trangthaithanhtoan: isKhachLe ? "DA_THANH_TOAN" : "CHUA_THANH_TOAN",
            ghichu: "[POS]",
            chiTietDonHang: newOrder.items.map(item => ({
                idchitietcaban: item.repoId, iddonvitinh: item.unitId, soluong: item.quantity,
                soluongkgthucte: item.estimatedKg, soluongkgthuctequydoi: item.estimatedKg,
                tongtiendukien: item.total, tongtienthucte: item.total,
            })),
        };
        try {
            await api.post("/Donhangs", payload);
            showToast("Tạo đơn hàng thành công!", "success");
            setCompletedOrderTotal(newOrderTotal);
            setOrderDone(true);
        } catch {
            showToast("Lỗi tạo đơn hàng!", "error");
        }
    };

    if (orderDone) {
        const isSi = customerType === "SI";
        return (
            <AdminLayout title="Đơn hàng hoàn tất">
                <div className="max-w-sm mx-auto bg-white rounded-2xl border border-slate-200 text-center p-6">
                    <h3 className="font-bold text-lg text-emerald-700">
                        {isSi ? "Đặt đơn hàng thành công!" : "Đơn hàng thành công!"}
                    </h3>
                    <p className="text-sm text-slate-600 font-semibold mt-2">
                        {isSi ? "Tổng tiền đơn hàng: " : "Tổng thu: "}{formatCurrency(completedOrderTotal)}
                    </p>
                    {isSi ? (
                        <>
                            <p className="text-xs text-slate-400 mt-2">Đơn đã chuyển sang "Đang đóng hàng" — khách thanh toán sau.</p>
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="w-full mt-6 p-4 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700">
                                Về Quản lý đơn hàng
                            </button>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 my-6">
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="p-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-sm">Tiền mặt</button>
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="p-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-sm">Quét QR</button>
                        </div>
                    )}
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Tạo đơn hàng (POS)">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">

                {/* BÊN TRÁI: CẤU HÌNH THÔNG TIN */}
                <div className="lg:col-span-4 space-y-5 bg-white rounded-2xl border border-slate-200 p-5">

                    {/* KHÓA CHỌN KHÁCH HÀNG */}
                    <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-xs font-bold text-slate-400 uppercase">1. Chọn loại khách</span>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 font-medium">
                                <input type="radio" checked={customerType === "LE"} disabled={customerConfirmed} onChange={() => setCustomerType("LE")} /> Khách lẻ
                            </label>
                            <label className="flex items-center gap-1.5 font-medium">
                                <input type="radio" checked={customerType === "SI"} disabled={customerConfirmed} onChange={() => setCustomerType("SI")} /> Khách sỉ
                            </label>
                        </div>

                        {customerType === "LE" ? (
                            <div className="space-y-2">
                                <input type="text" placeholder="Tên khách hàng" disabled={customerConfirmed} className="w-full p-2 border border-slate-200 rounded-lg bg-white" value={newOrder.tenKhachLe} onChange={(e) => setNewOrder({ ...newOrder, tenKhachLe: e.target.value })} />
                                <input type="text" placeholder="Số điện thoại" disabled={customerConfirmed} className="w-full p-2 border border-slate-200 rounded-lg bg-white" value={newOrder.sdtKhachLe} onChange={(e) => setNewOrder({ ...newOrder, sdtKhachLe: e.target.value })} />
                            </div>
                        ) : (
                            <select className="w-full p-2 border border-slate-200 rounded-lg bg-white" disabled={customerConfirmed} value={newOrder.idthongtinkhachhang} onChange={(e) => setNewOrder({ ...newOrder, idthongtinkhachhang: e.target.value })}>
                                <option value="">-- Chọn khách sỉ từ hệ thống --</option>
                                {customers.map(c => <option key={c.idtaikhoan} value={c.idtaikhoan}>{c.ho} {c.ten} ({c.sodienthoai || "Trống số"})</option>)}
                            </select>
                        )}

                        {!customerConfirmed ? (
                            <button onClick={handleConfirmCustomer} className="w-full py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs">Xác nhận khách hàng</button>
                        ) : (
                            <div className="text-center text-xs text-green-700 bg-green-50 py-1.5 border border-green-200 rounded-lg font-bold">Đã khóa</div>
                        )}
                    </div>

                    {/* FORM CHỌN SẢN PHẨM */}
                    <div className={`space-y-4 ${!customerConfirmed ? "opacity-30 pointer-events-none" : ""}`}>
                        <span className="text-xs font-bold text-slate-400 uppercase block border-b pb-1">2. Thêm mặt hàng</span>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Loại cá</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg bg-white" value={currentItem.fishId} onChange={(e) => handleFishChange(e.target.value)}>
                                    <option value="">-- Chọn --</option>
                                    {fishTypes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Size</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg bg-white" value={currentItem.sizeId} onChange={(e) => handleSizeChange(e.target.value)}>
                                    <option value="">-- Chọn --</option>
                                    {sizes.map(s => <option key={s.idsizeca} value={s.idsizeca}>{s.sizeca}</option>)}
                                </select>
                            </div>
                        </div>

                        {currentStock !== null && (
                            <div className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${currentStock <= 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                Tồn kho khả dụng: {currentStock} kg
                            </div>
                        )}

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Đơn vị tính</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg bg-white" value={currentItem.unitId} onChange={(e) => handleUnitChange(e.target.value)}>
                                    <option value="">-- Chọn ĐVT --</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.tendvt}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Số lượng</label>
                                    <input type="number" min="1" className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold" value={currentItem.quantity} onChange={(e) => handleQuantityChange(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Cân nặng (Kg)</label>
                                    <input type="number" disabled={currentItem.factor > 0} className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold bg-white disabled:bg-slate-100" value={currentItem.estimatedKg} onChange={(e) => setCurrentItem({ ...currentItem, estimatedKg: parseFloat(e.target.value) || 0 })} />
                                    {currentStock !== null && currentItem.estimatedKg > currentStock && (
                                        <div className="text-[11px] text-red-500 font-bold mt-1">Vượt tồn kho ⚠ (còn {currentStock} kg)</div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Đơn giá áp dụng</label>
                                <div className="p-2 border border-slate-200 rounded-lg bg-slate-100 font-bold text-slate-700">{formatCurrency(currentItem.pricePerKg)}</div>
                            </div>
                        </div>

                        <button onClick={handleAddItem} className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700">
                            Thêm vào giỏ
                        </button>
                    </div>
                </div>

                {/* BÊN PHẢI: GIỎ HÀNG */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h4 className="font-bold text-slate-700">Giỏ hàng thanh toán</h4>
                        <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-0.5 rounded-md text-xs font-bold">{newOrder.items.length} món</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="p-3">Sản phẩm</th>
                                    <th className="p-3">ĐVT</th>
                                    <th className="p-3 text-center">SL</th>
                                    <th className="p-3 text-center">Tổng Kg</th>
                                    <th className="p-3 text-right">Giá/Kg</th>
                                    <th className="p-3 text-right">Thành tiền</th>
                                    <th className="p-3 text-center">Xóa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {newOrder.items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="p-3"><div className="font-bold text-slate-700">{item.fishName}</div><div className="text-xs text-slate-400">{item.sizeName}</div></td>
                                        <td className="p-3 font-medium text-slate-600">{item.unitName}</td>
                                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                                        <td className="p-3 text-center text-cyan-600 font-bold">{item.estimatedKg} kg</td>
                                        <td className="p-3 text-right text-slate-500">{formatCurrency(item.pricePerKg)}</td>
                                        <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 font-bold hover:text-red-700">Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                                {newOrder.items.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-slate-400 italic">Giỏ hàng đang trống.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 font-medium">Tổng tiền cần thu:</span>
                            <span className="text-2xl font-bold text-cyan-700">{formatCurrency(newOrderTotal)}</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Hủy</button>
                            <button onClick={handleSubmitOrder} disabled={newOrder.items.length === 0} className={`flex-1 py-3.5 font-bold rounded-xl text-center ${newOrder.items.length > 0 ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-md cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                {customerType === "SI" ? "Đặt đơn hàng" : "Hoàn tất xuất hóa đơn"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}