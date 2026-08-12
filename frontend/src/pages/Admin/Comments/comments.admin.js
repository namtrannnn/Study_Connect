import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {

    Search,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Clock,
    ArrowUpDown,
    MessageSquare,
    Heart,
    CornerDownRight,
    X,
    FileText,
    Calendar,
    ExternalLink,
    ImageIcon,
    Image as ImageIconSimple,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminComments, updateCommentStatus, deleteAdminComment, updatePostStatus, softDeleteAdminPost } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmModal from '../../../components/ConfirmModal';

function CommentsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [keyword, setKeyword] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'root' | 'reply'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'hidden'
    const [timeRange, setTimeRange] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [selectedCommentDetail, setSelectedCommentDetail] = useState(null);
    const [selectedPostDetail, setSelectedPostDetail] = useState(null);
    const [modalImageIdx, setModalImageIdx] = useState(0);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    const debouncedKeyword = useDebounce(keyword.trim(), 400);

    const fetchComments = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAdminComments({
                keyword: debouncedKeyword,
                type: typeFilter,
                status: statusFilter,
                timeRange,
                sortBy,
                page,
                limit: 10,
            });
            if (res?.code === 200) {
                setComments(res.data.comments || []);
                setPagination(res.data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
            } else {
                toast.error(res?.message || 'Không thể tải danh sách bình luận');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải bình luận');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments(1);
    }, [debouncedKeyword, typeFilter, statusFilter, timeRange, sortBy]);

    // Smart display title for posts (handles text-less image-only posts)
    const getPostDisplayTitle = (post) => {
        if (!post) return 'Bài viết đã bị xóa';
        if (post.title && post.title.trim()) return post.title;
        if (post.content && post.content.trim()) return post.content;
        if (post.caption && post.caption.trim()) return post.caption;
        const imgList = post.images || post.media || [];
        if (imgList.length > 0) return `📷 [Bài viết ${imgList.length} hình ảnh]`;
        return 'Bài viết không có tiêu đề';
    };

    const handleToggleStatus = (comment) => {
        const isHiding = comment.status !== 'hidden';
        const newStatus = isHiding ? 'hidden' : 'active';

        setConfirmModal({
            isOpen: true,
            title: isHiding ? 'Ẩn bình luận' : 'Hiện bình luận',
            message: isHiding
                ? 'Ẩn bình luận này khỏi bài viết? Người dùng khác sẽ không xem được bình luận này.'
                : 'Hiện lại bình luận này trên bài viết?',
            confirmText: isHiding ? 'Ẩn ngay' : 'Hiện lại',
            type: isHiding ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    setActionLoadingId(comment._id);
                    setConfirmModal({ isOpen: false });
                    const res = await updateCommentStatus(comment._id, newStatus);
                    if (res?.code === 200) {
                        toast.success(res.message);
                        setComments((prev) => prev.map((c) => (c._id === comment._id ? { ...c, status: newStatus } : c)));
                        if (selectedCommentDetail?._id === comment._id) {
                            setSelectedCommentDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
                        }
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Thao tác thất bại');
                } finally {
                    setActionLoadingId('');
                }
            },
        });
    };

    const handleDelete = (comment) => {
        const userName = comment.user_id?.fullName || 'người dùng';
        setConfirmModal({
            isOpen: true,
            title: 'Xóa bình luận vi phạm',
            message: `Xóa bình luận này của "${userName}"? Thao tác này không thể hoàn tác.`,
            confirmText: 'Xóa bình luận',
            type: 'danger',
            onConfirm: async () => {
                try {
                    setActionLoadingId(comment._id);
                    setConfirmModal({ isOpen: false });
                    const res = await deleteAdminComment(comment._id);
                    if (res?.code === 200) {
                        toast.success('Đã xóa bình luận vi phạm');
                        setComments((prev) => prev.filter((c) => c._id !== comment._id));
                        if (selectedCommentDetail?._id === comment._id) {
                            setSelectedCommentDetail(null);
                        }
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Xóa bình luận thất bại');
                } finally {
                    setActionLoadingId('');
                }
            },
        });
    };

    const handleOpenPostDetail = (post) => {
        if (!post) return;
        setSelectedPostDetail(post);
        setModalImageIdx(0);
    };

    const handleTogglePostStatus = (post) => {
        const isHiding = post.status !== 'hidden';
        const newStatus = isHiding ? 'hidden' : 'active';

        setConfirmModal({
            isOpen: true,
            title: isHiding ? 'Ẩn bài viết' : 'Hiện bài viết',
            message: isHiding ? 'Bạn có chắc muốn ẨN bài viết này khỏi Feed?' : 'Hiện lại bài viết này trên Feed?',
            confirmText: isHiding ? 'Ẩn bài viết' : 'Hiện lại',
            type: isHiding ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    setConfirmModal({ isOpen: false });
                    const res = await updatePostStatus(post._id, newStatus);
                    if (res?.code === 200) {
                        toast.success(res.message);
                        setSelectedPostDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Cập nhật bài viết thất bại');
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
                    setConfirmModal({ isOpen: false });
                    const res = await softDeleteAdminPost(post._id);
                    if (res?.code === 200) {
                        toast.success('Đã xóa bài viết thành công');
                        setSelectedPostDetail(null);
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Không thể xóa bài viết');
                }
            },
        });
    };

    // Helper for rendering post author safely
    const getPostAuthor = (post) => {
        if (!post) return null;
        return post.user_id || post.author || null;
    };

    // Helper for post images list
    const getPostImages = (post) => {
        if (!post) return [];
        return post.images && post.images.length > 0 ? post.images : post.media || [];
    };

    return (
        <div className="space-y-6">
            {/* Toolbar & Filters */}
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
                        placeholder="Tìm kiếm nội dung bình luận..."
                        className={`h-11 w-full rounded-2xl border pl-11 pr-4 text-xs font-medium outline-none transition ${
                            isDark
                                ? 'border-white/10 bg-white/5 text-white focus:border-indigo-500 placeholder:text-gray-500'
                                : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500 placeholder:text-slate-400'
                        }`}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Category Filter */}
                    <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                        {[
                            { id: 'all', label: 'Tất cả' },
                            { id: 'root', label: 'Bình luận chính' },
                            { id: 'reply', label: 'Phản hồi' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTypeFilter(item.id)}
                                className={`rounded-xl px-3 py-1.5 font-semibold transition ${
                                    typeFilter === item.id
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

                    {/* Status Filter */}
                    <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                        {[
                            { id: 'all', label: 'Mọi trạng thái' },
                            { id: 'active', label: 'Hiển thị' },
                            { id: 'hidden', label: 'Đã ẩn' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setStatusFilter(item.id)}
                                className={`rounded-xl px-2.5 py-1.5 font-semibold transition ${
                                    statusFilter === item.id
                                        ? 'bg-amber-600 text-white shadow-md'
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

            {/* Comments Table */}
            <div className={`overflow-hidden rounded-3xl border backdrop-blur-xl shadow-2xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white'}`}>
                <div className="no-scrollbar overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className={`border-b uppercase tracking-wider font-bold ${isDark ? 'border-white/10 bg-white/[0.03] text-gray-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                            <tr>
                                <th className="px-6 py-4">Người bình luận</th>
                                <th className="px-6 py-4">Nội dung bình luận</th>
                                <th className="px-6 py-4">Thuộc Bài viết</th>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-gray-400">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                                        <p className="mt-2 font-medium">Đang tải danh sách bình luận...</p>
                                    </td>
                                </tr>
                            ) : comments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-gray-400">
                                        Không tìm thấy bình luận nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                comments.map((c) => {
                                    const isReply = Boolean(c.parentComment);
                                    const isHidden = c.status === 'hidden';
                                    const isProcessing = actionLoadingId === c._id;
                                    const postTitle = getPostDisplayTitle(c.post_id);

                                    return (
                                        <tr
                                            key={c._id}
                                            onClick={() => setSelectedCommentDetail(c)}
                                            className={`transition cursor-pointer ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 min-w-[180px]">
                                                    <img
                                                        src={c.user_id?.avatar || 'https://via.placeholder.com/150'}
                                                        alt="Avatar"
                                                        className="h-9 w-9 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className={`truncate font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                {c.user_id?.fullName || 'Người dùng'}
                                                            </h4>
                                                            {isHidden && (
                                                                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-500 border border-amber-500/30">
                                                                    Ẩn
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`truncate text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                            @{c.user_id?.username || 'user'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-medium max-w-xs">
                                                {isReply && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 mb-0.5">
                                                        <CornerDownRight className="h-3 w-3" />
                                                        Phản hồi {c.replyToUser?.fullName ? `@${c.replyToUser.username}` : ''}
                                                    </div>
                                                )}
                                                <p className={`line-clamp-2 truncate ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                                                    {c.content || 'Hình ảnh / Sticker'}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 max-w-xs" onClick={(e) => e.stopPropagation()}>
                                                {c.post_id ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPostDetail(c.post_id)}
                                                        className="flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 hover:underline text-left truncate max-w-xs"
                                                        title="Bấm để xem bài viết gốc"
                                                    >
                                                        <span className="truncate">{postTitle}</span>
                                                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 italic">Bài viết đã bị xóa</span>
                                                )}
                                            </td>

                                            <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                {new Date(c.createdAt).toLocaleString('vi-VN')}
                                            </td>

                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(c)}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                                            isHidden ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'
                                                        }`}
                                                        title={isHidden ? 'Hiện bình luận' : 'Ẩn bình luận'}
                                                    >
                                                        <EyeOff className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedCommentDetail(c)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition hover:bg-indigo-500/20"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isProcessing}
                                                        onClick={() => handleDelete(c)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
                                                        title="Xóa bình luận vi phạm"
                                                    >
                                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between border-t px-6 py-4 text-xs font-semibold ${isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                        <span>Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} bình luận)</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pagination.page <= 1 || loading}
                                onClick={() => fetchComments(pagination.page - 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                                    isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                } disabled:opacity-30`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                disabled={pagination.page >= pagination.totalPages || loading}
                                onClick={() => fetchComments(pagination.page + 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                                    isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                } disabled:opacity-30`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ================= COMMENT DETAIL MODAL ================= */}
            {selectedCommentDetail && createPortal(
                <div
                    onClick={() => setSelectedCommentDetail(null)}
                    className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border p-6 shadow-2xl space-y-5 ${isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <img
                                    src={selectedCommentDetail.user_id?.avatar || 'https://via.placeholder.com/150'}
                                    alt="Avatar"
                                    className="h-11 w-11 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg"
                                />
                                <div>
                                    <h4 className="font-bold text-sm">{selectedCommentDetail.user_id?.fullName}</h4>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{selectedCommentDetail.user_id?.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedCommentDetail.status === 'hidden' && (
                                    <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-500 border border-amber-500/30">Đã ẩn</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedCommentDetail(null)}
                                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Reply context info */}
                        {selectedCommentDetail.parentComment && (
                            <div className={`rounded-2xl border p-3.5 text-xs space-y-1 ${isDark ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300' : 'border-indigo-200 bg-indigo-50 text-indigo-900'}`}>
                                <div className="flex items-center gap-1.5 font-bold">
                                    <CornerDownRight className="h-4 w-4" />
                                    <span>Phản hồi {selectedCommentDetail.replyToUser?.fullName ? `@${selectedCommentDetail.replyToUser.username}` : 'bình luận'}:</span>
                                </div>
                                {selectedCommentDetail.parentComment?.content && (
                                    <p className="line-clamp-2 italic opacity-80 pl-5 border-l-2 border-indigo-400/40 ml-1">
                                        "{selectedCommentDetail.parentComment.content}"
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="space-y-1">
                            <label className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                Nội dung bình luận:
                            </label>
                            <div className={`rounded-2xl border p-4 text-xs font-medium leading-relaxed whitespace-pre-wrap ${isDark ? 'border-white/5 bg-white/[0.02] text-gray-200' : 'border-slate-100 bg-slate-50 text-slate-800'}`}>
                                {selectedCommentDetail.content}
                            </div>
                        </div>

                        {/* Belong to post - Interactive Button */}
                        {selectedCommentDetail.post_id && (
                            <div
                                onClick={() => handleOpenPostDetail(selectedCommentDetail.post_id)}
                                className={`group rounded-2xl border p-3.5 text-xs space-y-1 cursor-pointer transition ${
                                    isDark ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                                        <FileText className="h-4 w-4" />
                                        <span>Thuộc Bài viết:</span>
                                    </div>
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 group-hover:underline">
                                        Xem chi tiết bài viết <ExternalLink className="h-3 w-3" />
                                    </span>
                                </div>
                                <p className={`font-semibold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {getPostDisplayTitle(selectedCommentDetail.post_id)}
                                </p>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`rounded-2xl border p-3 text-center ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center justify-center gap-1 text-rose-500 font-extrabold text-lg">
                                    <Heart className="h-4 w-4" /> {selectedCommentDetail.likesCount || 0}
                                </div>
                                <div className="text-[11px] font-medium text-gray-400 mt-0.5">Lượt thích</div>
                            </div>
                            <div className={`rounded-2xl border p-3 text-center ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center justify-center gap-1 text-blue-500 font-extrabold text-lg">
                                    <MessageSquare className="h-4 w-4" /> {selectedCommentDetail.repliesCount || 0}
                                </div>
                                <div className="text-[11px] font-medium text-gray-400 mt-0.5">Câu trả lời</div>
                            </div>
                        </div>

                        {/* Meta */}
                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Đăng vào: {new Date(selectedCommentDetail.createdAt).toLocaleString('vi-VN')}</span>
                            {selectedCommentDetail.isEdited && (
                                <span className="ml-2 text-amber-500 font-semibold">(Đã chỉnh sửa)</span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className={`flex items-center justify-end gap-2 border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(selectedCommentDetail)}
                                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                                    selectedCommentDetail.status === 'hidden'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                        : 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                }`}
                            >
                                <EyeOff className="h-4 w-4" />
                                {selectedCommentDetail.status === 'hidden' ? 'Hiện bình luận' : 'Ẩn bình luận'}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDelete(selectedCommentDetail)}
                                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/20"
                            >
                                <Trash2 className="h-4 w-4" /> Xóa bình luận
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ================= POST DETAIL VIEWER MODAL ================= */}
            {selectedPostDetail && (() => {
                const postAuthor = getPostAuthor(selectedPostDetail);
                const postImages = getPostImages(selectedPostDetail);
                const hasTextContent = (selectedPostDetail.title && selectedPostDetail.title.trim()) || (selectedPostDetail.content && selectedPostDetail.content.trim()) || (selectedPostDetail.caption && selectedPostDetail.caption.trim());

                return createPortal(
                    <div
                        onClick={() => setSelectedPostDetail(null)}
                        className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border p-6 shadow-2xl space-y-5 ${
                                isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'
                            }`}
                        >
                            {/* Header */}
                            <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={postAuthor?.avatar || 'https://via.placeholder.com/150'}
                                        alt="Avatar"
                                        className="h-11 w-11 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg"
                                    />
                                    <div>
                                        <h4 className="font-bold text-sm">{postAuthor?.fullName || 'Tác giả'}</h4>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{postAuthor?.username || 'user'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedPostDetail.status === 'hidden' && (
                                        <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-500 border border-amber-500/30">Đã ẩn</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPostDetail(null)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            {selectedPostDetail.title && <h3 className="text-base font-bold text-indigo-500">{selectedPostDetail.title}</h3>}

                            {/* Content */}
                            {selectedPostDetail.content && selectedPostDetail.content.trim() ? (
                                <div className={`text-xs leading-relaxed font-medium whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                    {selectedPostDetail.content}
                                </div>
                            ) : !hasTextContent && postImages.length > 0 ? (
                                <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                                    <ImageIconSimple className="h-4 w-4" />
                                    Bài viết chỉ bao gồm hình ảnh ({postImages.length} ảnh)
                                </div>
                            ) : null}

                            {/* Images Gallery */}
                            {postImages.length > 0 && (
                                <div className="space-y-3">
                                    <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/40">
                                        <img
                                            src={postImages[modalImageIdx]?.url || postImages[modalImageIdx]}
                                            alt="Post Image"
                                            className="w-full max-h-80 object-contain mx-auto"
                                        />
                                    </div>
                                    {postImages.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                            {postImages.map((img, idx) => (
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

                            {/* Stats */}
                            <div className={`grid grid-cols-2 gap-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                <div className={`rounded-2xl border p-3 text-center ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className="flex items-center justify-center gap-1 text-rose-500 font-extrabold text-lg">
                                        <Heart className="h-4 w-4" /> {selectedPostDetail.likesCount || 0}
                                    </div>
                                    <div className="text-[11px] font-medium mt-0.5">Lượt thích</div>
                                </div>
                                <div className={`rounded-2xl border p-3 text-center ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className="flex items-center justify-center gap-1 text-blue-500 font-extrabold text-lg">
                                        <MessageSquare className="h-4 w-4" /> {selectedPostDetail.commentsCount || 0}
                                    </div>
                                    <div className="text-[11px] font-medium mt-0.5">Bình luận</div>
                                </div>
                            </div>

                            {/* Meta */}
                            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                    Đăng vào: {selectedPostDetail.createdAt ? new Date(selectedPostDetail.createdAt).toLocaleString('vi-VN') : 'Không rõ'}
                                </span>
                            </div>

                            {/* Actions Footer */}
                            <div className={`flex flex-wrap items-center justify-end gap-2 border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                <button
                                    type="button"
                                    onClick={() => handleTogglePostStatus(selectedPostDetail)}
                                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                                        selectedPostDetail.status === 'hidden'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                            : 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                    }`}
                                >
                                    <EyeOff className="h-4 w-4" />
                                    {selectedPostDetail.status === 'hidden' ? 'Hiện bài viết' : 'Ẩn bài viết'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDeletePost(selectedPostDetail)}
                                    className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/20"
                                >
                                    <Trash2 className="h-4 w-4" /> Xóa bài viết
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                );
            })()}


            {/* CONFIRMATION MODAL */}
            <ConfirmModal {...confirmModal} onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
        </div>
    );
}

export default CommentsAdmin;
