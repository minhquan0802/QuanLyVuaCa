import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

const taoDongSizeMoi = () => ({
    rowKey: `new-${Date.now()}-${Math.random()}`,
    idsizeca: null,
    tensizemoi: "",
    tenSize: "",
    sokgtuongung: "",
    giabanle: "",
    giabansi: "",
    isNew: true,
});

export default function MoLaiLoaiCa() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [category, setCategory] = useState(location.state?.category || null);
    const [sizeRows, setSizeRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setLoadError("");
                const [categoryResponse, detailResponse] = await Promise.all([
                    api.get(`/Loaicas/${id}`),
                    api.get(`/Chitietcabans/loai-ca/${id}`),
                ]);

                const loadedCategory = categoryResponse.data.result;
                if (!loadedCategory?.deleted) {
                    setLoadError("Loại cá này đang được mở bán, không cần thực hiện mở lại.");
                    return;
                }

                const existingRows = (detailResponse.data.result || [])
                    .sort((a, b) => (a.tenSize || "").localeCompare(b.tenSize || "", "vi"))
                    .map(detail => ({
                        rowKey: `existing-${detail.id}`,
                        idsizeca: detail.idSizeCa,
                        tensizemoi: null,
                        tenSize: detail.tenSize,
                        sokgtuongung: detail.sokgtuongung ?? "",
                        giabanle: "",
                        giabansi: "",
                        isNew: false,
                    }));

                setCategory(loadedCategory);
                setSizeRows(existingRows.length > 0 ? existingRows : [taoDongSizeMoi()]);
            } catch (error) {
                const requestUrl = error.config?.url || "";
                const status = error.response?.status;
                if (status === 404 && requestUrl.includes("/Chitietcabans/loai-ca/")) {
                    setLoadError(
                        "Backend chưa nhận API tải kích cỡ mới. Vui lòng khởi động lại backend rồi tải lại trang."
                    );
                } else {
                    setLoadError(
                        error.response?.data?.message
                        || "Không thể tải thông tin loại cá và kích cỡ."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const updateRow = (rowKey, field, value) => {
        setSizeRows(previous => previous.map(row =>
            row.rowKey === rowKey ? { ...row, [field]: value } : row
        ));
    };

    const removeRow = (rowKey) => {
        setSizeRows(previous => previous.filter(row => row.rowKey !== rowKey));
    };

    const addNewSizeRow = () => {
        setSizeRows(previous => [...previous, taoDongSizeMoi()]);
    };

    const taoPayload = () => {
        if (sizeRows.length === 0) {
            showToast("Phải giữ lại hoặc thêm ít nhất một kích cỡ để mở bán!", "error");
            return null;
        }

        const normalizedNames = new Set();
        const configurations = [];

        for (const row of sizeRows) {
            const sizeName = (
                row.isNew ? row.tensizemoi : row.tenSize || ""
            ).trim();
            const normalizedName = sizeName.replace(/\s+/g, "").toLocaleLowerCase("vi");
            const kg = Number(row.sokgtuongung);
            const retailPrice = Number(row.giabanle);
            const wholesalePrice = Number(row.giabansi);

            if (!sizeName) {
                showToast("Vui lòng nhập tên cho kích cỡ mới!", "error");
                return null;
            }
            if (normalizedNames.has(normalizedName)) {
                showToast(`Kích cỡ “${sizeName}” đang bị khai báo trùng!`, "error");
                return null;
            }
            normalizedNames.add(normalizedName);

            if (!Number.isFinite(kg) || kg <= 0) {
                showToast(`Số kg quy đổi của size ${sizeName} phải lớn hơn 0!`, "error");
                return null;
            }
            if (!Number.isFinite(retailPrice) || retailPrice <= 1000) {
                showToast(`Giá bán lẻ của size ${sizeName} phải lớn hơn 1.000 VNĐ!`, "error");
                return null;
            }
            if (!Number.isFinite(wholesalePrice) || wholesalePrice <= 1000) {
                showToast(`Giá bán sỉ của size ${sizeName} phải lớn hơn 1.000 VNĐ!`, "error");
                return null;
            }
            if (wholesalePrice > retailPrice) {
                showToast(`Giá bán sỉ của size ${sizeName} không được vượt giá bán lẻ!`, "error");
                return null;
            }

            configurations.push({
                idsizeca: row.isNew ? null : Number(row.idsizeca),
                tensizemoi: row.isNew ? sizeName : null,
                sokgtuongung: kg,
                giabanle: retailPrice,
                giabansi: wholesalePrice,
            });
        }

        return { cauhinhkichthuoc: configurations };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const payload = taoPayload();
        if (!payload) return;

        const accepted = await confirm({
            title: "Mở lại loại cá",
            message: `Mở bán lại “${category?.tenloaica || "loại cá này"}” với ${sizeRows.length} kích cỡ đang hiển thị?`,
            confirmText: "Mở bán lại",
            variant: "primary",
        });
        if (!accepted) return;

        try {
            setSubmitting(true);
            await api.patch(`/Loaicas/${id}/khoi-phuc`, payload);
            showToast("Đã mở lại loại cá và thiết lập bảng giá mới!", "success");
            navigate("/admin/QuanLyLoaiCa");
        } catch (error) {
            showToast(
                error.response?.data?.message
                || "Không thể mở lại loại cá và thiết lập bảng giá!",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout title="Mở Lại Loại Cá">
            <div className="mx-auto max-w-5xl">
                <div className="mb-5">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/QuanLyLoaiCa")}
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-cyan-700"
                    >
                        <span aria-hidden="true">←</span>
                        Quay lại danh sách loại cá
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="overflow-hidden rounded-2xl border border-black bg-white"
                >
                    <div className="border-b border-black bg-cyan-600 px-6 py-4">
                        <h2 className="text-lg font-bold text-white">
                            Mở lại {category ? `“${category.tenloaica}”` : "loại cá"}
                        </h2>
                        <p className="mt-1 text-xs text-cyan-50">
                            Xóa những kích cỡ chưa muốn bán, thêm kích cỡ mới và nhập bảng giá cho các dòng còn lại.
                        </p>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-sm text-slate-400">
                            Đang tải thông tin...
                        </div>
                    ) : loadError ? (
                        <div className="p-6">
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                                {loadError}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 p-5">
                            {sizeRows.length === 0 && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
                                    Chưa có kích cỡ nào được chọn. Hãy thêm ít nhất một kích cỡ mới.
                                </div>
                            )}

                            {sizeRows.map(row => (
                                <div
                                    key={row.rowKey}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.2fr_0.8fr_1fr_1fr_auto]"
                                >
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                            Kích cỡ
                                        </span>
                                        {row.isNew ? (
                                            <input
                                                type="text"
                                                required
                                                maxLength={20}
                                                placeholder="Ví dụ: 2 - 3kg"
                                                value={row.tensizemoi}
                                                onChange={event => updateRow(
                                                    row.rowKey,
                                                    "tensizemoi",
                                                    event.target.value
                                                )}
                                                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                            />
                                        ) : (
                                            <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-700">
                                                Size {row.tenSize}
                                            </div>
                                        )}
                                    </label>

                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                            Kg quy đổi
                                        </span>
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            value={row.sokgtuongung}
                                            onChange={event => updateRow(
                                                row.rowKey,
                                                "sokgtuongung",
                                                event.target.value
                                            )}
                                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-right text-sm font-bold outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                        />
                                    </label>

                                    <PriceInput
                                        label="Giá bán lẻ"
                                        value={row.giabanle}
                                        onChange={value => updateRow(row.rowKey, "giabanle", value)}
                                    />

                                    <PriceInput
                                        label="Giá bán sỉ"
                                        value={row.giabansi}
                                        onChange={value => updateRow(row.rowKey, "giabansi", value)}
                                    />

                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(row.rowKey)}
                                            className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 lg:w-auto"
                                            title="Không mở bán kích cỡ này"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addNewSizeRow}
                                className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-800 transition-colors hover:bg-cyan-100"
                            >
                                <span className="text-lg leading-none">+</span>
                                Thêm kích cỡ mới
                            </button>

                            <div className="rounded-xl border border-black bg-cyan-50 p-3 text-sm leading-6 text-cyan-800">
                                Chỉ các kích cỡ còn trên danh sách mới được mở bán. Giá phải lớn hơn 1.000 VNĐ và giá sỉ không được lớn hơn giá lẻ.
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-black bg-cyan-600 p-4">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => navigate("/admin/QuanLyLoaiCa")}
                            className="rounded-xl border border-red-700 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || Boolean(loadError) || submitting}
                            className="rounded-xl border border-black bg-white px-6 py-2.5 text-sm font-bold text-cyan-800 shadow-sm transition-all hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                            {submitting ? "Đang xử lý..." : "Xác nhận mở lại"}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

function PriceInput({ label, value, onChange }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
            <div className="relative">
                <input
                    type="number"
                    required
                    min="1001"
                    step="1"
                    placeholder="Nhập giá"
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 pr-16 text-right text-sm font-bold tabular-nums text-slate-700 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ
                </span>
            </div>
        </label>
    );
}
