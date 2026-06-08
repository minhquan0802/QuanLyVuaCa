import Header from "../components/header";
import Footer from "../components/footer";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCoXacThuc } from "../utils/fetchAPI";

const TABS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' },
    { id: 'DANG_XU_LY', label: 'Đang xử lý' },
    { id: 'DANG_GIAO', label: 'Đang giao' },
    { id: 'DA_GIAO', label: 'Đã giao hàng' },      
    { id: 'DA_THANH_TOAN', label: 'Đã thanh toán' },
    { id: 'DA_HUY', label: 'Đã hủy' },
];

export default function ThongTinDonHang() {
    const navigate = useNavigate();
    const APP_BASE_URL = "http://localhost:8080/QuanLyVuaCa"; // [1] Thêm Base URL
    
    // --- STATE DỮ LIỆU CHÍNH ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL'); 

    // --- STATE CHO MODAL CHI TIẾT ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // [2] Helper lấy ảnh (Copy từ ProductList)
    const getImageUrl = (urlFromDb) => {
        if (!urlFromDb) return 'https://placehold.co/400x300?text=No+Image';
        if (urlFromDb.startsWith('http')) return urlFromDb;
        if (urlFromDb.startsWith('/')) return `${APP_BASE_URL}${urlFromDb}`;
        return `${APP_BASE_URL}/images/loaica/${urlFromDb}`;
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetchCoXacThuc("/Donhangs/my-orders");
                if (res.ok) {
                    const data = await res.json();
                    const sortedOrders = (data.result || []).sort((a, b) => 
                        new Date(b.ngaydat) - new Date(a.ngaydat)
                    );
                    setOrders(sortedOrders);
                } else {
                    console.error("Lỗi tải đơn hàng");
                }
            } catch (error) {
                console.error("Lỗi kết nối:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const handleViewDetail = async (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
        setLoadingDetails(true);
        setOrderDetails([]);

        try {
            const res = await fetchCoXacThuc(`/Donhangs/${order.iddonhang}/chitiet`);
            if (res.ok) {
                const data = await res.json();
                setOrderDetails(data.result || []);
            }
        } catch (error) {
            console.error("Lỗi tải chi tiết:", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const filteredOrders = useMemo(() => {
        if (activeTab === 'ALL') return orders;

        return orders.filter(order => {
            const status = order.trangthaidonhang;
            switch (activeTab) {
                case 'CHO_XAC_NHAN': return status === 'CHO_XAC_NHAN';
                case 'DANG_XU_LY': return ['DA_XAC_NHAN', 'DANG_CHUAN_BI_HANG'].includes(status);
                case 'DANG_GIAO': return ['DANG_GIAO_HANG', 'DANG_VAN_CHUYEN'].includes(status);
                case 'DA_GIAO': return status === 'GIAO_HANG_THANH_CONG';
                case 'DA_THANH_TOAN': return ['DA_THANH_TOAN', 'HOAN_TAT'].includes(status);
                case 'DA_HUY': return ['HUY', 'DA_HUY'].includes(status);
                default: return false;
            }
        });
    }, [orders, activeTab]);

    const getStatusText = (status) => {
        switch (status) {
            case "CHO_XAC_NHAN": return "Chờ xác nhận";
            case "DA_XAC_NHAN": return "Đang chuẩn bị hàng";
            case "DANG_CHUAN_BI_HANG": return "Đang đóng gói";
            case "DANG_GIAO_HANG": 
            case "DANG_VAN_CHUYEN": return "Đang giao hàng";
            case "GIAO_HANG_THANH_CONG": return "Giao thành công"; 
            case "DA_THANH_TOAN": return "Đã thanh toán";       
            case "HOAN_TAT": return "Hoàn tất";
            case "HUY": return "Đã hủy";
            default: return status;
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "CHO_XAC_NHAN": return "bg-orange-100 text-orange-600";
            case "DA_XAC_NHAN":
            case "DANG_CHUAN_BI_HANG": return "bg-blue-100 text-blue-600";
            case "DANG_GIAO_HANG": 
            case "DANG_VAN_CHUYEN": return "bg-cyan-100 text-cyan-600";
            case "GIAO_HANG_THANH_CONG": return "bg-teal-100 text-teal-700"; 
            case "DA_THANH_TOAN": 
            case "HOAN_TAT": return "bg-green-100 text-green-700";           
            case "DA_HUY":
            case "HUY": return "bg-red-100 text-red-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="bg-slate-100 font-body text-slate-600 min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow pb-12">
                <div className="mx-auto max-w-5xl px-0 md:px-4 pt-4 md:pt-8">
                    
                    {/* TAB BAR */}
                    <div className="bg-white sticky top-[70px] z-10 shadow-sm border-b border-slate-200 mb-4 md:rounded-t-lg overflow-hidden">
                        <div className="flex overflow-x-auto no-scrollbar">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 min-w-[110px] py-4 text-sm font-medium text-center transition-colors whitespace-nowrap border-b-2 
                                        ${activeTab === tab.id 
                                            ? "border-blue-600 text-blue-600" 
                                            : "border-transparent text-slate-600 hover:text-blue-500"
                                        }`}
                                >
                                    {tab.label} ({orders.filter(o => {
                                        if (tab.id === 'ALL') return true;
                                        const s = o.trangthaidonhang;
                                        if (tab.id === 'CHO_XAC_NHAN') return s === 'CHO_XAC_NHAN';
                                        if (tab.id === 'DANG_XU_LY') return ['DA_XAC_NHAN', 'DANG_CHUAN_BI_HANG'].includes(s);
                                        if (tab.id === 'DANG_GIAO') return ['DANG_GIAO_HANG', 'DANG_VAN_CHUYEN'].includes(s);
                                        if (tab.id === 'DA_GIAO') return s === 'GIAO_HANG_THANH_CONG';
                                        if (tab.id === 'DA_THANH_TOAN') return ['DA_THANH_TOAN', 'HOAN_TAT'].includes(s);
                                        if (tab.id === 'DA_HUY') return ['HUY', 'DA_HUY'].includes(s);
                                        return false;
                                    }).length})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DANH SÁCH ĐƠN HÀNG */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin size-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            Đang tải đơn hàng...
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-white py-16 flex flex-col items-center justify-center shadow-sm md:rounded-lg">
                            <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-5xl text-slate-300">receipt_long</span>
                            </div>
                            <p className="text-slate-500 font-medium">Chưa có đơn hàng nào</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => {
                                // [3] Lấy sản phẩm đầu tiên để hiển thị Preview
                                // Kiểm tra cấu trúc trả về từ Backend. 
                                // Giả sử Backend trả về listChitietdonhang hoặc chiTietDonHangs
                                const products = order.listChitietdonhang || order.chiTietDonHangs || [];
                                const firstItem = products.length > 0 ? products[0] : null;
                                const otherItemsCount = products.length - 1;

                                return (
                                    <div key={order.iddonhang} className="bg-white p-5 shadow-sm md:rounded-lg hover:shadow-md transition-shadow">
                                        
                                        {/* Header Card */}
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">Minh Quân Fresh</span>
                                                <button className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded font-bold">Mall</button>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className={`font-medium uppercase truncate px-2 py-0.5 rounded text-xs ${getStatusStyle(order.trangthaidonhang)}`}>
                                                    {getStatusText(order.trangthaidonhang)}
                                                </span>
                                                <div className="h-4 w-[1px] bg-slate-300 mx-1"></div> 
                                                <span className="text-slate-400 text-xs uppercase">
                                                    {formatDate(order.ngaydat)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Body Card - [CẬP NHẬT] Hiển thị sản phẩm thật */}
                                        <div 
                                            className="flex gap-4 cursor-pointer" 
                                            onClick={() => handleViewDetail(order)}
                                        >
                                            {firstItem ? (
                                                <>
                                                    {/* Ảnh sản phẩm */}
                                                    <div className="size-20 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                                        <img 
                                                            // Cần đảm bảo backend trả về hinhanhurl trong object chi tiết, nếu không sẽ dùng placeholder
                                                            src={getImageUrl(firstItem.idchitietcaban?.idloaica?.hinhanhurl || firstItem.hinhanhurl)} 
                                                            alt="Sản phẩm"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {e.target.onerror = null; e.target.src = 'https://placehold.co/100?text=Fish'}}
                                                        />
                                                    </div>
                                                    
                                                    {/* Thông tin sản phẩm */}
                                                    <div className="flex-1 flex flex-col justify-center">
                                                        <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">
                                                            {firstItem.tenLoaiCa || firstItem.idchitietcaban?.idloaica?.tenloaica || "Sản phẩm"}
                                                        </h4>
                                                        <div className="text-xs text-slate-500 mb-1">
                                                            Phân loại: {firstItem.tenSize || firstItem.idchitietcaban?.idsizeca?.sizeca}
                                                        </div>
                                                        <div className="text-xs text-slate-800">
                                                            x{firstItem.soluong}
                                                        </div>
                                                        
                                                        {/* Badge "Xem thêm" nếu có nhiều món */}
                                                        {otherItemsCount > 0 && (
                                                            <div className="mt-1 text-xs text-blue-600 font-medium">
                                                                Xem thêm {otherItemsCount} sản phẩm khác...
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Giá của món này (Optional - hiển thị bên phải) */}
                                                    <div className="text-right flex flex-col justify-center">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {(firstItem.tongtiendukien || firstItem.tongtienthucte || 0).toLocaleString()}đ
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                /* Fallback nếu API chưa trả về list chi tiết */
                                                <>
                                                    <div className="size-20 bg-slate-100 rounded border border-slate-200 flex items-center justify-center flex-shrink-0">
                                                        <span className="material-symbols-outlined text-slate-400 text-3xl">shopping_bag</span>
                                                    </div>
                                                    <div className="flex-1 flex items-center">
                                                        <p className="text-sm text-slate-500 italic">
                                                            Chi tiết đơn hàng #{order.iddonhang.substring(0, 8)}...
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Footer Card */}
                                        <div className="border-t border-slate-100 pt-4 mt-4">
                                            <div className="flex justify-end items-center gap-2 mb-4">
                                                <span className="text-sm text-slate-600">Thành tiền:</span>
                                                <span className="text-lg font-bold text-blue-600">
                                                    {order.tongtien ? order.tongtien.toLocaleString() : 0}₫
                                                </span>
                                            </div>

                                            <div className="flex justify-end gap-3">
                                                <button className="px-6 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                                                    Mua lại
                                                </button>
                                                <button 
                                                    onClick={() => handleViewDetail(order)}
                                                    className="px-6 py-2 rounded border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* --- MODAL CHI TIẾT (GIỮ NGUYÊN) --- */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">
                                    Chi tiết đơn #{selectedOrder.iddonhang.substring(0, 8).toUpperCase()}
                                </h3>
                                <p className="text-xs text-slate-500">{formatDate(selectedOrder.ngaydat)}</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingDetails ? (
                                <div className="text-center py-8 text-slate-500">Đang tải chi tiết...</div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="border rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                                <tr>
                                                    <th className="p-3 font-medium">Sản phẩm</th>
                                                    <th className="p-3 font-medium text-center">SL</th>
                                                    <th className="p-3 font-medium text-right">Đơn giá</th>
                                                    <th className="p-3 font-medium text-right">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {orderDetails.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="p-3">
                                                            <p className="font-bold text-slate-700">{item.tenLoaiCa}</p>
                                                            <p className="text-xs text-slate-500">{item.tenSize}</p>
                                                        </td>
                                                        <td className="p-3 text-center">{item.soluong}</td>
                                                        <td className="p-3 text-right">
                                                            {item.dongia ? item.dongia.toLocaleString() : 0}đ
                                                        </td>
                                                        <td className="p-3 text-right font-bold text-slate-700">
                                                            {item.tongtiendukien ? item.tongtiendukien.toLocaleString() : 0}đ
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200">
                                        <span className="font-bold text-slate-600">Tổng thanh toán:</span>
                                        <span className="font-display text-2xl font-bold text-blue-600">
                                            {selectedOrder.tongtien ? selectedOrder.tongtien.toLocaleString() : 0}đ
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-right">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}