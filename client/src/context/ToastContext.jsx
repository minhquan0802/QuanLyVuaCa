import React, { createContext, useState, useContext, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState({ show: false, message: "", type: "success", action: null });

    // action (tùy chọn): { label, onClick } - hiện thêm 1 nút bấm trong toast, tự đóng toast khi bấm
    const showToast = useCallback((message, type = "success", action = null) => {
        setToast({ show: true, message, type, action });

        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, action ? 8000 : 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            
            {toast.show && (
                <div className="fixed bottom-5 right-5 z-9999 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 min-w-[300px] bg-white text-sm max-w-md">
                    {toast.type === "success" ? (
                        <div className="p-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                    )}

                    <div className="flex-1 font-medium text-slate-800 leading-relaxed break-words">
                        {toast.message}
                    </div>

                    {toast.action && (
                        <button
                            onClick={() => {
                                toast.action.onClick();
                                setToast((prev) => ({ ...prev, show: false }));
                            }}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition-colors"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}