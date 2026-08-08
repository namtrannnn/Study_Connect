import { useEffect, useState } from 'react';
import { Hash, Plus, Trash2, TrendingUp, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminHashtags, addBlacklistHashtag, deleteBlacklistHashtag } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';

function HashtagsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [trending, setTrending] = useState([]);
    const [blacklist, setBlacklist] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchHashtags = async () => {
        try {
            setLoading(true);
            const res = await getAdminHashtags();
            if (res?.code === 200) {
                setTrending(res.data.trending || []);
                setBlacklist(res.data.blacklist || []);
            } else {
                toast.error(res?.message || 'Không thể tải hashtag');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải hashtag');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHashtags();
    }, []);

    const handleAddBlacklist = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) return;

        try {
            setAdding(true);
            const res = await addBlacklistHashtag(newTag);
            if (res?.code === 200) {
                toast.success(res.message);
                setNewTag('');
                fetchHashtags();
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Thêm blacklist thất bại');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteBlacklist = async (id) => {
        try {
            const res = await deleteBlacklistHashtag(id);
            if (res?.code === 200) {
                toast.success('Đã xóa khỏi Blacklist');
                setBlacklist((prev) => prev.filter((item) => item._id !== id));
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Xóa thất bại');
        }
    };

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Trending Hashtags */}
            <div className={`rounded-3xl border p-6 backdrop-blur-xl space-y-4 ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-500">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Top Hashtag Trending</h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Các chủ đề hashtag đang được thảo luận nhiều nhất</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-gray-400">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : trending.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400">Chưa có hashtag nào.</div>
                ) : (
                    <div className="space-y-3">
                        {trending.map((item, idx) => (
                            <div key={idx} className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/10 text-xs font-extrabold text-indigo-500">
                                        #{idx + 1}
                                    </span>
                                    <span className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>#{item.tag}</span>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? 'bg-white/5 text-gray-300' : 'bg-slate-200 text-slate-700'}`}>
                                    {item.count} bài viết
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Blacklist Hashtags */}
            <div className={`rounded-3xl border p-6 backdrop-blur-xl space-y-4 ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Blacklist Hashtag Cấm</h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Các từ khóa/hashtag cấm xuất hiện trên nền tảng</p>
                    </div>
                </div>

                {/* Add Blacklist Form */}
                <form onSubmit={handleAddBlacklist} className="flex gap-2">
                    <div className="relative flex-1">
                        <Hash className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Nhập hashtag cấm (ví dụ: cam_spamm)..."
                            className={`h-10 w-full rounded-2xl border pl-9 pr-4 text-xs font-medium outline-none ${
                                isDark ? 'border-white/10 bg-white/5 text-white focus:border-rose-500' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-rose-500'
                            }`}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={adding || !newTag.trim()}
                        className="flex items-center gap-1.5 rounded-2xl bg-rose-600 px-4 text-xs font-bold text-white shadow-lg transition hover:bg-rose-500 disabled:opacity-50"
                    >
                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Thêm Cấm
                    </button>
                </form>

                {loading ? (
                    <div className="py-12 text-center text-gray-400">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-rose-500" />
                    </div>
                ) : blacklist.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400">Danh sách cấm đang trống.</div>
                ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {blacklist.map((item) => (
                            <div key={item._id} className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3">
                                <span className="font-bold text-xs text-rose-500">#{item.tag}</span>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteBlacklist(item._id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20"
                                    title="Bỏ cấm"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default HashtagsAdmin;
