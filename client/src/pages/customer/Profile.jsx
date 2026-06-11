import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const ROLE_LABEL = { ADMIN: "Quản trị viên", STAFF: "Nhân viên", CUSTOMER: "Khách hàng" };
const STATUS_CONFIG = {
    HOAT_DONG:          { label: "Hoạt động",          cls: "bg-green-100 text-green-700" },
    KHOA:               { label: "Bị khóa",             cls: "bg-red-100 text-red-700" },
    CHO_DUYET:          { label: "Chờ phê duyệt",       cls: "bg-yellow-100 text-yellow-700" },
    CHO_XAC_THUC_EMAIL: { label: "Chờ xác thực email",  cls: "bg-slate-100 text-slate-600" },
};

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function ViewValue({ value, fallback = "Chưa cập nhật" }) {
    return (
        <div className="text-slate-800 font-medium text-sm border-b border-slate-100 pb-1.5 min-h-[30px] flex items-center">
            {value || <span className="text-slate-400 italic font-normal">{fallback}</span>}
        </div>
    );
}

function EditInput({ name, value, onChange, type = "text", placeholder }) {
    return (
        <input
            type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
            className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 px-2 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm transition-colors placeholder:text-slate-400 placeholder:font-normal placeholder:italic"
        />
    );
}

export default function Profile() {
    const navigate = useNavigate();
    const { user, setUser, loading } = useAuth();
    const { showToast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ho: "", ten: "", sodienthoai: "", diachi: "" });
    const [isSaving, setIsSaving] = useState(false);

    const [isChangingPw, setIsChangingPw] = useState(false);
    const [pwData, setPwData] = useState({ matkhauCu: "", matkhauMoi: "", xacNhan: "" });
    const [showPw, setShowPw] = useState(false);
    const [isSavingPw, setIsSavingPw] = useState(false);

    const handleEditClick = () => {
        setFormData({ ho: user?.ho || "", ten: user?.ten || "", sodienthoai: user?.sodienthoai || "", diachi: user?.diachi || "" });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.ho.trim() || !formData.ten.trim()) {
            showToast("Họ và tên không được để trống", "error");
            return;
        }
        setIsSaving(true);
        try {
            const { data } = await api.put(`/tai-khoan/${user.idtaikhoan}`, {
                ho: formData.ho.trim(),
                ten: formData.ten.trim(),
                sodienthoai: formData.sodienthoai.trim(),
                diachi: formData.diachi.trim(),
            });
            setUser(data.result);
            setIsEditing(false);
            showToast("Cập nhật hồ sơ thành công!", "success");
        } catch (err) {
            showToast(`Có lỗi xảy ra: ${err.response?.data?.message || "Thao tác thất bại"}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePw = async () => {
        if (!pwData.matkhauCu) {
            showToast("Vui lòng nhập mật khẩu hiện tại", "error");
            return;
        }
        if (pwData.matkhauMoi.length < 8) {
            showToast("Mật khẩu mới phải có ít nhất 8 ký tự", "error");
            return;
        }
        if (pwData.matkhauMoi !== pwData.xacNhan) {
            showToast("Mật khẩu xác nhận không khớp", "error");
            return;
        }
        setIsSavingPw(true);
        try {
            await api.put("/tai-khoan/doi-mat-khau", {
                matkhauCu: pwData.matkhauCu,
                matkhauMoi: pwData.matkhauMoi,
            });
            setIsChangingPw(false);
            setPwData({ matkhauCu: "", matkhauMoi: "", xacNhan: "" });
            showToast("Đổi mật khẩu thành công!", "success");
        } catch (err) {
            const code = err.response?.data?.code;
            const msg = code === 1033
                ? "Mật khẩu hiện tại không đúng."
                : err.response?.data?.message || "Thao tác thất bại";
            showToast(msg, "error");
        } finally {
            setIsSavingPw(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="size-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <p className="text-slate-500 text-sm">Vui lòng đăng nhập để xem hồ sơ.</p>
                <button onClick={() => navigate("/login")} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700">
                    Đăng nhập
                </button>
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[user.trangthaitk] ?? { label: user.trangthaitk, cls: "bg-slate-100 text-slate-600" };

    return (
        <div className="bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-5">

                {/* --- THÔNG TIN CÁ NHÂN --- */}
                <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-6 sm:p-8">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                        <div>
                            <h3 className="font-bold text-base text-slate-800">Thông tin cá nhân</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400">{ROLE_LABEL[user.vaitro] ?? user.vaitro}</span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
                                    {statusCfg.label}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 text-xs cursor-pointer">
                                        Hủy
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 text-xs disabled:opacity-60 flex items-center gap-1.5 cursor-pointer">
                                        {isSaving ? <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                        {isSaving ? "Đang lưu..." : "Lưu lại"}
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleEditClick} className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 text-xs flex items-center gap-1.5 cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="size-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                                    </svg>
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Field label="Họ & Tên đệm">
                                {isEditing
                                    ? <EditInput name="ho" value={formData.ho} onChange={e => setFormData(p => ({ ...p, ho: e.target.value }))} />
                                    : <ViewValue value={user.ho} />}
                            </Field>
                            <Field label="Tên">
                                {isEditing
                                    ? <EditInput name="ten" value={formData.ten} onChange={e => setFormData(p => ({ ...p, ten: e.target.value }))} />
                                    : <ViewValue value={user.ten} />}
                            </Field>
                        </div>

                        <Field label="Địa chỉ Email">
                            <div className="text-slate-600 font-medium text-sm border-b border-slate-100 pb-1.5 flex justify-between items-center min-h-[30px]">
                                <span>{user.email}</span>
                                {isEditing && <span className="text-[10px] text-slate-400 font-normal">(Không thể sửa)</span>}
                            </div>
                        </Field>

                        <Field label="Số điện thoại">
                            {isEditing
                                ? <EditInput name="sodienthoai" value={formData.sodienthoai} onChange={e => setFormData(p => ({ ...p, sodienthoai: e.target.value }))} />
                                : <ViewValue value={user.sodienthoai} />}
                        </Field>

                        <Field label="Địa chỉ giao hàng">
                            {isEditing
                                ? <EditInput name="diachi" value={formData.diachi} onChange={e => setFormData(p => ({ ...p, diachi: e.target.value }))} />
                                : <ViewValue value={user.diachi} />}
                        </Field>
                    </div>
                </div>

                {/* --- ĐỔI MẬT KHẨU --- */}
                <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-6 sm:p-8">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                        <h3 className="font-bold text-base text-slate-800">Bảo mật</h3>
                        {!isChangingPw && (
                            <button onClick={() => { setIsChangingPw(true); setShowPw(false); setPwData({ matkhauCu: "", matkhauMoi: "", xacNhan: "" }); }} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-xs cursor-pointer">
                                Đổi mật khẩu
                            </button>
                        )}
                    </div>

                    {isChangingPw ? (
                        <div className="space-y-4">
                            <Field label="Mật khẩu hiện tại">
                                <div className="relative">
                                    <input
                                        type={showPw ? "text" : "password"}
                                        value={pwData.matkhauCu}
                                        onChange={e => setPwData(p => ({ ...p, matkhauCu: e.target.value }))}
                                        placeholder="Nhập mật khẩu đang dùng"
                                        className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 pl-2 pr-10 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm placeholder:text-slate-400 placeholder:font-normal placeholder:italic"
                                    />
                                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                        <span className="material-symbols-outlined text-[18px]">{showPw ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </Field>

                            <Field label="Mật khẩu mới">
                                <div className="relative">
                                    <input
                                        type={showPw ? "text" : "password"}
                                        value={pwData.matkhauMoi}
                                        onChange={e => setPwData(p => ({ ...p, matkhauMoi: e.target.value }))}
                                        placeholder="Tối thiểu 8 ký tự"
                                        className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 pl-2 pr-10 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm placeholder:text-slate-400 placeholder:font-normal placeholder:italic"
                                    />
                                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                        <span className="material-symbols-outlined text-[18px]">{showPw ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </Field>

                            <Field label="Xác nhận mật khẩu mới">
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={pwData.xacNhan}
                                    onChange={e => setPwData(p => ({ ...p, xacNhan: e.target.value }))}
                                    placeholder="Nhập lại mật khẩu mới"
                                    className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 px-2 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm placeholder:text-slate-400 placeholder:font-normal placeholder:italic"
                                />
                            </Field>

                            {pwData.matkhauMoi && pwData.xacNhan && pwData.matkhauMoi !== pwData.xacNhan && (
                                <p className="text-xs text-red-500">Mật khẩu xác nhận không khớp.</p>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => { setIsChangingPw(false); setPwData({ matkhauCu: "", matkhauMoi: "", xacNhan: "" }); }} className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 text-xs cursor-pointer">
                                    Hủy
                                </button>
                                <button onClick={handleChangePw} disabled={isSavingPw || !pwData.matkhauCu || !pwData.matkhauMoi || !pwData.xacNhan} className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 text-xs disabled:opacity-60 flex items-center gap-1.5 cursor-pointer">
                                    {isSavingPw ? <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                    {isSavingPw ? "Đang lưu..." : "Cập nhật mật khẩu"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="material-symbols-outlined text-slate-300">lock</span>
                            Mật khẩu được bảo mật. Click "Đổi mật khẩu" để thay đổi.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
