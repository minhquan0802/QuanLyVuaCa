// Tính danh sách nút cần hiện: luôn có trang đầu, trang cuối, các trang lân cận
// quanh trang hiện tại; khoảng bị nhảy cóc thay bằng "..."
export function getPageList(current, total, siblingCount = 1) {
    const totalHienThi = siblingCount * 2 + 5;
    if (total <= totalHienThi) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const trai = Math.max(current - siblingCount, 1);
    const phai = Math.min(current + siblingCount, total);
    const coDotsTrai = trai > 2;
    const coDotsPhai = phai < total - 1;

    const pages = [1];
    if (coDotsTrai) pages.push("...");
    for (let p = trai; p <= phai; p++) {
        if (p !== 1 && p !== total) pages.push(p);
    }
    if (coDotsPhai) pages.push("...");
    pages.push(total);
    return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1 }) {
    if (totalPages <= 1) return null;

    const pages = getPageList(currentPage, totalPages, siblingCount);

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Trước
            </button>

            {pages.map((page, index) =>
                page === "..." ? (
                    <span key={`dots-${index}`} className="size-8 flex items-center justify-center text-slate-400 select-none">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`size-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                            currentPage === page
                                ? "bg-cyan-600 text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Sau
            </button>
        </div>
    );
}
