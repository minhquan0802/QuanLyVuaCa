import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ColumnFilter({ label, options, selectedValues, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const popoverRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleClickOutside = (event) => {
            if (!buttonRef.current?.contains(event.target)
                && !popoverRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        const handleResize = () => setIsOpen(false);

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("resize", handleResize);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("resize", handleResize);
        };
    }, [isOpen]);

    const togglePopover = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const width = 256;
            const padding = 12;
            setPosition({
                top: rect.bottom + 8,
                left: Math.max(
                    padding,
                    Math.min(rect.right - width, window.innerWidth - width - padding)
                )
            });
        }
        setIsOpen(previous => !previous);
    };

    const toggleValue = (value) => {
        onChange(
            selectedValues.includes(value)
                ? selectedValues.filter(item => item !== value)
                : [...selectedValues, value]
        );
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={togglePopover}
                title={`Lọc theo ${label.toLowerCase()}`}
                aria-label={`Lọc theo ${label.toLowerCase()}`}
                aria-expanded={isOpen}
                className={`relative size-8 shrink-0 inline-flex items-center justify-center rounded-lg border transition-colors ${
                    selectedValues.length > 0
                        ? "border-cyan-300 bg-cyan-100 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-cyan-300 hover:text-cyan-700"
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6.75 9.75h10.5M10.5 15h3M12 15v4.5" />
                </svg>
                {selectedValues.length > 0 && (
                    <span className="absolute -right-2 -top-2 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white shadow-sm">
                        {selectedValues.length}
                    </span>
                )}
            </button>

            {isOpen && typeof document !== "undefined" && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden normal-case"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-100 bg-slate-50">
                        <span className="text-xs font-bold text-slate-700">{label}</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onChange(options.map(option => option.value))}
                                className="text-xs font-bold text-cyan-700 hover:text-cyan-900"
                            >
                                Tất cả
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                disabled={selectedValues.length === 0}
                                className="text-xs font-bold text-slate-500 hover:text-slate-700 disabled:opacity-40"
                            >
                                Bỏ chọn
                            </button>
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-2">
                        {options.map(option => (
                            <label
                                key={String(option.value)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-cyan-50"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option.value)}
                                    onChange={() => toggleValue(option.value)}
                                    className="size-4 accent-cyan-600"
                                />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
