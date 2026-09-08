import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

// ISO: 1 = thứ Hai … 7 = Chủ nhật. Giữ đúng chuẩn của java.time.DayOfWeek để FE và BE nói cùng
// một ngôn ngữ, không phải quy đổi ở giữa.
const CAC_THU = [
    { value: 1, nhan: "T2" },
    { value: 2, nhan: "T3" },
    { value: 3, nhan: "T4" },
    { value: 4, nhan: "T5" },
    { value: 5, nhan: "T6" },
    { value: 6, nhan: "T7" },
    { value: 7, nhan: "CN" },
];

const FORM_RONG = {
    tenlich: "",
    cacNgayTrongTuan: [],
    ngaybatdau: new Date().toISOString().slice(0, 10),
    ngayketthuc: "",
    ghichu: "",
    chiTiet: [],
};

const dinhDangNgay = (chuoi) =>
    chuoi ? new Date(chuoi).toLocaleDateString("vi-VN") : "—";

export default function DatHangDinhKy() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const laKhachSi = user?.vaitro === "CUSTOMER";

    const [danhSach, setDanhSach] = useState([]);
    const [sanPham, setSanPham] = useState([]);
    const [donViTinh, setDonViTinh] = useState([]);
    const [loading, setLoading] = useState(true);

    const [moForm, setMoForm] = useState(false);
    const [dangSuaId, setDangSuaId] = useState(null);
    const [form, setForm] = useState(FORM_RONG);
    const [dangLuu, setDangLuu] = useState(false);

    const taiDanhSach = useCallback(() => {
        setLoading(true);
        api.get("/LichDatHang")
            .then(res => setDanhSach(res.data.result || []))
            .catch(() => showToast("Không tải được danh sách lịch đặt hàng!", "error"))
            .finally(() => setLoading(false));
    }, [showToast]);

    useEffect(() => {
        if (authLoading || !laKhachSi) return;
        taiDanhSach();

        Promise.all([api.get("/Chitietcabans"), api.get("/Donvitinhs")])
            .then(([resSp, resDvt]) => {
                setSanPham(resSp.data.result || []); // API đã loại sẵn sản phẩm ngừng kinh doanh
                setDonViTinh(resDvt.data.result || []);
            })
            .catch(() => showToast("Không tải được danh mục sản phẩm!", "error"));
    }, [authLoading, laKhachSi, taiDanhSach, showToast]);

    const donViMacDinh = useMemo(() => donViTinh[0]?.id ?? 1, [donViTinh]);

    // --- Thao tác trên form ---

    const moFormTao = () => {
        setDangSuaId(null);
        setForm(FORM_RONG);
        setMoForm(true);
    };

    const moFormSua = (lich) => {
        setDangSuaId(lich.idlich);
        setForm({
            tenlich: lich.tenlich || "",
            cacNgayTrongTuan: [...(lich.cacNgayTrongTuan || [])],
            ngaybatdau: lich.ngaybatdau || "",
            ngayketthuc: lich.ngayketthuc || "",
            ghichu: lich.ghichu || "",
            chiTiet: (lich.chiTiet || []).map(ct => ({
                idchitietcaban: ct.idchitietcaban,
                iddonvitinh: ct.iddonvitinh,
                soluong: ct.soluong,
            })),
        });
        setMoForm(true);
    };

    const doiThu = (thu) => {
        setForm(prev => ({
            ...prev,
            cacNgayTrongTuan: prev.cacNgayTrongTuan.includes(thu)
                ? prev.cacNgayTrongTuan.filter(t => t !== thu)
                : [...prev.cacNgayTrongTuan, thu].sort((a, b) => a - b),
        }));
    };

    const themDong = () => {
        if (sanPham.length === 0) return;
        setForm(prev => ({
            ...prev,
            chiTiet: [...prev.chiTiet, {
                idchitietcaban: sanPham[0].id,
                iddonvitinh: donViMacDinh,
                soluong: 1,
            }],
        }));
    };

    const suaDong = (index, truong, giaTri) => {
        setForm(prev => ({
            ...prev,
            chiTiet: prev.chiTiet.map((dong, i) =>
                i === index ? { ...dong, [truong]: giaTri } : dong),
        }));
    };

    const xoaDong = (index) => {
        setForm(prev => ({
            ...prev,
            chiTiet: prev.chiTiet.filter((_, i) => i !== index),
        }));
    };

    const luuForm = async () => {
        if (form.cacNgayTrongTuan.length === 0) {
            showToast("Chọn ít nhất một thứ trong tuần!", "error");
            return;
        }
        if (form.chiTiet.length === 0) {
            showToast("Lịch phải có ít nhất một sản phẩm!", "error");
            return;
        }
        if (form.chiTiet.some(dong => !dong.soluong || Number(dong.soluong) < 1)) {
            showToast("Số lượng của mỗi dòng phải lớn hơn 0!", "error");
            return;
        }

        const payload = {
            tenlich: form.tenlich || null,
            cacNgayTrongTuan: form.cacNgayTrongTuan,
            ngaybatdau: form.ngaybatdau || null,
            ngayketthuc: form.ngayketthuc || null,
            ghichu: form.ghichu || null,
            chiTiet: form.chiTiet.map(dong => ({
                idchitietcaban: Number(dong.idchitietcaban),
                iddonvitinh: Number(dong.iddonvitinh),
                soluong: Number(dong.soluong),
            })),
        };

        setDangLuu(true);
        try {
            if (dangSuaId) {
                await api.put(`/LichDatHang/${dangSuaId}`, payload);
                showToast("Đã cập nhật lịch đặt hàng!", "success");
            } else {
                await api.post("/LichDatHang", payload);
                showToast("Đã tạo lịch đặt hàng định kỳ!", "success");
            }
            setMoForm(false);
            taiDanhSach();
        } catch (err) {
            showToast(err.response?.data?.message || "Không lưu được lịch đặt hàng!", "error");
        } finally {
            setDangLuu(false);
        }
    };

    const doiTrangThai = async (lich) => {
        try {
            await api.put(`/LichDatHang/${lich.idlich}/trang-thai?kichHoat=${!lich.dangkichhoat}`);
            showToast(lich.dangkichhoat ? "Đã tạm dừng lịch." : "Đã bật lại lịch.", "success");
            taiDanhSach();
        } catch (err) {
            showToast(err.response?.data?.message || "Không đổi được trạng thái!", "error");
        }
    };

    const xoaLich = async (lich) => {
        const dongY = await confirm({
            title: "Xóa lịch đặt hàng",
            message: `Xóa lịch "${lich.tenlich || "không tên"}"? Các đơn đã sinh trước đó vẫn được giữ nguyên.`,
            confirmText: "Xóa",
            variant: "danger",
        });
        if (!dongY) return;
        try {
            await api.delete(`/LichDatHang/${lich.idlich}`);
            showToast("Đã xóa lịch đặt hàng.", "success");
            taiDanhSach();
        } catch (err) {
            showToast(err.response?.data?.message || "Không xóa được lịch!", "error");
        }
    };

    // --- Các trạng thái không hiển thị được nội dung ---

    if (authLoading) return null;

    if (!user) {
        return (
            <div className="bg-slate-50 min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-500 mb-4">Vui lòng đăng nhập để dùng đặt hàng định kỳ.</p>
                    <Link to="/login" className="px-6 py-2 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    if (!laKhachSi) {
        return (
            <div className="bg-slate-50 min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <span className="material-symbols-outlined text-5xl text-slate-300">event_repeat</span>
                    <h2 className="font-display text-2xl font-bold text-slate-800 mt-3">Dành cho khách sỉ</h2>
                    <p className="text-slate-500 mt-2">
                        Đặt hàng định kỳ phục vụ nhà hàng, quán ăn lấy hàng đều đặn mỗi tuần.
                        Liên hệ vựa để nâng cấp tài khoản lên khách sỉ.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-800">
                            Đặt hàng định kỳ
                        </h1>
                        <p className="mt-2 text-slate-500 max-w-xl">
                            Khai báo giỏ hàng quen thuộc một lần, mỗi sáng hệ thống tự tạo đơn cho những
                            thứ bạn đã chọn.
                        </p>
                    </div>
                    <button
                        onClick={moFormTao}
                        className="shrink-0 px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Tạo lịch mới
                    </button>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 mb-6 text-sm text-cyan-900">
                    Đơn tự sinh vào <strong>5 giờ sáng</strong> và ở trạng thái <strong>Chờ xác nhận</strong>,
                    đúng như bạn tự đặt. Vựa vẫn cân lại và xác nhận trước khi giao, nên bạn còn kịp báo
                    đổi số lượng trong buổi sáng.
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-16">Đang tải...</div>
                ) : danhSach.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300">event_repeat</span>
                        <p className="text-slate-500 mt-3">Bạn chưa có lịch đặt hàng nào.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {danhSach.map(lich => (
                            <div
                                key={lich.idlich}
                                className={`bg-white rounded-2xl border p-6 transition-colors ${
                                    lich.dangkichhoat ? "border-slate-200" : "border-slate-200 bg-slate-50/60"
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-bold text-lg text-slate-800">
                                                {lich.tenlich || "Lịch không tên"}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                lich.dangkichhoat
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                            }`}>
                                                {lich.dangkichhoat ? "Đang chạy" : "Tạm dừng"}
                                            </span>
                                        </div>

                                        <div className="flex gap-1.5 mt-3 flex-wrap">
                                            {CAC_THU.map(thu => (
                                                <span
                                                    key={thu.value}
                                                    className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold ${
                                                        (lich.cacNgayTrongTuan || []).includes(thu.value)
                                                            ? "bg-cyan-600 text-white"
                                                            : "bg-slate-100 text-slate-400"
                                                    }`}
                                                >
                                                    {thu.nhan}
                                                </span>
                                            ))}
                                        </div>

                                        <ul className="mt-4 space-y-1 text-sm text-slate-600">
                                            {(lich.chiTiet || []).map(ct => (
                                                <li key={ct.idchitietlich} className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[16px] text-slate-300">set_meal</span>
                                                    <span className={ct.ngungKinhDoanh ? "line-through text-slate-400" : ""}>
                                                        {ct.tenLoaiCa} - {ct.tenSize} × {ct.soluong} {ct.tenDonViTinh}
                                                    </span>
                                                    {ct.ngungKinhDoanh && (
                                                        <span className="text-xs font-bold text-rose-500">ngừng kinh doanh</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                                            <span>Lần chạy kế tiếp: <strong className="text-slate-700">{dinhDangNgay(lich.ngayChayKeTiep)}</strong></span>
                                            <span>Chạy gần nhất: {dinhDangNgay(lich.lanchaycuoi)}</span>
                                            {lich.ngayketthuc && <span>Kết thúc: {dinhDangNgay(lich.ngayketthuc)}</span>}
                                        </div>

                                        {/* Lỗi lần chạy gần nhất phải hiện ngay trên thẻ: khách không có cách
                                            nào khác để biết sáng nay đơn của mình không được tạo. */}
                                        {lich.loilanchaycuoi && (
                                            <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
                                                Lần chạy {dinhDangNgay(lich.lanchaycuoi)} không tạo được đơn: {lich.loilanchaycuoi}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex lg:flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => moFormSua(lich)}
                                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => doiTrangThai(lich)}
                                            className="px-4 py-2 rounded-lg border border-cyan-300 text-cyan-700 text-sm font-medium hover:bg-cyan-50 transition-colors cursor-pointer"
                                        >
                                            {lich.dangkichhoat ? "Tạm dừng" : "Bật lại"}
                                        </button>
                                        <button
                                            onClick={() => xoaLich(lich)}
                                            className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- FORM TẠO / SỬA --- */}
            {moForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                            <h3 className="font-bold text-xl text-slate-800">
                                {dangSuaId ? "Sửa lịch đặt hàng" : "Tạo lịch đặt hàng"}
                            </h3>
                            <button onClick={() => setMoForm(false)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-sm font-bold text-slate-700">Tên lịch</label>
                                <input
                                    type="text"
                                    value={form.tenlich}
                                    onChange={e => setForm(p => ({ ...p, tenlich: e.target.value }))}
                                    placeholder="Ví dụ: Hàng sáng thứ 2-4-6"
                                    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700">Các thứ trong tuần</label>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {CAC_THU.map(thu => (
                                        <button
                                            key={thu.value}
                                            type="button"
                                            onClick={() => doiThu(thu.value)}
                                            className={`size-11 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                                                form.cacNgayTrongTuan.includes(thu.value)
                                                    ? "bg-cyan-600 text-white"
                                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            }`}
                                        >
                                            {thu.nhan}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Bắt đầu từ</label>
                                    <input
                                        type="date"
                                        value={form.ngaybatdau}
                                        onChange={e => setForm(p => ({ ...p, ngaybatdau: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Kết thúc</label>
                                    <input
                                        type="date"
                                        value={form.ngayketthuc}
                                        onChange={e => setForm(p => ({ ...p, ngayketthuc: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Bỏ trống = chạy tới khi bạn tắt</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-700">Giỏ hàng mẫu</label>
                                    <button
                                        type="button"
                                        onClick={themDong}
                                        className="text-sm font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Thêm sản phẩm
                                    </button>
                                </div>

                                {form.chiTiet.length === 0 ? (
                                    <p className="mt-2 text-sm text-slate-400 italic">Chưa có sản phẩm nào.</p>
                                ) : (
                                    <div className="mt-2 space-y-2">
                                        {form.chiTiet.map((dong, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <select
                                                    value={dong.idchitietcaban}
                                                    onChange={e => suaDong(index, "idchitietcaban", e.target.value)}
                                                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                                >
                                                    {sanPham.map(sp => (
                                                        <option key={sp.id} value={sp.id}>
                                                            {sp.tenLoaiCa} - {sp.tenSize}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={dong.iddonvitinh}
                                                    onChange={e => suaDong(index, "iddonvitinh", e.target.value)}
                                                    className="w-28 px-2 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                                >
                                                    {donViTinh.map(dvt => (
                                                        <option key={dvt.id} value={dvt.id}>{dvt.tendvt}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={dong.soluong}
                                                    onChange={e => suaDong(index, "soluong", e.target.value)}
                                                    className="w-20 px-2 py-2 rounded-lg border border-slate-200 text-sm text-right outline-none focus:ring-2 focus:ring-cyan-500/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => xoaDong(index)}
                                                    className="shrink-0 size-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-slate-400 mt-2">
                                    Giá được áp tại thời điểm sinh đơn theo bảng giá đang hiệu lực, nên lịch
                                    không giữ lại giá cũ.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700">Ghi chú cho vựa</label>
                                <input
                                    type="text"
                                    value={form.ghichu}
                                    onChange={e => setForm(p => ({ ...p, ghichu: e.target.value }))}
                                    placeholder="Ví dụ: giao trước 6h sáng"
                                    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                            <button
                                onClick={() => setMoForm(false)}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={luuForm}
                                disabled={dangLuu}
                                className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {dangLuu ? "Đang lưu..." : dangSuaId ? "Lưu thay đổi" : "Tạo lịch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
