import { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CornerDownLeft,
} from 'lucide-react';
import { useAdminTheme } from '../../layout/Admin/index.jsx';

function AdminPagination({ page = 1, totalPages = 1, total = 0, limit = 10, onPageChange }) {
    const themeCtx = useAdminTheme();
    const isDark = themeCtx ? themeCtx.isDark : true;

    const [jumpInput, setJumpInput] = useState(String(page));

    useEffect(() => {
        setJumpInput(String(page));
    }, [page]);

    if (!totalPages || totalPages <= 1) {
        if (total > 0) {
            return (
                <div className={`mt-6 flex items-center justify-between border-t pt-4 text-xs font-semibold ${isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                    <span>Tổng số: <strong className="text-indigo-500">{total}</strong> kết quả</span>
                    <span>Trang 1 / 1</span>
                </div>
            );
        }
        return null;
    }

    const handleJumpSubmit = (e) => {
        e.preventDefault();
        const targetPage = parseInt(jumpInput, 10);
        if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages && targetPage !== page) {
            onPageChange(targetPage);
        } else {
            setJumpInput(String(page));
        }
    };

    // Calculate smart page number array with ellipses
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, page - 1);
            let end = Math.min(totalPages, page + 1);

            if (page <= 3) {
                start = 1;
                end = 4;
            } else if (page >= totalPages - 2) {
                start = totalPages - 3;
                end = totalPages;
            }

            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const fromItem = Math.min((page - 1) * limit + 1, total);
    const toItem = Math.min(page * limit, total);

    return (
        <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 text-xs select-none ${
            isDark ? 'border-white/10 text-gray-300' : 'border-slate-200 text-slate-600'
        }`}>
            {/* Total items stats */}
            <div className="font-medium">
                Hiển thị <strong className="text-indigo-400">{fromItem}-{toItem}</strong> trên tổng <strong className="text-indigo-400">{total}</strong> bản ghi
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
                {/* First Page */}
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(1)}
                    title="Trang đầu"
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                        isDark
                            ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                            : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous Page */}
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    title="Trang trước"
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                        isDark
                            ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                            : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((p, idx) => {
                        if (p === '...') {
                            return (
                                <span key={`dots-${idx}`} className="px-1 text-gray-400 font-bold">
                                    ...
                                </span>
                            );
                        }
                        const isCurrent = p === page;
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-xl text-xs font-bold transition ${
                                    isCurrent
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                        : isDark
                                        ? 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                        : 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                {/* Next Page */}
                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    title="Trang sau"
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                        isDark
                            ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                            : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page */}
                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(totalPages)}
                    title="Trang cuối"
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                        isDark
                            ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                            : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>

                {/* Jump to Page Form */}
                <form onSubmit={handleJumpSubmit} className="ml-2 flex items-center gap-1.5">
                    <span className="text-gray-400 text-[11px]">Đi tới:</span>
                    <div className="relative flex items-center">
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={jumpInput}
                            onChange={(e) => setJumpInput(e.target.value)}
                            className={`h-8 w-12 rounded-xl border text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                                isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
                            }`}
                        />
                    </div>
                    <button
                        type="submit"
                        title="Chuyển trang"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition border border-indigo-500/30"
                    >
                        <CornerDownLeft className="h-3.5 w-3.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminPagination;
