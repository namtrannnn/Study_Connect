import { useEffect, useState } from 'react';
import { Search, X, Clock, FileText, FolderKanban, CircleHelp, GraduationCap, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { searchStudyConnect } from '../../../services/SearchServices';
import useDebounce from '../../../hooks/useDebounce';
import { LoadingSearch } from '../../../components/Loading';
import { followUser, unfollowUser } from '../../../services/friend.services';

const TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'users', label: 'Người dùng' },
    { id: 'posts', label: 'Bài viết' },
];

const HISTORY_STORAGE_KEY = 'studyconnect_search_history';

function getRelationBadge(status) {
    switch (status) {
        case 'mutual':
            return { label: '👥 Bạn bè', className: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' };
        case 'following':
            return { label: 'Đang theo dõi', className: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300' };
        case 'follower':
            return { label: 'Theo dõi lại', className: 'bg-blue-600 text-white hover:bg-blue-700' };
        case 'pending_sent':
            return { label: '⏳ Đã gửi yêu cầu', className: 'bg-amber-50 text-amber-700 hover:bg-red-50 hover:text-red-600 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-red-500/20' };
        default:
            return { label: '+ Theo dõi', className: 'bg-blue-600 text-white hover:bg-blue-700' };
    }
}

function getPostTypeLabel(type) {
    switch (type) {
        case 'project':
            return 'Dự án';
        case 'question':
            return 'Câu hỏi';
        case 'knowledge':
            return 'Kiến thức';
        case 'learning':
            return 'Học tập';
        case 'collaboration':
            return 'Cộng tác';
        case 'achievement':
            return 'Thành tựu';
        default:
            return 'Bài viết';
    }
}

function getPostIcon(type) {
    if (type === 'project') return FolderKanban;
    if (type === 'question') return CircleHelp;
    if (type === 'learning') return GraduationCap;
    if (type === 'collaboration') return Users;
    return FileText;
}

export default function SearchPanel({ onClose }) {
    const navigate = useNavigate();

    const [keyword, setKeyword] = useState('');
    const debouncedKeyword = useDebounce(keyword.trim(), 400);

    // Search History State (from localStorage)
    const [searchHistory, setSearchHistory] = useState(() => {
        try {
            const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
            return saved ? JSON.parse(saved) : ['react', '@namtran', 'studyconnect', 'javascript'];
        } catch {
            return ['react', '@namtran', 'studyconnect', 'javascript'];
        }
    });

    const [activeTab, setActiveTab] = useState('all');
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);
    const [hasMorePosts, setHasMorePosts] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [error, setError] = useState('');

    const hasResult = users.length > 0 || posts.length > 0;
    const showUsers = activeTab === 'all' || activeTab === 'users';
    const showPosts = activeTab === 'all' || activeTab === 'posts';

    // Save term to search history
    const saveToHistory = (term) => {
        if (!term || term.length < 2) return;
        setSearchHistory((prev) => {
            const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
            const updated = [term, ...filtered].slice(0, 10);
            try {
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
        });
    };

    // Remove single item from search history
    const handleRemoveHistoryItem = (e, itemToRemove) => {
        e.stopPropagation();
        setSearchHistory((prev) => {
            const updated = prev.filter((item) => item !== itemToRemove);
            try {
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
        });
    };

    // Clear all search history
    const handleClearAllHistory = () => {
        setSearchHistory([]);
        try {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch {}
    };

    // Initial Search when debounced keyword or tab changes
    useEffect(() => {
        if (!debouncedKeyword) {
            setUsers([]);
            setPosts([]);
            setPage(1);
            setHasMoreUsers(false);
            setHasMorePosts(false);
            setError('');
            setLoading(false);
            return;
        }

        saveToHistory(debouncedKeyword);

        const executeSearch = async () => {
            try {
                setLoading(true);
                setError('');
                setPage(1);

                const res = await searchStudyConnect({
                    keyword: debouncedKeyword,
                    type: activeTab,
                    page: 1,
                    limit: activeTab === 'all' ? 8 : 15,
                });

                const data = res?.data || {};
                setUsers(data.users || []);
                setPosts(data.posts || []);
                setHasMoreUsers(Boolean(data.hasMoreUsers));
                setHasMorePosts(Boolean(data.hasMorePosts));
            } catch (err) {
                console.log('Search error:', err);
                setUsers([]);
                setPosts([]);
                setError('Không thể tìm kiếm lúc này. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        executeSearch();
    }, [debouncedKeyword, activeTab]);

    // Load More Pagination
    const handleLoadMore = async () => {
        if (loadingMore || !debouncedKeyword) return;
        const nextPage = page + 1;
        try {
            setLoadingMore(true);
            const res = await searchStudyConnect({
                keyword: debouncedKeyword,
                type: activeTab,
                page: nextPage,
                limit: activeTab === 'all' ? 8 : 15,
            });

            const data = res?.data || {};
            const newUsers = data.users || [];
            const newPosts = data.posts || [];

            setUsers((prev) => [...prev, ...newUsers]);
            setPosts((prev) => [...prev, ...newPosts]);
            setPage(nextPage);
            setHasMoreUsers(Boolean(data.hasMoreUsers));
            setHasMorePosts(Boolean(data.hasMorePosts));
        } catch (err) {
            console.log('Load more search error:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Follow / Unfollow User Action Handler
    const handleToggleFollow = async (e, user) => {
        e.preventDefault();
        e.stopPropagation();
        const targetUserId = user._id;
        if (actionLoadingId === targetUserId) return;

        try {
            setActionLoadingId(targetUserId);

            if (user.relationStatus === 'following' || user.relationStatus === 'mutual') {
                await unfollowUser(targetUserId);
                setUsers((prev) =>
                    prev.map((u) => (u._id === targetUserId ? { ...u, relationStatus: 'none' } : u)),
                );
                toast.info(`Đã bỏ theo dõi ${user.fullName}`);
            } else if (user.relationStatus === 'pending_sent') {
                await unfollowUser(targetUserId);
                setUsers((prev) =>
                    prev.map((u) => (u._id === targetUserId ? { ...u, relationStatus: 'none' } : u)),
                );
                toast.info('Đã hủy yêu cầu theo dõi');
            } else {
                const res = await followUser(targetUserId);
                const newStatus = res?.data?.relationStatus || (user.isPrivate ? 'pending_sent' : 'following');
                setUsers((prev) =>
                    prev.map((u) => (u._id === targetUserId ? { ...u, relationStatus: newStatus } : u)),
                );
                toast.success(
                    newStatus === 'pending_sent'
                        ? 'Đã gửi yêu cầu theo dõi'
                        : `Đã theo dõi ${user.fullName}`,
                );
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleGoProfile = (target) => {
        if (!target) return;
        onClose?.();
        navigate(`/profile/${target}`);
    };

    const handleGoPost = (postId) => {
        if (!postId) return;
        onClose?.();
        navigate(`/post/${postId}`);
    };

    return (
        <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-[#181b22] dark:text-white">
            {/* Header */}
            <div className="border-b border-blue-100 px-5 py-4 dark:border-white/10">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Tìm kiếm</h2>
                        <p className="text-xs font-medium text-slate-400">Tìm kiếm bạn học, bài viết nhanh chóng</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Input with debounce */}
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-blue-200 dark:bg-white/10 dark:focus-within:bg-white/10 dark:focus-within:ring-blue-400/30">
                    <Search className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Nhập tên, @username, React..."
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                        autoFocus
                    />

                    {keyword && (
                        <button
                            type="button"
                            onClick={() => setKeyword('')}
                            className="rounded-full bg-slate-200 p-1 text-slate-500 transition hover:bg-slate-300 dark:bg-white/10 dark:text-slate-300"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Tabs Filter */}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {TABS.map((tab) => {
                        const active = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    shrink-0 rounded-full px-4 py-2 text-xs font-bold transition
                                    ${
                                        active
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Body Results */}
            <div id="search-scroll-container" className="flex-1 overflow-y-auto px-5 py-4">
                {!debouncedKeyword && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                                Lịch sử tìm kiếm gần đây
                            </p>
                            {searchHistory.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAllHistory}
                                    className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Xóa tất cả
                                </button>
                            )}
                        </div>

                        {searchHistory.length === 0 ? (
                            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-4 text-center dark:border-white/10 dark:bg-white/5">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Chưa có lịch sử tìm kiếm. Nhập từ khóa để tìm bạn học hoặc bài viết!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {searchHistory.map((item) => (
                                    <div
                                        key={item}
                                        onClick={() => setKeyword(item)}
                                        className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left transition hover:bg-blue-50 dark:hover:bg-white/10"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                                                <Clock className="h-4 w-4" />
                                            </span>
                                            <span className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {item}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => handleRemoveHistoryItem(e, item)}
                                            title="Xóa khỏi lịch sử"
                                            className="rounded-full p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-white/20 dark:hover:text-white"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {debouncedKeyword && loading && <LoadingSearch />}

                {debouncedKeyword && !loading && error && (
                    <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-500 dark:bg-red-500/10">
                        {error}
                    </div>
                )}

                {debouncedKeyword && !loading && !error && !hasResult && (
                    <div className="flex h-[260px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                            <Search className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Không tìm thấy kết quả</p>
                        <p className="mt-1 max-w-[260px] text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Thử tìm bằng tên, @username hoặc từ khóa bài viết khác.
                        </p>
                    </div>
                )}

                {debouncedKeyword && !loading && !error && hasResult && (
                    <div className="space-y-6">
                        {/* Users Section */}
                        {showUsers && users.length > 0 && (
                            <section>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Người dùng ({users.length})
                                    </h3>

                                    {activeTab === 'all' && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('users')}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            Xem tất cả
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    {users.map((u) => {
                                        const badge = getRelationBadge(u.relationStatus);

                                        return (
                                            <div
                                                key={u._id}
                                                onClick={() => handleGoProfile(u.username || u._id)}
                                                className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-transparent p-3 transition hover:border-blue-100 hover:bg-blue-50/70 dark:hover:border-white/10 dark:hover:bg-white/5"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <img
                                                        src={u.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                                        alt={u.fullName}
                                                        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-white/10"
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                                            {u.fullName}
                                                        </p>
                                                        <p className="truncate text-xs font-medium text-slate-400">
                                                            @{u.username}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Single Action Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleToggleFollow(e, u)}
                                                    disabled={actionLoadingId === u._id}
                                                    className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50 ${badge.className}`}
                                                >
                                                    {actionLoadingId === u._id ? 'Đang xử lý...' : badge.label}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Posts Section */}
                        {showPosts && posts.length > 0 && (
                            <section>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Bài viết ({posts.length})
                                    </h3>

                                    {activeTab === 'all' && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('posts')}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            Xem tất cả
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {posts.map((post) => {
                                        const TypeIcon = getPostIcon(post.postType);
                                        const firstMedia = post.media?.[0];

                                        return (
                                            <button
                                                key={post._id}
                                                type="button"
                                                onClick={() => handleGoPost(post._id)}
                                                className="w-full rounded-2xl border border-blue-100 bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <img
                                                                src={
                                                                    post.author?.avatar ||
                                                                    'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'
                                                                }
                                                                alt={post.author?.fullName || 'avatar'}
                                                                className="h-8 w-8 rounded-full object-cover"
                                                            />

                                                            <div className="min-w-0">
                                                                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                                    {post.author?.fullName || 'Người dùng'}
                                                                </p>
                                                                <p className="truncate text-[11px] text-slate-400">
                                                                    @{post.author?.username || 'user'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                                                            <TypeIcon className="h-3 w-3" />
                                                            {getPostTypeLabel(post.postType)}
                                                        </div>

                                                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                                            {post.caption ||
                                                                post.project?.summary ||
                                                                post.question?.detail ||
                                                                'Không có nội dung mô tả.'}
                                                        </p>
                                                    </div>

                                                    {firstMedia?.url && (
                                                        <img
                                                            src={firstMedia.url}
                                                            alt=""
                                                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Load More Button if hasMore */}
                        {(hasMoreUsers || hasMorePosts) && (
                            <div className="pt-2 text-center">
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="rounded-2xl bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-500/10 dark:text-blue-300"
                                >
                                    {loadingMore ? 'Đang tải thêm...' : 'Tải thêm kết quả'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
