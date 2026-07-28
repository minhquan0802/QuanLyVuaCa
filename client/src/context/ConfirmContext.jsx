import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

const ConfirmContext = createContext(null);

const VARIANTS = {
    danger: {
        icon: "bg-red-50 text-red-600 border-red-200",
        button: "bg-red-600 hover:bg-red-700 focus:ring-red-200",
    },
    warning: {
        icon: "bg-amber-50 text-amber-600 border-amber-200",
        button: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-200",
    },
    primary: {
        icon: "bg-cyan-50 text-cyan-600 border-cyan-200",
        button: "bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-200",
    },
};

export function ConfirmProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const resolverRef = useRef(null);
    const confirmButtonRef = useRef(null);

    const closeDialog = useCallback((accepted) => {
        resolverRef.current?.(accepted);
        resolverRef.current = null;
        setDialog(null);
    }, []);

    const openDialog = useCallback((options, mode) => {
        resolverRef.current?.(false);

        setDialog({
            title: options.title || (mode === "alert" ? "Thông báo" : "Xác nhận hành động"),
            message: options.message || (mode === "alert" ? "" : "Bạn có chắc muốn tiếp tục?"),
            confirmText: options.confirmText || (mode === "alert" ? "Đóng" : "Xác nhận"),
            cancelText: options.cancelText || "Hủy",
            variant: options.variant || "primary",
            mode,
        });

        return new Promise((resolve) => {
            resolverRef.current = resolve;
        });
    }, []);

    const confirm = useCallback((options = {}) => openDialog(options, "confirm"), [openDialog]);
    const showAlert = useCallback((options = {}) => openDialog(options, "alert"), [openDialog]);

    useEffect(() => () => resolverRef.current?.(false), []);

    useEffect(() => {
        if (!dialog) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        confirmButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === "Escape") closeDialog(false);
        };
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [dialog, closeDialog]);

    const value = useMemo(() => ({ confirm, showAlert }), [confirm, showAlert]);
    const variant = VARIANTS[dialog?.variant] || VARIANTS.primary;

    return (
        <ConfirmContext.Provider value={value}>
            {children}

            {dialog && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeDialog(false);
                    }}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                        aria-describedby="confirm-dialog-message"
                        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`shrink-0 rounded-xl border p-2.5 ${variant.icon}`}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="size-6"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                                    />
                                </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-900">
                                    {dialog.title}
                                </h2>
                                <p id="confirm-dialog-message" className="mt-2 text-sm leading-6 text-slate-600">
                                    {dialog.message}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            {dialog.mode !== "alert" && (
                                <button
                                    type="button"
                                    onClick={() => closeDialog(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                >
                                    {dialog.cancelText}
                                </button>
                            )}
                            <button
                                ref={confirmButtonRef}
                                type="button"
                                onClick={() => closeDialog(true)}
                                className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors focus:outline-none focus:ring-4 ${variant.button}`}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error("useConfirm phải được sử dụng bên trong ConfirmProvider!");
    return context;
}
