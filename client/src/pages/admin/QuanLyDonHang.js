import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchCoXacThuc } from "../../utils/fetchAPI";


const ORDER_STATUS = {
    "CHO_XAC_NHAN": { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700", icon: "hourglass_top" },
    "DA_THANH_TOAN": { label: "Đã thanh toán", color: "bg-teal-100 text-teal-700", icon: "credit_score" },
    "DANG_DONG_HANG": { label: "Đang đóng hàng", color: "bg-blue-100 text-blue-700", icon: "inventory_2" },
    "DANG_VAN_CHUYEN": { label: "Đang vận chuyển", color: "bg-purple-100 text-purple-700", icon: "local_shipping" },
    "GIAO_HANG_THANH_CONG": { label: "Giao thành công", color: "bg-green-100 text-green-700", icon: "check_circle" },
    "HUY": { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: "cancel" }
};

const STATUS_PRIORITY = {
    "CHO_XAC_NHAN": 1,
    "DANG_DONG_HANG": 2,
    "DANG_VAN_CHUYEN": 3,
    "GIAO_HANG_THANH_CONG": 4,
    "DA_THANH_TOAN": 5,
    "HUY": 6
};

export default function QuanLyDonHang() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("ALL");

    // --- State cho Xem Chi Tiết ---
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewDetails, setViewDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // [MỚI] State để kiểm tra xem đã chỉnh sửa cân nặng chưa
    const [isEdited, setIsEdited] = useState(false);

    // --- State cho TẠO ĐƠN MỚI ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [fishes, setFishes] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [units, setUnits] = useState([]);
    const [priceList, setPriceList] = useState([]);
    // State lưu dữ liệu quy đổi (1 con = bao nhiêu kg)
    const [conversionList, setConversionList] = useState([]);

    // Form tạo đơn
    const [newOrder, setNewOrder] = useState({
        idthongtinkhachhang: "",
        items: []
    });

    // Form thêm sản phẩm con
    const [currentItem, setCurrentItem] = useState({
        fishId: "",
        sizeId: "",
        repoId: "",
        unitId: "",
        unitName: "",
        factor: 0,
        quantity: 1,
        estimatedKg: 0,
        pricePerKg: 0,
    });

    // Fetch dữ liệu ban đầu
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [resOrders, resCust, resFish, resUnits, resPrices, resConversions] = await Promise.all([
                fetchCoXacThuc("/Donhangs"),
                fetchCoXacThuc("/TaiKhoans"),
                fetchCoXacThuc("/Loaicas"),
                fetchCoXacThuc("/Donvitinhs"),
                fetchCoXacThuc("/Banggias"),
                fetchCoXacThuc("/Quydois")
            ]);

            if (resOrders.ok) {
                const data = await resOrders.json();
                let realData = data.result || data.data || (Array.isArray(data) ? data : []);

                // [CẬP NHẬT] Logic sắp xếp: Ưu tiên Trạng thái -> sau đó đến Thời gian
                realData.sort((a, b) => {
                    const priorityA = STATUS_PRIORITY[a.trangthaidonhang] || 99;
                    const priorityB = STATUS_PRIORITY[b.trangthaidonhang] || 99;

                    // 1. So sánh trạng thái trước
                    if (priorityA !== priorityB) {
                        return priorityA - priorityB; // Số nhỏ lên đầu
                    }

                    // 2. Nếu cùng trạng thái -> So sánh thời gian (Mới nhất lên đầu)
                    return new Date(b.ngaydat) - new Date(a.ngaydat);
                });

                setOrders(realData);
            }

            if (resCust.ok) {
                const data = await resCust.json();
                const allUsers = data.result || [];
                setCustomers(allUsers.filter(u => {
                    const rId = u.idvaitro?.id || u.idvaitro;
                    return rId === 5 || rId === 6;
                }));
            }

            if (resFish.ok) {
                const data = await resFish.json();
                setFishes(data.result || []);
            }

            if (resUnits.ok) {
                const data = await resUnits.json();
                setUnits(data.result || []);
            }

            if (resPrices.ok) {
                const data = await resPrices.json();
                setPriceList(data.result || []);
            }
            // Fetch bảng quy đổi
            if (resConversions.ok) {
                const data = await resConversions.json();
                // Kiểm tra kỹ các trường hợp trả về của API (result, data, hoặc mảng trực tiếp)
                const listQuyDoi = data.result || data.data || (Array.isArray(data) ? data : []);

                setConversionList(listQuyDoi);

                // [DEBUG] In ra để xem dữ liệu đã về chưa
                // console.log("Dữ liệu Quy đổi tải về:", listQuyDoi); 
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Xem Chi Tiết
    // const handleViewDetail = async (order) => {
    //     setSelectedOrder(order);
    //     setIsViewModalOpen(true);
    //     setLoadingDetails(true);
    //     try {
    //         const res = await fetchCoXacThuc(`/Donhangs/${order.iddonhang}/chitiet`);
    //         if (res.ok) {
    //             const data = await res.json();
    //             setViewDetails(data.result || []);
    //         }
    //     } catch (error) { console.error(error); }
    //     finally { setLoadingDetails(false); }
    // };

    const handleViewDetail = async (order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
        setLoadingDetails(true);
        setIsEdited(false);
        try {
            const res = await fetchCoXacThuc(`/Donhangs/${order.iddonhang}/chitiet`);
            if (res.ok) {
                const data = await res.json();
                const rawDetails = data.result || [];

                // --- 🔴 DEBUG LOG: In ra toàn bộ dữ liệu nhận được ---
                // console.log("👉 [1] Dữ liệu API trả về (data.result):", rawDetails);

                // if (rawDetails.length > 0) {
                //     const item = rawDetails[0];
                //     // console.log("👉 [2] Soi kỹ phần tử đầu tiên:", item);

                //     // Kiểm tra xem tên biến chính xác là gì (thường API Java hay trả về camelCase)
                //     // console.log("   - Check 1 (chữ thường):", item.soluongkgthucte);
                //     // console.log("   - Check 2 (camelCase):", item.soLuongKgThucTe);
                //     // console.log("   - Check 3 (tên cũ):", item.khoiluongthucte);
                // }
                // -----------------------------------------------------

                const mappedDetails = rawDetails.map(d => {
                    // Xử lý thông minh: Thử lấy cả 2 trường hợp (chữ thường hoặc camelCase)
                    // Backend Java thường tự đổi "soluongkgthucte" thành "soLuongKgThucTe"
                    const valThucTe = d.soluongkgthucte ?? d.soLuongKgThucTe ?? d.khoiluongthucte ?? 0;
                    const valDuKien = d.soluongkgthuctequydoi ?? d.soLuongKgThucTeQuyDoi ?? d.khoiluongdukien ?? 0;
                    const valTienDuKien = d.tongtiendukien ?? d.tongTienDuKien ?? d.thanhtiendukien ?? 0;
                    const valTienThucTe = d.tongtienthucte ?? d.tongTienThucTe ?? d.thanhtienthucte ?? 0;

                    return {
                        ...d,
                        // Lưu giá trị chuẩn vào biến mới để dùng trong render
                        finalSoluongKgThucTe: valThucTe,
                        finalSoluongKgDuKien: valDuKien,
                        finalTienDuKien: valTienDuKien,
                        finalTienThucTe: valTienThucTe,

                        // Logic cũ của bạn
                        editWeight: valThucTe > 0 ? valThucTe : valDuKien,
                        calculatedPrice: valDuKien > 0 ? (valTienDuKien / valDuKien) : 0
                    };
                });

                // console.log("👉 [3] Dữ liệu sau khi Map:", mappedDetails);
                setViewDetails(mappedDetails);
            }
        } catch (error) { console.error(error); }
        finally { setLoadingDetails(false); }
    };
    // 2. Hàm xử lý khi gõ vào ô Input cân nặng
    const handleWeightInputChange = (idDetail, newVal) => {
        const val = parseFloat(newVal) || 0;
        setViewDetails(prev => prev.map(item => {
            if (item.idchitietdonhang === idDetail) {
                return {
                    ...item,
                    editWeight: val,
                    // Tính lại thành tiền thực tế tạm thời trên UI
                    thanhtienthucte: val * item.calculatedPrice
                };
            }
            return item;
        }));
        setIsEdited(true);
    };

    // 3. Hàm Lưu xuống Server
    const handleSaveRealWeight = async () => {
        if (!selectedOrder) return;

        const payload = viewDetails.map(item => ({
            idChitietdonhang: item.idchitietdonhang,
            soluongkgthucte: item.editWeight
        }));

        try {
            const res = await fetchCoXacThuc(`/Donhangs/${selectedOrder.iddonhang}/cap-nhat-can-nang`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Đã cập nhật cân nặng thực tế!");
                setIsEdited(false);
                fetchInitialData(); 
            } else {
                // --- [SỬA ĐỔI]: Đọc lỗi chi tiết từ Backend ---
                try {
                    const errData = await res.json();
                    // Hiển thị message từ Backend (vd: "Kho không đủ hàng!...") hoặc fallback nếu không có
                    alert("Lỗi: " + (errData.message || "Cập nhật thất bại"));
                } catch (e) {
                    alert("Lỗi cập nhật: Không thể đọc phản hồi từ server");
                }
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối hệ thống!");
        }
    };

    // Hàm tự động tính giá
    const getAutoPrice = (repoId, customerId) => {
        if (!repoId || !customerId) return 0;
        const customer = customers.find(c => c.idtaikhoan == customerId);
        if (!customer) return 0;

        const roleId = Number(customer.idvaitro?.id || customer.idvaitro);
        const isWholesale = roleId === 5;

        const activePrice = priceList.find(p =>
            p.idChitietcaban == repoId && p.trangThai === "Đang áp dụng"
        );

        if (!activePrice) return 0;
        return isWholesale ? activePrice.giaBanSi : activePrice.giaBanLe;
    };

    // --- LOGIC TẠO ĐƠN HÀNG ---
    const handleCustomerChange = (customerId) => {
        setNewOrder({ ...newOrder, idthongtinkhachhang: customerId });
        if (currentItem.repoId) {
            const newPrice = getAutoPrice(currentItem.repoId, customerId);
            setCurrentItem(prev => ({ ...prev, pricePerKg: newPrice }));
        }
    };

    const handleFishChange = async (fishId) => {
        // 1. Reset các lựa chọn cũ
        setCurrentItem(prev => ({ ...prev, fishId: fishId, sizeId: "", repoId: "", pricePerKg: 0 }));
        setSizes([]);

        if (!fishId) return;

        try {
            const res = await fetchCoXacThuc(`/Chitietcabans`);

            if (res.ok) {
                const data = await res.json();
                // Kiểm tra xem data trả về nằm trong .result hay .data hay là mảng trực tiếp
                const allInventory = data.result || data.data || [];

                // console.log("Dữ liệu kho tải về:", allInventory); 

                const validSizes = allInventory
                    .filter(item => {
                        // Backend có thể trả về nhiều kiểu, mình check hết các trường hợp:
                        // 1. idLoaiCa (CamelCase)
                        // 2. idloaica (lowercase) - có thể là object hoặc id trực tiếp
                        const itemIdLoaiCa = item.idLoaiCa || item.idloaica?.id || item.idloaica;

                        // Debug: Uncomment dòng dưới nếu vẫn không hiện để xem nó so sánh cái gì
                        // console.log(`So sánh: Kho(${itemIdLoaiCa}) vs Chọn(${fishId})`);

                        return Number(itemIdLoaiCa) === Number(fishId);
                    })
                    .map(item => ({
                        // Check kỹ tên biến Size (Backend thường trả về idSizeCa hoặc idsizeca)
                        idsizeca: item.idSizeCa || item.idsizeca,
                        sizeca: item.tenSize || item.sizeca,
                        repoId: item.id
                    }));

                // console.log("Danh sách Size sau khi lọc:", validSizes);
                setSizes(validSizes);
            } else {
                console.error("Lỗi gọi API kho:", res.status);
            }
        } catch (error) {
            console.error("Lỗi lấy size từ kho:", error);
        }
    };

    const handleSizeChange = (selectedSizeId) => {
        const selectedSizeObj = sizes.find(s => s.idsizeca == selectedSizeId);
        const repoId = selectedSizeObj ? selectedSizeObj.repoId : "";

        const autoPrice = getAutoPrice(repoId, newOrder.idthongtinkhachhang);

        // Tính lại factor cho Size mới
        let newFactor = currentItem.factor;
        let newEstKg = 0;

        // Nếu đang chọn một đơn vị tính nào đó
        if (currentItem.unitId) {
            const selectedUnit = units.find(u => (u.iddvt || u.id) == currentItem.unitId);

            // Reset về hệ số gốc (VD: Bao = 10, Con = 0)
            const baseFactor = selectedUnit ? selectedUnit.hesokg : 0;

            // Nếu là Con (baseFactor = 0), tìm quy đổi cho repoId MỚI
            if (baseFactor === 0) {
                const specificFactor = getConversionFactor(repoId);
                // Nếu có quy đổi thì dùng, không thì vẫn là 0
                newFactor = specificFactor > 0 ? specificFactor : 0;
            } else {
                newFactor = baseFactor;
            }

            // Tính lại Kg
            if (newFactor > 0) {
                newEstKg = parseFloat((currentItem.quantity * newFactor).toFixed(2));
            }
        }

        setCurrentItem(prev => ({
            ...prev,
            sizeId: selectedSizeId,
            repoId: repoId,
            pricePerKg: autoPrice,
            factor: newFactor,      // Cập nhật factor mới
            estimatedKg: newEstKg   // Cập nhật kg mới
        }));
    };

    const handleUnitChange = (val) => {
        const unitId = Number(val);
        const selectedUnit = units.find(u => (u.iddvt || u.id) == unitId);

        if (!selectedUnit) return;

        // 1. Lấy hệ số gốc từ bảng Đơn vị tính (VD: Bao = 10, Con = 0)
        let factor = selectedUnit.hesokg || 0;

        // 2. [QUAN TRỌNG] Nếu hệ số gốc là 0 (Chọn Con), tìm trong bảng Quy đổi
        if (factor === 0) {
            // Gọi hàm getConversionFactor chỉ với repoId
            const specificFactor = getConversionFactor(currentItem.repoId);

            // Nếu tìm thấy trong bảng quy đổi (VD: 1.00), gán nó làm factor
            if (specificFactor > 0) {
                factor = specificFactor;
            }
        }

        // 3. Tính toán lại số kg ước lượng
        let estKg = 0;
        if (factor > 0) {
            estKg = parseFloat((currentItem.quantity * factor).toFixed(2));
        }

        // Cập nhật state
        setCurrentItem(prev => ({
            ...prev,
            unitId: unitId,
            unitName: selectedUnit.tendvt,
            factor: factor, // Lúc này factor đã là 1.00 -> Input sẽ bị disabled
            estimatedKg: estKg
        }));
    };

    const handleQuantityChange = (qty) => {
        const quantity = parseFloat(qty) || 0;
        let estKg = currentItem.estimatedKg;
        if (currentItem.factor > 0) estKg = quantity * currentItem.factor;
        setCurrentItem(prev => ({ ...prev, quantity: quantity, estimatedKg: estKg }));
    };

    const handleAddItem = () => {
        if (!currentItem.fishId || !currentItem.sizeId || !currentItem.unitId) {
            alert("Vui lòng chọn đầy đủ thông tin!"); return;
        }
        if (!newOrder.idthongtinkhachhang) {
            alert("Vui lòng chọn khách hàng trước!"); return;
        }
        if (currentItem.pricePerKg === 0) {
            alert("Sản phẩm này chưa được thiết lập giá bán!"); return;
        }

        const fish = fishes.find(f => f.id == currentItem.fishId);
        const size = sizes.find(s => s.idsizeca == currentItem.sizeId);
        const totalEstimatedPrice = currentItem.estimatedKg * currentItem.pricePerKg;

        const newItem = {
            id: Date.now(),
            repoId: currentItem.repoId,
            fishId: currentItem.fishId,
            sizeId: currentItem.sizeId,
            fishName: fish?.tenloaica,
            sizeName: size?.sizeca,
            unitId: currentItem.unitId,
            unitName: currentItem.unitName,
            quantity: currentItem.quantity,
            estimatedKg: currentItem.estimatedKg,
            pricePerKg: currentItem.pricePerKg,
            total: totalEstimatedPrice
        };

        setNewOrder({ ...newOrder, items: [...newOrder.items, newItem] });
        setCurrentItem({ ...currentItem, quantity: 1, estimatedKg: 0 });
    };

    const handleRemoveItem = (id) => {
        setNewOrder({ ...newOrder, items: newOrder.items.filter(i => i.id !== id) });
    };

    const handleSubmitOrder = async () => {
        if (!newOrder.idthongtinkhachhang) { alert("Chưa chọn khách hàng!"); return; }
        if (newOrder.items.length === 0) { alert("Đơn hàng rỗng!"); return; }

        const payload = {
            idthongtinkhachhang: newOrder.idthongtinkhachhang,
            trangthaidonhang: "DANG_DONG_HANG",
            chiTietDonHang: newOrder.items.map(item => ({
                idchitietcaban: item.repoId,
                iddonvitinh: item.unitId,
                soluong: item.quantity,
                soluongkgthucte: item.unitName === 'Con' ? item.estimatedKg : 0,
                soluongkgthuctequydoi: item.unitName !== 'Con' ? item.estimatedKg : 0,
                tongtiendukien: item.total,
                tongtienthucte: 0
            }))
        };

        try {
            const res = await fetchCoXacThuc("/Donhangs", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Tạo đơn hàng thành công!");
                setIsCreateModalOpen(false);
                setNewOrder({ idthongtinkhachhang: "", items: [] });
                fetchInitialData();
            } else {
                const err = await res.json();
                alert("Lỗi: " + (err.message || "Không thể tạo đơn"));
            }
        } catch (error) { console.error(error); }
    };

    // const handleUpdateStatus = async (newStatus) => {
    //     if (!selectedOrder) return;
    //     if (!window.confirm(`Xác nhận chuyển trạng thái sang: ${ORDER_STATUS[newStatus].label}?`)) return;
    //     try {
    //         const res = await fetchCoXacThuc(`/Donhangs/${selectedOrder.iddonhang}/status`, {
    //             method: "PUT",
    //             body: JSON.stringify({ trangthaidonhang: newStatus })
    //         });
    //         if (res.ok) {
    //             const updatedOrders = orders.map(o => o.iddonhang === selectedOrder.iddonhang ? { ...o, trangthaidonhang: newStatus } : o);
    //             setOrders(updatedOrders);
    //             setSelectedOrder({ ...selectedOrder, trangthaidonhang: newStatus });
    //             alert("Thành công!");
    //             setIsViewModalOpen(false);
    //         }
    //     } catch (error) { console.error(error); }
    // };

    // Hàm tìm hệ số quy đổi từ bảng Quydoi
    const getConversionFactor = (repoId) => {
        // Log xem repoId (ID kho) truyền vào có đúng không
        // console.log("Check quy đổi cho RepoID:", repoId); 

        if (!repoId) return 0;

        const conversion = conversionList.find(c => {
            // Xử lý trường hợp backend trả về object hoặc id
            // Lưu ý: Kiểm tra kỹ tên biến idchitietcaban hay idChiTietCaBan
            const cRepoId = c.idchitietcaban?.id || c.idchitietcaban || c.idChiTietCaBan;

            return Number(cRepoId) === Number(repoId);
        });

        if (conversion) {
            // console.log("=> Tìm thấy quy đổi:", conversion.sokgtuongung);
            return conversion.sokgtuongung || conversion.soKgTuongUng || 0;
        } else {
            // console.log("=> Không tìm thấy quy đổi cho ID:", repoId);
            return 0;
        }
    };

    // const calculateTotal = (details) => details.reduce((sum, item) => sum + (item.tongtiendukien || 0), 0);
    const calculateTotal = (details) => details.reduce((sum, item) => {
        const itemTotal = item.tongtienthucte > 0 ? item.tongtienthucte : item.tongtiendukien;
        return sum + (itemTotal || 0);
    }, 0);

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedOrder) return;
        // Cảnh báo nếu đang sửa cân mà chưa lưu
        if (isEdited && !window.confirm("Bạn đã sửa cân nặng nhưng chưa Lưu. Tiếp tục đổi trạng thái?")) return;

        if (!window.confirm(`Xác nhận chuyển trạng thái sang: ${ORDER_STATUS[newStatus].label}?`)) return;
        try {
            const res = await fetchCoXacThuc(`/Donhangs/${selectedOrder.iddonhang}/status`, {
                method: "PUT",
                body: JSON.stringify({ trangthaidonhang: newStatus })
            });
            if (res.ok) {
                // Update local state
                const updatedOrders = orders.map(o => o.iddonhang === selectedOrder.iddonhang ? { ...o, trangthaidonhang: newStatus } : o);
                setOrders(updatedOrders);
                setSelectedOrder({ ...selectedOrder, trangthaidonhang: newStatus });
                alert("Thành công!");
                setIsViewModalOpen(false);
            }
        } catch (error) { console.error(error); }
    };

    const filteredOrders = filterStatus === "ALL" ? orders : orders.filter(o => o.trangthaidonhang === filterStatus);

    // --- RENDER MODAL TẠO ĐƠN ---
    const renderCreateModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50">
                    <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                        <span className="material-symbols-outlined">add_shopping_cart</span> Tạo đơn hàng (Admin POS)
                    </h3>
                    <button onClick={() => setIsCreateModalOpen(false)}><span className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors">close</span></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* CỘT TRÁI: FORM */}
                    <div className="lg:col-span-4 space-y-6 border-r border-slate-100 pr-0 lg:pr-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Khách hàng</label>
                            <select className="w-full p-2.5 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" value={newOrder.idthongtinkhachhang} onChange={(e) => handleCustomerChange(e.target.value)}>
                                <option value="">-- Chọn khách hàng --</option>
                                {customers.map(c => {
                                    const roleId = c.idvaitro?.id || c.idvaitro;
                                    const roleName = Number(roleId) === 5 ? "Khách sỉ" : "Khách lẻ";
                                    return <option key={c.idtaikhoan} value={c.idtaikhoan}>{c.ho} {c.ten} ({roleName})</option>;
                                })}
                            </select>
                        </div>
                        <div className="border-t border-slate-200"></div>
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-700">Thông tin sản phẩm</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Loại cá</label>
                                    <select className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500" value={currentItem.fishId} onChange={(e) => handleFishChange(e.target.value)}>
                                        <option value="">-- Chọn --</option>
                                        {fishes.map(f => <option key={f.id} value={f.id}>{f.tenloaica}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Size</label>
                                    <select className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500" value={currentItem.sizeId} onChange={(e) => handleSizeChange(e.target.value)}>
                                        <option value="">-- Chọn --</option>
                                        {sizes.map(s => <option key={s.idsizeca} value={s.idsizeca}>{s.sizeca}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Đơn vị tính</label>
                                <select className="w-full p-2 border rounded-lg bg-white focus:ring-1 focus:ring-blue-500" value={currentItem.unitId} onChange={(e) => handleUnitChange(e.target.value)}>
                                    <option value="">-- Chọn ĐVT --</option>
                                    {units.map(u => <option key={u.iddvt || u.id} value={u.iddvt || u.id}>{u.tendvt} (HS: {u.hesokg})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Số lượng</label>
                                    <input type="number" min="1" className="w-full p-2 border rounded-lg text-center font-bold focus:ring-1 focus:ring-blue-500" value={currentItem.quantity} onChange={(e) => handleQuantityChange(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Kg (Ước lượng)</label>
                                    <input type="number" disabled={currentItem.factor > 0} className={`w-full p-2 border rounded-lg text-center font-bold ${currentItem.factor > 0 ? 'bg-gray-100 text-slate-500' : 'bg-white text-blue-600 border-blue-300'}`} value={currentItem.estimatedKg} onChange={(e) => setCurrentItem({ ...currentItem, estimatedKg: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Giá bán (VNĐ/Kg)</label>
                                <input type="number" className="w-full p-2 border rounded-lg bg-gray-100 font-bold" value={currentItem.pricePerKg} readOnly placeholder="Tự động..." />
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                <span className="text-sm font-medium text-blue-800">Tạm tính:</span>
                                <span className="text-lg font-bold text-blue-700">{(currentItem.estimatedKg * currentItem.pricePerKg).toLocaleString()}đ</span>
                            </div>
                        </div>
                        <button onClick={handleAddItem} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-lg active:scale-95">+ Thêm vào đơn</button>
                    </div>

                    {/* CỘT PHẢI: DANH SÁCH (Fix lỗi tràn -> thêm overflow-x-auto) */}
                    <div className="lg:col-span-8 flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                            <h4 className="font-bold text-slate-700">Danh sách sản phẩm</h4>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{newOrder.items.length} món</span>
                        </div>
                        {/* [SỬA LỖI TRÀN TẠI ĐÂY] */}
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-left text-sm min-w-max"> {/* min-w-max để giữ bảng không bị bóp méo */}
                                <thead className="bg-slate-100 text-slate-500 sticky top-0 shadow-sm z-10">
                                    <tr><th className="p-3">Tên cá</th><th className="p-3">ĐVT</th><th className="p-3 text-center">SL</th><th className="p-3 text-center">Kg</th><th className="p-3 text-right">Giá/Kg</th><th className="p-3 text-right">Thành tiền</th><th className="p-3 text-center">Xóa</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {newOrder.items.map(item => (
                                        <tr key={item.id}>
                                            <td className="p-3"><div className="font-bold text-slate-700">{item.fishName}</div><div className="text-xs text-slate-500">{item.sizeName}</div></td>
                                            <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{item.unitName}</span></td>
                                            <td className="p-3 text-center font-medium">{item.quantity}</td>
                                            <td className="p-3 text-center text-blue-600 font-bold">{item.estimatedKg}</td>
                                            <td className="p-3 text-right">{item.pricePerKg.toLocaleString()}</td>
                                            <td className="p-3 text-right font-bold text-slate-800">{item.total.toLocaleString()}</td>
                                            <td className="p-3 text-center"><button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {newOrder.items.length === 0 && <div className="p-12 text-center text-slate-400 italic">Chưa có sản phẩm nào được chọn</div>}
                        </div>
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex justify-between items-center mb-4"><span className="text-slate-500">Tổng cộng dự kiến:</span><span className="text-3xl font-bold text-blue-700">{newOrder.items.reduce((sum, i) => sum + i.total, 0).toLocaleString()} <span className="text-lg text-slate-400 font-normal">VNĐ</span></span></div>
                            <button onClick={handleSubmitOrder} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 text-lg transition-all active:scale-95">Hoàn tất đơn hàng</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout title="Quản Lý Đơn Hàng">
            {/* Toolbar - [SỬA LỖI TRÀN] Dùng flex-wrap thay vì scroll ngang */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    <button onClick={() => setFilterStatus("ALL")} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${filterStatus === "ALL" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100 shadow-sm"}`}>Tất cả</button>
                    {Object.keys(ORDER_STATUS).map(status => (
                        <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${filterStatus === status ? "bg-white ring-2 ring-blue-500 text-blue-700 shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"}`}>
                            <span className={`size-2 rounded-full ${ORDER_STATUS[status].color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                            {ORDER_STATUS[status].label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap shrink-0">
                    <span className="material-symbols-outlined">add_shopping_cart</span> Tạo đơn hàng
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]"> {/* min-w để tránh bảng bị co quá mức trên mobile */}
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Mã Đơn</th>
                                <th className="p-4">Khách Hàng</th>
                                <th className="p-4">Ngày Đặt</th>
                                <th className="p-4">Trạng Thái</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center">Đang tải...</td></tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((item) => {
                                    const statusConfig = ORDER_STATUS[item.trangthaidonhang] || { label: item.trangthaidonhang, color: "bg-gray-100" };
                                    return (
                                        <tr key={item.iddonhang} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 font-mono font-medium text-blue-600">#{item.iddonhang.substring(0, 8)}...</td>
                                            <td className="p-4 font-medium">{item.tenKhachHang || "Khách lẻ"}</td>
                                            <td className="p-4 text-slate-500">{new Date(item.ngaydat).toLocaleString('vi-VN')}</td>
                                            <td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex w-fit items-center gap-1 ${statusConfig.color}`}><span className="material-symbols-outlined text-[14px]">{statusConfig.icon}</span>{statusConfig.label}</span></td>
                                            <td className="p-4 text-center"><button onClick={() => handleViewDetail(item)} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors">Xem chi tiết</button></td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Không có đơn hàng nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Render Create Modal */}
            {isCreateModalOpen && renderCreateModal()}

            {/* Render View Modal (Giữ nguyên) */}
            {isViewModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {selectedOrder.trangthaidonhang === "DANG_DONG_HANG" ? "📦 Cân & Đóng Hàng" : "Chi tiết đơn hàng"} #{selectedOrder.iddonhang.substring(0, 8)}
                            </h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Thông tin khách & trạng thái (Giữ nguyên) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-blue-600">person</span>Thông tin khách hàng</h4>
                                    <p className="text-sm text-slate-600"><span className="font-medium">Họ tên:</span> {selectedOrder.tenKhachHang || "..."}</p>
                                    <p className="text-sm text-slate-600"><span className="font-medium">SĐT:</span> {selectedOrder.sdtKhachHang || "..."}</p>
                                </div>

                                {/* Cột Action - Thêm nút Lưu cân nặng */}
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-orange-600">local_shipping</span> Trạng thái: {ORDER_STATUS[selectedOrder.trangthaidonhang].label}
                                    </h4>

                                    {/* [MỚI] NÚT LƯU CÂN NẶNG - CHỈ HIỆN KHI ĐANG ĐÓNG HÀNG */}
                                    {selectedOrder.trangthaidonhang === "DANG_DONG_HANG" && (
                                        <div className="mb-3">
                                            <button
                                                onClick={handleSaveRealWeight}
                                                disabled={!isEdited}
                                                className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isEdited ? "bg-yellow-500 text-white hover:bg-yellow-600 shadow-md animate-pulse" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                                            >
                                                <span className="material-symbols-outlined">save</span>
                                                {isEdited ? "Lưu Cân Nặng Thực Tế" : "Đã lưu cân nặng"}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {/* Các nút chuyển trạng thái cũ */}
                                        {(selectedOrder.trangthaidonhang === "CHO_XAC_NHAN" || selectedOrder.trangthaidonhang === "DA_THANH_TOAN") && (
                                            <button onClick={() => handleUpdateStatus("DANG_DONG_HANG")} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 whitespace-nowrap">Bắt đầu đóng hàng</button>
                                        )}
                                        {selectedOrder.trangthaidonhang === "DANG_DONG_HANG" && (
                                            <button onClick={() => handleUpdateStatus("DANG_VAN_CHUYEN")} className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 whitespace-nowrap">Giao Vận chuyển</button>
                                        )}
                                        {selectedOrder.trangthaidonhang === "DANG_VAN_CHUYEN" && (
                                            <button onClick={() => handleUpdateStatus("GIAO_HANG_THANH_CONG")} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 whitespace-nowrap">Hoàn tất</button>
                                        )}
                                        {!["GIAO_HANG_THANH_CONG", "HUY", "DANG_VAN_CHUYEN"].includes(selectedOrder.trangthaidonhang) && (
                                            <button onClick={() => handleUpdateStatus("HUY")} className="px-3 py-2 border border-red-200 text-red-600 rounded-lg font-bold text-xs hover:bg-red-50">Hủy</button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* [MỚI] TABLE CHI TIẾT SẢN PHẨM CÓ INPUT */}
                            <h4 className="font-bold text-slate-800 mb-3">Chi tiết sản phẩm</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm min-w-[700px]">
                                        <thead className="bg-blue-50 border-b text-blue-900 font-bold">
                                            <tr>
                                                <th className="p-3">Sản phẩm</th>
                                                <th className="p-3">Size</th>
                                                {/* [MỚI] Thêm cột ĐVT vào Header */}
                                                <th className="p-3 text-center">ĐVT</th>
                                                <th className="p-3 text-center">SL</th>
                                                <th className="p-3 text-center text-slate-500">Dự kiến(Kg)</th>
                                                {/* Cột thực tế làm nổi bật */}
                                                <th className="p-3 text-center bg-yellow-100 text-yellow-800 border-x border-yellow-200 w-[140px]">
                                                    {selectedOrder.trangthaidonhang === "DANG_DONG_HANG" ? "✏️ Nhập Kg thật" : "Kg Thực tế"}
                                                </th>
                                                <th className="p-3 text-right">Đơn giá</th>
                                                <th className="p-3 text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {loadingDetails ? (<tr><td colSpan="8" className="p-4 text-center">Đang tải...</td></tr>) : viewDetails.length > 0 ? (
                                                viewDetails.map(d => {

                                                    // console.log("----- DEBUG ĐƠN VỊ TÍNH -----");
                                                    // console.log("1. Danh sách Units (đã tải):", units);
                                                    // console.log("2. Chi tiết dòng này (d):", d);
                                                    // console.log("3. ID ĐVT tìm được từ dòng:", d.iddonvitinh || d.idDonViTinh || d.donvitinh?.id);


                                                    const isEditingMode = selectedOrder.trangthaidonhang === "DANG_DONG_HANG";

                                                    // Dùng biến final đã xử lý ở trên
                                                    const hienThiTien = d.finalTienThucTe > 0 ? d.finalTienThucTe : d.finalTienDuKien;

                                                    // --- [SỬA LỖI TẠI ĐÂY] ---
                                                    // 1. Lấy ID đơn vị tính từ dòng chi tiết (Check các trường hợp backend trả về)
                                                    const detailUnitId = d.iddonvitinh || d.idDonViTinh || (d.donvitinh && (d.donvitinh.id || d.donvitinh.iddvt));

                                                    // 2. Tìm đối tượng Unit trong danh sách units (đã tải ở đầu trang)
                                                    const foundUnit = units.find(u => Number(u.id || u.iddvt) === Number(detailUnitId));

                                                    // 3. Lấy tên: Ưu tiên tìm thấy trong list -> Nếu không thì lấy text từ API -> Cuối cùng là "-"
                                                    const tenDVT = foundUnit ? foundUnit.tendvt : (d.tenDonViTinh || d.donvitinh?.tendvt || "-");
                                                    return (
                                                        <tr key={d.idchitietdonhang}>
                                                            <td className="p-3 font-medium">{d.tenLoaiCa || d.chitietcaban?.tenloaica}</td>
                                                            <td className="p-3 text-slate-500">{d.tenSize || d.chitietcaban?.tensize}</td>

                                                            {/* [MỚI] Thêm cột hiển thị ĐVT riêng */}
                                                            <td className="p-3 text-center">
                                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">
                                                                    {tenDVT}
                                                                </span>
                                                            </td>

                                                            {/* [SỬA] Cột SL chỉ hiển thị số lượng (đã bỏ phần text nhỏ) */}
                                                            <td className="p-3 text-center font-bold">{d.soluong}</td>

                                                            {/* HIỂN THỊ DỰ KIẾN */}
                                                            <td className="p-3 text-center text-slate-400">
                                                                {d.finalSoluongKgDuKien ? d.finalSoluongKgDuKien.toLocaleString() : "-"}
                                                            </td>

                                                            {/* Ô NHẬP LIỆU */}
                                                            <td className={`p-2 text-center border-x ${isEditingMode ? 'bg-yellow-50' : ''}`}>
                                                                {isEditingMode ? (
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        className="w-full text-center font-bold text-blue-700 bg-white border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none py-1"
                                                                        value={d.editWeight}
                                                                        onChange={(e) => handleWeightInputChange(d.idchitietdonhang, e.target.value)}
                                                                    />
                                                                ) : (
                                                                    // HIỂN THỊ THỰC TẾ
                                                                    <span className="font-bold text-slate-800">
                                                                        {d.finalSoluongKgThucTe ? d.finalSoluongKgThucTe.toLocaleString() : "-"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="p-3 text-right text-slate-500">{d.calculatedPrice?.toLocaleString()}</td>
                                                            <td className="p-3 text-right font-bold text-slate-800">{hienThiTien?.toLocaleString()}đ</td>
                                                        </tr>
                                                    )
                                                })
                                            ) : (<tr><td colSpan="8" className="p-4 text-center">Trống</td></tr>)}
                                        </tbody>
                                        <tfoot className="bg-slate-50">
                                            <tr>
                                                {/* [SỬA] Tăng colSpan lên 7 vì đã thêm 1 cột */}
                                                <td colSpan="7" className="p-3 text-right font-bold">TỔNG CỘNG THỰC TẾ:</td>
                                                <td className="p-3 text-right font-bold text-blue-600 text-xl">{calculateTotal(viewDetails).toLocaleString()}đ</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}