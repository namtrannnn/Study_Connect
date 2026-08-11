import { useEffect, useState } from 'react';
import {
    Search,
    FileText,
    Heart,
    MessageSquare,
    Trash2,
    Eye,
    Loader2,
    ChevronLeft,
    ChevronRight,
    X,
    EyeOff,
    Clock,
    ArrowUpDown,
    Calendar,
    ImageIcon,
    Hash,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminPosts, updatePostStatus, softDeleteAdminPost } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmModal from '../../../components/ConfirmModal';


function PostsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 9, totalPages: 1, total: 0 });
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedPost, setSelectedPost] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [modalImageIdx, setModalImageIdx] = useState(0);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    const debouncedKeyword = useDebounce(keyword.trim(), 400);

    const fetchPosts = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAdminPosts({
                keyword: debouncedKeyword,
                status: statusFilter,
                timeRange,
                sortBy,
                page,
                limit: 9,
            });

            if (res?.code === 200 || res?.data?.posts) {
                const postsList = res?.data?.posts || res?.posts || [];
                const pag = res?.data?.pagination || res?.pagination || { page: 1, limit: 9, totalPages: 1, total: 0 };
                setPosts(postsList);
                setPagination(pag);
            } else {
                toast.error(res?.message || 'Không thể tải danh sách bài viết');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải dữ liệu bài viết');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts(1);
    }, [debouncedKeyword, statusFilter, timeRange, sortBy]);

    const handleToggleStatus = (post) => {
        const isHiding = post.status !== 'hidden';
        const newStatus = isHiding ? 'hidden' : 'active';

        setConfirmModal({
            isOpen: true,
            title: isHiding ? 'Ẩn bài viết' : 'Hiện bài viết',
            message: isHiding
                ? 'Bạn có chắc muốn ẨN bài viết này khỏi Feed của người dùng?'
                : 'Hiện lại bài viết này trên Bảng tin Feed?',
            confirmText: isHiding ? 'Ẩn bài viết' : 'Hiện lại',
            type: isHiding ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    setActionLoadingId(post._id);
                    setConfirmModal({ isOpen: false });
                    const res = await updatePostStatus(post._id, newStatus);
                    if (res?.code === 200) {
                        toast.success(res.message);
                        setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, status: newStatus } : p)));
                        if (selectedPost?._id === post._id) {
                            setSelectedPost((prev) => (prev ? { ...prev, status: newStatus } : null));
                        }
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Cập nhật bài viết thất bại');
                } finally {
                    setActionLoadingId('');
                }
            },
        });
    };

    const handleDeletePost = (post) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xóa vĩnh viễn bài viết',
            message: 'Xóa vĩnh viễn bài viết này khỏi hệ thống? Thao tác này không thể hoàn tác.',
            confirmText: 'Xóa bài viết',
            type: 'danger',
            onConfirm: async () => {
                try {
                    setActionLoadingId(post._id);
                    setConfirmModal({ isOpen: false });
                    const res = await softDeleteAdminPost(post._id);
                    if (res?.code === 200) {
                        toast.success('Đã xóa bài viết thành công');
                        setPosts((prev) => prev.filter((p) => p._id !== post._id));
                        if (selectedPost?._id === post._id) setSelectedPost(null);
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Không thể xóa bài viết');
                } finally {
                    setActionLoadingId('');
                }
            },
        });
    };


    const openPostDetail = (post) => {
        setSelectedPost(post);
        setModalImageIdx(0);
    };

    // Helper: format relative time
    const formatRelativeTime = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ngày trước`;
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div className="space-y-6">
            {/* Search & Filter Toolbar */}
            <div
                className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 backdrop-blur-xl ${
                    isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'
                }`}
            >
                <div className="relative min-w-[280px] flex-1 max-w-md">
                    <Search className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm kiếm nội dung bài viết hoặc tác giả..."
                        className={`h-11 w-full rounded-2xl border pl-11 pr-4 text-xs font-medium outline-none transition ${
                            isDark
                                ? 'border-white/10 bg-white/5 text-white focus:border-indigo-500 placeholder:text-gray-500'
                                : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500 placeholder:text-slate-400'
                        }`}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                        {[
                            { id: 'all', label: 'Tất cả' },
                            { id: 'active', label: 'Hiển thị' },
                            { id: 'hidden', label: 'Đã ẩn' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setStatusFilter(item.id)}
                                className={`rounded-xl px-3 py-1.5 font-semibold transition ${
                                    statusFilter === item.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Time Range Filter */}
                    <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                        <Clock className={`h-3.5 w-3.5 ml-1.5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                        {[
                            { id: 'all', label: 'Mọi lúc' },
                            { id: 'today', label: 'Hôm nay' },
                            { id: 'week', label: '7 ngày' },
                            { id: 'month', label: 'Tháng này' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTimeRange(item.id)}
                                className={`rounded-xl px-2.5 py-1.5 font-semibold transition ${
                                    timeRange === item.id
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort By */}
                    <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                        <ArrowUpDown className={`h-3.5 w-3.5 ml-1.5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                        {[
                            { id: 'newest', label: 'Mới nhất' },
                            { id: 'oldest', label: 'Cũ nhất' },
                            { id: 'popular', label: 'Hot nhất' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSortBy(item.id)}
                                className={`rounded-xl px-2.5 py-1.5 font-semibold transition ${
                                    sortBy === item.id
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            {loading ? (
                <div className="flex h-64 flex-col items-center justify-center text-sm text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="mt-2 font-medium">Đang tải danh sách bài viết...</p>
                </div>
            ) : posts.length === 0 ? (
                <div className={`flex h-64 flex-col items-center justify-center rounded-3xl border p-8 text-center backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <FileText className="h-12 w-12 text-gray-400 mb-2" />
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Chưa có bài viết nào</h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Không tìm thấy bài viết phù hợp.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => {
                        const author = post.user_id;
                        const isHidden = post.status === 'hidden';
                        const isProcessing = actionLoadingId === post._id;
                        const hasImages = post.images && post.images.length > 0;
                        const imageCount = hasImages ? post.images.length : 0;
                        const hasContent = post.content && post.content.trim().length > 0;

                        return (
                            <div
                                key={post._id}
                                onClick={() => openPostDetail(post)}
                                className={`group relative flex flex-col overflow-hidden rounded-3xl border backdrop-blur-xl transition cursor-pointer hover:-translate-y-1 hover:shadow-2xl ${
                                    isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white'
                                }`}
                            >
                                {/* Author Header */}
                                <div className={`flex items-center justify-between gap-3 p-4 pb-0`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={author?.avatar || 'https://via.placeholder.com/150'}
                                            alt="Author Avatar"
                                            className="h-9 w-9 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                        />
                                        <div className="min-w-0">
                                            <h4 className={`truncate font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{author?.fullName || 'Người dùng'}</h4>
                                            <p className={`truncate text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                @{author?.username || 'user'} · {formatRelativeTime(post.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {isHidden && (
                                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/30">
                                                Đã ẩn
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Content Area - adaptive height */}
                                <div className="px-4 pt-3">
                                    {post.title && <h5 className="font-bold text-indigo-400 text-xs mb-1 line-clamp-1">{post.title}</h5>}
                                    {hasContent && (
                                        <p className={`text-xs leading-relaxed font-medium ${hasImages ? 'line-clamp-2' : 'line-clamp-4'} ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                            {post.content}
                                        </p>
                                    )}
                                    {post.hashtags && post.hashtags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {post.hashtags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                                                    #{tag}
                                                </span>
                                            ))}
                                            {post.hashtags.length > 3 && (
                                                <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                                    +{post.hashtags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Images Area - smart layout */}
                                {hasImages && (
                                    <div className="px-4 pt-3">
                                        {imageCount === 1 ? (
                                            <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/40 h-40">
                                                <img
                                                    src={post.images[0]?.url || post.images[0]}
                                                    alt="Post Media"
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                />
                                            </div>
                                        ) : imageCount === 2 ? (
                                            <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl h-36">
                                                {post.images.slice(0, 2).map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={img?.url || img}
                                                        alt="Post Media"
                                                        className="h-full w-full object-cover border border-black/10 rounded-xl"
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl h-36">
                                                <img
                                                    src={post.images[0]?.url || post.images[0]}
                                                    alt="Post Media"
                                                    className="h-full w-full object-cover border border-black/10 rounded-xl row-span-2"
                                                />
                                                <div className="relative">
                                                    <img
                                                        src={post.images[1]?.url || post.images[1]}
                                                        alt="Post Media"
                                                        className="h-full w-full object-cover border border-black/10 rounded-xl"
                                                    />
                                                    {imageCount > 2 && (
                                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 text-white text-sm font-bold">
                                                            <ImageIcon className="h-4 w-4 mr-1" /> +{imageCount - 2}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer: Stats + Actions */}
                                <div className={`mt-auto flex items-center justify-between p-4 pt-3 border-t ${isDark ? 'border-white/5' : 'border-slate-100'} ${!hasImages && !hasContent ? 'mt-2' : 'mt-3'}`}>
                                    <div className="flex items-center gap-3 text-xs font-semibold">
                                        <span className="flex items-center gap-1 text-rose-500">
                                            <Heart className="h-3.5 w-3.5" /> {post.likesCount || 0}
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-500">
                                            <MessageSquare className="h-3.5 w-3.5" /> {post.commentsCount || 0}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(post)}
                                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                                isHidden ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'
                                            }`}
                                            title={isHidden ? 'Hiện bài viết' : 'Ẩn bài viết'}
                                        >
                                            <EyeOff className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openPostDetail(post)}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition hover:bg-indigo-500/20"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => handleDeletePost(post)}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
                                            title="Xóa bài viết"
                                        >
                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className={`flex items-center justify-between rounded-3xl border p-5 text-xs font-semibold backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80 text-gray-400' : 'border-slate-200 bg-white text-slate-500'}`}>
                    <span>Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} bài viết)</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={pagination.page <= 1 || loading}
                            onClick={() => fetchPosts(pagination.page - 1)}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                                isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                            } disabled:opacity-30`}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            disabled={pagination.page >= pagination.totalPages || loading}
                            onClick={() => fetchPosts(pagination.page + 1)}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                                isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                            } disabled:opacity-30`}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* =================== POST DETAIL MODAL =================== */}
            {selectedPost && (
                <div
                    onClick={() => setSelectedPost(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border p-6 shadow-2xl space-y-5 ${isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                    >
                        {/* Modal Header: Author + Close */}
                        <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <img
                                    src={selectedPost.user_id?.avatar || 'https://via.placeholder.com/150'}
                                    alt="Avatar"
                                    className="h-11 w-11 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg"
                                />
                                <div>
                                    <h4 className="font-bold text-sm">{selectedPost.user_id?.fullName}</h4>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                        @{selectedPost.user_id?.username} · {formatRelativeTime(selectedPost.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedPost.status === 'hidden' && (
                                    <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-500 border border-amber-500/30">Đã ẩn</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedPost(null)}
                                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Title */}
                        {selectedPost.title && <h3 className="text-base font-bold text-indigo-500">{selectedPost.title}</h3>}

                        {/* Content */}
                        {selectedPost.content && selectedPost.content.trim() && (
                            <div className={`text-xs leading-relaxed font-medium whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                {selectedPost.content}
                            </div>
                        )}

                        {/* Hashtags */}
                        {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedPost.hashtags.map((tag, i) => (
                                    <span key={i} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                                        <Hash className="h-3 w-3" />{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Images Gallery */}
                        {selectedPost.images && selectedPost.images.length > 0 && (
                            <div className="space-y-3">
                                {/* Main Image */}
                                <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/40">
                                    <img
                                        src={selectedPost.images[modalImageIdx]?.url || selectedPost.images[modalImageIdx]}
                                        alt="Post Image"
                                        className="w-full max-h-80 object-contain mx-auto"
                                    />
                                </div>
                                {/* Thumbnail Row */}
                                {selectedPost.images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {selectedPost.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setModalImageIdx(idx)}
                                                className={`shrink-0 h-14 w-14 rounded-xl overflow-hidden border-2 transition ${
                                                    modalImageIdx === idx ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <img src={img?.url || img} alt="" className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Post Info & Stats */}
                        <div className={`grid grid-cols-2 gap-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            <div className={`rounded-2xl border p-3 text-center ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center justify-center gap-1 text-rose-500 font-extrabold text-lg">
                                    <Heart className="h-4 w-4" /> {selectedPost.likesCount || 0}
                                </div>
                                <div className="text-[11px] font-medium mt-0.5">Lượt thích</div>
                            </div>
                            <div className={`rounded-2xl border p-3 text-center ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center justify-center gap-1 text-blue-500 font-extrabold text-lg">
                                    <MessageSquare className="h-4 w-4" /> {selectedPost.commentsCount || 0}
                                </div>
                                <div className="text-[11px] font-medium mt-0.5">Bình luận</div>
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Đăng vào: {new Date(selectedPost.createdAt).toLocaleString('vi-VN')}</span>
                            {selectedPost.isEdited && (
                                <span className="ml-2 text-amber-500 font-semibold">(Đã chỉnh sửa)</span>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className={`flex flex-wrap items-center justify-end gap-2 border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(selectedPost)}
                                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                                    selectedPost.status === 'hidden'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                        : 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                }`}
                            >
                                <EyeOff className="h-4 w-4" />
                                {selectedPost.status === 'hidden' ? 'Hiện bài viết' : 'Ẩn bài viết'}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDeletePost(selectedPost)}
                                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/20"
                            >
                                <Trash2 className="h-4 w-4" /> Xóa bài viết
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            <ConfirmModal {...confirmModal} onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
        </div>
    );
}


export default PostsAdmin;
