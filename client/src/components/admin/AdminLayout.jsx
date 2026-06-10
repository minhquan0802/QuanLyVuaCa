import { useState } from "react";
import AdminSidebar from "./AdminSidebar"; 
import { useNavigate } from "react-router-dom";

export default function AdminLayout({ children, title = "" }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 font-body flex selection:bg-cyan-500/20 selection:text-cyan-700">
            <AdminSidebar/>

            <div className="flex-1 flex flex-col transition-all duration-300 ml-64">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase border-l-2 border-cyan-500 pl-3">{title}</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="size-9 rounded-xl bg-slate-50 hover:bg-cyan-50 flex items-center justify-center text-slate-500 hover:text-cyan-600 transition-colors ring-1 ring-slate-200 border-none shadow-sm">
                            <span className="material-symbols-outlined text-lg">notifications</span>
                        </button>
                    </div>
                </header>

                <main className="p-8 flex-1 bg-slate-50/50 text-slate-700">
                    {children}
                </main>
            </div>
        </div>
    );
}