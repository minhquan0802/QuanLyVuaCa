import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { fetchCoXacThuc } from "../utils/fetchAPI"; 

// [CẬP NHẬT] Map ID (số) sang Tên hiển thị
const ROLE_DEFINITIONS = {
    1: "Quản Trị Viên (Admin)",
    2: "Nhân Viên Kho",
    3: "Nhân Viên Bán Hàng",
    4: "Nhân Viên",
    5: "Khách Sỉ",
    6: "Khách Lẻ"
};

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // State cho chế độ chỉnh sửa
    const [isEditing, setIsEditing] = useState(false); 
    const [formData, setFormData] = useState({});      

    // Fetch dữ liệu ban đầu
    useEffect(() => {
        const getMyInfo = async () => {
            try {
                setLoading(true);
                const res = await fetchCoXacThuc("/TaiKhoans/myinfo");

                if (!res.ok) throw new Error("Không thể tải thông tin tài khoản");

                const data = await res.json();
                setUser(data.result);
                setFormData(data.result);

            } catch (error) {
                console.error("Lỗi:", error);
            } finally {
                setLoading(false);
            }
        };

        getMyInfo();
    }, [navigate]);

    // [CẬP NHẬT] Hàm lấy tên hiển thị dựa trên ID (số)
    const getDisplayRole = (roleId) => {
        if (!roleId) return "Thành viên";
        return ROLE_DEFINITIONS[roleId] || "Thành viên";
    };

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---

    const handleEditClick = () => {
        setFormData({
            ho: user.ho,
            ten: user.ten,
            sodienthoai: user.sodienthoai || "",
            diachi: user.diachi || "",
            idvaitro: user.idvaitro // Giữ nguyên ID vai trò
        });
        setIsEditing(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(user); 
    };

    const handleSave = async () => {
        try {
            const res = await fetchCoXacThuc(`/TaiKhoans/${user.idtaikhoan}`, {
                method: "PUT",
                body: JSON.stringify({
                    ho: formData.ho,
                    ten: formData.ten,
                    sodienthoai: formData.sodienthoai,
                    diachi: formData.diachi,
                    idvaitro: formData.idvaitro // Gửi ID số về backend
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Cập nhật thất bại");
            }

            const data = await res.json();
            setUser(data.result);
            setIsEditing(false);
            alert("Cập nhật hồ sơ thành công!");

        } catch (error) {
            console.error("Lỗi save:", error);
            alert("Có lỗi xảy ra: " + error.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-2">
                    <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Đang tải hồ sơ...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-body flex flex-col">
            <Header />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden mb-6">
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                        <div className="px-8 pb-8 relative">
                            <div className="absolute -top-16 left-8 p-1 bg-white rounded-full">
                                <div className="size-32 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                                    <span className="material-symbols-outlined text-6xl">person</span>
                                </div>
                            </div>
                            <div className="pl-36 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        {user.ho} {user.ten}
                                        {isEditing && <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Đang sửa</span>}
                                    </h1>
                                    <p className="text-slate-500 font-medium">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            user.trangthaitk === 'HOAT_DONG' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                            {user.trangthaitk === 'HOAT_DONG' ? 'Đang hoạt động' : 'Đã khóa'}
                                        </span>
                                        
                                        {/* [ĐÃ CẬP NHẬT] Truyền ID số vào hàm helper */}
                                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase shadow-sm">
                                            {getDisplayRole(user.idvaitro)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* NÚT ĐIỀU KHIỂN */}
                                <div>
                                    {!isEditing ? (
                                        <button 
                                            onClick={handleEditClick}
                                            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                            Chỉnh sửa
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleCancel}
                                                className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-all active:scale-95"
                                            >
                                                Hủy
                                            </button>
                                            <button 
                                                onClick={handleSave}
                                                className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">save</span>
                                                Lưu
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Details (Giữ nguyên phần này) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8">
                            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-600">contact_page</span>
                                Thông tin cá nhân
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Họ & Tên đệm</label>
                                        {isEditing ? (
                                            <input 
                                                type="text" name="ho" value={formData.ho} onChange={handleChange}
                                                className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-2 py-1 text-slate-800 font-medium focus:outline-none"
                                            />
                                        ) : (
                                            <div className="text-slate-800 font-medium text-lg border-b border-slate-100 pb-1">{user.ho}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tên</label>
                                        {isEditing ? (
                                            <input 
                                                type="text" name="ten" value={formData.ten} onChange={handleChange}
                                                className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-2 py-1 text-slate-800 font-medium focus:outline-none"
                                            />
                                        ) : (
                                            <div className="text-slate-800 font-medium text-lg border-b border-slate-100 pb-1">{user.ten}</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                    <div className="text-slate-600 font-medium text-lg border-b border-slate-100 pb-1 flex justify-between">
                                        {user.email}
                                        {isEditing && <span className="text-xs text-slate-400 italic font-normal">(Không thể sửa)</span>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Số điện thoại</label>
                                    {isEditing ? (
                                        <input 
                                            type="text" name="sodienthoai" value={formData.sodienthoai} onChange={handleChange}
                                            className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-2 py-1 text-slate-800 font-medium focus:outline-none"
                                        />
                                    ) : (
                                        <div className="text-slate-800 font-medium text-lg border-b border-slate-100 pb-1">
                                            {user.sodienthoai || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Địa chỉ</label>
                                    {isEditing ? (
                                        <input 
                                            type="text" name="diachi" value={formData.diachi} onChange={handleChange}
                                            className="w-full border-b-2 border-blue-500 bg-blue-50/50 px-2 py-1 text-slate-800 font-medium focus:outline-none"
                                        />
                                    ) : (
                                        <div className="text-slate-800 font-medium text-lg border-b border-slate-100 pb-1">
                                            {user.diachi || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Bảo mật</h3>
                                <div className="space-y-3">
                                    <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center justify-between group">
                                        Đổi mật khẩu
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600">chevron_right</span>
                                    </button>
                                    <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center justify-between group">
                                        Lịch sử đăng nhập
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}