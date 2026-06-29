import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const fmt = (val) => new Intl.NumberFormat("vi-VN").format(val || 0) + "đ";

const FIELD = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30";
const LABEL = "block text-xs font-bold text-slate-500 mb-1";

export default function TaoDonHang() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- 1. STATE QUẢN LÝ KHÁCH HÀNG ---
    const [customerType, setCustomerType] = useState("LE"); // Loại khách: "LE" (Lẻ) hoặc "SI" (Sỉ)
    const [customerConfirmed, setCustomerConfirmed] = useState(false); // Cờ xác nhận đã nhập/chọn xong thông tin khách
    const [customers, setCustomers] = useState([]); // Danh sách khách sỉ (từ API tài khoản)

    // --- 2. STATE QUẢN LÝ DỮ LIỆU KHO (MASTER DATA) ---
    const [fishes, setFishes] = useState([]); // Toàn bộ dữ liệu chi tiết cá bán
    const [sizes, setSizes] = useState([]); // Danh sách size tương ứng với loại cá đang chọn
    const [units, setUnits] = useState([]); // Danh sách đơn vị tính (Con, Lô, Kg...)
    const [priceList, setPriceList] = useState([]); // Bảng giá hiện hành
    const [conversionList, setConversionList] = useState([]); // Bảng quy đổi (để tính ra số Kg tương ứng)

    // --- 3. STATE QUẢN LÝ ĐƠN HÀNG VÀ CHI TIẾT ---
    const [order, setOrder] = useState({ idthongtinkhachhang: "", tenKhachLe: "", sdtKhachLe: "", items: [] });
    // item: Lưu thông tin của 1 dòng sản phẩm đang được chọn trước khi bấm "Thêm" vào đơn
    const [item, setItem] = useState({ fishId: "", sizeId: "", repoId: "", unitId: "", unitName: "", factor: 0, quantity: 1, estimatedKg: 0, pricePerKg: 0 });

    // --- 4. STATE TRẠNG THÁI THANH TOÁN ---
    const [done, setDone] = useState(false); // Cờ báo hiệu đơn hàng đã tạo thành công
    const [doneTotal, setDoneTotal] = useState(0); // Lưu lại tổng tiền để hiển thị sau khi hoàn tất

    // --- EFFECT LẤY DỮ LIỆU ĐẦU VÀO ---
    useEffect(() => {
        // Tải đồng loạt 5 API cần thiết cho màn hình POS
        Promise.all([
            api.get("/tai-khoan"),
            api.get("/Chitietcabans"),
            api.get("/Donvitinhs"),
            api.get("/Banggias"),
            api.get("/Quydois"),
        ]).then(([resCust, resFish, resUnits, resPrices, resConv]) => {
            setCustomers((resCust.data?.result || []).filter(u => u.vaitro === "CUSTOMER")); // Lọc ra tài khoản là khách hàng
            setFishes(resFish.data?.result || []);
            setUnits(resUnits.data?.result || []);
            setPriceList(resPrices.data?.result || []);
            setConversionList(resConv.data?.result || []);
        }).catch(() => showToast("Không thể tải dữ liệu!", "error"));
    }, []);

    // Lọc ra danh sách "Loại cá" duy nhất từ kho để hiển thị ở Dropdown đầu tiên
    const fishTypes = fishes.reduce((acc, f) => {
        if (!acc.some(x => x.id === f.idLoaiCa)) acc.push({ id: f.idLoaiCa, ten: f.tenLoaiCa });
        return acc;
    }, []);

    // --- CÁC HÀM TIỆN ÍCH TÍNH TOÁN ---
    // Lấy hệ số quy đổi ra Kg dựa vào id chi tiết cá bán
    const getFactor = (repoId) =>
        conversionList.find(c => Number(c.idchitietcaban?.id) === Number(repoId))?.sokgtuongung || 0;

    // Tra cứu giá bán (Sỉ hoặc Lẻ) tùy thuộc vào loại khách hàng hiện tại
    const getPrice = (repoId) => {
        const p = priceList.find(p => Number(p.idChitietcaban) === Number(repoId) && p.trangThai === "Đang áp dụng");
        if (!p) return 0;
        return customerType === "SI" ? p.giaBanSi : p.giaBanLe;
    };

    // --- CÁC HÀM XỬ LÝ KHI NGƯỜI DÙNG THAO TÁC TRÊN FORM ---

    // 1. Khi chọn Loại Cá: Reset size, repoId, giá và lọc lại danh sách Size phù hợp
    const handleFishChange = (fishId) => {
        setItem(prev => ({ ...prev, fishId, sizeId: "", repoId: "", pricePerKg: 0 }));
        setSizes(fishes
            .filter(f => Number(f.idLoaiCa) === Number(fishId))
            .map(f => ({ idsizeca: f.idSizeCa, sizeca: f.tenSize, repoId: f.id }))
        );
    };

    // 2. Khi chọn Size: Tìm ra chi tiết lô (repoId), tra cứu lại giá và tính lại số Kg ước tính
    const handleSizeChange = (sizeId) => {
        const sz = sizes.find(s => s.idsizeca == sizeId);
        const repoId = sz?.repoId || "";
        // Nếu đã chọn Đơn vị tính thì lấy hệ số của đơn vị đó, ngược lại lấy hệ số từ bảng quy đổi
        const factor = item.unitId ? (units.find(u => u.id == item.unitId)?.hesokg || getFactor(repoId)) : 0;
        setItem(prev => ({
            ...prev, sizeId, repoId,
            pricePerKg: getPrice(repoId),
            factor,
            estimatedKg: factor > 0 ? parseFloat((prev.quantity * factor).toFixed(2)) : 0,
        }));
    };

    // 3. Khi chọn Đơn vị tính: Cập nhật lại hệ số và tính lại số Kg ước tính
    const handleUnitChange = (unitId) => {
        const u = units.find(u => u.id == Number(unitId));
        if (!u) return;
        const factor = u.hesokg || getFactor(item.repoId) || 0;
        setItem(prev => ({
            ...prev, unitId: Number(unitId), unitName: u.tendvt, factor,
            estimatedKg: factor > 0 ? parseFloat((prev.quantity * factor).toFixed(2)) : prev.estimatedKg,
        }));
    };

    // 4. Khi nhập Số lượng: Tự động nhân với hệ số quy đổi ra số Kg ước tính
    const handleQtyChange = (qty) => {
        const quantity = parseFloat(qty) || 0;
        setItem(prev => ({ ...prev, quantity, estimatedKg: prev.factor > 0 ? quantity * prev.factor : prev.estimatedKg }));
    };

    // 5. Thêm sản phẩm vừa chọn vào giỏ hàng (mảng items trong order)
    const handleAddItem = () => {
        if (!item.fishId || !item.sizeId || !item.unitId) { showToast("Điền thiếu thông tin!", "error"); return; }
        if (!item.pricePerKg) { showToast("Chưa có giá bán!", "error"); return; }

        const fish = fishTypes.find(f => f.id == item.fishId);
        const size = sizes.find(s => s.idsizeca == item.sizeId);

        // Đẩy item vào mảng items và tính luôn Thành tiền (total) = Kg ước tính * Giá/Kg
        setOrder(prev => ({
            ...prev, items: [...prev.items, {
                id: Date.now(), repoId: item.repoId, unitId: item.unitId, unitName: item.unitName,
                fishName: fish?.ten, sizeName: size?.sizeca, quantity: item.quantity,
                estimatedKg: item.estimatedKg, pricePerKg: item.pricePerKg,
                total: item.estimatedKg * item.pricePerKg,
            }]
        }));

        // Reset form nhập liệu để chọn sản phẩm tiếp theo
        setItem(prev => ({ ...prev, quantity: 1, estimatedKg: 0 }));
    };

    // Xác nhận thông tin khách hàng hợp lệ trước khi cho phép bấm thanh toán
    const handleConfirmCustomer = () => {
        if (customerType === "LE" && !order.tenKhachLe.trim()) { showToast("Vui lòng nhập tên khách!", "error"); return; }
        if (customerType === "SI" && !order.idthongtinkhachhang) { showToast("Vui lòng chọn khách sỉ!", "error"); return; }
        setCustomerConfirmed(true);
    };

    // Tính tổng tiền của toàn bộ đơn hàng
    const orderTotal = order.items.reduce((sum, i) => sum + i.total, 0);

    // --- HÀM SUBMIT TẠO ĐƠN HÀNG LÊN SERVER ---
    const handleSubmit = async () => {
        if (!order.items.length) { showToast("Đơn hàng đang trống!", "error"); return; }

        const si = customers.find(c => c.idtaikhoan === order.idthongtinkhachhang);

        // Đóng gói payload tương thích với API Donhangs
        const payload = {
            idthongtinkhachhang: customerType === "LE" ? null : order.idthongtinkhachhang,
            tenKhachHang: customerType === "LE" ? order.tenKhachLe : `${si?.ho} ${si?.ten}`,
            sdtKhachHang: customerType === "LE" ? order.sdtKhachLe : si?.sodienthoai,
            trangthaidonhang: "DA_THANH_TOAN", // Mặc định POS là thanh toán ngay
            ghichu: "[POS]", // Gắn tag để phân biệt với đơn đặt online
            chiTietDonHang: order.items.map(i => ({
                idchitietcaban: i.repoId, iddonvitinh: i.unitId, soluong: i.quantity,
                soluongkgthucte: i.estimatedKg, soluongkgthuctequydoi: i.estimatedKg,
                tongtiendukien: i.total, tongtienthucte: i.total,
            })),
        };

        try {
            await api.post("/Donhangs", payload);
            setDoneTotal(orderTotal); // Lưu lại tổng tiền để show màn hình thành công
            setDone(true); // Bật cờ hoàn tất
        } catch {
            showToast("Lỗi tạo đơn hàng!", "error");
        }
    };

    if (done) return (
        <AdminLayout title="Tạo Đơn Hàng">
            <div className="max-w-sm mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-10 text-center">
                    <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-8 text-green-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 mb-1">Đơn hàng thành công!</h3>
                    <p className="text-slate-500 text-sm mb-1">Tổng tiền thu</p>
                    <p className="text-3xl font-bold text-cyan-600">{fmt(doneTotal)}</p>
                </div>
                <div className="px-6 pb-6">
                    <button onClick={() => navigate("/admin/QuanLyDonHang")} className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-700 transition-colors cursor-pointer">
                        Về danh sách đơn hàng
                    </button>
                </div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout title="Tạo Đơn Hàng">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-sm">

                {/* ── CỘT TRÁI ── */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <p className="font-bold text-slate-700">Thông tin đơn hàng</p>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Bước 1: Khách hàng */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 1 — Khách hàng</p>
                            <div className="flex gap-4">
                                {["LE", "SI"].map(t => (
                                    <label key={t} className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                                        <input type="radio" checked={customerType === t} disabled={customerConfirmed} onChange={() => {
                                            setCustomerType(t);
                                            setOrder({ idthongtinkhachhang: "", tenKhachLe: "", sdtKhachLe: "", items: [] });
                                            setItem({ fishId: "", sizeId: "", repoId: "", unitId: "", unitName: "", factor: 0, quantity: 1, estimatedKg: 0, pricePerKg: 0 });
                                            setSizes([]);
                                        }} className="accent-cyan-600" />
                                        {t === "LE" ? "Khách lẻ" : "Khách sỉ"}
                                    </label>
                                ))}
                            </div>

                            {customerType === "LE" ? (
                                <div className="space-y-2">
                                    <input type="text" placeholder="Tên khách hàng *" disabled={customerConfirmed} className={FIELD} value={order.tenKhachLe} onChange={e => setOrder({ ...order, tenKhachLe: e.target.value })} />
                                    <input type="text" placeholder="Số điện thoại" disabled={customerConfirmed} className={FIELD} value={order.sdtKhachLe} onChange={e => setOrder({ ...order, sdtKhachLe: e.target.value })} />
                                </div>
                            ) : (
                                <select className={FIELD} disabled={customerConfirmed} value={order.idthongtinkhachhang} onChange={e => setOrder({ ...order, idthongtinkhachhang: e.target.value })}>
                                    <option value="">-- Chọn khách sỉ --</option>
                                    {customers.map(c => <option key={c.idtaikhoan} value={c.idtaikhoan}>{c.ho} {c.ten} ({c.sodienthoai || "—"})</option>)}
                                </select>
                            )}

                            {customerConfirmed ? (
                                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                                    <span className="text-green-700 text-xs font-bold">Đã xác nhận khách hàng</span>
                                    <button onClick={() => setCustomerConfirmed(false)} className="text-xs text-slate-400 hover:text-red-500 cursor-pointer">Sửa</button>
                                </div>
                            ) : (
                                <button onClick={handleConfirmCustomer} className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-colors cursor-pointer">
                                    Xác nhận khách hàng
                                </button>
                            )}
                        </div>

                        {/* Bước 2: Sản phẩm */}
                        <div className={`space-y-3 transition-opacity ${!customerConfirmed ? "opacity-30 pointer-events-none" : ""}`}>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 2 — Thêm mặt hàng</p>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={LABEL}>Loại cá</label>
                                    <select className={FIELD} value={item.fishId} onChange={e => handleFishChange(e.target.value)}>
                                        <option value="">-- Chọn --</option>
                                        {fishTypes.map(f => <option key={f.id} value={f.id}>{f.ten}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL}>Size</label>
                                    <select className={FIELD} value={item.sizeId} onChange={e => handleSizeChange(e.target.value)}>
                                        <option value="">-- Chọn --</option>
                                        {sizes.map(s => <option key={s.idsizeca} value={s.idsizeca}>{s.sizeca}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={LABEL}>Đơn vị tính</label>
                                <select className={FIELD} value={item.unitId} onChange={e => handleUnitChange(e.target.value)}>
                                    <option value="">-- Chọn --</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.tendvt}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={LABEL}>Số lượng</label>
                                    <input type="number" min="1" className={FIELD + " text-center font-bold"} value={item.quantity} onChange={e => handleQtyChange(e.target.value)} />
                                </div>
                                <div>
                                    <label className={LABEL}>Kg ước tính</label>
                                    <input type="number" disabled={item.factor > 0} className={FIELD + " text-center font-bold disabled:bg-slate-50"} value={item.estimatedKg} onChange={e => setItem({ ...item, estimatedKg: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>

                            <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold">Đơn giá</span>
                                <span className="font-bold text-slate-800">{fmt(item.pricePerKg)}</span>
                            </div>

                            <button onClick={handleAddItem} className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-colors cursor-pointer">
                                + Thêm vào giỏ
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── CỘT PHẢI ── */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <p className="font-bold text-slate-700">Danh sách mặt hàng</p>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700">
                            {order.items.length} món
                        </span>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left min-w-[600px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4">Sản phẩm</th>
                                    <th className="p-4">ĐVT</th>
                                    <th className="p-4 text-center">SL</th>
                                    <th className="p-4 text-center">Kg</th>
                                    <th className="p-4 text-right">Đơn giá</th>
                                    <th className="p-4 text-right">Thành tiền</th>
                                    <th className="p-4" />
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {order.items.length === 0 ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Chưa có sản phẩm nào.</td></tr>
                                ) : order.items.map(i => (
                                    <tr key={i.id} className="hover:bg-slate-50/50">
                                        <td className="p-4">
                                            <p className="font-bold text-slate-900">{i.fishName}</p>
                                            <p className="text-xs text-slate-500">{i.sizeName}</p>
                                        </td>
                                        <td className="p-4 text-slate-600">{i.unitName}</td>
                                        <td className="p-4 text-center font-bold text-slate-700">{i.quantity}</td>
                                        <td className="p-4 text-center font-bold text-cyan-600">{i.estimatedKg} kg</td>
                                        <td className="p-4 text-right text-slate-500 text-xs">{fmt(i.pricePerKg)}</td>
                                        <td className="p-4 text-right font-bold text-slate-900">{fmt(i.total)}</td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => setOrder(prev => ({ ...prev, items: prev.items.filter(x => x.id !== i.id) }))} className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 cursor-pointer">
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-600 font-bold">Tổng tiền cần thu</span>
                            <span className="text-2xl font-bold text-cyan-600">{fmt(orderTotal)}</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => navigate("/admin/QuanLyDonHang")} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 text-sm cursor-pointer transition-colors">
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!order.items.length}
                                className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Hoàn tất xuất hóa đơn
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
