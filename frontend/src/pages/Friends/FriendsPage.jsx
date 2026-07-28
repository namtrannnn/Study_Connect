import { useEffect, useState } from 'react';
import { Check, MessageCircle, Search, UserRound, UserX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
    acceptFriendRequest,
    getMyFriends,
    getReceivedFriendRequests,
    refuseFriendRequest,
} from '../../services/friendServices';

function FriendsPage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);

    const [loadingFriends, setLoadingFriends] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const loadFriends = async () => {
        try {
            setLoadingFriends(true);

            const res = await getMyFriends();

            setFriends(res?.data?.friends || []);
        } catch (error) {
            console.log('loadFriends error:', error);
        } finally {
            setLoadingFriends(false);
        }
    };

    const loadRequests = async () => {
        try {
            setLoadingRequests(true);

            const res = await getReceivedFriendRequests();

            setRequests(res?.data?.requests || []);
        } catch (error) {
            console.log('loadRequests error:', error);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        loadFriends();
        loadRequests();
    }, []);

    const handleAccept = async (userId) => {
        try {
            setActionLoadingId(userId);

            const res = await acceptFriendRequest(userId);

            setRequests((prev) => prev.filter((item) => item._id !== userId));
            await loadFriends();

            toast.success(res?.message || 'Đã chấp nhận lời mời kết bạn');
        } catch (error) {
            console.log('accept friend error:', error);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRefuse = async (userId) => {
        try {
            setActionLoadingId(userId);

            const res = await refuseFriendRequest(userId);

            setRequests((prev) => prev.filter((item) => item._id !== userId));

            toast.success(res?.message || 'Đã từ chối lời mời kết bạn');
        } catch (error) {
            console.log('refuse friend error:', error);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleGoProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    const handleGoMessage = (roomChatId) => {
        if (!roomChatId) {
            toast.info('Chưa tìm thấy phòng chat');
            return;
        }

        navigate(`/messages/${roomChatId}`);
    };

    return (
        <div className="min-h-full py-6">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-6 rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#181b22]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mối quan hệ & Theo dõi</h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Quản lý danh sách người theo dõi qua lại và yêu cầu theo dõi chờ duyệt.
                            </p>
                        </div>

                        <div className="relative w-full md:w-[320px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="h-11 w-full rounded-2xl border border-blue-100 bg-blue-50/60 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2 rounded-2xl bg-blue-50 p-1 dark:bg-white/5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                activeTab === 'friends'
                                    ? 'bg-white text-primary shadow-sm dark:bg-[#0f1117] dark:text-blue-300'
                                    : 'text-gray-600 hover:text-primary dark:text-gray-300'
                            }`}
                        >
                            Bạn bè (Mutual Follow) ({friends.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                activeTab === 'requests'
                                    ? 'bg-white text-primary shadow-sm dark:bg-[#0f1117] dark:text-blue-300'
                                    : 'text-gray-600 hover:text-primary dark:text-gray-300'
                            }`}
                        >
                            Yêu cầu theo dõi ({requests.length})
                        </button>
                    </div>
                </div>

                {activeTab === 'friends' && (
                    <div className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#181b22]">
                        {loadingFriends ? (
                            <div className="py-12 text-center text-sm text-gray-500">Đang tải danh sách bạn bè...</div>
                        ) : friends.length === 0 ? (
                            <EmptyState
                                icon={<UserRound className="h-8 w-8" />}
                                title="Chưa có bạn bè"
                                description="Khi bạn chấp nhận lời mời hoặc người khác chấp nhận bạn, danh sách sẽ hiển thị ở đây."
                            />
                        ) : (
                            <div className="grid gap-3">
                                {friends.map((friend) => (
                                    <div
                                        key={friend._id}
                                        className="flex flex-col gap-4 rounded-3xl border border-blue-50 p-4 transition hover:bg-blue-50/60 dark:border-white/10 dark:hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <img
                                                src={friend.avatar || 'https://i.pravatar.cc/150?img=3'}
                                                alt={friend.fullName}
                                                className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-100 dark:ring-white/10"
                                            />

                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                                                    {friend.fullName}
                                                </h3>
                                                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                                    @{friend.username || 'username'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleGoMessage(friend.roomChatId)}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                Nhắn tin
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleGoProfile(friend._id)}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-blue-100 dark:bg-white/10 dark:text-blue-300"
                                            >
                                                <UserRound className="h-4 w-4" />
                                                Hồ sơ
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#181b22]">
                        {loadingRequests ? (
                            <div className="py-12 text-center text-sm text-gray-500">Đang tải lời mời...</div>
                        ) : requests.length === 0 ? (
                            <EmptyState
                                icon={<UserX className="h-8 w-8" />}
                                title="Không có lời mời nào"
                                description="Các lời mời kết bạn mới sẽ xuất hiện tại đây."
                            />
                        ) : (
                            <div className="grid gap-3">
                                {requests.map((request) => (
                                    <div
                                        key={request._id}
                                        className="flex flex-col gap-4 rounded-3xl border border-blue-50 p-4 transition hover:bg-blue-50/60 dark:border-white/10 dark:hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <img
                                                src={request.avatar || 'https://i.pravatar.cc/150?img=4'}
                                                alt={request.fullName}
                                                className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-100 dark:ring-white/10"
                                            />

                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                                                    {request.fullName}
                                                </h3>
                                                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                                    @{request.username || 'username'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={actionLoadingId === request._id}
                                                onClick={() => handleAccept(request._id)}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Check className="h-4 w-4" />
                                                Chấp nhận
                                            </button>

                                            <button
                                                type="button"
                                                disabled={actionLoadingId === request._id}
                                                onClick={() => handleRefuse(request._id)}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10"
                                            >
                                                <X className="h-4 w-4" />
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState({ icon, title, description }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-primary dark:bg-white/10 dark:text-blue-300">
                {icon}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    );
}

export default FriendsPage;
