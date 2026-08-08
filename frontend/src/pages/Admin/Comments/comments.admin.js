import { useEffect, useState } from 'react';
import { Search, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminComments, deleteAdminComment } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';

function CommentsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [keyword, setKeyword] = useState('');
    const [deletingId, setDeletingId] = useState('');

    const fetchComments = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAdminComments({ keyword, page, limit: 10 });
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
        const timer = setTimeout(() => {
            fetchComments(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [keyword]);

    const handleDelete = async (comment) => {
        if (!window.confirm(`Xóa bình luận này của ${comment.user_id?.fullName || 'người dùng'}?`)) return;

        try {
            setDeletingId(comment._id);
            const res = await deleteAdminComment(comment._id);
            if (res?.code === 200) {
                toast.success('Đã xóa bình luận vi phạm');
                setComments((prev) => prev.filter((c) => c._id !== comment._id));
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Xóa bình luận thất bại');
        } finally {
            setDeletingId('');
        }
    };

    return (
        <div className="space-y-6">
            <div className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
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
                <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Tổng số bình luận: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pagination.total}</span>
                </div>
            </div>

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
                                        Không tìm thấy bình luận nào.
                                    </td>
                                </tr>
                            ) : (
                                comments.map((c) => (
                                    <tr key={c._id} className={`transition ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 min-w-[180px]">
                                                <img
                                                    src={c.user_id?.avatar || 'https://via.placeholder.com/150'}
                                                    alt="Avatar"
                                                    className="h-9 w-9 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                                />
                                                <div className="min-w-0">
                                                    <h4 className={`truncate font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.user_id?.fullName || 'Người dùng'}</h4>
                                                    <p className={`truncate text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{c.user_id?.username || 'user'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 font-medium max-w-xs truncate ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                                            {c.content || 'Hình ảnh / Sticker'}
                                        </td>
                                        <td className="px-6 py-4 text-indigo-500 max-w-xs truncate font-medium">
                                            {c.post_id?.title || c.post_id?.content || 'Bài viết'}
                                        </td>
                                        <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                            {new Date(c.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                disabled={deletingId === c._id}
                                                onClick={() => handleDelete(c)}
                                                className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
                                                title="Xóa bình luận vi phạm"
                                            >
                                                {deletingId === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between border-t px-6 py-4 text-xs font-semibold ${isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                        <span>Trang {pagination.page} / {pagination.totalPages}</span>
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
        </div>
    );
}

export default CommentsAdmin;
