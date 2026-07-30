import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

export default function MoLaiLoaiCa() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [category, setCategory] = useState(location.state?.category || null);
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [hasNoPriceHistory, setHasNoPriceHistory] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setLoadError("");
                setHasNoPriceHistory(false);
                const [categoryResponse, historyResponse] = await Promise.all([
                    api.get(`/Loaicas/${id}`),
                    api.get("/Banggias/history"),
                ]);

                const loadedCategory = categoryResponse.data.result;
                const latestPriceByProduct = new Map();

                (historyResponse.data.result || [])
                    .filter(price => Number(price.idLoaiCa) === Number(id))
                    .forEach(price => {
                        const current = latestPriceByProduct.get(price.idChitietcaban);
                        if (!current || Number(price.id) > Number(current.id)) {
                            latestPriceByProduct.set(price.idChitietcaban, price);
                        }
                    });

                const productPrices = [...latestPriceByProduct.values()]
                    .sort((a, b) => (a.tenSize || "").localeCompare(b.tenSize || "", "vi"))
                    .map(price => ({
                        idChitietcaban: price.idChitietcaban,
                        tenSize: price.tenSize,
                        giabanle: "",
                        giabansi: "",
                    }));

                setCategory(loadedCategory);
                setPrices(productPrices);
                if (!loadedCategory?.deleted) {
                    setLoadError("Loại cá này đang được mở bán, không cần thực hiện mở lại.");
                } else if (productPrices.length === 0) {
                    setHasNoPriceHistory(true);
                }
            } catch (error) {
                setLoadError(error.response?.data?.message || "Không thể tải thông tin loại cá và bảng giá.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const updatePrice = (idChitietcaban, field, value) => {
        setPrices(previous => previous.map(price =>
            price.idChitietcaban === idChitietcaban
                ? { ...price, [field]: value }
                : price
        ));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (hasNoPriceHistory) {
            const accepted = await confirm({
                title: "Mở lại loại cá",
                message: `Mở bán lại “${category?.tenloaica || "loại cá này"}”? Loại cá này chưa từng có bảng giá — hãy vào "Thiết lập giá mới" để thêm giá trước khi khách có thể đặt hàng.`,
                confirmText: "Mở bán lại",
                variant: "primary",
            });
            if (!accepted) return;

            try {
                setSubmitting(true);
                await api.patch(`/Loaicas/${id}/khoi-phuc`);
                showToast("Đã mở lại loại cá! Đừng quên thiết lập giá bán trước khi khách đặt hàng.", "success");
                navigate("/admin/QuanLyLoaiCa");
            } catch (error) {
                showToast(error.response?.data?.message || "Không thể mở lại loại cá!", "error");
            } finally {
                setSubmitting(false);
            }
            return;
        }

        const invalidPrice = prices.find(price => {
            const retailPrice = Number(price.giabanle);
            const wholesalePrice = Number(price.giabansi);
            return !Number.isFinite(retailPrice)
                || !Number.isFinite(wholesalePrice)
                || retailPrice <= 1000
                || wholesalePrice <= 1000
                || wholesalePrice > retailPrice;
        });

        if (invalidPrice) {
            showToast(
                `Giá của size ${invalidPrice.tenSize}: giá phải lớn hơn 1.000 VNĐ và giá sỉ không được vượt giá lẻ!`,
                "error"
            );
            return;
        }

        const accepted = await confirm({
            title: "Mở lại loại cá",
            message: `Mở bán lại “${category?.tenloaica || "loại cá này"}” và áp dụng bảng giá vừa nhập?`,
            confirmText: "Mở bán lại",
            variant: "primary",
        });
        if (!accepted) return;

        let restored = false;
        try {
            setSubmitting(true);
            await api.patch(`/Loaicas/${id}/khoi-phuc`);
            restored = true;

            for (const price of prices) {
                await api.post("/Banggias", {
                    idchitietcaban: price.idChitietcaban,
                    giabanle: Number(price.giabanle),
                    giabansi: Number(price.giabansi),
                });
            }

            showToast("Đã mở lại loại cá và thiết lập bảng giá mới!", "success");
            navigate("/admin/QuanLyLoaiCa");
        } catch (error) {
            if (restored) {
                try {
                    await api.delete(`/Loaicas/${id}`);
                } catch {
                    showToast("Không thể hoàn tác trạng thái loại cá. Vui lòng kiểm tra lại!", "error");
                }
            }
            showToast(error.response?.data?.message || "Không thể mở lại và thiết lập bảng giá!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout title="Mở Lại Loại Cá">
            <div className="mx-auto max-w-3xl">
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

                <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-black bg-white">
                    <div className="border-b border-black bg-cyan-600 px-6 py-4">
                        <h2 className="text-lg font-bold text-white">
                            Mở lại {category ? `“${category.tenloaica}”` : "loại cá"}
                        </h2>
                        <p className="mt-1 text-xs text-cyan-50">
                            Thiết lập bảng giá mới cho từng kích cỡ. Loại cá chỉ được mở bán sau khi tất cả giá được lưu thành công.
                        </p>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-sm text-slate-400">Đang tải thông tin...</div>
                    ) : loadError ? (
                        <div className="p-6">
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                                {loadError}
                            </div>
                        </div>
                    ) : hasNoPriceHistory ? (
                        <div className="p-6">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
                                Loại cá này chưa từng được thiết lập giá bán. Bạn có thể mở bán lại ngay, sau đó vào trang "Thiết lập giá mới" để thêm giá cho từng kích cỡ.
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 p-5">
                            {prices.map(price => (
                                <div
                                    key={price.idChitietcaban}
                                    className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(100px,0.7fr)_1fr_1fr]"
                                >
                                    <div className="flex items-center">
                                        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                                            Size {price.tenSize}
                                        </span>
                                    </div>

                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-bold text-slate-600">Giá bán lẻ</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="1001"
                                                step="1"
                                                placeholder="Nhập giá bán lẻ"
                                                value={price.giabanle}
                                                onChange={event => updatePrice(
                                                    price.idChitietcaban,
                                                    "giabanle",
                                                    event.target.value
                                                )}
                                                className="w-full rounded-xl border border-slate-200 bg-white p-2 pr-10 text-right text-sm font-bold tabular-nums text-slate-700 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">VNĐ</span>
                                        </div>
                                    </label>

                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-bold text-slate-600">Giá bán sỉ</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min="1001"
                                                step="1"
                                                placeholder="Nhập giá bán sỉ"
                                                value={price.giabansi}
                                                onChange={event => updatePrice(
                                                    price.idChitietcaban,
                                                    "giabansi",
                                                    event.target.value
                                                )}
                                                className="w-full rounded-xl border border-slate-200 bg-white p-2 pr-10 text-right text-sm font-bold tabular-nums text-slate-700 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">VNĐ</span>
                                        </div>
                                    </label>
                                </div>
                            ))}

                            <div className="rounded-xl border border-black bg-cyan-50 p-3 text-sm leading-6 text-cyan-800">
                                Giá bán lẻ và giá bán sỉ phải lớn hơn 1.000 VNĐ. Giá bán sỉ không được lớn hơn giá bán lẻ.
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
                            {submitting ? "Đang xử lý..." : hasNoPriceHistory ? "Mở lại (chưa có giá)" : "Xác nhận mở lại"}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
