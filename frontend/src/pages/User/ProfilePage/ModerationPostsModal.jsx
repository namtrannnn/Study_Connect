import React from 'react';
import { ShieldAlert, ShieldCheck, X, Loader2, RefreshCw } from 'lucide-react';
import Post from '../../Dashboard/Post';

export default function ModerationPostsModal({
    isOpen,
    onClose,
    posts = [],
    loading = false,
    hasMore = false,
    onLoadMore,
    currentUser,
    onDeletePost,
    totalCount = 0,
    onRefresh,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
            />

            {/* Modal Dialog Box */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-full max-w-2xl rounded-3xl bg-white dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200 dark:border-white/15 flex flex-col max-h-[88vh] shadow-2xl animate-scaleUp overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                                    Kiểm duyệt nội dung
                                </h3>
                                {totalCount > 0 && (
                                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                        {totalCount} bài viết
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Danh sách các bài viết đang chờ xét duyệt hoặc đã bị ẩn do vi phạm
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {onRefresh && (
                            <button
                                type="button"
                                onClick={onRefresh}
                                disabled={loading}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition"
                                title="Làm mới"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition cursor-pointer"
                            title="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Status Guidance / Legend */}
                <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3 dark:border-white/5 dark:bg-white/[0.02] shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/80 px-3 py-1.5 text-amber-800 dark:bg-amber-950/30 dark:border-amber-500/30 dark:text-amber-300">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="font-semibold">Đang chờ duyệt:</span>
                            <span className="opacity-80">Hệ thống đang kiểm tra</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/80 px-3 py-1.5 text-red-800 dark:bg-red-950/30 dark:border-red-500/30 dark:text-red-300">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            <span className="font-semibold">Vi phạm tiêu chuẩn:</span>
                            <span className="opacity-80">Đã bị ẩn khỏi Bảng tin</span>
                        </div>
                    </div>
                </div>

                {/* Content / Post List */}
                <div className="flex-1 overflow-y-auto overscroll-contain custom-modal-scroll p-4 space-y-4">
                    {loading && posts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                Đang tải danh sách bài viết kiểm duyệt...
                            </p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                Không có bài viết nào cần xử lý!
                            </h4>
                            <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                Tất cả các bài viết của bạn đã được kiểm duyệt an toàn và đang hiển thị công khai trên Bảng tin.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {posts.map((postItem) => (
                                    <div
                                        key={postItem._id || postItem.id}
                                        className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden dark:border-white/10 dark:bg-[#1f1f23]"
                                    >
                                        <Post
                                            post={postItem}
                                            currentUser={currentUser}
                                            onDelete={onDeletePost}
                                        />
                                    </div>
                                ))}
                            </div>

                            {hasMore && (
                                <div className="pt-2 pb-4 text-center">
                                    <button
                                        type="button"
                                        onClick={onLoadMore}
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 transition disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                                                <span>Đang tải thêm...</span>
                                            </>
                                        ) : (
                                            <span>Tải thêm bài viết</span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
