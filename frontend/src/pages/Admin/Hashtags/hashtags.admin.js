import { useEffect, useState } from 'react';
import {
    Hash,
    Plus,
    Trash2,
    TrendingUp,
    ShieldAlert,
    Loader2,
    Search,
    Filter,
    ArrowUpDown,
    Eye,
    Shield,
    X,
    Heart,
    MessageSquare,
    AlertTriangle,
    Lock,
    Unlock,
    Flame,
    CheckCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getAdminHashtags,
    addBlacklistHashtag,
    deleteBlacklistHashtag,
    getHashtagPosts,
} from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmModal from '../../../components/ConfirmModal';
import AdminPagination from '../../../components/AdminPagination';
import AdminPostDetailModal from '../../../components/AdminPostDetailModal';
import AdminSelect from '../../../components/AdminSelect';


function HashtagsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [hashtags, setHashtags] = useState([]);
    const [stats, setStats] = useState({ totalHashtagsCount: 0, trendingCount: 0, blacklistCount: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

    // Filters
    const [keyword, setKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'trending' | 'blacklist'
    const [sortBy, setSortBy] = useState('count'); // 'count' | 'interactions' | 'newest' | 'alphabetical'

    // Add Blacklist Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [newReason, setNewReason] = useState('');
    const [adding, setAdding] = useState(false);

    // Hashtag Posts Modal State
    const [selectedHashtagForPosts, setSelectedHashtagForPosts] = useState(null);
    const [hashtagPosts, setHashtagPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [selectedPostDetail, setSelectedPostDetail] = useState(null);

    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    const debouncedKeyword = useDebounce(keyword.trim(), 400);

    const fetchHashtags = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAdminHashtags({
                keyword: debouncedKeyword,
                tab: activeTab,
                sortBy,
                page,
                limit: 10,
            });

            if (res?.code === 200) {
                setHashtags(res.data.hashtags || []);
                setStats(res.data.stats || { totalHashtagsCount: 0, trendingCount: 0, blacklistCount: 0 });
                setPagination(res.data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
            } else {
                toast.error(res?.message || 'Không thể tải danh sách hashtag');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải hashtag');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHashtags(1);
    }, [debouncedKeyword, activeTab, sortBy]);

    // Handle Add to Blacklist Submit
    const handleAddBlacklistSubmit = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) {
            toast.warning('Vui lòng nhập tên Hashtag');
            return;
        }

        try {
            setAdding(true);
            const res = await addBlacklistHashtag(newTag, newReason);
            if (res?.code === 200) {
                toast.success(res.message);
                setNewTag('');
                setNewReason('');
                setShowAddModal(false);
                fetchHashtags(pagination.page);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Thêm vào danh sách cấm thất bại');
        } finally {
            setAdding(false);
        }
    };

    // Quick Blacklist a tag from the table
    const handleQuickBlacklist = (item) => {
        setConfirmModal({
            isOpen: true,
            title: `Cấm Hashtag #${item.tag}`,
            message: `Bạn có chắc muốn thêm #${item.tag} vào danh sách cấm? Người dùng sẽ không thể đăng bài với hashtag này.`,
            confirmText: 'Cấm ngay',
            type: 'danger',
            onConfirm: async () => {
                try {
                    setConfirmModal({ isOpen: false });
                    const res = await addBlacklistHashtag(item.tag, 'Cấm từ danh sách Hashtag');
                    if (res?.code === 200) {
                        toast.success(res.message);
                        fetchHashtags(pagination.page);
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Cấm thất bại');
                }
            },
        });
    };

    // Remove from Blacklist
    const handleRemoveBlacklist = (item) => {
        if (!item.blacklistId) return;

        setConfirmModal({
            isOpen: true,
            title: `Bỏ cấm Hashtag #${item.tag}`,
            message: `Bạn có chắc muốn gỡ bỏ cấm cho hashtag #${item.tag}?`,
            confirmText: 'Gỡ cấm',
            type: 'info',
            onConfirm: async () => {
                try {
                    setConfirmModal({ isOpen: false });
                    const res = await deleteBlacklistHashtag(item.blacklistId);
                    if (res?.code === 200) {
                        toast.success('Đã gỡ khỏi danh sách cấm thành công');
                        fetchHashtags(pagination.page);
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Gỡ cấm thất bại');
                }
            },
        });
    };

    // Open Hashtag Posts Viewer
    const handleOpenHashtagPosts = async (tag) => {
        try {
            setSelectedHashtagForPosts(tag);
            setLoadingPosts(true);
            const res = await getHashtagPosts(tag, { page: 1, limit: 20 });
            if (res?.code === 200) {
                setHashtagPosts(res.data.posts || []);
            }
        } catch (err) {
            toast.error('Không thể lấy danh sách bài viết');
        } finally {
            setLoadingPosts(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Total Hashtags Card */}
                <div
                    onClick={() => setActiveTab('all')}
                    className={`group relative overflow-hidden rounded-3xl border p-5 transition cursor-pointer ${
                        activeTab === 'all'
                            ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                            : isDark
                            ? 'border-white/10 bg-[#0f172a]/80 hover:bg-[#0f172a]'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-indigo-400">Tổng số Hashtag</p>
                            <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {stats.totalHashtagsCount || 0}
                            </h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-500 group-hover:scale-110 transition">
                            <Hash className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Trending Card */}
                <div
                    onClick={() => setActiveTab('trending')}
                    className={`group relative overflow-hidden rounded-3xl border p-5 transition cursor-pointer ${
                        activeTab === 'trending'
                            ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                            : isDark
                            ? 'border-white/10 bg-[#0f172a]/80 hover:bg-[#0f172a]'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-400">Đang Xu Hướng (7 ngày)</p>
                            <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {stats.trendingCount || 0}
                            </h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 group-hover:scale-110 transition">
                            <Flame className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Blacklist Card */}
                <div
                    onClick={() => setActiveTab('blacklist')}
                    className={`group relative overflow-hidden rounded-3xl border p-5 transition cursor-pointer ${
                        activeTab === 'blacklist'
                            ? 'border-rose-500/50 bg-rose-500/10 shadow-lg shadow-rose-500/10'
                            : isDark
                            ? 'border-white/10 bg-[#0f172a]/80 hover:bg-[#0f172a]'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-rose-400">Hashtag Bị Cấm (Blacklist)</p>
                            <h3 className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {stats.blacklistCount || 0}
                            </h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500 group-hover:scale-110 transition">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER & ACTIONS BAR */}
            <div className={`rounded-3xl border p-5 backdrop-blur-xl space-y-4 ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm kiếm hashtag..."
                            className={`h-10 w-full rounded-2xl border pl-9 pr-4 text-xs font-medium outline-none transition ${
                                isDark ? 'border-white/10 bg-white/5 text-white focus:border-indigo-500' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500'
                            }`}
                        />
                    </div>

                    {/* Add Blacklist Button */}
                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500"
                    >
                        <Plus className="h-4 w-4" /> Thêm Hashtag Cấm
                    </button>
                </div>

                {/* Tabs & Sort */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4 border-white/5">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                                activeTab === 'all'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : isDark
                                    ? 'bg-white/5 text-gray-400 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Tất cả ({stats.totalHashtagsCount || 0})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('trending')}
                            className={`flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                                activeTab === 'trending'
                                    ? 'bg-amber-500 text-white shadow'
                                    : isDark
                                    ? 'bg-white/5 text-gray-400 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Flame className="h-3.5 w-3.5 text-amber-400" />
                            Top Xu Hướng ({stats.trendingCount || 0})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('blacklist')}
                            className={`flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                                activeTab === 'blacklist'
                                    ? 'bg-rose-600 text-white shadow'
                                    : isDark
                                    ? 'bg-white/5 text-gray-400 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                            Blacklist Cấm ({stats.blacklistCount || 0})
                        </button>
                    </div>

                    {/* Sort Selector */}
                    <div className="flex items-center gap-2">
                        <AdminSelect
                            value={sortBy}
                            onChange={(val) => setSortBy(val)}
                            icon={ArrowUpDown}
                            options={[
                                { value: 'count', label: 'Nhiều bài viết nhất' },
                                { value: 'interactions', label: 'Tương tác cao nhất' },
                                { value: 'newest', label: 'Mới dùng gần đây' },
                                { value: 'alphabetical', label: 'Tên A - Z' },
                            ]}
                        />
                    </div>

                </div>

                {/* HASHTAGS TABLE */}
                <div className="overflow-x-auto no-scrollbar pt-2">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className={`border-b text-[11px] font-extrabold uppercase tracking-wider ${isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                                <th className="pb-3 pl-2">Hashtag</th>
                                <th className="pb-3">Trạng thái</th>
                                <th className="pb-3 text-center">Số bài viết</th>
                                <th className="pb-3 text-center">Lượt tương tác</th>
                                <th className="pb-3">Mới nhất</th>
                                <th className="pb-3 pr-2 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500 mb-2" />
                                        Đang tải dữ liệu hashtag...
                                    </td>
                                </tr>
                            ) : hashtags.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        Không tìm thấy hashtag nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                hashtags.map((item, idx) => (
                                    <tr key={idx} className={`transition hover:bg-white/[0.02] ${isDark ? '' : 'hover:bg-slate-50'}`}>
                                        {/* Hashtag Name */}
                                        <td className="py-3.5 pl-2 font-bold">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-extrabold text-xs">
                                                    #
                                                </span>
                                                <span className={`text-xs font-extrabold ${item.isBlacklisted ? 'line-through text-rose-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    #{item.tag}
                                                </span>
                                                {item.recentCount > 0 && (
                                                    <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                                                        <Flame className="h-3 w-3" /> Hot
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5">
                                            {item.isBlacklisted ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-500 border border-rose-500/30">
                                                    <ShieldAlert className="h-3 w-3" /> Đã bị cấm
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/30">
                                                    <CheckCircle className="h-3 w-3" /> Hoạt động
                                                </span>
                                            )}
                                        </td>

                                        {/* Post Count */}
                                        <td className="py-3.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenHashtagPosts(item.tag)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-indigo-500/10 px-2.5 py-1 font-extrabold text-indigo-400 hover:bg-indigo-500/20 transition"
                                            >
                                                <span>{item.count} bài</span>
                                                <Eye className="h-3 w-3" />
                                            </button>
                                        </td>

                                        {/* Interactions */}
                                        <td className="py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-3 font-semibold text-gray-400">
                                                <span className="flex items-center gap-1 text-rose-400">
                                                    <Heart className="h-3 w-3" /> {item.likesCount}
                                                </span>
                                                <span className="flex items-center gap-1 text-blue-400">
                                                    <MessageSquare className="h-3 w-3" /> {item.commentsCount}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Last Used */}
                                        <td className="py-3.5 text-gray-400">
                                            {item.lastUsed ? new Date(item.lastUsed).toLocaleDateString('vi-VN') : 'N/A'}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 pr-2 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenHashtagPosts(item.tag)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition hover:bg-indigo-500/20"
                                                    title="Xem các bài viết chứa hashtag này"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {item.isBlacklisted ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBlacklist(item)}
                                                        className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-500 transition hover:bg-emerald-500/20"
                                                        title="Gỡ khỏi Blacklist"
                                                    >
                                                        <Unlock className="h-3.5 w-3.5" /> Gỡ Cấm
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickBlacklist(item)}
                                                        className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-500/20"
                                                        title="Thêm vào Blacklist Cấm"
                                                    >
                                                        <Lock className="h-3.5 w-3.5" /> Cấm
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <AdminPagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={(p) => fetchHashtags(p)}
                />
            </div>

            {/* ================= ADD BLACKLIST MODAL ================= */}
            {showAddModal && (
                <div
                    onClick={() => setShowAddModal(false)}
                    className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl space-y-5 ${
                            isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'
                        }`}
                    >
                        <div className="flex items-center justify-between border-b pb-4 border-rose-500/20">
                            <div className="flex items-center gap-2 font-bold text-sm text-rose-500">
                                <ShieldAlert className="h-5 w-5" /> Thêm Hashtag vào Blacklist Cấm
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                    isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddBlacklistSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className={`text-xs font-extrabold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Tên Hashtag Cấm:</label>
                                <div className="relative">
                                    <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Ví dụ: hack_coin, game_bai..."
                                        className={`h-11 w-full rounded-2xl border pl-9 pr-4 text-xs font-bold outline-none ${
                                            isDark ? 'border-white/10 bg-white/5 text-white focus:border-rose-500' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-rose-500'
                                        }`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={`text-xs font-extrabold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Lý do cấm (không bắt buộc):</label>
                                <textarea
                                    rows={3}
                                    value={newReason}
                                    onChange={(e) => setNewReason(e.target.value)}
                                    placeholder="Lý do cấm hashtag này..."
                                    className={`w-full rounded-2xl border p-3 text-xs font-medium outline-none ${
                                        isDark ? 'border-white/10 bg-white/5 text-white focus:border-rose-500' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-rose-500'
                                    }`}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                                        isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={adding || !newTag.trim()}
                                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-rose-500 disabled:opacity-50"
                                >
                                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />} Cấm ngay
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= HASHTAG POSTS LIST MODAL ================= */}
            {selectedHashtagForPosts && (
                <div
                    onClick={() => setSelectedHashtagForPosts(null)}
                    className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar rounded-3xl border p-6 shadow-2xl space-y-4 ${
                            isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'
                        }`}
                    >
                        <div className="flex items-center justify-between border-b pb-3 border-indigo-500/20">
                            <div className="flex items-center gap-2 font-extrabold text-sm text-indigo-400">
                                <Hash className="h-5 w-5" /> Các bài viết chứa hashtag #{selectedHashtagForPosts} ({hashtagPosts.length})
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedHashtagForPosts(null)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                    isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {loadingPosts ? (
                            <div className="py-12 text-center text-gray-400">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500 mb-2" />
                                Đang tìm kiếm các bài viết chứa #{selectedHashtagForPosts}...
                            </div>
                        ) : hashtagPosts.length === 0 ? (
                            <div className="py-8 text-center text-xs text-gray-400">Không tìm thấy bài viết nào chứa hashtag này.</div>
                        ) : (
                            <div className="space-y-3">
                                {hashtagPosts.map((p) => (
                                    <div
                                        key={p._id}
                                        onClick={() => setSelectedPostDetail(p)}
                                        className={`group rounded-2xl border p-4 transition cursor-pointer space-y-2 ${
                                            isDark ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <img
                                                    src={p.user_id?.avatar || 'https://via.placeholder.com/150'}
                                                    alt=""
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                                <div>
                                                    <h5 className="font-bold text-xs">{p.user_id?.fullName || 'Tác giả'}</h5>
                                                    <p className="text-[10px] text-gray-400">@{p.user_id?.username}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>

                                        {p.title && <h4 className="font-bold text-xs text-indigo-400">{p.title}</h4>}
                                        {p.content && <p className="text-xs line-clamp-2 leading-relaxed opacity-90">{p.content}</p>}

                                        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-rose-400 font-bold">
                                                    <Heart className="h-3 w-3" /> {p.likesCount || 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-blue-400 font-bold">
                                                    <MessageSquare className="h-3 w-3" /> {p.commentsCount || 0}
                                                </span>
                                            </div>
                                            <span className="text-indigo-400 font-bold group-hover:underline flex items-center gap-1">
                                                Xem chi tiết bài <Eye className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* REUSABLE POST DETAIL VIEWER MODAL */}
            <AdminPostDetailModal
                post={selectedPostDetail}
                onClose={() => setSelectedPostDetail(null)}
                onUpdatePost={(updatedPost) => {
                    if (!updatedPost) {
                        setHashtagPosts((prev) => prev.filter((p) => p._id !== selectedPostDetail._id));
                        setSelectedPostDetail(null);
                    } else {
                        setHashtagPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
                        setSelectedPostDetail(updatedPost);
                    }
                }}
            />

            {/* CONFIRMATION MODAL */}
            <ConfirmModal {...confirmModal} onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
        </div>
    );
}

export default HashtagsAdmin;
