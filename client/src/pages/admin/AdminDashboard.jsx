import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../config/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    DollarSign, CheckCircle2, ShoppingCart, Package, Wallet,
    AlertCircle, TableProperties, BarChart2, Table, Download, TrendingUp, TrendingDown
} from "lucide-react";

const ORDER_STATUS = {
    CHO_XAC_NHAN: { label: "Chờ xác nhận", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    DANG_DONG_HANG: { label: "Đang đóng hàng", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    DANG_VAN_CHUYEN: { label: "Đang vận chuyển", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    GIAO_HANG_THANH_CONG: { label: "Giao thành công", badge: "bg-green-50 text-green-700 border-green-200" },
    HUY: { label: "Đã hủy", badge: "bg-red-50 text-red-700 border-red-200" },
};

export default function SalesDashboard() {
    const { user } = useAuth() || {};
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState("TODAY");
    const [customFrom, setCustomFrom] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    });
    const [customTo, setCustomTo] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    });
    const [viewMode, setViewMode] = useState("TABLE"); // "TABLE" hoặc "CHART"
    const [exportingExcel, setExportingExcel] = useState(false);

    // --- CHỈ SỐ TÀI CHÍNH & BÁN HÀNG ---
    const [stats, setStats] = useState({
        tongDoanhThu: 0,
        chiPhiNhapHang: 0,
        chiPhiNhapDaThanhToan: 0,
        thuTuBanThanhLy: 0,
        donHoanThanh: 0,
        soLoQuaHan: 0
    });

    // --- KHỐI LƯỢNG NHẬP - BÁN - HAO HỤT THEO LOẠI CÁ ---
    const [fishVolumeData, setFishVolumeData] = useState([]);

    // --- PHÂN TÍCH LÃI/LỖ VÀ HAO HỤT CÂN ---
    // Dùng chung bộ lọc thời gian ở đầu trang: backend cũng đi qua
    // ThongKeService.xacDinhKhoangThoiGian() nên nhận đúng các giá trị range của Dashboard.
    const [laiLo, setLaiLo] = useState(null);
    const [tabPhanTich, setTabPhanTich] = useState("SAN_PHAM");
    const [bangPhanTich, setBangPhanTich] = useState([]);
    const [loadingPhanTich, setLoadingPhanTich] = useState(true);

    // --- DANH SÁCH ĐƠN HÀNG ---
    const [orders, setOrders] = useState([]);
    const [orderDetailsById, setOrderDetailsById] = useState({});
    const orderDetailsCacheRef = useRef({});
    const loadingOrderDetailIdsRef = useRef(new Set());
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersTotalElements, setOrdersTotalElements] = useState(0);
    const [ordersTotalPages, setOrdersTotalPages] = useState(0);
    const ordersPageSize = 5;

    // KPI và bảng luân chuyển phụ thuộc khoảng thời gian đang chọn, tải lại mỗi khi đổi
    useEffect(() => {
        if (timeRange === "CUSTOM" && (!customFrom || !customTo || customFrom > customTo)) return;
        const params = timeRange === "CUSTOM"
            ? { range: timeRange, from: customFrom, to: customTo }
            : { range: timeRange };

        api.get("/Thongke/tong-quan", { params })
            .then(res => setStats(res.data.result))
            .catch(() => {});

        api.get("/Thongke/luan-chuyen-hang-hoa", { params })
            .then(res => setFishVolumeData(res.data.result || []))
            .catch(() => {});

        api.get("/BaoCao/lai-lo", { params })
            .then(res => setLaiLo(res.data.result || null))
            .catch(() => setLaiLo(null));
    }, [timeRange, customFrom, customTo]);

    // Bảng phân tích tải riêng vì còn phụ thuộc tab đang chọn, không nên kéo theo cả khối KPI.
    useEffect(() => {
        if (timeRange === "CUSTOM" && (!customFrom || !customTo || customFrom > customTo)) return;
        const params = timeRange === "CUSTOM"
            ? { range: timeRange, from: customFrom, to: customTo }
            : { range: timeRange };

        const duongDan = tabPhanTich === "SAN_PHAM" ? "/BaoCao/bien-loi-nhuan/san-pham"
            : tabPhanTich === "LO" ? "/BaoCao/bien-loi-nhuan/lo"
            : "/BaoCao/hao-hut-can";

        setLoadingPhanTich(true);
        api.get(duongDan, { params })
            .then(res => setBangPhanTich(res.data.result || []))
            .catch(() => setBangPhanTich([]))
            .finally(() => setLoadingPhanTich(false));
    }, [timeRange, customFrom, customTo, tabPhanTich]);

    // Chỉ tải danh sách đơn ở bước đầu. Chi tiết được tải theo trang đang hiển thị
    // ở effect phía dưới để tránh gọi một API cho mọi đơn hàng cùng lúc.
    const showTonKho = timeRange === "TODAY";

    // Tồn kho do backend lấy trực tiếp từ kho hiện tại, không tự suy ra từ số phát sinh trong kỳ.
    const processedFishData = [...fishVolumeData]
        .sort((a, b) => b.ban - a.ban); // Ưu tiên xếp theo loại cá bán chạy nhất

    const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(value || 0)} VNĐ`;
    const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 });

    const handleExportExcel = async () => {
        if (timeRange === "CUSTOM" && (!customFrom || !customTo || customFrom > customTo)) {
            showToast("Khoảng thời gian xuất báo cáo không hợp lệ.", "error");
            return;
        }

        const params = timeRange === "CUSTOM"
            ? { range: timeRange, from: customFrom, to: customTo }
            : { range: timeRange };

        setExportingExcel(true);
        try {
            const response = await api.get("/Thongke/xuat-excel", {
                params,
                responseType: "blob",
            });
            const disposition = response.headers["content-disposition"] || "";
            const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
            const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
            const fileName = encodedName
                ? decodeURIComponent(encodedName)
                : plainName || `BaoCaoDashboard_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const url = URL.createObjectURL(new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }));
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            showToast("Đã xuất báo cáo Dashboard thành công.", "success");
        } catch {
            showToast("Không thể xuất báo cáo Excel. Vui lòng thử lại.", "error");
        } finally {
            setExportingExcel(false);
        }
    };

    const getRangeBounds = () => {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        if (timeRange === "CUSTOM") {
            const customStart = new Date(`${customFrom}T00:00:00`);
            const customEnd = new Date(`${customTo}T23:59:59.999`);
            return { start: customStart, end: customEnd };
        }

        if (timeRange === "THIS_WEEK") {
            const day = start.getDay() || 7;
            start.setDate(start.getDate() - day + 1);
        } else if (timeRange === "THIS_MONTH") {
            start.setDate(1);
        } else if (timeRange === "THIS_QUARTER") {
            start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
        } else if (timeRange === "THIS_YEAR") {
            start.setMonth(0, 1);
        }
        return { start, end: now };
    };

    const toLocalDateParam = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (timeRange === "CUSTOM" && (!customFrom || !customTo || customFrom > customTo)) return;
        const { start, end } = getRangeBounds();
        setOrdersLoading(true);
        api.get("/Donhangs/search", {
            params: {
                from: toLocalDateParam(start),
                to: toLocalDateParam(end),
                page: ordersPage - 1,
                size: ordersPageSize
            }
        })
            .then(res => {
                const result = res.data.result || {};
                setOrders(result.content || []);
                setOrdersTotalElements(result.totalElements || 0);
                setOrdersTotalPages(result.totalPages || 0);
            })
            .catch(() => {
                setOrders([]);
                setOrdersTotalElements(0);
                setOrdersTotalPages(0);
            })
            .finally(() => setOrdersLoading(false));
    }, [timeRange, customFrom, customTo, ordersPage]);

    useEffect(() => {
        setOrdersPage(1);
    }, [timeRange, customFrom, customTo]);

    const paginatedOrders = orders;
    const visibleOrderIdsKey = paginatedOrders.map(order => order.iddonhang).join("|");

    // Chỉ tải chi tiết của tối đa 5 đơn trên trang hiện tại. Kết quả được cache theo
    // id đơn hàng nên quay lại trang đã xem sẽ không phát sinh request mới.
    useEffect(() => {
        if (!visibleOrderIdsKey) return;

        const visibleOrderIds = visibleOrderIdsKey.split("|");
        const missingOrderIds = visibleOrderIds.filter(id =>
            !Object.prototype.hasOwnProperty.call(orderDetailsCacheRef.current, id)
            && !loadingOrderDetailIdsRef.current.has(id)
        );
        if (missingOrderIds.length === 0) return;
        missingOrderIds.forEach(id => loadingOrderDetailIdsRef.current.add(id));

        Promise.all(missingOrderIds.map(async id => {
            try {
                const detailRes = await api.get(`/Donhangs/${id}/chitiet`);
                return [id, detailRes.data.result || []];
            } catch {
                return [id, []];
            }
        })).then(detailEntries => {
            const newDetails = Object.fromEntries(detailEntries);
            orderDetailsCacheRef.current = { ...orderDetailsCacheRef.current, ...newDetails };
            detailEntries.forEach(([id]) => loadingOrderDetailIdsRef.current.delete(id));
            setOrderDetailsById({ ...orderDetailsCacheRef.current });
        });
    }, [visibleOrderIdsKey]);

    useEffect(() => {
        setOrdersPage(1);
    }, [timeRange]);

    useEffect(() => {
        if (ordersTotalPages > 0 && ordersPage > ordersTotalPages) {
            setOrdersPage(ordersTotalPages);
        }
    }, [ordersPage, ordersTotalPages]);

    const formatOrderItems = (details = []) => {
        if (details.length === 0) return "Chưa có thông tin mặt hàng";
        return details.map(item => {
            const tenSanPham = [item.tenLoaiCa, item.tenSize].filter(Boolean).join(" - ");
            const donVi = item.tenDonViTinh ? ` ${item.tenDonViTinh}` : "";
            return `${tenSanPham || "Sản phẩm"} × ${item.soluong ?? 0}${donVi}`;
        }).join(", ");
    };

    // Custom Tooltip cho Biểu đồ Cột (Cập nhật thêm Tồn kho)
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const getValue = (dataKey) => Number(payload.find(item => item.dataKey === dataKey)?.value || 0);
            return (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 min-w-[200px]">
                    <p className="font-bold text-slate-800 mb-3 border-b pb-2">{label}</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-blue-500"></span> Đã nhập:</span>
                            <span className="font-bold text-slate-800">{getValue("nhap").toLocaleString("vi-VN")} kg</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-green-500"></span> Đã bán:</span>
                            <span className="font-bold text-slate-800">{getValue("ban").toLocaleString("vi-VN")} kg</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-orange-500"></span> Bán thanh lý:</span>
                            <span className="font-bold text-slate-800">{getValue("banThanhLy").toLocaleString("vi-VN")} kg</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-red-500"></span> Tiêu hủy:</span>
                            <span className="font-bold text-slate-800">{getValue("tieuHuy").toLocaleString("vi-VN")} kg</span>
                        </div>
                        {showTonKho && (
                            <div className="flex justify-between items-center text-sm pt-1 mt-1 border-t border-slate-50">
                                <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-purple-500"></span> Tồn kho hiện tại:</span>
                                <span className="font-bold text-purple-700">{getValue("tonKho").toLocaleString("vi-VN")} kg</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <AdminLayout title="Dashboard">
            
            {/* --- HEADER LỌC THỜI GIAN --- */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Tổng kết kinh doanh</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={exportingExcel || (timeRange === "CUSTOM" && (!customFrom || !customTo || customFrom > customTo))}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download size={18} />
                        {exportingExcel ? "Đang xuất..." : "Xuất Excel"}
                    </button>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="rounded-xl text-sm font-bold p-2.5 border border-cyan-700 bg-cyan-600 text-white shadow-sm outline-none cursor-pointer transition-colors hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-700"
                    >
                        <option className="bg-white text-slate-800" value="TODAY">Hôm nay</option>
                        <option className="bg-white text-slate-800" value="THIS_WEEK">Tuần này</option>
                        <option className="bg-white text-slate-800" value="THIS_MONTH">Tháng này</option>
                        <option className="bg-white text-slate-800" value="THIS_QUARTER">Quý này</option>
                        <option className="bg-white text-slate-800" value="THIS_YEAR">Năm nay</option>
                        <option className="bg-white text-slate-800" value="CUSTOM">Tùy chọn...</option>
                    </select>
                    {timeRange === "CUSTOM" && (
                        <>
                            <label className="text-sm text-slate-500">Từ</label>
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="p-2 border border-slate-300 rounded-xl bg-white text-sm" />
                            <label className="text-sm text-slate-500">đến</label>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="p-2 border border-slate-300 rounded-xl bg-white text-sm" />
                        </>
                    )}
                </div>
            </div>

            {timeRange === "CUSTOM" && customFrom > customTo && (
                <p className="-mt-5 mb-6 text-right text-sm font-medium text-red-600">Ngày bắt đầu không được lớn hơn ngày kết thúc.</p>
            )}

            {/* --- KHU VỰC 1: TỔNG QUAN TÀI CHÍNH (KPI + PHÂN TÍCH LÃI/LỖ) --- */}
            {/* Doanh thu / chi phí nhập / thu thanh lý ở khối KPI và trong báo cáo lãi lỗ vốn là CÙNG
                một truy vấn trên CÙNG khoảng thời gian, nên gộp làm một thay vì hiện hai lần. */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-4">
                <div className="bg-cyan-100 p-6 rounded-3xl shadow-sm border border-cyan-300 text-cyan-950 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-cyan-200 rounded-2xl"><DollarSign size={28} className="text-cyan-700" /></div></div>
                    <div>
                        <p className="text-cyan-700 text-xs font-bold uppercase tracking-wider mb-1">Doanh Thu Đơn Hàng</p>
                        <h3 className="text-2xl lg:text-3xl font-black">{formatCurrency(stats.tongDoanhThu)}</h3>
                    </div>
                </div>

                <div className="bg-orange-100 p-6 rounded-3xl shadow-sm border border-orange-300 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-orange-200 rounded-2xl"><Package size={28} className="text-orange-700" /></div></div>
                    <div>
                        <p className="text-orange-700 text-xs font-bold uppercase tracking-wider mb-1">Giá Vốn Hàng Bán</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-orange-950">{laiLo ? formatCurrency(laiLo.giaVonHangBan) : "—"}</h3>
                        <p className="mt-2 text-xs font-semibold text-orange-800">Chỉ phần cá đã thực sự xuất đi</p>
                    </div>
                </div>

                {/* Ô chủ đạo: tô đặc để tách khỏi các ô pastel, vì đây mới là con số kết luận. */}
                <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-between text-white ${
                    Number(laiLo?.loiNhuanGop || 0) >= 0 ? "bg-emerald-600 border-emerald-700" : "bg-rose-600 border-rose-700"
                }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            {Number(laiLo?.loiNhuanGop || 0) >= 0
                                ? <TrendingUp size={28} className="text-white" />
                                : <TrendingDown size={28} className="text-white" />}
                        </div>
                    </div>
                    <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Lợi Nhuận Gộp</p>
                        <h3 className="text-2xl lg:text-3xl font-black">{laiLo ? formatCurrency(laiLo.loiNhuanGop) : "—"}</h3>
                        <p className="mt-2 text-xs font-semibold text-white/80">
                            {laiLo ? `Biên ${formatNumber(laiLo.bienLoiNhuanGop)}%` : "Đang tính..."}
                        </p>
                    </div>
                </div>

                <div className="bg-amber-100 p-6 rounded-3xl shadow-sm border border-amber-300 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-amber-200 rounded-2xl"><ShoppingCart size={28} className="text-amber-700" /></div></div>
                    <div>
                        <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">Chi Phí Nhập Hàng</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-amber-950">{formatCurrency(stats.chiPhiNhapHang)}</h3>
                        <p className="mt-2 text-xs font-semibold text-amber-800">
                            Đã trả cho hàng nhập kỳ này: {formatCurrency(stats.chiPhiNhapDaThanhToan)}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-100 p-6 rounded-3xl shadow-sm border border-slate-300 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-slate-200 rounded-2xl"><Wallet size={28} className="text-slate-700" /></div></div>
                    <div>
                        <p className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Công Nợ Nhà Cung Cấp</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-red-600">{laiLo ? formatCurrency(laiLo.congNoNccConLai) : "—"}</h3>
                        <p className="mt-2 text-xs font-semibold text-slate-600">
                            Đã trả trong kỳ: {laiLo ? formatCurrency(laiLo.tienDaTraNcc) : "—"}
                        </p>
                    </div>
                </div>

                <div className="bg-violet-100 p-6 rounded-3xl shadow-sm border border-violet-300 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-violet-200 rounded-2xl"><DollarSign size={28} className="text-violet-700" /></div></div>
                    <div>
                        <p className="text-violet-700 text-xs font-bold uppercase tracking-wider mb-1">Thu Từ Bán Thanh Lý</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-violet-950">{formatCurrency(stats.thuTuBanThanhLy)}</h3>
                    </div>
                </div>

                <div className="bg-emerald-100 p-6 rounded-3xl shadow-sm border border-emerald-300 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-emerald-200 rounded-2xl"><CheckCircle2 size={28} className="text-emerald-700" /></div></div>
                    <div>
                        <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">Đơn Hoàn Thành</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-emerald-950">{stats.donHoanThanh} <span className="text-lg font-semibold text-emerald-600">đơn</span></h3>
                    </div>
                </div>

                {timeRange === "TODAY" && user?.vaitro === "ADMIN" && (
                    <button
                        type="button"
                        onClick={() => navigate("/admin/QuanLyThanhLy?tab=quahan")}
                        className={`text-left p-6 rounded-3xl shadow-sm border flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                            stats.soLoQuaHan > 0 ? "bg-rose-100 border-rose-300" : "bg-rose-50 border-rose-200"
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stats.soLoQuaHan > 0 ? "bg-rose-200" : "bg-rose-100"}`}>
                                <AlertCircle size={28} className={stats.soLoQuaHan > 0 ? "text-rose-700" : "text-rose-500"} />
                            </div>
                        </div>
                        <div>
                            <p className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">Lô Hàng Quá Hạn</p>
                            <h3 className={`text-2xl lg:text-3xl font-black ${stats.soLoQuaHan > 0 ? "text-rose-700" : "text-rose-950"}`}>
                                {stats.soLoQuaHan} <span className="text-lg font-semibold text-rose-500">lô</span>
                            </h3>
                        </div>
                    </button>
                )}
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl px-5 py-4 mb-8 text-xs text-cyan-900 leading-relaxed">
                <strong>Cách đọc:</strong> lợi nhuận gộp = doanh thu − <em>giá vốn hàng bán</em>, không phải
                doanh thu − <em>chi phí nhập hàng</em>. Hai ô đó nằm cạnh nhau nhưng đo hai thứ khác nhau: cá
                nhập trong kỳ mà còn nằm trong bể thì chưa phải chi phí của doanh thu kỳ này. Giá vốn và biên
                lợi nhuận chỉ có số liệu với đơn phát sinh sau khi bật tính năng phân bổ lô.
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
                <div className="mb-6">
                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                        <TrendingUp size={24} className="text-cyan-600" />
                        Chi tiết lãi/lỗ và hao hụt
                    </h3>
                    <p className="text-slate-500 mt-1 text-sm">
                        Bóc tách các con số phía trên theo sản phẩm, theo lô nhập, và đối chiếu cân dự kiến với cân thực tế
                    </p>
                </div>

                <div className="flex bg-cyan-50 p-1.5 rounded-xl border border-cyan-200 w-fit mb-4">
                    {[
                        { value: "SAN_PHAM", label: "Theo sản phẩm" },
                        { value: "LO", label: "Theo lô nhập" },
                        { value: "HAO_HUT", label: "Hao hụt cân" },
                    ].map(item => (
                        <button
                            key={item.value}
                            onClick={() => setTabPhanTich(item.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                                tabPhanTich === item.value
                                    ? "bg-cyan-600 text-white shadow-sm"
                                    : "text-cyan-800 hover:text-cyan-900 hover:bg-cyan-100"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    {tabPhanTich === "HAO_HUT" ? (
                        <table className="w-full text-left min-w-[820px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4">Loại cá</th>
                                    <th className="p-4">Size</th>
                                    <th className="p-4 text-right">Kg dự kiến</th>
                                    <th className="p-4 text-right">Kg thực tế</th>
                                    <th className="p-4 text-right">Chênh lệch</th>
                                    <th className="p-4 text-right">Tỷ lệ lệch</th>
                                    <th className="p-4 text-center">Số dòng đơn</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingPhanTich ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                                ) : bangPhanTich.length > 0 ? (
                                    bangPhanTich.map((dong, index) => (
                                        <tr key={`${dong.idLoaiCa}-${dong.tenSize}-${index}`} className={dong.vuotNguong ? "bg-rose-50/50" : ""}>
                                            <td className="p-4 font-semibold text-slate-800">{dong.tenLoaiCa}</td>
                                            <td className="p-4">{dong.tenSize}</td>
                                            <td className="p-4 text-right tabular-nums">{formatNumber(dong.tongKgDuKien)}</td>
                                            <td className="p-4 text-right tabular-nums">{formatNumber(dong.tongKgThucTe)}</td>
                                            <td className={`p-4 text-right tabular-nums font-semibold ${Number(dong.chenhLech) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                {formatNumber(dong.chenhLech)}
                                            </td>
                                            <td className="p-4 text-right tabular-nums font-bold">
                                                <span className={dong.vuotNguong ? "text-rose-600" : "text-slate-600"}>{formatNumber(dong.tyLeLech)}%</span>
                                                {dong.vuotNguong && <span className="ml-2 text-xs font-bold text-rose-500">vượt ngưỡng</span>}
                                            </td>
                                            <td className="p-4 text-center tabular-nums">{dong.soDongDon}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Chưa có dữ liệu cân thực tế trong kỳ này.</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left min-w-[900px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    {tabPhanTich === "LO" && <th className="p-4">Lô / Ngày nhập</th>}
                                    <th className="p-4">Loại cá</th>
                                    <th className="p-4">Size</th>
                                    <th className="p-4 text-right">Kg đã bán</th>
                                    <th className="p-4 text-right">Doanh thu</th>
                                    <th className="p-4 text-right">Giá vốn</th>
                                    <th className="p-4 text-right">Lợi nhuận gộp</th>
                                    <th className="p-4 text-right">Biên</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingPhanTich ? (
                                    <tr><td colSpan="8" className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                                ) : bangPhanTich.length > 0 ? (
                                    bangPhanTich.map((dong, index) => {
                                        const loiNhuan = Number(dong.loiNhuanGop || 0);
                                        return (
                                            <tr key={`${dong.idLo || dong.tenLoaiCa}-${dong.tenSize}-${index}`}>
                                                {tabPhanTich === "LO" && (
                                                    <td className="p-4">
                                                        <p className="font-mono text-xs text-slate-500">{(dong.idLo || "").slice(0, 8).toUpperCase()}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {dong.ngayNhap ? new Date(dong.ngayNhap).toLocaleDateString("vi-VN") : "-"}
                                                        </p>
                                                    </td>
                                                )}
                                                <td className="p-4 font-semibold text-slate-800">{dong.tenLoaiCa}</td>
                                                <td className="p-4">{dong.tenSize}</td>
                                                <td className="p-4 text-right tabular-nums">{formatNumber(dong.soLuongBan)}</td>
                                                <td className="p-4 text-right tabular-nums">{formatCurrency(dong.doanhThu)}</td>
                                                <td className="p-4 text-right tabular-nums text-amber-700">{formatCurrency(dong.giaVon)}</td>
                                                <td className={`p-4 text-right tabular-nums font-bold ${loiNhuan >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {formatCurrency(loiNhuan)}
                                                </td>
                                                <td className={`p-4 text-right tabular-nums font-semibold ${loiNhuan >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {formatNumber(dong.bienLoiNhuan)}%
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-slate-400 italic">
                                            Chưa có dữ liệu phân bổ lô trong kỳ này. Báo cáo chỉ có số liệu cho đơn phát sinh sau khi bật tính năng.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- KHU VỰC 2: THỐNG KÊ LUÂN CHUYỂN HÀNG HÓA (BẢNG/BIỂU ĐỒ) --- */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
                <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                            {viewMode === "TABLE" ? <TableProperties size={24} className="text-cyan-600" /> : <BarChart2 size={24} className="text-cyan-600" />}
                            Thống kê luân chuyển hàng hóa
                        </h3>
                        <p className="text-slate-500 mt-1 text-sm">
                            {showTonKho
                                ? "Hiển thị số lượng (kg) Nhập - Bán - Bán thanh lý - Tiêu hủy trong hôm nay và tồn kho hiện tại"
                                : "Hiển thị số lượng (kg) Nhập - Bán - Bán thanh lý - Tiêu hủy trong kỳ"}
                        </p>
                    </div>
                    
                    {/* Nút Toggle Switch */}
                    <div className="flex bg-cyan-50 p-1.5 rounded-xl border border-cyan-200">
                        <button
                            onClick={() => setViewMode("TABLE")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                viewMode === "TABLE" 
                                ? "bg-cyan-600 text-white shadow-sm" 
                                : "text-cyan-800 hover:text-cyan-900 hover:bg-cyan-100"
                            }`}
                        >
                            <Table size={16} /> Bảng dữ liệu
                        </button>
                        <button
                            onClick={() => setViewMode("CHART")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                viewMode === "CHART" 
                                ? "bg-cyan-600 text-white shadow-sm" 
                                : "text-cyan-800 hover:text-cyan-900 hover:bg-cyan-100"
                            }`}
                        >
                            <BarChart2 size={16} /> Biểu đồ cột
                        </button>
                    </div>
                </div>
                
                {/* HIỂN THỊ DẠNG BẢNG */}
                {viewMode === "TABLE" && (
                    <div className="overflow-x-auto max-h-[400px] rounded-xl border border-black animate-in fade-in duration-300">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 rounded-tl-xl">Tên loại cá</th>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 text-right text-blue-600">Đã nhập (kg)</th>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 text-right text-green-600">Đã bán (kg)</th>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 text-right text-orange-600">Bán thanh lý (kg)</th>
                                    <th className={`py-4 px-6 font-semibold border-b border-slate-200 text-right text-red-500 ${!showTonKho ? "rounded-tr-xl" : ""}`}>Tiêu hủy (kg)</th>
                                    {showTonKho && (
                                        <th className="py-4 px-6 font-semibold border-b border-slate-200 text-right text-purple-600 rounded-tr-xl">Tồn kho hiện tại (kg)</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {processedFishData.map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-800">{row.name}</td>
                                        <td className="py-4 px-6 text-right font-semibold tabular-nums text-slate-700">{row.nhap.toLocaleString("vi-VN")}</td>
                                        <td className="py-4 px-6 text-right font-semibold tabular-nums text-slate-700">{row.ban.toLocaleString("vi-VN")}</td>
                                        <td className="py-4 px-6 text-right font-semibold tabular-nums text-orange-600">{Number(row.banThanhLy || 0).toLocaleString("vi-VN")}</td>
                                        <td className="py-4 px-6 text-right font-semibold tabular-nums text-red-500">{Number(row.tieuHuy || 0).toLocaleString("vi-VN")}</td>
                                        {showTonKho && (
                                            <td className="py-4 px-6 text-right font-bold tabular-nums text-cyan-700">{Number(row.tonKho || 0).toLocaleString("vi-VN")}</td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* HIỂN THỊ DẠNG BIỂU ĐỒ */}
                {viewMode === "CHART" && (
                    <div className="h-[400px] w-full animate-in fade-in duration-300">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processedFishData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 500 }} />
                                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                
                                <Bar dataKey="nhap" name="Đã nhập" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="ban" name="Đã bán" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="banThanhLy" name="Bán thanh lý" fill="#f97316" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="tieuHuy" name="Tiêu hủy" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                                {showTonKho && (
                                    <Bar dataKey="tonKho" name="Tồn kho hiện tại" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={12} />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* --- KHU VỰC 3: ĐƠN HÀNG TRONG KỲ --- */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                            <ShoppingCart size={24} className="text-cyan-600" />
                            Đơn hàng trong kỳ
                        </h3>
                        <p className="text-slate-500 mt-1 text-sm">Danh sách đơn hàng theo khoảng thời gian đang chọn ở phía trên</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-cyan-100 text-cyan-800 text-sm font-bold">
                            {ordersTotalElements} đơn
                        </span>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/QuanLyDonHang")}
                            className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700 transition-colors"
                        >
                            Xem tất cả đơn hàng
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-black">
                    <table className="w-full min-w-[760px] text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-5 py-3 font-bold">Khách hàng</th>
                                <th className="px-5 py-3 font-bold">Mặt hàng đã đặt</th>
                                <th className="px-5 py-3 font-bold">Trạng thái</th>
                                <th className="px-5 py-3 font-bold text-right">Tổng giá trị</th>
                                <th className="px-5 py-3 font-bold text-right">Ngày đặt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ordersLoading ? (
                                <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-400">Đang tải danh sách đơn hàng...</td></tr>
                            ) : paginatedOrders.length > 0 ? (
                                paginatedOrders.map(order => {
                                    const status = ORDER_STATUS[order.trangthaidonhang] || {
                                        label: order.trangthaidonhang || "Không xác định",
                                        badge: "bg-slate-50 text-slate-600 border-slate-200"
                                    };
                                    return (
                                        <tr
                                            key={order.iddonhang}
                                            onClick={() => navigate(`/admin/QuanLyDonHang/chi-tiet/${order.iddonhang}`, {
                                                state: { returnTo: "/admin" }
                                            })}
                                            className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                                            title="Bấm để xem chi tiết đơn hàng"
                                        >
                                            <td className="px-5 py-4 font-semibold text-slate-800">{order.tenKhachHang || "Khách vãng lai"}</td>
                                            <td className="px-5 py-4 text-slate-600 max-w-xl truncate">
                                                {Object.prototype.hasOwnProperty.call(orderDetailsById, order.iddonhang)
                                                    ? formatOrderItems(orderDetailsById[order.iddonhang])
                                                    : "Đang tải mặt hàng..."}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg border text-xs font-bold ${status.badge}`}>{status.label}</span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold tabular-nums text-cyan-700">{formatCurrency(order.tongtien || 0)}</td>
                                            <td className="px-5 py-4 text-right text-slate-500">{new Date(order.ngaydat).toLocaleString("vi-VN")}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-400 italic">Không có đơn hàng trong khoảng thời gian này.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {!ordersLoading && ordersTotalElements > 0 && (
                        <div className="px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                            <span className="text-xs text-slate-500">
                                Hiển thị {(ordersPage - 1) * ordersPageSize + 1}–{Math.min(ordersPage * ordersPageSize, ordersTotalElements)} trong {ordersTotalElements} đơn
                            </span>
                            <Pagination currentPage={ordersPage} totalPages={ordersTotalPages} onPageChange={setOrdersPage} />
                        </div>
                    )}
                </div>
            </div>

        </AdminLayout>
    );
}
