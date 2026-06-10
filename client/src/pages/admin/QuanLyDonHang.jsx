import React, { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

// Định nghĩa cấu trúc Trạng thái hoàn toàn bằng màu sắc, KHÔNG dùng Icon
const ORDER_STATUS = {
    "CHO_XAC_NHAN": { label: "Chờ xác nhận", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    "DA_THANH_TOAN": { label: "Đã thanh toán", color: "bg-teal-50 text-teal-700 border-teal-200" },
    "DANG_DONG_HANG": { label: "Đang đóng hàng", color: "bg-blue-50 text-blue-700 border-blue-200" },
    "DANG_VAN_CHUYEN": { label: "Đang vận chuyển", color: "bg-purple-50 text-purple-700 border-purple-200" },
    "GIAO_HANG_THANH_CONG": { label: "Giao thành công", color: "bg-green-50 text-green-700 border-green-200" },
    "HUY": { label: "Đã hủy", color: "bg-red-50 text-red-700 border-red-200" }
};

const STATUS_PRIORITY = {
    "CHO_XAC_NHAN": 1, "DANG_DONG_HANG": 2, "DANG_VAN_CHUYEN": 3,
    "GIAO_HANG_THANH_CONG": 4, "DA_THANH_TOAN": 5, "HUY": 6
};

// Helper: Format tiền tệ chuẩn
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
};

export default function QuanLyDonHang() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("ALL");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewDetails, setViewDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isEdited, setIsEdited] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [fishes, setFishes] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [units, setUnits] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [conversionList, setConversionList] = useState([]);

    const [newOrder, setNewOrder] = useState({
        idthongtinkhachhang: "", tenKhachLe: "", sdtKhachLe: "", items: []
    });
    const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
    const [completedOrderTotal, setCompletedOrderTotal] = useState(0);

    const [currentItem, setCurrentItem] = useState({
        fishId: "", sizeId: "", repoId: "", unitId: "", unitName: "",
        factor: 0, quantity: 1, estimatedKg: 0, pricePerKg: 0,
    });

    const { showToast } = useToast();

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [resOrders, resCust, resFish, resUnits, resPrices, resConversions] = await Promise.all([
                api.get("/Donhangs"), api.get("/tai-khoan"), api.get("/Loaicas"),
                api.get("/Donvitinhs"), api.get("/Banggias"), api.get("/Quydois")
            ]);

            const ordersData = resOrders.data;
            let realData = ordersData.result || ordersData.data || (Array.isArray(ordersData) ? ordersData : []);

            realData.sort((a, b) => {
                const priorityA = STATUS_PRIORITY[a.trangthaidonhang] || 99;
                const priorityB = STATUS_PRIORITY[b.trangthaidonhang] || 99;
                if (priorityA !== priorityB) return priorityA - priorityB;
                return new Date(b.ngaydat) - new Date(a.ngaydat);
            });

            setOrders(realData);
            setCustomers((resCust.data?.result || []).filter(u => u.vaitro === "CUSTOMER"));
            setFishes(resFish.data?.result || []);
            setUnits(resUnits.data?.result || []);
            setPriceList(resPrices.data?.result || []);
            setConversionList(resConversions.data?.result || resConversions.data?.data || []);
        } catch (error) {
            console.error(error);
            showToast("Không thể tải danh sách đơn hàng!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

    const filteredOrders = useMemo(() => {
        return filterStatus === "ALL" ? orders : orders.filter(o => o.trangthaidonhang === filterStatus);
    }, [orders, filterStatus]);

    const newOrderTotal = useMemo(() => {
        return newOrder.items.reduce((sum, i) => sum + i.total, 0);
    }, [newOrder.items]);

    const handleViewDetail = async (order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
        setLoadingDetails(true);
        setIsEdited(false);
        try {
            const { data } = await api.get(`/Donhangs/${order.iddonhang}/chitiet`);
            const rawDetails = data.result || [];

            const mappedDetails = rawDetails.map(d => {
                const valThucTe = d.soluongkgthucte ?? d.soLuongKgThucTe ?? d.khoiluongthucte ?? 0;
                const valDuKien = d.soluongkgthuctequydoi ?? d.soLuongKgThucTeQuyDoi ?? d.khoiluongdukien ?? 0;
                const valTienDuKien = d.tongtiendukien ?? d.tongTienDuKien ?? d.thanhtiendukien ?? 0;
                const valTienThucTe = d.tongtienthucte ?? d.tongTienThucTe ?? d.thanhtienthucte ?? 0;

                return {
                    ...d,
                    finalSoluongKgThucTe: valThucTe,
                    finalSoluongKgDuKien: valDuKien,
                    finalTienDuKien: valTienDuKien,
                    finalTienThucTe: valTienThucTe,
                    editWeight: valThucTe > 0 ? valThucTe : valDuKien,
                    calculatedPrice: valDuKien > 0 ? (valTienDuKien / valDuKien) : 0
                };
            });

            setViewDetails(mappedDetails);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoadingDetails(false); 
        }
    };

    const handleWeightInputChange = useCallback((idDetail, newVal) => {
        const val = parseFloat(newVal) || 0;
        setViewDetails(prev => prev.map(item => {
            if (item.idchitietdonhang === idDetail) {
                return {
                    ...item,
                    editWeight: val,
                    finalTienThucTe: val * item.calculatedPrice
                };
            }
            return item;
        }));
        setIsEdited(true);
    }, []);

    const handleSaveRealWeight = async () => {
        if (!selectedOrder) return;
        const payload = viewDetails.map(item => ({ idChitietdonhang: item.idchitietdonhang, soluongkgthucte: item.editWeight }));
        try {
            await api.put(`/Donhangs/${selectedOrder.iddonhang}/cap-nhat-can-nang`, payload);
            showToast("Đã cập nhật cân nặng thực tế!", "success");
            setIsEdited(false);
            fetchInitialData();
        } catch (error) {
            showToast("Cập nhật cân nặng thất bại!", "error");
        }
    };

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

        if (!customerId) {
            const kgUnit = units.find(u => Number(u.hesokg) === 1);
            if (kgUnit) {
                const unitId = kgUnit.iddvt || kgUnit.id;
                const newPrice = currentItem.repoId ? getAutoPrice(currentItem.repoId, "") : 0;
                setCurrentItem(prev => ({
                    ...prev, unitId, unitName: kgUnit.tendvt, factor: 1,
                    estimatedKg: parseFloat((currentItem.quantity * 1).toFixed(2)), pricePerKg: newPrice,
                }));
            }
        } else {
            if (currentItem.repoId) {
                setCurrentItem(prev => ({ ...prev, pricePerKg: getAutoPrice(currentItem.repoId, customerId) }));
            }
        }
    };

    const handleFishChange = async (fishId) => {
        setCurrentItem(prev => ({ ...prev, fishId: fishId, sizeId: "", repoId: "", pricePerKg: 0 }));
        setSizes([]);
        if (!fishId) return;
        try {
            const { data } = await api.get(`/Chitietcabans`);
            const allInventory = data.result || data.data || [];
            const validSizes = allInventory
                .filter(item => Number(item.idLoaiCa || item.idloaica?.id || item.idloaica) === Number(fishId))
                .map(item => ({ idsizeca: item.idSizeCa || item.idsizeca, sizeca: item.tenSize || item.sizeca, repoId: item.id }));
            setSizes(validSizes);
        } catch (error) { console.error(error); }
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
            ...prev, sizeId: selectedSizeId, repoId: repoId,
            pricePerKg: getAutoPrice(repoId, newOrder.idthongtinkhachhang),
            factor: newFactor,
            estimatedKg: newFactor > 0 ? parseFloat((currentItem.quantity * newFactor).toFixed(2)) : 0
        }));
    };

    const handleUnitChange = (val) => {
        const unitId = Number(val);
        const selectedUnit = units.find(u => (u.iddvt || u.id) == unitId);
        if (!selectedUnit) return;

        let factor = selectedUnit.hesokg || getConversionFactor(currentItem.repoId) || 0;
        setCurrentItem(prev => ({
            ...prev, unitId: unitId, unitName: selectedUnit.tendvt, factor: factor, 
            estimatedKg: factor > 0 ? parseFloat((currentItem.quantity * factor).toFixed(2)) : 0
        }));
    };

    const handleQuantityChange = (qty) => {
        const quantity = parseFloat(qty) || 0;
        setCurrentItem(prev => ({ ...prev, quantity, estimatedKg: prev.factor > 0 ? quantity * prev.factor : prev.estimatedKg }));
    };

    const handleAddItem = () => {
        if (!currentItem.fishId || !currentItem.sizeId || !currentItem.unitId) return alert("Vui lòng chọn đầy đủ thông tin!");
        if (currentItem.pricePerKg === 0) return alert("Sản phẩm này chưa được thiết lập giá bán!");

        const fish = fishes.find(f => f.id == currentItem.fishId);
        const size = sizes.find(s => s.idsizeca == currentItem.sizeId);

        const newItem = {
            id: Date.now(), repoId: currentItem.repoId, fishId: currentItem.fishId, sizeId: currentItem.sizeId,
            fishName: fish?.tenloaica, sizeName: size?.sizeca, unitId: currentItem.unitId, unitName: currentItem.unitName,
            quantity: currentItem.quantity, estimatedKg: currentItem.estimatedKg, pricePerKg: currentItem.pricePerKg,
            total: currentItem.estimatedKg * currentItem.pricePerKg
        };

        setNewOrder(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setCurrentItem(prev => ({ ...prev, quantity: 1, estimatedKg: 0 }));
    };

    const handleRemoveItem = (id) => {
        setNewOrder(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    };

    const handleClosePaymentPopup = () => {
        setIsPaymentPopupOpen(false);
        setNewOrder({ idthongtinkhachhang: "", tenKhachLe: "", sdtKhachLe: "", items: [] });
        setCurrentItem({ fishId: "", sizeId: "", repoId: "", unitId: "", unitName: "", factor: 0, quantity: 1, estimatedKg: 0, pricePerKg: 0 });
    };

    const handleSubmitOrder = async () => {
        if (newOrder.items.length === 0) return alert("Đơn hàng rỗng!");
        const isKhachLe = !newOrder.idthongtinkhachhang;
        const payload = {
            idthongtinkhachhang: isKhachLe ? null : newOrder.idthongtinkhachhang,
            tenKhachLe: isKhachLe ? newOrder.tenKhachLe : null,
            sdtKhachLe: isKhachLe ? newOrder.sdtKhachLe : null,
            trangthaidonhang: "DA_THANH_TOAN", ghichu: "[POS]",
            chiTietDonHang: newOrder.items.map(item => ({
                idchitietcaban: item.repoId, iddonvitinh: item.unitId, soluong: item.quantity,
                soluongkgthucte: item.estimatedKg, soluongkgthuctequydoi: item.estimatedKg,
                tongtiendukien: item.total, tongtienthucte: item.total
            }))
        };
        try {
            await api.post("/Donhangs", payload);
            showToast("Tạo đơn hàng POS thành công!", "success");
            setIsCreateModalOpen(false);
            setCompletedOrderTotal(newOrderTotal);
            setIsPaymentPopupOpen(true);
            fetchInitialData();
        } catch (error) {
            showToast("Không thể tạo đơn hàng!", "error");
        }
    };

    const calculateTotal = useCallback((details) => {
        return details.reduce((sum, item) => sum + ((item.finalTienThucTe > 0 ? item.finalTienThucTe : item.finalTienDuKien) || 0), 0);
    }, []);

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedOrder) return;
        if (isEdited && !window.confirm("Bạn đã sửa cân nặng nhưng chưa Lưu. Tiếp tục đổi trạng thái?")) return;
        if (!window.confirm(`Xác nhận chuyển trạng thái sang: ${ORDER_STATUS[newStatus].label}?`)) return;
        try {
            await api.put(`/Donhangs/${selectedOrder.iddonhang}/status`, { trangthaidonhang: newStatus });
            setOrders(prev => prev.map(o => o.iddonhang === selectedOrder.iddonhang ? { ...o, trangthaidonhang: newStatus } : o));
            setSelectedOrder(prev => ({ ...prev, trangthaidonhang: newStatus }));
            showToast("Chuyển trạng thái thành công!", "success");
            setIsViewModalOpen(false);
        } catch (error) { showToast("Lỗi thao tác!", "error"); }
    };

    // --- DIỆN MẠO MODAL TẠO ĐƠN ---
    const renderCreateModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-cyan-50/60">
                    <h3 className="font-bold text-lg text-cyan-900">Tạo đơn hàng (Admin POS)</h3>
                    <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">
                    <div className="lg:col-span-4 space-y-5 border-r border-slate-100 pr-0 lg:pr-4">
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
                                    <input type="text" placeholder="Khách vãng lai" className="w-full p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-cyan-500" value={newOrder.tenKhachLe} onChange={(e) => setNewOrder({ ...newOrder, tenKhachLe: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số điện thoại</label>
                                    <input type="text" placeholder="Không bắt buộc" className="w-full p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-cyan-500" value={newOrder.sdtKhachLe} onChange={(e) => setNewOrder({ ...newOrder, sdtKhachLe: e.target.value })} />
                                </div>
                            </div>
                        )}
                        <div className="border-t border-slate-200"></div>
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-700">Thông tin sản phẩm</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Loại cá</label>
                                    <select className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-cyan-500" value={currentItem.fishId} onChange={(e) => handleFishChange(e.target.value)}>
                                        <option value="">-- Chọn --</option>
                                        {fishes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Size</label>
                                    <select className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-cyan-500" value={currentItem.sizeId} onChange={(e) => handleSizeChange(e.target.value)}>
                                        <option value="">-- Chọn --</option>
                                        {sizes.map(s => <option key={s.idsizeca} value={s.idsizeca}>{s.sizeca}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="bg-cyan-50/40 p-4 rounded-xl border border-cyan-100 space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Đơn vị tính</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-cyan-500" value={currentItem.unitId} onChange={(e) => handleUnitChange(e.target.value)}>
                                    <option value="">-- Chọn ĐVT --</option>
                                    {units.map(u => <option key={u.iddvt || u.id} value={u.iddvt || u.id}>{u.tendvt} (HS: {u.hesokg})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số lượng</label>
                                    <input type="number" min="1" className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold bg-white focus:border-cyan-500 outline-none" value={currentItem.quantity} onChange={(e) => handleQuantityChange(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số Kg</label>
                                    <input type="number" disabled={currentItem.factor > 0} className={`w-full p-2 border rounded-lg text-center font-bold outline-none ${currentItem.factor > 0 ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white text-cyan-600 border-cyan-200 focus:border-cyan-500'}`} value={currentItem.estimatedKg} onChange={(e) => setCurrentItem({ ...currentItem, estimatedKg: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Giá bán (VNĐ/Kg)</label>
                                <input type="text" className="w-full p-2 border border-slate-200 rounded-lg bg-slate-100 font-bold text-slate-600 outline-none" value={formatCurrency(currentItem.pricePerKg)} readOnly />
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-cyan-200/50">
                                <span className="font-medium text-cyan-800">Tạm tính:</span>
                                <span className="text-lg font-bold text-cyan-700">{formatCurrency(currentItem.estimatedKg * currentItem.pricePerKg)}</span>
                            </div>
                        </div>
                        <button onClick={handleAddItem} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-xs active:scale-95 cursor-pointer">+ Thêm vào đơn</button>
                    </div>

                    <div className="lg:col-span-8 flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-xs">
                            <h4 className="font-bold text-slate-700">Danh sách món đã chọn</h4>
                            <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold">{newOrder.items.length} mặt hàng</span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm min-w-max">
                                <thead className="bg-slate-100 text-slate-500 sticky top-0 shadow-xs z-10 font-bold text-xs uppercase">
                                    <tr><th className="p-3">Tên cá</th><th className="p-3">ĐVT</th><th className="p-3 text-center">SL</th><th className="p-3 text-center">Kg</th><th className="p-3 text-right">Giá/Kg</th><th className="p-3 text-right">Thành tiền</th><th className="p-3 text-center">Xóa</th></tr>
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
                                </tbody>
                            </table>
                            {newOrder.items.length === 0 && <div className="p-12 text-center text-slate-400 italic">Chưa có sản phẩm nào trong giỏ</div>}
                        </div>
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex justify-between items-center mb-4"><span className="text-slate-500 font-medium">Tổng hóa đơn dự kiến:</span><span className="text-2xl font-bold text-cyan-700">{formatCurrency(newOrderTotal)}</span></div>
                            <button onClick={handleSubmitOrder} className="w-full py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 text-base transition-all active:scale-95 cursor-pointer">Hoàn tất đơn hàng</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- POPUP LỰA CHỌN PHƯƠNG THỨC THANH TOÁN ---
    const renderPaymentPopup = () => (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-cyan-100 bg-cyan-50 text-center">
                    <h3 className="font-bold text-lg text-cyan-800">Đơn hàng đã ghi nhận!</h3>
                    <p className="text-sm text-cyan-600 font-semibold mt-1">Tổng tiền thu: {formatCurrency(completedOrderTotal)}</p>
                </div>
                <div className="p-6">
                    <p className="text-center font-bold text-slate-600 mb-4 text-xs uppercase">Hình thức thu ngân</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button onClick={handleClosePaymentPopup} className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 transition-all font-bold text-slate-700 cursor-pointer text-sm">
                            Tiền mặt
                        </button>
                        <button onClick={handleClosePaymentPopup} className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 transition-all font-bold text-slate-700 cursor-pointer text-sm">
                            Quét QR
                        </button>
                    </div>
                    <button onClick={handleClosePaymentPopup} className="w-full py-2 text-slate-400 text-xs hover:text-slate-600 transition-colors cursor-pointer">Đóng cửa sổ</button>
                </div>
            </div>
        </div>
    );

    // --- GIAO DIỆN DANH SÁCH CHÍNH ---
    return (
        <AdminLayout title="Quản Lý Đơn Hàng">
            {/* TOOLBAR TÌM KIẾM & BỘ LỌC TABS */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-1.5 w-full xl:w-auto">
                    <button onClick={() => setFilterStatus("ALL")} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border shadow-2xs cursor-pointer ${filterStatus === "ALL" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"}`}>Tất cả</button>
                    {Object.keys(ORDER_STATUS).map(status => {
                        const isCurrent = filterStatus === status;
                        return (
                            <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 border cursor-pointer ${isCurrent ? "bg-white border-cyan-500 text-cyan-700 ring-2 ring-cyan-500/20 shadow-2xs" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"}`}>
                                <span className={`size-2 rounded-full ${ORDER_STATUS[status].color.split(' ')[0].replace('50', '500').replace('100', '500')}`}></span>
                                {ORDER_STATUS[status].label}
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer text-sm">
                    Tạo đơn hàng
                </button>
            </div>

            {/* BẢNG THÔNG TIN ĐƠN HÀNG */}
            <div className="bg-white rounded-2xl shadow-2xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Mã Đơn</th><th className="p-4">Khách Hàng</th><th className="p-4">Ngày Đặt</th><th className="p-4">Trạng Thái</th><th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((item) => {
                                    const statusConfig = ORDER_STATUS[item.trangthaidonhang] || { label: item.trangthaidonhang, color: "bg-gray-50 text-gray-600 border-slate-200" };
                                    return (
                                        <tr key={item.iddonhang} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-mono font-medium text-cyan-700">#{item.iddonhang.substring(0, 8).toUpperCase()}</td>
                                            <td className="p-4 font-bold text-slate-800">{item.tenKhachHang || "Khách lẻ"}</td>
                                            <td className="p-4 text-slate-500">{new Date(item.ngaydat).toLocaleString('vi-VN')}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex w-fit items-center ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleViewDetail(item)} className="px-4 py-2 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer">Xử lý đơn</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Không tìm thấy đơn hàng nào phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONDITIONAL POPUPS / MODALS */}
            {isCreateModalOpen && renderCreateModal()}
            {isPaymentPopupOpen && renderPaymentPopup()}

            {/* MODAL CHI TIẾT ĐƠN HÀNG & CẬP NHẬT TRỌNG LƯỢNG */}
            {isViewModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {selectedOrder.trangthaidonhang === "DANG_DONG_HANG" ? "Cân & Đóng Hàng" : "Chi tiết đơn"} <span className="text-cyan-600">#{selectedOrder.iddonhang.substring(0, 8).toUpperCase()}</span>
                            </h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-red-500 font-bold cursor-pointer">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                                    <h4 className="font-bold mb-2.5 text-cyan-900 uppercase text-xs tracking-wider">Thông tin người mua</h4>
                                    <p className="text-slate-600"><span className="font-medium text-slate-400">Họ tên:</span> {selectedOrder.tenKhachHang || "Khách lẻ vãng lai"}</p>
                                    <p className="text-slate-600 mt-1"><span className="font-medium text-slate-400">SĐT:</span> {selectedOrder.sdtKhachHang || "..."}</p>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                        Trạng thái: <span className="text-cyan-600 font-black ml-1">{ORDER_STATUS[selectedOrder.trangthaidonhang].label}</span>
                                    </h4>

                                    {selectedOrder.trangthaidonhang === "DANG_DONG_HANG" && (
                                        <div className="my-2">
                                            <button onClick={handleSaveRealWeight} disabled={!isEdited} className={`w-full py-2 rounded-lg font-bold transition-all text-xs cursor-pointer ${isEdited ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                                {isEdited ? "Xác nhận & Lưu Kg thực tế" : "Cân nặng đã đồng bộ"}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
                                        {selectedOrder.trangthaidonhang === "CHO_XAC_NHAN" && (
                                            <button onClick={() => handleUpdateStatus("DANG_DONG_HANG")} className="flex-1 py-1.5 bg-cyan-600 text-white rounded-lg font-bold text-xs hover:bg-cyan-700 whitespace-nowrap cursor-pointer">Bắt đầu đóng hàng</button>
                                        )}
                                        {selectedOrder.trangthaidonhang === "DANG_DONG_HANG" && (
                                            <button onClick={() => handleUpdateStatus("DANG_VAN_CHUYEN")} className="flex-1 py-1.5 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 whitespace-nowrap cursor-pointer">Giao đơn vị vận chuyển</button>
                                        )}
                                        {selectedOrder.trangthaidonhang === "DANG_VAN_CHUYEN" && (
                                            <button onClick={() => handleUpdateStatus("GIAO_HANG_THANH_CONG")} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 whitespace-nowrap cursor-pointer">Xác nhận giao thành công</button>
                                        )}
                                        {["CHO_XAC_NHAN", "DANG_DONG_HANG"].includes(selectedOrder.trangthaidonhang) && (
                                            <button onClick={() => handleUpdateStatus("HUY")} className="px-4 py-1.5 border border-red-200 text-red-600 rounded-lg font-bold text-xs hover:bg-red-50 cursor-pointer">Hủy đơn</button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-800 mb-3">Danh sách chi tiết mặt hàng</h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm min-w-[700px]">
                                        <thead className="bg-cyan-50/60 border-b border-slate-200 text-cyan-900 font-bold text-xs uppercase">
                                            <tr>
                                                <th className="p-3">Sản phẩm</th><th className="p-3">Size</th><th className="p-3 text-center">ĐVT</th><th className="p-3 text-center">SL</th><th className="p-3 text-center text-slate-400">Dự kiến(Kg)</th>
                                                <th className="p-3 text-center bg-yellow-50 text-yellow-800 border-x border-slate-200 w-[140px]">
                                                    {selectedOrder.trangthaidonhang === "DANG_DONG_HANG" ? "✏️ Gõ Số Kg Thật" : "Kg Thực tế"}
                                                </th>
                                                <th className="p-3 text-right">Đơn giá</th><th className="p-3 text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {loadingDetails ? (<tr><td colSpan="8" className="p-4 text-center text-slate-400">Đang tải...</td></tr>) : viewDetails.length > 0 ? (
                                                viewDetails.map(d => {
                                                    const isEditingMode = selectedOrder.trangthaidonhang === "DANG_DONG_HANG";
                                                    const hienThiTien = d.finalTienThucTe > 0 ? d.finalTienThucTe : d.finalTienDuKien;
                                                    const detailUnitId = d.iddonvitinh || d.idDonViTinh || (d.donvitinh && (d.donvitinh.id || d.donvitinh.iddvt));
                                                    const foundUnit = units.find(u => Number(u.id || u.iddvt) === Number(detailUnitId));
                                                    const tenDVT = foundUnit ? foundUnit.tendvt : (d.tenDonViTinh || d.donvitinh?.tendvt || "-");

                                                    return (
                                                        <tr key={d.idchitietdonhang} className="hover:bg-slate-50/30">
                                                            <td className="p-3 font-bold text-slate-700">{d.tenLoaiCa || d.chitietcaban?.tenloaica}</td>
                                                            <td className="p-3 text-slate-500 text-xs">{d.tenSize || d.chitietcaban?.tensize}</td>
                                                            <td className="p-3 text-center"><span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-500 whitespace-nowrap">{tenDVT}</span></td>
                                                            <td className="p-3 text-center font-bold text-slate-800">{d.soluong}</td>
                                                            <td className="p-3 text-center text-slate-400 font-medium">{d.finalSoluongKgDuKien ? d.finalSoluongKgDuKien.toLocaleString() : "-"}</td>
                                                            <td className={`p-1 text-center border-x border-slate-200 ${isEditingMode ? 'bg-yellow-50/50' : ''}`}>
                                                                {isEditingMode ? (
                                                                    <input type="number" step="0.1" className="w-full text-center font-bold text-cyan-700 bg-white border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none py-1 text-sm shadow-inner" value={d.editWeight} onChange={(e) => handleWeightInputChange(d.idchitietdonhang, e.target.value)} />
                                                                ) : (
                                                                    <span className="font-bold text-slate-800">{d.finalSoluongKgThucTe ? d.finalSoluongKgThucTe.toLocaleString() : "-"}</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-right text-slate-400 text-xs">{formatCurrency(d.calculatedPrice)}</td>
                                                            <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(hienThiTien)}</td>
                                                        </tr>
                                                    )
                                                })
                                            ) : (<tr><td colSpan="8" className="p-4 text-center text-slate-400">Trống</td></tr>)}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                            <tr>
                                                <td colSpan="7" className="p-4 text-right text-slate-500 text-xs uppercase tracking-wider">Tổng cộng hóa đơn thực tế:</td>
                                                <td className="p-4 text-right font-black text-cyan-600 text-xl">{formatCurrency(calculateTotal(viewDetails))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FORM COMPONENT CSS FALLBACK */}
            <style>{`
                .label-text { display: block; font-size: 0.875rem; font-weight: 700; color: #334155; margin-bottom: 0.375rem; }
                .input-field { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; transition: all 0.2s; font-size: 0.875rem; bg: #ffffff; }
                .input-field:focus { border-color: #0891b2; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2); }
            `}</style>
        </AdminLayout>
    );
}