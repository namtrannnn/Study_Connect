import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { getSocket } from '../../../../config/socket';
import * as NotificationServices from '../../../../services/notification.services';
import { setUnreadCount, incrementUnread, decrementUnread, resetUnread } from '../../../../redux/slices/notificationSlice';

const TYPE_ICONS = {
    friend_request: '👥',
    friend_accept: '🤝',
    post_like: '❤️',
    post_comment: '💬',
    comment_reply: '↩️',
    mention: '@',
    study_room_invite: '📚',
};

function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

export default function NotificationsPanel({ onClose }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCountLocal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await NotificationServices.getNotifications();
            if (res.code === 200) {
                setNotifications(res.notifications || []);
                setUnreadCountLocal(res.unreadCount || 0);
                dispatch(setUnreadCount(res.unreadCount || 0));
            }
        } catch {
            toast.error('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleNew = ({ notification, unreadCount: serverCount }) => {
            if (!notification) return;
            setNotifications((prev) => {
                const existed = prev.some((n) => String(n._id) === String(notification._id));
                if (existed) return prev;
                return [notification, ...prev];
            });
            // Use authoritative count from server instead of blindly incrementing
            if (typeof serverCount === 'number') {
                setUnreadCountLocal(serverCount);
                dispatch(setUnreadCount(serverCount));
            } else {
                setUnreadCountLocal((prev) => prev + 1);
                dispatch(incrementUnread());
            }
        };

        const handleReadAll = ({ unreadCount: count }) => {
            setUnreadCountLocal(count ?? 0);
            dispatch(setUnreadCount(count ?? 0));
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        };

        const handleDeleted = ({ notificationId }) => {
            setNotifications((prev) => prev.filter((n) => String(n._id) !== String(notificationId)));
        };

        socket.on('SERVER_NOTIFICATION_NEW', handleNew);
        socket.on('SERVER_NOTIFICATION_READ_ALL', handleReadAll);
        socket.on('SERVER_NOTIFICATION_DELETED', handleDeleted);

        return () => {
            socket.off('SERVER_NOTIFICATION_NEW', handleNew);
            socket.off('SERVER_NOTIFICATION_READ_ALL', handleReadAll);
            socket.off('SERVER_NOTIFICATION_DELETED', handleDeleted);
        };
    }, []);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await NotificationServices.markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) => (String(n._id) === String(notificationId) ? { ...n, isRead: true } : n)),
            );
            setUnreadCountLocal((prev) => Math.max(prev - 1, 0));
        } catch {
            toast.error('Không thể đánh dấu đã đọc');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setMarkingAll(true);
            await NotificationServices.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCountLocal(0);
        } catch {
            toast.error('Không thể đánh dấu tất cả đã đọc');
        } finally {
            setMarkingAll(false);
        }
    };

    const handleNotifClick = async (notif) => {
        // Đánh dấu đã đọc nếu chưa
        if (!notif.isRead) await handleMarkAsRead(notif._id);

        const refId = notif.refId;
        const senderId = notif.sender?._id;
        const senderUsername = notif.sender?.username;

        switch (notif.type) {
            case 'friend_request':
            case 'friend_accept':
            case 'follow':
            case 'follow_request':
            case 'follow_accept':
                if (senderUsername || senderId) navigate(`/profile/${senderUsername || senderId}`);
                break;
            case 'post_like':
            case 'post_comment':
            case 'comment_reply':
            case 'mention':
                if (refId) navigate(`/post/${refId}`);
                break;
            case 'study_room_invite':
                if (refId) navigate(`/study-room/${refId}`);
                break;
            default:
                break;
        }
        onClose?.();
    };

    const handleDelete = async (e, notificationId) => {
        e.stopPropagation();
        try {
            await NotificationServices.deleteNotification(notificationId);
            setNotifications((prev) => prev.filter((n) => String(n._id) !== String(notificationId)));
        } catch {
            toast.error('Không thể xóa thông báo');
        }
    };

    return (
        <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-[#181b22] dark:text-white">
            {/* Header */}
            <div className="border-b border-blue-100 px-5 py-4 dark:border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Thông báo</h2>
                            {unreadCount > 0 && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-slate-400">Hoạt động liên quan đến bạn</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                disabled={markingAll}
                                className="flex items-center gap-1.5 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 transition hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-500/15 dark:text-blue-300"
                            >
                                {markingAll ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Đọc tất cả
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex animate-pulse items-center gap-3 rounded-3xl p-3">
                                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <div className="h-3 w-1/3 rounded-full bg-slate-200 dark:bg-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex h-[260px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                            <Bell className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-black text-slate-800 dark:text-white">Chưa có thông báo</p>
                        <p className="mt-1 max-w-[240px] text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Khi có hoạt động mới, bạn sẽ thấy ở đây.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {notifications.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={() => handleNotifClick(notif)}
                                className={`group relative flex cursor-pointer items-start gap-3 rounded-3xl border p-3 transition hover:-translate-y-0.5 hover:shadow-sm ${
                                    !notif.isRead
                                        ? 'border-blue-100 bg-blue-50/60 dark:border-white/10 dark:bg-blue-500/5'
                                        : 'border-transparent hover:border-blue-100 hover:bg-blue-50/70 dark:hover:border-white/10 dark:hover:bg-white/5'
                                }`}
                            >
                                {/* Avatar + icon */}
                                <div className="relative shrink-0">
                                    <img
                                        src={notif.sender?.avatar || 'https://i.pravatar.cc/150?img=3'}
                                        alt={notif.sender?.fullName}
                                        className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-white/10"
                                    />
                                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow dark:bg-[#181b22]">
                                        {TYPE_ICONS[notif.type] || '🔔'}
                                    </span>
                                </div>

                                {/* Text */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm leading-5 text-slate-800 dark:text-slate-100">
                                        <span className="font-black">{notif.sender?.fullName || 'Ai đó'}</span>{' '}
                                        <span className="font-medium">{notif.message}</span>
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                                        {formatTime(notif.createdAt)}
                                    </p>
                                </div>

                                {/* Unread dot + delete */}
                                <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
                                    {!notif.isRead && (
                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, notif._id)}
                                        className="text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-white/20"
                                        aria-label="Xóa thông báo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

