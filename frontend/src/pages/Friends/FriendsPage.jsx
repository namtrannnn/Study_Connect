import { useEffect, useMemo, useState } from 'react';
import { Check, Search, UserCheck, UserPlus, UserRound, UserX, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import InfiniteScroll from 'react-infinite-scroll-component';

import {
    acceptFollowRequest,
    followUser,
    getFollowersList,
    getFollowingList,
    getReceivedRequests,
    getSuggestedUsers,
    refuseFollowRequest,
    unfollowUser,
} from '../../services/friend.services';
import { registerFriendSocketEvents, unregisterFriendSocketEvents } from '../../sockets/friend.socket';
import UnfollowConfirmModal from '../../components/UnfollowConfirmModal';
import { LoadingFriends } from '../../components/Loading';

function FriendsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useSelector((state) => state.user?.infoUser || {});

    const [activeTab, setActiveTab] = useState(location.state?.tab || 'following'); // 'following' | 'followers' | 'suggested' | 'requests'
    const [searchQuery, setSearchQuery] = useState('');
    const [unfollowTargetUser, setUnfollowTargetUser] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Tab Data States with Pagination
    const [following, setFollowing] = useState({ list: [], page: 1, hasMore: false, total: 0 });
    const [followers, setFollowers] = useState({ list: [], page: 1, hasMore: false, total: 0 });
    const [suggested, setSuggested] = useState({ list: [], page: 1, hasMore: false, total: 0 });
    const [requests, setRequests] = useState({ list: [], page: 1, hasMore: false, total: 0 });

    const [initialLoading, setInitialLoading] = useState(false);

    // Fetch Page 1 for all tabs on initial mount or refresh
    const loadInitialData = async () => {
        try {
            setInitialLoading(true);
            const [followingRes, followersRes, suggestedRes, requestsRes] = await Promise.allSettled([
                getFollowingList({ page: 1, limit: 20 }),
                getFollowersList({ page: 1, limit: 20 }),
                getSuggestedUsers(1, 20),
                getReceivedRequests(1, 20),
            ]);

            if (followingRes.status === 'fulfilled' && followingRes.value?.code === 200) {
                const data = followingRes.value.data;
                setFollowing({
                    list: data.following || [],
                    page: 1,
                    hasMore: !!data.hasMore,
                    total: data.totalFollowing || 0,
                });
            }

            if (followersRes.status === 'fulfilled' && followersRes.value?.code === 200) {
                const data = followersRes.value.data;
                setFollowers({
                    list: data.followers || [],
                    page: 1,
                    hasMore: !!data.hasMore,
                    total: data.totalFollowers || 0,
                });
            }

            if (suggestedRes.status === 'fulfilled' && suggestedRes.value?.code === 200) {
                const data = suggestedRes.value.data;
                setSuggested({
                    list: data.users || [],
                    page: 1,
                    hasMore: !!data.hasMore,
                    total: data.totalUsers || 0,
                });
            }

            if (requestsRes.status === 'fulfilled' && requestsRes.value?.code === 200) {
                const data = requestsRes.value.data;
                setRequests({
                    list: data.requests || [],
                    page: 1,
                    hasMore: !!data.hasMore,
                    total: data.totalRequests || 0,
                });
            }
        } catch (error) {
            console.log('Load initial data error:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();

        registerFriendSocketEvents({
            onRequestReceived: () => loadInitialData(),
            onRequestCancelled: () => loadInitialData(),
            onFriendAccepted: () => loadInitialData(),
            onRequestRefused: () => loadInitialData(),
        });

        return () => {
            unregisterFriendSocketEvents();
        };
    }, []);

    // Load More items when user scrolls to bottom
    const handleLoadMore = async () => {
        try {
            if (activeTab === 'following' && following.hasMore) {
                const nextPage = following.page + 1;
                const res = await getFollowingList({ page: nextPage, limit: 20 });
                if (res?.code === 200) {
                    setFollowing((prev) => ({
                        list: [...prev.list, ...(res.data.following || [])],
                        page: nextPage,
                        hasMore: !!res.data.hasMore,
                        total: res.data.totalFollowing || prev.total,
                    }));
                }
            } else if (activeTab === 'followers' && followers.hasMore) {
                const nextPage = followers.page + 1;
                const res = await getFollowersList({ page: nextPage, limit: 20 });
                if (res?.code === 200) {
                    setFollowers((prev) => ({
                        list: [...prev.list, ...(res.data.followers || [])],
                        page: nextPage,
                        hasMore: !!res.data.hasMore,
                        total: res.data.totalFollowers || prev.total,
                    }));
                }
            } else if (activeTab === 'suggested' && suggested.hasMore) {
                const nextPage = suggested.page + 1;
                const res = await getSuggestedUsers(nextPage, 20);
                if (res?.code === 200) {
                    setSuggested((prev) => ({
                        list: [...prev.list, ...(res.data.users || [])],
                        page: nextPage,
                        hasMore: !!res.data.hasMore,
                        total: res.data.totalUsers || prev.total,
                    }));
                }
            } else if (activeTab === 'requests' && requests.hasMore) {
                const nextPage = requests.page + 1;
                const res = await getReceivedRequests(nextPage, 20);
                if (res?.code === 200) {
                    setRequests((prev) => ({
                        list: [...prev.list, ...(res.data.requests || [])],
                        page: nextPage,
                        hasMore: !!res.data.hasMore,
                        total: res.data.totalRequests || prev.total,
                    }));
                }
            }
        } catch (error) {
            console.log('Load more error:', error);
        }
    };

    // Current Tab List & Pagination details
    const currentTabData = useMemo(() => {
        if (activeTab === 'following') return following;
        if (activeTab === 'followers') return followers;
        if (activeTab === 'suggested') return suggested;
        return requests;
    }, [activeTab, following, followers, suggested, requests]);

    // Filter current tab data based on search query
    const filteredList = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const list = currentTabData.list || [];

        if (!query) return list;

        return list.filter(
            (item) =>
                item.fullName?.toLowerCase().includes(query) ||
                item.username?.toLowerCase().includes(query),
        );
    }, [currentTabData.list, searchQuery]);

    // Silent refresh: reload data without showing skeleton loading
    const silentRefreshData = async () => {
        try {
            const [followingRes, followersRes, suggestedRes, requestsRes] = await Promise.allSettled([
                getFollowingList({ page: 1, limit: 20 }),
                getFollowersList({ page: 1, limit: 20 }),
                getSuggestedUsers(1, 20),
                getReceivedRequests(1, 20),
            ]);

            if (followingRes.status === 'fulfilled' && followingRes.value?.code === 200) {
                const data = followingRes.value.data;
                setFollowing({ list: data.following || [], page: 1, hasMore: !!data.hasMore, total: data.totalFollowing || 0 });
            }
            if (followersRes.status === 'fulfilled' && followersRes.value?.code === 200) {
                const data = followersRes.value.data;
                setFollowers({ list: data.followers || [], page: 1, hasMore: !!data.hasMore, total: data.totalFollowers || 0 });
            }
            if (suggestedRes.status === 'fulfilled' && suggestedRes.value?.code === 200) {
                const data = suggestedRes.value.data;
                setSuggested({ list: data.users || [], page: 1, hasMore: !!data.hasMore, total: data.totalUsers || 0 });
            }
            if (requestsRes.status === 'fulfilled' && requestsRes.value?.code === 200) {
                const data = requestsRes.value.data;
                setRequests({ list: data.requests || [], page: 1, hasMore: !!data.hasMore, total: data.totalRequests || 0 });
            }
        } catch (error) {
            console.log('Silent refresh error:', error);
        }
    };

    // Handle Follow
    const handleFollow = async (userId) => {
        try {
            setActionLoadingId(userId);
            const res = await followUser(userId);
            if (res?.code === 200) {
                toast.success(res.message || 'Đã theo dõi thành công');
                // Remove from suggested immediately
                setSuggested((prev) => ({
                    ...prev,
                    list: prev.list.filter((u) => (u._id || u.id) !== userId),
                    total: Math.max((prev.total || 0) - 1, 0),
                }));
                // Silent refresh in background
                silentRefreshData();
            } else {
                toast.error(res?.message || 'Không thể theo dõi');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi thao tác theo dõi');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Unfollow
    const handleUnfollow = async (userId) => {
        try {
            setActionLoadingId(userId);
            const res = await unfollowUser(userId);
            if (res?.code === 200) {
                toast.info(res.message || 'Đã bỏ theo dõi');
                setUnfollowTargetUser(null);
                // Remove from following list immediately
                setFollowing((prev) => ({
                    ...prev,
                    list: prev.list.filter((u) => (u._id || u.id) !== userId),
                    total: Math.max((prev.total || 0) - 1, 0),
                }));
                // Silent refresh in background
                silentRefreshData();
            } else {
                toast.error(res?.message || 'Không thể bỏ theo dõi');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi thao tác bỏ theo dõi');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Accept Request
    const handleAcceptRequest = async (userId) => {
        try {
            setActionLoadingId(userId);
            const res = await acceptFollowRequest(userId);
            if (res?.code === 200) {
                toast.success(res.message || 'Đã chấp nhận yêu cầu theo dõi');
                // Remove from requests list immediately
                setRequests((prev) => ({
                    ...prev,
                    list: prev.list.filter((u) => (u._id || u.id) !== userId),
                    total: Math.max((prev.total || 0) - 1, 0),
                }));
                // Silent refresh in background
                silentRefreshData();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi chấp nhận yêu cầu');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Refuse Request
    const handleRefuseRequest = async (userId) => {
        try {
            setActionLoadingId(userId);
            const res = await refuseFollowRequest(userId);
            if (res?.code === 200) {
                toast.info(res.message || 'Đã từ chối yêu cầu');
                // Remove from requests list immediately
                setRequests((prev) => ({
                    ...prev,
                    list: prev.list.filter((u) => (u._id || u.id) !== userId),
                    total: Math.max((prev.total || 0) - 1, 0),
                }));
                // Silent refresh in background
                silentRefreshData();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi từ chối yêu cầu');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleGoProfile = (userId, username) => {
        navigate(`/profile/${username || userId}`);
    };

    // Set of IDs that I am following
    const followingSet = useMemo(
        () => new Set(following.list.map((item) => (item._id || item.id)?.toString())),
        [following.list],
    );

    if (initialLoading) return <LoadingFriends />;

    return (
        <div className="min-h-full py-6">
            <div className="mx-auto w-full max-w-5xl">
                {/* Header Card */}
                <div className="mb-6 rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#181b22]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đang theo dõi</h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Quản lý những người bạn đang theo dõi, người theo dõi bạn và gợi ý kết nối mới.
                            </p>
                        </div>

                        <div className="relative w-full md:w-[320px]">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm người dùng..."
                                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50/80 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-gray-100/70 p-1.5 dark:bg-white/5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('following')}
                            className={`flex-1 min-w-[140px] rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                activeTab === 'following'
                                    ? 'bg-white text-blue-600 shadow-sm dark:bg-[#0f1117] dark:text-blue-400'
                                    : 'text-gray-600 hover:text-blue-600 dark:text-gray-300'
                            }`}
                        >
                            Đang theo dõi ({following.total})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('followers')}
                            className={`flex-1 min-w-[140px] rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                activeTab === 'followers'
                                    ? 'bg-white text-blue-600 shadow-sm dark:bg-[#0f1117] dark:text-blue-400'
                                    : 'text-gray-600 hover:text-blue-600 dark:text-gray-300'
                            }`}
                        >
                            Người theo dõi ({followers.total})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('suggested')}
                            className={`flex-1 min-w-[140px] rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                activeTab === 'suggested'
                                    ? 'bg-white text-blue-600 shadow-sm dark:bg-[#0f1117] dark:text-blue-400'
                                    : 'text-gray-600 hover:text-blue-600 dark:text-gray-300'
                            }`}
                        >
                            Gợi ý theo dõi
                        </button>

                        {(requests.total > 0 || currentUser.isPrivate) && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('requests')}
                                className={`flex-1 min-w-[140px] rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                    activeTab === 'requests'
                                        ? 'bg-white text-blue-600 shadow-sm dark:bg-[#0f1117] dark:text-blue-400'
                                        : 'text-gray-600 hover:text-blue-600 dark:text-gray-300'
                                }`}
                            >
                                Yêu cầu theo dõi ({requests.total})
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area with Infinite Scroll */}
                <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#181b22]">
                    {initialLoading ? (
                        <div className="py-16 text-center text-sm font-medium text-gray-500">Đang tải dữ liệu...</div>
                    ) : filteredList.length === 0 ? (
                        <EmptyState
                            icon={<UserRound className="h-8 w-8 text-gray-400" />}
                            title={
                                searchQuery
                                    ? 'Không tìm thấy kết quả'
                                    : activeTab === 'following'
                                    ? 'Chưa theo dõi ai'
                                    : activeTab === 'followers'
                                    ? 'Chưa có người theo dõi'
                                    : activeTab === 'suggested'
                                    ? 'Không có gợi ý mới'
                                    : 'Không có yêu cầu nào'
                            }
                            description={
                                searchQuery
                                    ? `Không tìm thấy tài khoản nào khớp với "${searchQuery}"`
                                    : activeTab === 'following'
                                    ? 'Hãy khám phá và theo dõi thêm bạn bè để xem bài viết của họ.'
                                    : activeTab === 'followers'
                                    ? 'Những người bắt đầu theo dõi bạn sẽ xuất hiện tại đây.'
                                    : activeTab === 'suggested'
                                    ? 'Bạn đã theo dõi tất cả gợi ý phù hợp.'
                                    : 'Các yêu cầu xin theo dõi tài khoản riêng tư sẽ hiển thị tại đây.'
                            }
                        />
                    ) : (
                        <InfiniteScroll
                            dataLength={filteredList.length}
                            next={handleLoadMore}
                            hasMore={!searchQuery && currentTabData.hasMore}
                            loader={
                                <div className="py-4 text-center text-xs font-semibold text-gray-400">
                                    Đang tải thêm...
                                </div>
                            }
                            scrollableTarget="friends-scroll-container"
                        >
                            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                                {filteredList.map((userItem) => {
                                    const id = userItem._id || userItem.id;
                                    const isFollowingThisUser = followingSet.has(id?.toString());

                                    return (
                                        <div
                                            key={id}
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-4 transition hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                                        >
                                            <div
                                                onClick={() => handleGoProfile(id, userItem.username)}
                                                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                                            >
                                                <img
                                                    src={
                                                        userItem.avatar ||
                                                        'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'
                                                    }
                                                    alt={userItem.fullName}
                                                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-gray-100 dark:ring-white/10"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                                        {userItem.fullName || 'Người dùng'}
                                                    </h3>
                                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                                        @{userItem.username || 'username'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action buttons based on activeTab */}
                                            <div className="flex shrink-0 items-center gap-2">
                                                {activeTab === 'following' && (
                                                    <button
                                                        type="button"
                                                        disabled={actionLoadingId === id}
                                                        onClick={() => setUnfollowTargetUser(userItem)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                                                    >
                                                        <UserX className="h-3.5 w-3.5" />
                                                        Hủy theo dõi
                                                    </button>
                                                )}

                                                {activeTab === 'followers' && (
                                                    <>
                                                        {isFollowingThisUser ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                                                                <UserCheck className="h-3.5 w-3.5" />
                                                                Đang theo dõi
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                disabled={actionLoadingId === id}
                                                                onClick={() => handleFollow(id)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                                            >
                                                                <UserPlus className="h-3.5 w-3.5" />
                                                                Theo dõi lại
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                {activeTab === 'suggested' && (
                                                    <button
                                                        type="button"
                                                        disabled={actionLoadingId === id}
                                                        onClick={() => handleFollow(id)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                                    >
                                                        <UserPlus className="h-3.5 w-3.5" />
                                                        Theo dõi
                                                    </button>
                                                )}

                                                {activeTab === 'requests' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={actionLoadingId === id}
                                                            onClick={() => handleAcceptRequest(id)}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            Chấp nhận
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={actionLoadingId === id}
                                                            onClick={() => handleRefuseRequest(id)}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </InfiniteScroll>
                    )}
                </div>
            </div>

            {/* Unfollow Confirmation Modal */}
            <UnfollowConfirmModal
                open={!!unfollowTargetUser}
                user={unfollowTargetUser}
                onClose={() => setUnfollowTargetUser(null)}
                onConfirm={() =>
                    handleUnfollow(unfollowTargetUser?._id || unfollowTargetUser?.id)
                }
                loading={
                    actionLoadingId ===
                    (unfollowTargetUser?._id || unfollowTargetUser?.id)
                }
            />
        </div>
    );
}

function EmptyState({ icon, title, description }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-white/10 dark:text-blue-300">
                {icon}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    );
}

export default FriendsPage;
