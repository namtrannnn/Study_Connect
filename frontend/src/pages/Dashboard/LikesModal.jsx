import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';

import { useNavigate } from 'react-router-dom';
import * as PostServices from '../../services/posts.services';
import useDebounce from '../../hooks/useDebounce';

function LikesModal({ open, onClose, postId }) {
    const navigate = useNavigate();
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasMore: false,
    });

    const debouncedSearch = useDebounce(search, 800);
    const firstSearchRef = useRef(true);

    const fetchLikes = async ({ page = 1, keyword = '', append = false } = {}) => {
        if (!postId) return;

        try {
            setLoading(true);

            const res = await PostServices.getPostLikes({
                postId,
                page,
                limit: 10,
                search: keyword,
            });

            if (res.code === 200) {
                setLikes((prev) => (append ? [...prev, ...(res.data || [])] : res.data || []));
                setMeta(
                    res.meta || {
                        page,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                        hasMore: false,
                    },
                );
            } else {
                toast.error(res.message || 'Không thể lấy danh sách lượt thích');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể lấy danh sách lượt thích');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open || !postId) return;

        firstSearchRef.current = true;

        setLikes([]);
        setSearch('');
        setMeta({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasMore: false,
        });

        fetchLikes({
            page: 1,
            keyword: '',
            append: false,
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, postId]);

    useEffect(() => {
        if (!open || !postId) return;

        if (firstSearchRef.current) {
            firstSearchRef.current = false;
            return;
        }

        fetchLikes({
            page: 1,
            keyword: debouncedSearch,
            append: false,
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const handleLoadMore = () => {
        if (loading || !meta?.hasMore) return;

        fetchLikes({
            page: (meta.page || 1) + 1,
            keyword: debouncedSearch,
            append: true,
        });
    };

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#181b22]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
                            <Heart size={19} className="fill-current" />
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Lượt thích</h3>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {meta?.total || 0} người đã thích bài viết này
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="border-b border-gray-100 px-5 py-4 dark:border-white/10">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm người đã thích..."
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white dark:focus:bg-[#20232b]"
                        />
                    </div>
                </div>

                <div className="custom-modal-scroll max-h-[440px] overflow-y-auto p-3">
                    {loading && likes.length === 0 && (
                        <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                    )}

                    {!loading && likes.length === 0 && (
                        <div className="py-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/10">
                                <Heart size={26} />
                            </div>

                            <p className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-200">
                                Chưa có lượt thích
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Khi có người thích bài viết, họ sẽ xuất hiện ở đây
                            </p>
                        </div>
                    )}

                    {likes.map((item) => {
                        const likedUser = item.user;
                        const userId = likedUser?._id || likedUser?.id;

                        if (!likedUser) return null;

                        return (
                            <button
                                type="button"
                                key={item.likeId || userId}
                                onClick={() => {
                                    onClose?.();
                                    const target = likedUser.username || userId;
                                    if (target) navigate(`/profile/${target}`);
                                }}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/10"
                            >
                                <img
                                    src={likedUser.avatar || 'https://i.pravatar.cc/150?img=3'}
                                    alt="avatar"
                                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-white/10"
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                        <span className="truncate text-sm font-bold text-gray-900 dark:text-white">
                                            {likedUser.fullName || likedUser.username || 'Người dùng'}
                                        </span>

                                        {likedUser.isVerified && (
                                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                                                ✓
                                            </span>
                                        )}
                                    </div>

                                    {likedUser.username && (
                                        <div className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                                            @{likedUser.username}
                                        </div>
                                    )}
                                </div>

                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
                                    <Heart size={14} className="fill-current" />
                                </div>
                            </button>
                        );
                    })}

                    {meta?.hasMore && (
                        <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Xem thêm
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default LikesModal;
