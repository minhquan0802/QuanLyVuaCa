import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyKho() {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'tenLoaiCa', direction: 'asc' });
    const { showToast } = useToast();

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [resInventory, resPrices] = await Promise.all([
                api.get("/Chitietcabans"),
                api.get("/Banggias")
            ]);
            setInventory(resInventory.data.result || []);
            const allPrices = resPrices.data.result || [];
            setPriceList(allPrices.filter(p => p.trangThai === "Đang áp dụng" || !p.ngayKetThuc));
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải dữ liệu kho hàng!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

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
        if (key === 'soluongton') { valA = Number(valA || 0); valB = Number(valB || 0); }
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

    const findCurrentPrice = (fishId, sizeId) => {
        const invItem = inventory.find(i => i.idLoaiCa == fishId && i.idSizeCa == sizeId);
        if (!invItem) return null;
        return priceList.find(p => {
            const pIdKho = p.idChitietcaban || (p.chitietcaban && p.chitietcaban.id);
            return Number(pIdKho) === Number(invItem.id);
        });
    };

    const handleImportFromRow = (item) => {
        const currentPriceObj = findCurrentPrice(item.idLoaiCa, item.idSizeCa);
        const autoLe = currentPriceObj ? (currentPriceObj.giaBanLe || currentPriceObj.giabanle) : 0;
        const autoSi = currentPriceObj ? (currentPriceObj.giaBanSi || currentPriceObj.giabansi) : 0;
        navigate('/admin/QuanLyKho/nhap-hang', {
            state: {
                initialLoaicaId: item.idLoaiCa,
                initialSizeId: item.idSizeCa,
                initialSizeName: item.tenSize,
                initialAutoLe: autoLe,
                initialAutoSi: autoSi
            }
        });
    };

    return (
        <AdminLayout title="Quản Lý Kho Hàng">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="text-slate-500 text-sm">
                    Theo dõi tồn kho, nhập hàng và cập nhật giá tự động.
                </div>
                <button
                    onClick={() => navigate("/admin/QuanLyKho/nhap-hang")}
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

        </AdminLayout>
    );
}
