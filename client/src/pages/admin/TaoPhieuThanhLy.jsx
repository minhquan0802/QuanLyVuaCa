import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const formatKg = (value) =>
    Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 });

const formatCurrency = (value) =>
    value == null ? "Chưa có" : `${Number(value).toLocaleString("vi-VN")}đ`;

export default function TaoPhieuThanhLy() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [allLots, setAllLots] = useState([]);
    const [addedDetails, setAddedDetails] = useState([]);
    const [filterFishId, setFilterFishId] = useState("");
    const [filterSize, setFilterSize] = useState("");
    const [filterExpiry, setFilterExpiry] = useState("");
    const [commonPrice, setCommonPrice] = useState("");
    const [headerForm, setHeaderForm] = useState({
        lydothanhly: "",
        trangthai: "DA_TIEU_HUY",
        ghichu: "",
    });

    useEffect(() => {
        Promise.all([
            api.get("/Chitietcabans"),
            api.get("/Phieuthanhlys/tat-ca-lo-con-hang"),
            api.get("/Phieuthanhlys/lo-qua-han"),
        ])
            .then(([inventoryResponse, allLotsResponse, overdueLotsResponse]) => {
                const inventory = inventoryResponse.data.result || [];
                const lots = allLotsResponse.data.result || [];
                const overdueIds = new Set(
                    (overdueLotsResponse.data.result || []).map(lot => lot.idchitietphieunhap)
                );
                const productsById = new Map(inventory.map(item => [Number(item.id), item]));

                const enrichedLots = lots
                    .map(lot => {
                        const product = productsById.get(Number(lot.idchitietcaban));
                        return {
                            ...lot,
                            idLoaiCa: product?.idLoaiCa,
                            tenLoaiCa: product?.tenLoaiCa || lot.tenLoaiCa,
                            tenSize: product?.tenSize || lot.tenSize,
                            isOverdue: overdueIds.has(lot.idchitietphieunhap),
                        };
                    })
                    .sort((a, b) => {
                        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
                        return String(a.ngaynhap).localeCompare(String(b.ngaynhap));
                    });

                setAllLots(enrichedLots);

                const requestedIds = new Set(location.state?.selectedLotIds || []);
                if (requestedIds.size > 0) {
                    setAddedDetails(
                        enrichedLots
                            .filter(lot => requestedIds.has(lot.idchitietphieunhap))
                            .map(lot => ({
                                idchitietphieunhap: lot.idchitietphieunhap,
                                tenLoaiCa: lot.tenLoaiCa,
                                tenSize: lot.tenSize,
                                ngaynhap: lot.ngaynhap,
                                soluongconlai: Number(lot.soluongconlai || 0),
                                soluongthanhly: Number(lot.soluongconlai || 0),
                                dongia: 0,
                                isOverdue: lot.isOverdue,
                            }))
                    );
                }
            })
            .catch(() => showToast("Không thể tải danh sách lô hàng!", "error"))
            .finally(() => setLoading(false));
    }, []);

    const fishOptions = useMemo(() => {
        const uniqueFish = new Map();
        allLots.forEach(lot => {
            if (lot.idLoaiCa != null) uniqueFish.set(String(lot.idLoaiCa), lot.tenLoaiCa);
        });
        return [...uniqueFish.entries()]
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label, "vi"));
    }, [allLots]);

    const sizeOptions = useMemo(() =>
        [...new Set(
            allLots
                .filter(lot => !filterFishId || String(lot.idLoaiCa) === filterFishId)
                .map(lot => lot.tenSize)
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, "vi")), [allLots, filterFishId]);

    const filteredLots = useMemo(() =>
        allLots.filter(lot => {
            if (filterFishId && String(lot.idLoaiCa) !== filterFishId) return false;
            if (filterSize && lot.tenSize !== filterSize) return false;
            if (filterExpiry === "QUA_HAN" && !lot.isOverdue) return false;
            if (filterExpiry === "CON_HAN" && lot.isOverdue) return false;
            return true;
        }), [allLots, filterFishId, filterSize, filterExpiry]);

    const selectedIds = useMemo(
        () => new Set(addedDetails.map(detail => detail.idchitietphieunhap)),
        [addedDetails]
    );

    const allVisibleSelected = filteredLots.length > 0
        && filteredLots.every(lot => selectedIds.has(lot.idchitietphieunhap));

    const toDetail = (lot) => ({
        idchitietphieunhap: lot.idchitietphieunhap,
        tenLoaiCa: lot.tenLoaiCa,
        tenSize: lot.tenSize,
        ngaynhap: lot.ngaynhap,
        soluongconlai: Number(lot.soluongconlai || 0),
        soluongthanhly: Number(lot.soluongconlai || 0),
        dongia: 0,
        isOverdue: lot.isOverdue,
    });

    const toggleLot = (lot) => {
        setAddedDetails(previous =>
            previous.some(detail => detail.idchitietphieunhap === lot.idchitietphieunhap)
                ? previous.filter(detail => detail.idchitietphieunhap !== lot.idchitietphieunhap)
                : [...previous, toDetail(lot)]
        );
    };

    const toggleAllVisible = () => {
        const visibleIds = new Set(filteredLots.map(lot => lot.idchitietphieunhap));
        setAddedDetails(previous => {
            if (allVisibleSelected) {
                return previous.filter(detail => !visibleIds.has(detail.idchitietphieunhap));
            }

            const existingIds = new Set(previous.map(detail => detail.idchitietphieunhap));
            return [
                ...previous,
                ...filteredLots
                    .filter(lot => !existingIds.has(lot.idchitietphieunhap))
                    .map(toDetail),
            ];
        });
    };

    const updateDetail = (lotId, field, value) => {
        setAddedDetails(previous => previous.map(detail =>
            detail.idchitietphieunhap === lotId
                ? { ...detail, [field]: value }
                : detail
        ));
    };

    const handleStatusChange = (trangthai) => {
        setHeaderForm(previous => ({ ...previous, trangthai }));
        if (trangthai === "DA_TIEU_HUY") {
            setCommonPrice("");
            setAddedDetails(previous => previous.map(detail => ({ ...detail, dongia: 0 })));
        }
    };

    const applyCommonPrice = () => {
        const price = Number(commonPrice);
        if (addedDetails.length === 0) {
            showToast("Vui lòng chọn ít nhất một lô trước khi áp dụng đơn giá!", "error");
            return;
        }
        if (!Number.isFinite(price) || price <= 0) {
            showToast("Đơn giá chung phải lớn hơn 0!", "error");
            return;
        }
        setAddedDetails(previous => previous.map(detail => ({ ...detail, dongia: price })));
    };

    const totalQuantity = addedDetails.reduce(
        (sum, detail) => sum + Number(detail.soluongthanhly || 0),
        0
    );
    const totalMoney = addedDetails.reduce(
        (sum, detail) => sum + Number(detail.soluongthanhly || 0) * Number(detail.dongia || 0),
        0
    );

    const handleSubmit = async () => {
        if (!headerForm.lydothanhly.trim()) {
            showToast("Vui lòng nhập lý do thanh lý!", "error");
            return;
        }
        if (addedDetails.length === 0) {
            showToast("Vui lòng chọn ít nhất một lô hàng!", "error");
            return;
        }

        for (const detail of addedDetails) {
            const quantity = Number(detail.soluongthanhly);
            const price = Number(detail.dongia);
            if (!Number.isFinite(quantity) || quantity <= 0 || quantity > detail.soluongconlai) {
                showToast(
                    `Số lượng thanh lý của ${detail.tenLoaiCa} (${detail.tenSize}) phải lớn hơn 0 và không vượt quá ${formatKg(detail.soluongconlai)} kg!`,
                    "error"
                );
                return;
            }
            if (!Number.isFinite(price) || price < 0) {
                showToast("Đơn giá không được âm!", "error");
                return;
            }
            if (headerForm.trangthai === "DA_BAN_THANH_LY" && price <= 0) {
                showToast("Bán thanh lý yêu cầu đơn giá của mọi lô lớn hơn 0!", "error");
                return;
            }
            if (headerForm.trangthai === "DA_TIEU_HUY" && price !== 0) {
                showToast("Tiêu hủy yêu cầu đơn giá bằng 0!", "error");
                return;
            }
        }

        try {
            await api.post("/Phieuthanhlys", {
                ...headerForm,
                listChiTiet: addedDetails.map(detail => ({
                    idchitietphieunhap: detail.idchitietphieunhap,
                    soluongthanhly: Number(detail.soluongthanhly),
                    dongia: Number(detail.dongia),
                })),
            });
            showToast("Lập phiếu thanh lý thành công!", "success");
            navigate("/admin/QuanLyThanhLy?tab=phieu");
        } catch (error) {
            showToast(error.response?.data?.message || "Không thể lập phiếu thanh lý!", "error");
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Lập Phiếu Thanh Lý">
                <div className="p-8 text-center text-slate-400">Đang tải dữ liệu...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Lập Phiếu Thanh Lý">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-4 space-y-5 bg-white rounded-2xl border border-slate-200 p-5 h-fit">
                    <h4 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                        <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">1</span>
                        Thông tin chung
                    </h4>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                            Lý do thanh lý
                        </label>
                        <input
                            type="text"
                            value={headerForm.lydothanhly}
                            onChange={event => setHeaderForm({ ...headerForm, lydothanhly: event.target.value })}
                            placeholder="Cá chết, hao hụt, lô quá hạn..."
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                            Trạng thái xử lý
                        </label>
                        <select
                            value={headerForm.trangthai}
                            onChange={event => handleStatusChange(event.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-cyan-500"
                        >
                            <option value="DA_TIEU_HUY">Đã tiêu hủy</option>
                            <option value="DA_BAN_THANH_LY">Đã bán thanh lý</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                            Ghi chú
                        </label>
                        <textarea
                            value={headerForm.ghichu}
                            onChange={event => setHeaderForm({ ...headerForm, ghichu: event.target.value })}
                            placeholder="Ghi chú thêm..."
                            className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none focus:border-cyan-500"
                        />
                    </div>

                    {headerForm.trangthai === "DA_BAN_THANH_LY" && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                Đơn giá chung
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    step="1000"
                                    value={commonPrice}
                                    onChange={event => setCommonPrice(event.target.value)}
                                    placeholder="Nhập giá áp dụng"
                                    className="min-w-0 flex-1 p-2 border border-slate-200 rounded-lg bg-white text-sm text-right outline-none focus:border-cyan-500"
                                />
                                <button
                                    type="button"
                                    onClick={applyCommonPrice}
                                    className="shrink-0 px-3 py-2 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer"
                                >
                                    Áp dụng
                                </button>
                            </div>
                            <p className="mt-1.5 text-xs text-slate-400">
                                Áp dụng cho mọi lô đã chọn; vẫn có thể chỉnh riêng từng dòng.
                            </p>
                        </div>
                    )}

                    <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 space-y-1">
                        <p className="text-sm text-cyan-800">
                            Đã chọn: <strong>{addedDetails.length} lô</strong>
                        </p>
                        <p className="text-sm text-cyan-800">
                            Tổng thanh lý: <strong>{formatKg(totalQuantity)} kg</strong>
                        </p>
                        <p className="text-sm text-cyan-800">
                            Tổng tiền: <strong>{totalMoney.toLocaleString("vi-VN")}đ</strong>
                        </p>
                    </div>
                </div>

                <div className="xl:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">2</span>
                            Chọn các lô cần thanh lý
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tên loại cá</label>
                            <select
                                value={filterFishId}
                                onChange={event => {
                                    setFilterFishId(event.target.value);
                                    setFilterSize("");
                                }}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
                            >
                                <option value="">Tất cả loại cá</option>
                                {fishOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Kích thước</label>
                            <select
                                value={filterSize}
                                onChange={event => setFilterSize(event.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
                            >
                                <option value="">Tất cả kích thước</option>
                                {sizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Hạn lô</label>
                            <select
                                value={filterExpiry}
                                onChange={event => setFilterExpiry(event.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
                            >
                                <option value="">Tất cả</option>
                                <option value="QUA_HAN">Đã quá hạn</option>
                                <option value="CON_HAN">Còn hạn</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1120px] text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                                <tr>
                                    <th className="p-3 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={toggleAllVisible}
                                            aria-label="Chọn tất cả lô đang hiển thị"
                                            className="size-4 accent-cyan-600"
                                        />
                                    </th>
                                    <th className="p-3">Tên loại cá</th>
                                    <th className="p-3">Kích thước</th>
                                    <th className="p-3">Ngày nhập</th>
                                    <th className="p-3 text-right">Còn lại</th>
                                    <th className="p-3 text-center">Hạn lô</th>
                                    <th className="p-3">Giá tham khảo</th>
                                    <th className="p-3 text-right">SL thanh lý</th>
                                    <th className="p-3 text-right">Đơn giá</th>
                                    <th className="p-3 text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLots.map(lot => {
                                    const detail = addedDetails.find(
                                        item => item.idchitietphieunhap === lot.idchitietphieunhap
                                    );
                                    return (
                                        <tr
                                            key={lot.idchitietphieunhap}
                                            className={detail ? "bg-cyan-50/30" : "hover:bg-slate-50/50"}
                                        >
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(detail)}
                                                    onChange={() => toggleLot(lot)}
                                                    aria-label={`Chọn lô ${lot.tenLoaiCa} ${lot.tenSize}`}
                                                    className="size-4 accent-cyan-600"
                                                />
                                            </td>
                                            <td className="p-3 font-bold text-slate-800">{lot.tenLoaiCa}</td>
                                            <td className="p-3 text-slate-600">{lot.tenSize}</td>
                                            <td className="p-3 text-slate-500">{lot.ngaynhap}</td>
                                            <td className="p-3 text-right font-bold text-slate-700">
                                                {formatKg(lot.soluongconlai)} kg
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                    lot.isOverdue
                                                        ? "bg-red-50 text-red-600 border-red-200"
                                                        : "bg-green-50 text-green-700 border-green-200"
                                                }`}>
                                                    {lot.isOverdue ? "Đã quá hạn" : "Còn hạn"}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                                                <div>Nhập: <strong className="text-slate-700">{formatCurrency(lot.gianhap)}</strong></div>
                                                <div>Lẻ: <strong className="text-slate-700">{formatCurrency(lot.giabanleHienTai)}</strong></div>
                                                <div>Sỉ: <strong className="text-slate-700">{formatCurrency(lot.giabansiHienTai)}</strong></div>
                                            </td>
                                            <td className="p-3 text-right">
                                                {detail ? (
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        max={detail.soluongconlai}
                                                        value={detail.soluongthanhly}
                                                        onChange={event => updateDetail(
                                                            lot.idchitietphieunhap,
                                                            "soluongthanhly",
                                                            event.target.value
                                                        )}
                                                        className="w-24 p-2 border border-slate-200 rounded-lg text-right outline-none focus:border-cyan-500"
                                                    />
                                                ) : "—"}
                                            </td>
                                            <td className="p-3 text-right">
                                                {detail ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1000"
                                                        disabled={headerForm.trangthai === "DA_TIEU_HUY"}
                                                        value={detail.dongia}
                                                        onChange={event => updateDetail(
                                                            lot.idchitietphieunhap,
                                                            "dongia",
                                                            event.target.value
                                                        )}
                                                        className="w-28 p-2 border border-slate-200 rounded-lg text-right outline-none focus:border-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                                                    />
                                                ) : "—"}
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-800">
                                                {detail
                                                    ? `${(
                                                        Number(detail.soluongthanhly || 0)
                                                        * Number(detail.dongia || 0)
                                                    ).toLocaleString("vi-VN")}đ`
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredLots.length === 0 && (
                                    <tr>
                                        <td colSpan="10" className="p-10 text-center text-slate-400 italic">
                                            Không có lô hàng phù hợp với bộ lọc.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/QuanLyThanhLy")}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={addedDetails.length === 0}
                            className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-sm cursor-pointer"
                        >
                            Hoàn tất lập phiếu ({addedDetails.length} lô)
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
