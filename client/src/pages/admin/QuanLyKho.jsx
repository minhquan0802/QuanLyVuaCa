import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ColumnFilter from "../../components/admin/ColumnFilter";
import Pagination from "../../components/Pagination";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + " VNĐ";

const THANHTOAN_STATUS = {
    "CHUA_THANH_TOAN": { label: "Chưa thanh toán", badge: "bg-orange-50 text-orange-700 border-orange-200" },
    "DA_THANH_TOAN":   { label: "Đã thanh toán",   badge: "bg-green-50 text-green-700 border-green-200"  },
};

const INVENTORY_STATUS = {
    "CON_HAN": { label: "Còn hạn", badge: "bg-green-50 text-green-700 border-green-200" },
    "CO_HANG_QUA_HAN": { label: "Có hàng quá hạn", badge: "bg-orange-50 text-orange-700 border-orange-200" },
    "TOAN_BO_QUA_HAN": { label: "Toàn bộ đã quá hạn", badge: "bg-red-50 text-red-700 border-red-200" },
    "HET_HANG": { label: "Hết hàng", badge: "bg-slate-50 text-slate-500 border-slate-200" },
    "CAN_DOI_SOAT": { label: "Cần đối soát", badge: "bg-amber-50 text-amber-700 border-amber-200" },
};

const formatKg = (value) =>
    `${Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} kg`;

export default function QuanLyKho() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.vaitro === "ADMIN";
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [tab, setTab] = useState("kho"); // "kho" | "nhap"
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // --- STATE KHO HÀNG ---
    const [inventory, setInventory] = useState([]);
    const [currentLots, setCurrentLots] = useState([]);
    const [overdueLots, setOverdueLots] = useState([]);
    const [loadingKho, setLoadingKho] = useState(true);
    const [selectedInventoryFishTypeIds, setSelectedInventoryFishTypeIds] = useState([]);
    const [selectedInventorySizes, setSelectedInventorySizes] = useState([]);
    const [selectedInventoryStatuses, setSelectedInventoryStatuses] = useState([]);

    // --- STATE PHIẾU NHẬP ---
    const [phieus, setPhieus] = useState([]);
    const [loadingNhap, setLoadingNhap] = useState(true);
    const [selectedImportDates, setSelectedImportDates] = useState([]);
    const [selectedImportFishNames, setSelectedImportFishNames] = useState([]);
    const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // --- GỌI API ---
    useEffect(() => {
        Promise.all([
            api.get("/Chitietcabans"),
            api.get("/Phieuthanhlys/tat-ca-lo-con-hang"),
            api.get("/Phieuthanhlys/lo-qua-han"),
        ])
            .then(([inventoryResponse, allLotsResponse, overdueLotsResponse]) => {
                const allLots = allLotsResponse.data.result || [];
                const overdue = overdueLotsResponse.data.result || [];
                const overdueIds = new Set(overdue.map(lot => lot.idchitietphieunhap));

                setInventory(inventoryResponse.data.result || []);
                setCurrentLots(allLots.filter(lot => !overdueIds.has(lot.idchitietphieunhap)));
                setOverdueLots(overdue);
            })
            .catch(() => showToast("Không thể tải dữ liệu kho!", "error"))
            .finally(() => setLoadingKho(false));
    }, []);

    const fetchPhieus = () => {
        setLoadingNhap(true);
        api.get("/Phieunhaps")
            .then(res => setPhieus(res.data.result || []))
            .catch(() => showToast("Không thể tải lịch sử phiếu nhập!", "error"))
            .finally(() => setLoadingNhap(false));
    };

    useEffect(() => { fetchPhieus(); }, []);

    // Reset trang khi đổi tab
    useEffect(() => { setCurrentPage(1); }, [tab]);

    // --- XỬ LÝ KHO HÀNG ---
    const currentKgByProduct = useMemo(() =>
        currentLots.reduce((result, lot) => {
            const productId = Number(lot.idchitietcaban);
            result.set(productId, (result.get(productId) || 0) + Number(lot.soluongconlai || 0));
            return result;
        }, new Map()), [currentLots]);

    const overdueKgByProduct = useMemo(() =>
        overdueLots.reduce((result, lot) => {
            const productId = Number(lot.idchitietcaban);
            result.set(productId, (result.get(productId) || 0) + Number(lot.soluongconlai || 0));
            return result;
        }, new Map()), [overdueLots]);

    const inventoryWithExpiry = useMemo(() =>
        inventory.map(item => {
            const productId = Number(item.id);
            const tongTon = Number(item.soluongton || 0);
            const conHan = currentKgByProduct.get(productId) || 0;
            const quaHan = overdueKgByProduct.get(productId) || 0;

            let tinhTrang = "CAN_DOI_SOAT";
            if (tongTon <= 0) {
                tinhTrang = "HET_HANG";
            } else if (conHan > 0 && quaHan <= 0) {
                tinhTrang = "CON_HAN";
            } else if (conHan > 0 && quaHan > 0) {
                tinhTrang = "CO_HANG_QUA_HAN";
            } else if (conHan <= 0 && quaHan > 0) {
                tinhTrang = "TOAN_BO_QUA_HAN";
            }

            return {
                ...item,
                soluongConHan: conHan,
                soluongQuaHan: quaHan,
                tinhTrang,
            };
        }), [inventory, currentKgByProduct, overdueKgByProduct]);

    const processedInventory = useMemo(() => {
        let filtered = inventoryWithExpiry;
        if (selectedInventoryFishTypeIds.length > 0) {
            filtered = filtered.filter(item => selectedInventoryFishTypeIds.includes(item.idLoaiCa));
        }
        if (selectedInventorySizes.length > 0) {
            filtered = filtered.filter(item => selectedInventorySizes.includes(item.tenSize));
        }
        if (selectedInventoryStatuses.length > 0) {
            filtered = filtered.filter(item => selectedInventoryStatuses.includes(item.tinhTrang));
        }
        return filtered;
    }, [inventoryWithExpiry, selectedInventoryFishTypeIds, selectedInventorySizes, selectedInventoryStatuses]);

    // --- XỬ LÝ PHIẾU NHẬP ---
    const processedPhieus = useMemo(() => {
        let filtered = phieus;
        if (selectedImportDates.length > 0) {
            filtered = filtered.filter(p => selectedImportDates.includes(p.ngaynhap));
        }
        if (selectedImportFishNames.length > 0) {
            filtered = filtered.filter(p => selectedImportFishNames.includes(p.tenLoaiCa));
        }
        if (selectedPaymentStatuses.length > 0) {
            filtered = filtered.filter(p => selectedPaymentStatuses.includes(p.trangthaithanhtoan));
        }
        return filtered;
    }, [phieus, selectedImportDates, selectedImportFishNames, selectedPaymentStatuses]);

    const inventoryFishOptions = useMemo(() => {
        const uniqueFishTypes = new Map();
        inventory.forEach(item => {
            if (item.idLoaiCa != null) uniqueFishTypes.set(item.idLoaiCa, item.tenLoaiCa);
        });
        return [...uniqueFishTypes.entries()]
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => (a.label || "").localeCompare(b.label || "", "vi"));
    }, [inventory]);

    const inventorySizeOptions = useMemo(() =>
        [...new Set(inventory.map(item => item.tenSize).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "vi"))
            .map(value => ({ value, label: value })), [inventory]);

    const inventoryStatusOptions = useMemo(() =>
        [...new Set(inventoryWithExpiry.map(item => item.tinhTrang))]
            .map(value => ({ value, label: INVENTORY_STATUS[value]?.label || value })), [inventoryWithExpiry]);

    const importDateOptions = useMemo(() =>
        [...new Set(phieus.map(p => p.ngaynhap).filter(Boolean))]
            .map(value => ({
                value,
                label: new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN")
            })), [phieus]);

    const importFishOptions = useMemo(() =>
        [...new Set(phieus.map(p => p.tenLoaiCa).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "vi"))
            .map(value => ({ value, label: value })), [phieus]);

    const paymentStatusOptions = useMemo(() =>
        Object.entries(THANHTOAN_STATUS).map(([value, config]) => ({
            value,
            label: config.label
        })), []);

    // --- PHÂN TRANG CHUNG ---
    const currentData = tab === "kho" ? processedInventory : processedPhieus;
    const totalPages = Math.ceil(currentData.length / pageSize);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return currentData.slice(start, start + pageSize);
    }, [currentData, currentPage]);

    const updateFilter = (setter, values) => {
        setter(values);
        setCurrentPage(1);
    };

    const handleImport = (item) => {
        navigate("/admin/QuanLyKho/nhap-hang", {
            state: {
                id: item.id,
                initialLoaicaId: item.idLoaiCa,
                initialSizeId: item.idSizeCa,
                initialSizeName: item.tenSize,
            },
        });
    };

    const handleMarkPaid = async (id) => {
        const accepted = await confirm({
            title: "Xác nhận thanh toán phiếu nhập",
            message: "Ghi nhận phiếu nhập này đã được thanh toán? Trạng thái thanh toán phiếu nhập sẽ được cập nhật.",
            confirmText: "Đã thanh toán",
            variant: "primary",
        });
        if (!accepted) return;
        setSubmitting(true);
        try {
            await api.patch(`/Phieunhaps/${id}/thanh-toan`);
            showToast("Đã cập nhật trạng thái thanh toán!", "success");
            fetchPhieus();
        } catch {
            showToast("Có lỗi xảy ra, vui lòng thử lại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout title="Quản Lý Kho Hàng">
            {/* TABS */}
            <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-5">
                <button
                    onClick={() => setTab("kho")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "kho" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Kho hàng tồn
                </button>
                <button
                    onClick={() => setTab("nhap")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "nhap" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Lịch sử nhập hàng
                </button>
            </div>

            {/* BẢNG */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {tab === "kho" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1050px]">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Tên loại cá</span>
                                            <ColumnFilter
                                                label="Tên loại cá"
                                                options={inventoryFishOptions}
                                                selectedValues={selectedInventoryFishTypeIds}
                                                onChange={values => updateFilter(setSelectedInventoryFishTypeIds, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Kích thước</span>
                                            <ColumnFilter
                                                label="Kích thước"
                                                options={inventorySizeOptions}
                                                selectedValues={selectedInventorySizes}
                                                onChange={values => updateFilter(setSelectedInventorySizes, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4 text-right">Tổng</th>
                                    <th className="p-4 text-right">Còn hạn</th>
                                    <th className="p-4 text-right">Quá hạn</th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Tình trạng</span>
                                            <ColumnFilter
                                                label="Tình trạng"
                                                options={inventoryStatusOptions}
                                                selectedValues={selectedInventoryStatuses}
                                                onChange={values => updateFilter(setSelectedInventoryStatuses, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4 text-center w-40">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {loadingKho ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map(item => {
                                        const status = INVENTORY_STATUS[item.tinhTrang] || INVENTORY_STATUS.CAN_DOI_SOAT;
                                        const rowHighlight = item.tinhTrang === "TOAN_BO_QUA_HAN"
                                            ? "hover:bg-slate-50/50"
                                            : item.tinhTrang === "CO_HANG_QUA_HAN"
                                                ? "bg-orange-50/20 hover:bg-orange-50/40"
                                                : "hover:bg-slate-50/50";

                                        return (
                                            <tr key={item.id} className={`${rowHighlight} transition-colors`}>
                                                <td className="p-4 font-semibold text-slate-800">{item.tenLoaiCa}</td>
                                                <td className="p-4 text-slate-600">{item.tenSize}</td>
                                                <td className="p-4 text-right font-semibold tabular-nums text-slate-700">{formatKg(item.soluongton)}</td>
                                                <td className="p-4 text-right font-semibold tabular-nums text-green-700">{formatKg(item.soluongConHan)}</td>
                                                <td className={`p-4 text-right font-semibold tabular-nums ${item.soluongQuaHan > 0 ? "text-red-600" : "text-slate-400"}`}>
                                                    {formatKg(item.soluongQuaHan)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold border ${status.badge}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col items-stretch gap-2">
                                                        {isAdmin && item.soluongQuaHan > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate("/admin/QuanLyThanhLy?tab=quahan")}
                                                                className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 transition-colors text-xs cursor-pointer"
                                                            >
                                                                Xem lô quá hạn
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImport(item)}
                                                            className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer"
                                                        >
                                                            Nhập thêm
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Không tìm thấy dữ liệu.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1060px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4 w-8"></th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Ngày nhập</span>
                                            <ColumnFilter
                                                label="Ngày nhập"
                                                options={importDateOptions}
                                                selectedValues={selectedImportDates}
                                                onChange={values => updateFilter(setSelectedImportDates, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">Nhà cung cấp</th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Tên loại cá</span>
                                            <ColumnFilter
                                                label="Tên loại cá"
                                                options={importFishOptions}
                                                selectedValues={selectedImportFishNames}
                                                onChange={values => updateFilter(setSelectedImportFishNames, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">Người tạo</th>
                                    <th className="p-4 text-right">Tổng SL (kg)</th>
                                    <th className="p-4 text-right">Tổng tiền</th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Thanh toán</span>
                                            <ColumnFilter
                                                label="Thanh toán"
                                                options={paymentStatusOptions}
                                                selectedValues={selectedPaymentStatuses}
                                                onChange={values => updateFilter(setSelectedPaymentStatuses, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4 text-center w-40">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingNhap ? (
                                    <tr><td colSpan="9" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map(p => {
                                        const status = THANHTOAN_STATUS[p.trangthaithanhtoan] || { label: p.trangthaithanhtoan, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                        const isExpanded = expandedId === p.idphieunhap;
                                        const hasDetail = p.listChiTiet && p.listChiTiet.length > 0;
                                        return (
                                            <React.Fragment key={p.idphieunhap}>
                                                <tr className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 text-center">
                                                        {hasDetail && (
                                                            <button
                                                                onClick={() => setExpandedId(prev => prev === p.idphieunhap ? null : p.idphieunhap)}
                                                                className="text-slate-400 hover:text-slate-700 transition-colors"
                                                            >
                                                                {isExpanded ? "▾" : "▸"}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-slate-500">{p.ngaynhap}</td>
                                                    <td className="p-4 font-semibold text-slate-800">{p.tenNhaCungCap}</td>
                                                    <td className="p-4 font-semibold text-slate-800">{p.tenLoaiCa}</td>
                                                    <td className="p-4 text-slate-600">{p.tenNguoiTaoPhieu || "—"}</td>
                                                    <td className="p-4 text-right font-semibold tabular-nums text-slate-700">{Number(p.tongsoluong || 0).toLocaleString("vi-VN")}</td>
                                                    <td className="p-4 text-right font-bold tabular-nums text-cyan-700">{formatCurrency(p.tongtien)}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center justify-center ${status.badge}`}>
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {isAdmin && p.trangthaithanhtoan === "CHUA_THANH_TOAN" ? (
                                                            <button
                                                                onClick={() => handleMarkPaid(p.idphieunhap)}
                                                                disabled={submitting}
                                                                className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold hover:bg-cyan-100 disabled:opacity-50 transition-colors text-xs cursor-pointer"
                                                            >
                                                                {submitting ? "..." : "Thanh toán"}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {isExpanded && hasDetail && (
                                                    <tr className="bg-cyan-50/40">
                                                        <td colSpan="9" className="px-8 py-3">
                                                            <table className="w-full text-xs border-collapse">
                                                                <thead>
                                                                    <tr className="text-slate-500 uppercase font-bold border-b border-slate-200">
                                                                    <th className="py-1.5 text-left">Kích thước</th>
                                                                        <th className="py-1.5 text-right">Số lượng (kg)</th>
                                                                        <th className="py-1.5 text-right">Giá nhập/kg</th>
                                                                        <th className="py-1.5 text-right">Thành tiền</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {p.listChiTiet.map((ct, idx) => (
                                                                        <tr key={idx} className="text-slate-700">
                                                                            <td className="py-1.5 font-semibold">{ct.tenSize}</td>
                                                                            <td className="py-1.5 text-right font-semibold tabular-nums">{Number(ct.soluongnhap || 0).toLocaleString("vi-VN")}</td>
                                                                            <td className="py-1.5 text-right font-semibold tabular-nums">{formatCurrency(ct.gianhap)}</td>
                                                                            <td className="py-1.5 text-right font-bold tabular-nums text-cyan-700">{formatCurrency(ct.thanhtien)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="9" className="p-8 text-center text-slate-400 italic">Chưa có phiếu nhập nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PHÂN TRANG CHUNG */}
                {currentData.length > pageSize && (
                    <div className="p-4 border-t border-slate-200 flex items-center gap-2 bg-slate-50/50">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
