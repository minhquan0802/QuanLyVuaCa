import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function TaoPhieuThanhLy() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lots, setLots] = useState([]);

    const [headerForm, setHeaderForm] = useState({
        lydothanhly: "",
        trangthai: "DA_TIEU_HUY",
        ghichu: "",
    });

    const [idloaica, setIdloaica] = useState("");
    const [idsizeca, setIdsizeca] = useState("");

    const [currentDetail, setCurrentDetail] = useState({
        idchitietphieunhap: "",
        soluongthanhly: 0,
        dongia: 0,
    });

    const [addedDetails, setAddedDetails] = useState([]);

    useEffect(() => {
        api.get("/Chitietcabans")
            .then(res => setInventory(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách sản phẩm kho!", "error"))
            .finally(() => setLoading(false));
    }, []);

    const fishTypes = inventory.reduce((acc, item) => {
        if (!acc.some(f => f.id === item.idLoaiCa)) {
            acc.push({ id: item.idLoaiCa, tenloaica: item.tenLoaiCa });
        }
        return acc;
    }, []);

    const availableSizes = idloaica
        ? inventory.filter(item => item.idLoaiCa == idloaica).map(item => ({ id: item.idSizeCa, sizeca: item.tenSize }))
        : [];

    const selectedProduct = inventory.find(i => i.idLoaiCa == idloaica && i.idSizeCa == idsizeca);
    const productId = selectedProduct?.id || "";

    // Khi đã xác định được sản phẩm kho (loại cá + size), tải danh sách lô còn hàng
    useEffect(() => {
        if (!productId) { setLots([]); return; }
        api.get(`/Phieuthanhlys/lo-con-hang?idchitietcaban=${productId}`)
            .then(res => setLots(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách lô!", "error"));
    }, [productId]);

    const handleSelectFish = (fishId) => {
        setIdloaica(fishId);
        setIdsizeca("");
        setCurrentDetail(prev => ({ ...prev, idchitietphieunhap: "" }));
    };

    const handleSelectSize = (sizeId) => {
        setIdsizeca(sizeId);
        setCurrentDetail(prev => ({ ...prev, idchitietphieunhap: "" }));
    };

    const selectedLot = lots.find(l => l.idchitietphieunhap === currentDetail.idchitietphieunhap);

    const handleAddDetail = () => {
        if (!selectedProduct) { showToast("Vui lòng chọn Loại cá và Size!", "error"); return; }
        if (!selectedLot) { showToast("Vui lòng chọn lô hàng!", "error"); return; }

        const soLuong = Number(currentDetail.soluongthanhly);
        if (soLuong <= 0) { showToast("Số lượng thanh lý phải > 0", "error"); return; }
        if (soLuong > Number(selectedLot.soluongconlai)) { showToast(`Lô này chỉ còn ${selectedLot.soluongconlai}kg!`, "error"); return; }
        if (Number(currentDetail.dongia) < 0) { showToast("Đơn giá không được âm", "error"); return; }

        setAddedDetails(prev => [...prev, {
            idTemp: Date.now(),
            idchitietphieunhap: selectedLot.idchitietphieunhap,
            tenLoaiCa: selectedProduct.tenLoaiCa,
            tenSize: selectedProduct.tenSize,
            ngaynhap: selectedLot.ngaynhap,
            soluongthanhly: soLuong,
            dongia: Number(currentDetail.dongia),
        }]);

        setCurrentDetail({ idchitietphieunhap: "", soluongthanhly: 0, dongia: 0 });
    };

    const handleRemoveDetail = (idTemp) => setAddedDetails(prev => prev.filter(item => item.idTemp !== idTemp));
    const calculateTotalQuantity = () => addedDetails.reduce((sum, item) => sum + Number(item.soluongthanhly), 0);
    const calculateTotalMoney = () => addedDetails.reduce((sum, item) => sum + item.soluongthanhly * item.dongia, 0);

    const handleSubmit = async () => {
        if (!headerForm.lydothanhly.trim()) { showToast("Vui lòng nhập lý do thanh lý!", "error"); return; }
        if (addedDetails.length === 0) { showToast("Phiếu thanh lý chưa có chi tiết lô hàng nào!", "error"); return; }

        const payload = {
            lydothanhly: headerForm.lydothanhly,
            trangthai: headerForm.trangthai,
            ghichu: headerForm.ghichu,
            listChiTiet: addedDetails.map(d => ({
                idchitietphieunhap: d.idchitietphieunhap,
                soluongthanhly: parseFloat(d.soluongthanhly),
                dongia: parseFloat(d.dongia),
            })),
        };

        try {
            await api.post("/Phieuthanhlys", payload);
            showToast("Lập phiếu thanh lý thành công!", "success");
            navigate("/admin/QuanLyThanhLy");
        } catch {
            showToast("Lỗi hệ thống hoặc kết nối thất bại!", "error");
        }
    };

    if (loading) return <AdminLayout title="Lập Phiếu Thanh Lý"><div className="p-8 text-center text-slate-400">Đang tải dữ liệu...</div></AdminLayout>;

    return (
        <AdminLayout title="Lập Phiếu Thanh Lý">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Cột trái: Thông tin chung */}
                <div className="lg:col-span-4 space-y-5 bg-white rounded-2xl ring-1 ring-slate-200 p-5">
                    <h4 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                        <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">1</span>
                        Thông tin chung
                    </h4>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lý do thanh lý</label>
                        <input type="text" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="Cá chết, hao hụt lúc nhập, sự cố..." value={headerForm.lydothanhly} onChange={e => setHeaderForm({ ...headerForm, lydothanhly: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trạng thái xử lý</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" value={headerForm.trangthai} onChange={e => setHeaderForm({ ...headerForm, trangthai: e.target.value })}>
                            <option value="DA_TIEU_HUY">Đã tiêu hủy</option>
                            <option value="DA_BAN_THANH_LY">Đã bán thanh lý</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ghi chú</label>
                        <textarea className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none" placeholder="Ghi chú thêm..." value={headerForm.ghichu} onChange={e => setHeaderForm({ ...headerForm, ghichu: e.target.value })} />
                    </div>
                </div>

                {/* Cột phải: Chọn lô và thêm chi tiết */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">2</span>
                            Chi Tiết Lô Thanh Lý
                        </h4>
                        <div className="text-sm font-bold text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-100">
                            Tổng: <span className="text-lg ml-1">{calculateTotalQuantity()}</span> kg
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                        <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-4">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Loại cá</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={idloaica} onChange={e => handleSelectFish(e.target.value)}>
                                    <option value="">-- Chọn Loại Cá --</option>
                                    {fishTypes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                                </select>
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Size</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={idsizeca} onChange={e => handleSelectSize(e.target.value)} disabled={!idloaica}>
                                    <option value="">{!idloaica ? "Chọn cá trước" : "Chọn Size"}</option>
                                    {availableSizes.map(s => <option key={s.id} value={s.id}>{s.sizeca}</option>)}
                                </select>
                            </div>
                            <div className="col-span-5">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Lô hàng</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={currentDetail.idchitietphieunhap} onChange={e => setCurrentDetail({ ...currentDetail, idchitietphieunhap: e.target.value })} disabled={!productId}>
                                    <option value="">{!productId ? "Chọn sản phẩm trước" : (lots.length > 0 ? "Chọn lô" : "Không có lô còn hàng")}</option>
                                    {lots.map(l => (
                                        <option key={l.idchitietphieunhap} value={l.idchitietphieunhap}>
                                            Nhập ngày {l.ngaynhap} — còn {l.soluongconlai}kg
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-4">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">SL Thanh Lý (kg)</label>
                                <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={currentDetail.soluongthanhly} onChange={e => setCurrentDetail({ ...currentDetail, soluongthanhly: e.target.value })} />
                            </div>
                            <div className="col-span-4">
                                <label className="text-xs font-bold text-slate-500 block mb-1.5">Đơn giá (0 nếu tiêu hủy)</label>
                                <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={currentDetail.dongia} onChange={e => setCurrentDetail({ ...currentDetail, dongia: e.target.value })} />
                            </div>
                            <div className="col-span-4">
                                <button onClick={handleAddDetail} className="w-full p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex justify-center items-center gap-1.5 cursor-pointer text-sm font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Thêm dòng
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase shadow-xs">
                                <tr>
                                    <th className="p-3">Sản phẩm</th>
                                    <th className="p-3">Lô (ngày nhập)</th>
                                    <th className="p-3 text-right">SL (kg)</th>
                                    <th className="p-3 text-right">Đơn giá</th>
                                    <th className="p-3 text-right">Thành tiền</th>
                                    <th className="p-3 text-center">Xóa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {addedDetails.map(item => (
                                    <tr key={item.idTemp} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-bold text-slate-700">{item.tenLoaiCa} ({item.tenSize})</td>
                                        <td className="p-3 text-slate-500">{item.ngaynhap}</td>
                                        <td className="p-3 text-right font-medium">{item.soluongthanhly}</td>
                                        <td className="p-3 text-right text-slate-500">{Number(item.dongia).toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold text-slate-800">{(item.soluongthanhly * item.dongia).toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handleRemoveDetail(item.idTemp)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-md mx-auto flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.74 0-.34-6M4.5 6.75h15m-1.5 0a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {addedDetails.length === 0 && <tr><td colSpan="6" className="p-12 text-center text-slate-400 italic">Chưa có chi tiết lô hàng nào được thêm.</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-slate-500 font-medium text-sm">
                            Tổng tiền thanh lý: <span className="text-xl font-bold text-slate-800 ml-1">{calculateTotalMoney().toLocaleString()} VNĐ</span>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button onClick={() => navigate("/admin/QuanLyThanhLy")} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">Hủy</button>
                            <button onClick={handleSubmit} disabled={addedDetails.length === 0} className={`px-6 py-3 font-bold rounded-xl shadow-md text-sm ${addedDetails.length > 0 ? "bg-cyan-600 text-white hover:bg-cyan-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                Hoàn tất lập phiếu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
