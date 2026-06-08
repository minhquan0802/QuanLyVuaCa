import AdminSidebar from "./AdminSidebar"; // Import từ cùng thư mục
import { useNavigate } from "react-router-dom";

export default function AdminLayout({ children, title = "Dashboard" }) {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-slate-50 font-body flex">
            <AdminSidebar />

            <div className="flex-1 ml-64 transition-all duration-300">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <div className="flex items-center gap-4">
                        <button className="size-9 rounded-full bg-slate-50 hover:bg-blue-50 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors ring-1 ring-slate-200 border-none">
                            <span className="material-symbols-outlined text-xl">notifications</span>
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <button 
                        onClick={() => navigate('/home')}
                        className="text-sm font-medium text-blue-600 hover:underline">
                            Về trang chủ
                        </button>
                    </div>
                </header>

                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}