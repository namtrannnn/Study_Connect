import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, UserCheck, Loader2, CheckCircle2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import * as FriendServices from '../../../services/friend.services';

export default function FollowListModal({
    open,
    onClose,
    userId,
    username,
    fullName,
    initialTab = 'followers',
    currentUser,
    onFollowChange,
}) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Track follow state per user: { [userId]: true / false }
    const [followingMap, setFollowingMap] = useState({});
    const [actionLoadingMap, setActionLoadingMap] = useState({});

    // Reset when modal opens or tab changes
    useEffect(() => {
        if (!open || !userId) return;
        setActiveTab(initialTab);
        setSearch('');
    }, [open, userId, initialTab]);

    useEffect(() => {
        if (!open || !userId) return;

        let isMounted = true;
        setLoading(true);
        setUsersList([]);
        setPage(1);

        const fetchList = activeTab === 'followers'
            ? FriendServices.getFollowersList({ userId, page: 1, limit: 20 })
            : FriendServices.getFollowingList({ userId, page: 1, limit: 20 });

        fetchList
            .then((res) => {
                if (!isMounted) return;
                if (res?.code === 200 && res?.data) {
                    const data = res.data;
                    const items = activeTab === 'followers' ? data.followers || [] : data.following || [];
                    setUsersList(items);
                    setHasMore(data.hasMore || false);
                    setTotalCount(activeTab === 'followers' ? data.totalFollowers : data.totalFollowing);

                    // Initialize following status map from current user's following list if available
                    const initialMap = {};
                    items.forEach((item) => {
                        const isFollowing = currentUser?.following?.includes(item._id) || false;
                        initialMap[item._id] = isFollowing;
                    });
                    setFollowingMap((prev) => ({ ...prev, ...initialMap }));
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('Fetch follow list error:', err);
                toast.error('Không thể tải danh sách');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [open, userId, activeTab, currentUser]);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;

        const nextPage = page + 1;
        try {
            setLoadingMore(true);
            const res = activeTab === 'followers'
                ? await FriendServices.getFollowersList({ userId, page: nextPage, limit: 20 })
                : await FriendServices.getFollowingList({ userId, page: nextPage, limit: 20 });

            if (res?.code === 200 && res?.data) {
                const data = res.data;
                const newItems = activeTab === 'followers' ? data.followers || [] : data.following || [];
                setUsersList((prev) => {
                    const existingIds = new Set(prev.map((u) => u._id));
                    const uniqueNewItems = newItems.filter((u) => !existingIds.has(u._id));
                    return [...prev, ...uniqueNewItems];
                });
                setPage(nextPage);
                setHasMore(data.hasMore || false);
            }
        } catch (err) {
            console.error('Load more error:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleToggleFollow = async (targetUser) => {
        const targetId = targetUser._id;
        const isCurrentlyFollowing = followingMap[targetId];

        try {
            setActionLoadingMap((prev) => ({ ...prev, [targetId]: true }));

            if (isCurrentlyFollowing) {
                await FriendServices.unfollowUser(targetId);
                setFollowingMap((prev) => ({ ...prev, [targetId]: false }));
                toast.info(`Đã bỏ theo dõi ${targetUser.fullName}`);
            } else {
                await FriendServices.followUser(targetId);
                setFollowingMap((prev) => ({ ...prev, [targetId]: true }));
                toast.success(`Đã theo dõi ${targetUser.fullName}`);
            }

            onFollowChange?.();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể thực hiện thao tác');
        } finally {
            setActionLoadingMap((prev) => ({ ...prev, [targetId]: false }));
        }
    };

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return usersList;
        const kw = search.trim().toLowerCase();
        return usersList.filter((u) =>
            u.fullName?.toLowerCase().includes(kw) ||
            u.username?.toLowerCase().includes(kw)
        );
    }, [usersList, search]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative z-10 flex h-[580px] max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-[#181b22] dark:text-white">
                {/* Header */}
                <div className="border-b border-gray-100 p-4 dark:border-white/10">
                    <div className="flex items-center justify-between pb-3">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">
                            {fullName || username || 'Người dùng'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                            title="Đóng"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="grid grid-cols-2 rounded-2xl bg-gray-100 p-1 dark:bg-white/5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('followers')}
                            className={`rounded-xl py-2 text-xs font-bold transition ${
                                activeTab === 'followers'
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-[#232730] dark:text-white'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            Người theo dõi
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('following')}
                            className={`rounded-xl py-2 text-xs font-bold transition ${
                                activeTab === 'following'
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-[#232730] dark:text-white'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            Đang theo dõi
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="w-full rounded-xl bg-gray-50 py-2 pl-9 pr-8 text-xs font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-gray-100 focus:ring-1 focus:ring-primary dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {loading ? (
                        <div className="space-y-3 p-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex animate-pulse items-center gap-3">
                                    <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-1/3 rounded-full bg-slate-200 dark:bg-white/10" />
                                        <div className="h-2.5 w-1/4 rounded-full bg-slate-100 dark:bg-white/5" />
                                    </div>
                                    <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-white/10" />
                                </div>
                            ))}
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5">
                                <Users size={24} />
                            </div>
                            <p className="mt-3 text-sm font-bold text-gray-800 dark:text-white">
                                {search ? 'Không tìm thấy kết quả nào' : 'Chưa có người dùng nào'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                {activeTab === 'followers'
                                    ? 'Người dùng này chưa có người theo dõi nào.'
                                    : 'Người dùng này chưa theo dõi ai.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.map((item) => {
                                const isMe = item._id === currentUser?._id;
                                const isFollowing = !!followingMap[item._id];
                                const isActionLoading = !!actionLoadingMap[item._id];

                                return (
                                    <div
                                        key={item._id}
                                        className="flex items-center justify-between gap-3 rounded-2xl p-2.5 transition hover:bg-gray-50 dark:hover:bg-white/5"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                navigate(`/profile/${item.username || item._id}`);
                                            }}
                                            className="flex flex-1 items-center gap-3 text-left min-w-0"
                                        >
                                            <Avatar className="h-11 w-11 shrink-0">
                                                <AvatarImage src={item.avatar} alt={item.fullName} />
                                                <AvatarFallback className="text-xs font-bold">
                                                    {item.fullName?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="truncate text-sm font-bold text-gray-900 hover:underline dark:text-white">
                                                        {item.fullName}
                                                    </span>
                                                    {item.isVerified && (
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 fill-blue-500 text-white" />
                                                    )}
                                                </div>
                                                <p className="truncate text-xs font-medium text-gray-400 dark:text-gray-500">
                                                    @{item.username || 'user'}
                                                </p>
                                            </div>
                                        </button>

                                        {!isMe && (
                                            <button
                                                type="button"
                                                disabled={isActionLoading}
                                                onClick={() => handleToggleFollow(item)}
                                                className={`flex h-8 min-w-[90px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition active:scale-95 disabled:opacity-60 ${
                                                    isFollowing
                                                        ? 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                                                        : 'bg-primary text-white hover:bg-primary/90'
                                                }`}
                                            >
                                                {isActionLoading ? (
                                                    <Loader2 size={13} className="animate-spin" />
                                                ) : isFollowing ? (
                                                    <>
                                                        <UserCheck size={13} />
                                                        <span>Đang theo dõi</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={13} />
                                                        <span>Theo dõi</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {hasMore && (
                                <div className="pt-2 text-center">
                                    <button
                                        type="button"
                                        disabled={loadingMore}
                                        onClick={handleLoadMore}
                                        className="rounded-xl px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:opacity-50"
                                    >
                                        {loadingMore ? 'Đang tải thêm...' : 'Xem thêm'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
