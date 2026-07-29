import { createPortal } from 'react-dom';
import { UserX } from 'lucide-react';

export default function UnfollowConfirmModal({ open, onClose, onConfirm, user, loading = false }) {
    if (!open || !user) return null;

    const username = user.username ? `@${user.username}` : user.fullName || 'người dùng này';

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) onClose?.();
            }}
        >
            <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white/20 bg-white p-6 shadow-2xl transition-all dark:border-white/10 dark:bg-[#181b22]">
                <div className="text-center">
                    {/* User Avatar */}
                    <div className="relative mx-auto mb-4 h-20 w-20">
                        <img
                            src={
                                user.avatar ||
                                'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'
                            }
                            alt={user.fullName}
                            className="h-20 w-20 rounded-full object-cover ring-4 ring-gray-100 dark:ring-white/10"
                        />
                        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                            <UserX className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Bỏ theo dõi {username}?
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        Bạn sẽ không còn nhìn thấy các bài viết của <span className="font-semibold text-gray-700 dark:text-gray-200">{user.fullName}</span> trên bảng tin của mình nữa.
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        {loading ? 'Đang bỏ...' : 'Bỏ theo dõi'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
