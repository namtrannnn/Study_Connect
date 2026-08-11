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
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminPosts, updatePostStatus, softDeleteAdminPost } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';
import useDebounce from '../../../hooks/useDebounce';

function PostsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 9, totalPages: 1, total: 0 });
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPost, setSelectedPost] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState('');

    const debouncedKeyword = useDebounce(keyword.trim(), 400);

    const fetchPosts = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAdminPosts({
                keyword: debouncedKeyword,
                status: statusFilter,
                page,
                limit: 9,
            });

            if (res?.code === 200) {
                setPosts(res.data.posts || []);
                setPagination(res.data.pagination || { page: 1, limit: 9, totalPages: 1, total: 0 });
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
    }, [debouncedKeyword, statusFilter]);


    const handleToggleStatus = async (post) => {
        const newStatus = post.status === 'hidden' ? 'active' : 'hidden';
        const msg = newStatus === 'hidden' ? 'Ẩn bài viết này khỏi Feed?' : 'Hiện lại bài viết trên Feed?';
        if (!window.confirm(msg)) return;

        try {
            setActionLoadingId(post._id);
            const res = await updatePostStatus(post._id, newStatus);
            if (res?.code === 200) {
                toast.success(res.message);
                setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, status: newStatus } : p)));
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Cập nhật bài viết thất bại');
        } finally {
            setActionLoadingId('');
        }
    };

    const handleDeletePost = async (post) => {
        if (!window.confirm('Xóa vĩnh viễn bài viết này khỏi hệ thống?')) return;

        try {
            setActionLoadingId(post._id);
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

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                        {[
                            { id: 'all', label: 'Tất cả bài viết' },
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
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Không tìm thấy bài viết phù hợp với từ khóa.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => {
                        const author = post.user_id;
                        const isHidden = post.status === 'hidden';
                        const isProcessing = actionLoadingId === post._id;

                        return (
                            <div
                                key={post._id}
                                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl ${
                                    isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white'
                                }`}
                            >
                                <div>
                                    <div className={`flex items-center justify-between gap-3 border-b pb-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={author?.avatar || 'https://via.placeholder.com/150'}
                                                alt="Author Avatar"
                                                className="h-9 w-9 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                            />
                                            <div className="min-w-0">
                                                <h4 className={`truncate font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{author?.fullName || 'Người dùng'}</h4>
                                                <p className={`truncate text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{author?.username || 'user'}</p>
                                            </div>
                                        </div>
                                        {isHidden && (
                                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/30">
                                                Đã ẩn
                                            </span>
                                        )}
                                    </div>

                                    {post.images && post.images.length > 0 && (
                                        <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-black/40 h-40">
                                            <img
                                                src={post.images[0]?.url || post.images[0]}
                                                alt="Post Media"
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        {post.title && <h5 className="font-bold text-indigo-400 text-xs mb-1 line-clamp-1">{post.title}</h5>}
                                        <p className={`line-clamp-3 text-xs leading-relaxed font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                            {post.content || 'Bài viết không có phần mô tả.'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                    <div className="flex items-center gap-3 text-xs font-semibold">
                                        <span className="flex items-center gap-1 text-rose-500">
                                            <Heart className="h-3.5 w-3.5" /> {post.likesCount || 0}
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-500">
                                            <MessageSquare className="h-3.5 w-3.5" /> {post.commentsCount || 0}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
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
                                            onClick={() => setSelectedPost(post)}
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
                    <span>Trang {pagination.page} / {pagination.totalPages}</span>
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

            {/* Post Detail Viewer Modal */}
            {selectedPost && (
                <div
                    onClick={() => setSelectedPost(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-2xl overflow-hidden rounded-3xl border p-6 shadow-2xl space-y-4 ${isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                    >

                        <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <img
                                    src={selectedPost.user_id?.avatar || 'https://via.placeholder.com/150'}
                                    alt="Avatar"
                                    className="h-10 w-10 rounded-2xl object-cover ring-1 ring-black/10"
                                />
                                <div>
                                    <h4 className="font-bold text-sm">{selectedPost.user_id?.fullName}</h4>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{selectedPost.user_id?.username}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPost(null)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {selectedPost.title && <h3 className="text-base font-bold text-indigo-500">{selectedPost.title}</h3>}

                        <div className={`max-h-60 overflow-y-auto pr-2 text-xs leading-relaxed font-medium whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                            {selectedPost.content}
                        </div>

                        {selectedPost.images && selectedPost.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {selectedPost.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img?.url || img}
                                        alt="Post Image"
                                        className="h-36 w-full rounded-2xl object-cover border border-black/10"
                                    />
                                ))}
                            </div>
                        )}

                        <div className={`flex items-center justify-between border-t pt-4 text-xs ${isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                            <span>Đăng vào: {new Date(selectedPost.createdAt).toLocaleString('vi-VN')}</span>
                            <button
                                type="button"
                                onClick={() => handleDeletePost(selectedPost)}
                                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/20"
                            >
                                <Trash2 className="h-4 w-4" /> Xóa bài viết
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PostsAdmin;
