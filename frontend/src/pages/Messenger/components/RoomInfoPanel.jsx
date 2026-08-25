import { useRef, useState } from 'react';
import ThemeSection from './ThemeSection';
import AddMembersModal from './AddMembersModal';
import GroupSettingsModal from './GroupSettingsModal';
import {
    X,
    Loader2,
    Pencil,
    Bell,
    BellOff,
    Pin,
    Archive,
    Trash2,
    LogOut,
    UserMinus,
    ShieldCheck,
    ShieldOff,
    UserPlus,
    Settings2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import roomChatApi from '../roomChatApi';
import { getRoomId, formatLastActive } from '../helpers';
import Avatar from './Avatar';
import { setNickname as setNicknameApi } from '../../../services/contactNickname.services';
import { upsertNickname } from '../../../redux/slices/nicknameSlice';
import { useDispatch, useSelector } from 'react-redux';

function RoomInfoPanel({ room, currentUser, onClose, onRoomUpdated, onLeaveOrDelete, themeStyles = {} }) {
    const dispatch = useDispatch();
    const nicknameMap = useSelector((state) => state.nickname?.map || {});
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(room?.title || '');
    const [editingNickname, setEditingNickname] = useState(false);
    const [nicknameInput, setNicknameInput] = useState('');
    const [nicknameTargetId, setNicknameTargetId] = useState(null); // userId được đặt biệt danh
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [loadingAction, setLoadingAction] = useState('');
    const avatarInputRef = useRef(null);

    const roomId = getRoomId(room);
    const myMember = room?.members?.find((m) => m?.user?._id === currentUser?._id);
    const isAdmin = ['admin', 'superAdmin'].includes(myMember?.role);
    const isSuperAdmin = myMember?.role === 'superAdmin';
    const isGroup = room?.typeRoom === 'group';
    const state = room?.currentUserRoomState || {};
    const otherMember = !isGroup ? room?.members?.find((m) => m?.user?._id !== currentUser?._id) : null;
    const displayName = isGroup ? room?.title || 'Nhóm chat' : otherMember?.user?.fullName || 'Người dùng';
    const displayAvatar = isGroup ? room?.avatar : otherMember?.user?.avatar;
    const displaySub = isGroup
        ? `${room?.members?.length || 0} thành viên`
        : otherMember?.user?.isOnline
          ? 'Đang hoạt động'
          : formatLastActive(otherMember?.user?.lastActiveAt);

    const doAction = async (key, fn) => {
        try {
            setLoadingAction(key);
            await fn();
        } catch {
        } finally {
            setLoadingAction('');
        }
    };

    const handleSaveTitle = () =>
        doAction('title', async () => {
            const res = await roomChatApi.updateTitle(roomId, titleInput);
            onRoomUpdated(res.data?.data || res.data);
            setEditingTitle(false);
        });

    const handleUploadAvatar = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        doAction('avatar', async () => {
            const res = await roomChatApi.uploadAvatar(roomId, file);
            onRoomUpdated(res.data?.data || res.data);
            toast.success('Đã cập nhật ảnh nhóm');
        });
    };

    const handleSaveNickname = () =>
        doAction('nickname', async () => {
            if (!nicknameTargetId) return;
            const res = await setNicknameApi(nicknameTargetId, nicknameInput.trim());
            if (res?.code === 200) {
                dispatch(upsertNickname({ targetId: nicknameTargetId, nickname: nicknameInput.trim() }));
                toast.success('Đã đặt biệt danh');
            }
            setEditingNickname(false);
            setNicknameTargetId(null);
        });

    const handleMute = () =>
        doAction('mute', async () => {
            const muted = !state.muted;
            await roomChatApi.muteRoom(roomId, muted);
            onRoomUpdated({ ...room, currentUserRoomState: { ...state, muted } });
            toast.success(muted ? 'Đã tắt thông báo' : 'Đã bật thông báo');
        });

    const handlePin = () =>
        doAction('pin', async () => {
            const pinned = !state.pinned;
            await roomChatApi.pinRoom(roomId, pinned);
            onRoomUpdated({ ...room, currentUserRoomState: { ...state, pinned } });
            toast.success(pinned ? 'Đã ghim' : 'Đã bỏ ghim');
        });

    const handleArchive = () =>
        doAction('archive', async () => {
            const archived = !state.archived;
            await roomChatApi.archiveRoom(roomId, archived);
            onRoomUpdated({ ...room, currentUserRoomState: { ...state, archived } });
            toast.success(archived ? 'Đã lưu trữ' : 'Đã bỏ lưu trữ');
        });

    const handleDeleteForMe = () =>
        doAction('delete', async () => {
            await roomChatApi.deleteForMe(roomId);
            toast.success('Đã xóa đoạn chat');
            onLeaveOrDelete(roomId);
        });

    const handleLeave = () =>
        doAction('leave', async () => {
            await roomChatApi.leaveGroup(roomId);
            toast.success('Đã rời nhóm');
            onLeaveOrDelete(roomId);
        });

    const handleKick = (userId) =>
        doAction(`kick_${userId}`, async () => {
            const res = await roomChatApi.kickMember(roomId, userId);
            onRoomUpdated(res.data?.data?.room || res.data?.room || res.data);
            toast.success('Đã kick thành viên');
        });

    const handleToggleRole = (userId, currentRole) =>
        doAction(`role_${userId}`, async () => {
            const newRole = currentRole === 'admin' ? 'member' : 'admin';
            const res = await roomChatApi.updateRole(roomId, userId, newRole);
            onRoomUpdated(res.data?.data?.room || res.data?.room || res.data);
            toast.success('Đã cập nhật quyền');
        });

    const handleTransferOwner = (userId) =>
        doAction(`transfer_${userId}`, async () => {
            const res = await roomChatApi.transferOwner(roomId, userId);
            onRoomUpdated(res.data?.data?.room || res.data?.room || res.data);
            toast.success('Đã chuyển quyền trưởng nhóm');
        });

    const loadFriendsToAdd = () => setShowAddMembers(true);

    const quickActions = [
        {
            key: 'mute',
            icon: state.muted ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />,
            label: state.muted ? 'Bật TB' : 'Tắt TB',
            fn: handleMute,
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            color: 'text-blue-500',
        },
        {
            key: 'pin',
            icon: <Pin className="h-5 w-5" />,
            label: state.pinned ? 'Bỏ ghim' : 'Ghim',
            fn: handlePin,
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            color: 'text-amber-500',
        },
        {
            key: 'archive',
            icon: <Archive className="h-5 w-5" />,
            label: state.archived ? 'Bỏ lưu trữ' : 'Lưu trữ',
            fn: handleArchive,
            bg: 'bg-violet-50 dark:bg-violet-500/10',
            color: 'text-violet-500',
        },
        {
            key: 'delete',
            icon: <Trash2 className="h-5 w-5" />,
            label: 'Xóa chat',
            fn: handleDeleteForMe,
            bg: 'bg-red-50 dark:bg-red-500/10',
            color: 'text-red-500',
        },
    ];

    return (
        <>
        <div
            className="modal-slide-down flex h-full w-full min-w-[340px] shrink-0 flex-col overflow-hidden border-l"
            style={{
                background: themeStyles.shell?.background || '#ffffff',
                borderColor: themeStyles.header?.borderColor || 'rgb(219 234 254)',
            }}
        >
            {/* Header */}
            <div
                className="relative flex h-[68px] shrink-0 items-center justify-end border-b px-4"
                style={{
                    backgroundColor: themeStyles.header?.backgroundColor || 'white',
                    borderColor: themeStyles.header?.borderColor || 'rgb(219 234 254)',
                }}
            >
                <span
                    className="absolute left-1/2 -translate-x-1/2 text-lg font-medium"
                    style={themeStyles.isDark ? { color: '#f1f5f9' } : { color: '#1e293b' }}
                >
                    Thông tin
                </span>

                <button
                    type="button"
                    onClick={onClose}
                    className="relative z-10 flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-black/5 dark:hover:bg-white/10"
                    style={themeStyles.isDark ? { color: 'rgba(241,245,249,0.6)' } : { color: '#94a3b8' }}
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div
                className="no-scrollbar flex-1 overflow-y-auto px-5 py-4"
                style={{
                    background: themeStyles.shell?.background || undefined,
                }}
            >
                {/* Hero */}
                <div
                    className="rounded-[28px] border p-5 text-center shadow-sm"
                    style={{
                        backgroundColor: themeStyles.header?.backgroundColor || 'white',
                        borderColor: themeStyles.isDark ? 'rgba(255,255,255,0.08)' : 'rgb(219 234 254)',
                    }}
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="h-[82px] w-[82px] overflow-hidden rounded-full shadow-lg ring-4 ring-blue-50 dark:ring-white/10">
                                <Avatar
                                    src={displayAvatar}
                                    name={displayName}
                                    size="h-[82px] w-[82px]"
                                    isGroup={isGroup}
                                />
                            </div>

                            {isGroup && isAdmin && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={loadingAction === 'avatar'}
                                        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:scale-105 disabled:opacity-60"
                                    >
                                        {loadingAction === 'avatar' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Pencil className="h-4 w-4" />
                                        )}
                                    </button>

                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleUploadAvatar}
                                    />
                                </>
                            )}

                            {!isGroup && otherMember?.user?.isOnline && (
                                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-[#181b22]" />
                            )}
                        </div>

                        {isGroup && isAdmin && editingTitle ? (
                            <div className="flex w-full items-center gap-2">
                                <input
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    autoFocus
                                    className="min-w-0 flex-1 rounded-2xl border border-blue-200 bg-blue-50/60 px-3 py-2 text-center text-sm font-bold outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                                />

                                <button
                                    type="button"
                                    onClick={handleSaveTitle}
                                    disabled={loadingAction === 'title'}
                                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                    {loadingAction === 'title' ? '...' : 'Lưu'}
                                </button>
                            </div>
                        ) : (
                            <div className="min-w-0">
                                <button
                                    type="button"
                                    onClick={() => isGroup && isAdmin && setEditingTitle(true)}
                                    className={`inline-flex max-w-full items-center justify-center gap-1.5 ${
                                        isGroup && isAdmin ? 'cursor-pointer hover:opacity-70' : 'cursor-default'
                                    }`}
                                >
                                    <span
                                        className="truncate text-lg font-medium"
                                        style={themeStyles.isDark ? { color: '#f1f5f9' } : { color: '#0f172a' }}
                                    >
                                        {displayName}
                                    </span>

                                    {isGroup && isAdmin && <Pencil className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
                                </button>

                                <p
                                    className="mt-1 text-sm font-medium"
                                    style={
                                        themeStyles.isDark ? { color: 'rgba(241,245,249,0.5)' } : { color: '#94a3b8' }
                                    }
                                >
                                    {displaySub}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick actions */}
                {/* Quick actions */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                    {quickActions.map(({ key, icon, label, fn, bg, color }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={fn}
                            disabled={loadingAction === key}
                            className={`group flex min-h-[74px] flex-col items-center justify-center gap-2 rounded-[22px] ${bg} shadow-sm ring-1 ring-black/[0.02] transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40`}
                        >
                            <span className={`${color} transition group-hover:scale-110`}>
                                {loadingAction === key ? <Loader2 className="h-5 w-5 animate-spin opacity-40" /> : icon}
                            </span>

                            <span className="text-xs font-medium leading-none text-gray-500 dark:text-gray-400">
                                {label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Chủ đề */}
                <div className="mt-4">
                    <ThemeSection room={room} onRoomUpdated={onRoomUpdated} themeStyles={themeStyles} />
                </div>

                {/* Nickname — chỉ hiển thị trong chat 1-1, đặt biệt danh cho đối phương */}
                {!isGroup && (
                <div
                    className="mt-4 overflow-hidden rounded-[24px] border shadow-sm transition"
                    style={{
                        backgroundColor: themeStyles.header?.backgroundColor || 'white',
                        borderColor: themeStyles.isDark ? 'rgba(255,255,255,0.08)' : 'rgb(219 234 254)',
                    }}
                >
                    {!editingNickname ? (
                        <button
                            type="button"
                            onClick={() => {
                                setNicknameTargetId(otherMember?.user?._id || null);
                                setNicknameInput(nicknameMap[otherMember?.user?._id] || '');
                                setEditingNickname(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-blue-50/60 dark:hover:bg-white/5"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-primary dark:bg-white/10">
                                <Pencil className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold" style={themeStyles.isDark ? { color: '#e2e8f0' } : { color: '#334155' }}>
                                    Biệt danh
                                </p>
                                <p className={`mt-0.5 truncate text-[15px] ${nicknameMap[otherMember?.user?._id] ? 'font-semibold text-gray-800 dark:text-gray-100' : 'font-normal italic text-gray-400'}`}>
                                    {nicknameMap[otherMember?.user?._id] || 'Chưa đặt biệt danh'}
                                </p>
                            </div>
                            <span className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">Sửa</span>
                        </button>
                    ) : (
                        <div className="p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-semibold" style={themeStyles.isDark ? { color: '#e2e8f0' } : { color: '#334155' }}>
                                    Đặt biệt danh cho {otherMember?.user?.fullName}
                                </span>
                                <button type="button" onClick={() => { setEditingNickname(false); setNicknameTargetId(null); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/10">✕</button>
                            </div>
                            <input
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="Nhập biệt danh..."
                                maxLength={50}
                                autoFocus
                                className="h-11 w-full rounded-2xl border border-blue-100 bg-blue-50/60 px-4 text-[15px] font-medium outline-none transition focus:border-primary focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <div className="mt-3 flex gap-2">
                                <button type="button" onClick={() => { setEditingNickname(false); setNicknameTargetId(null); }} className="flex-1 rounded-2xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300">Hủy</button>
                                <button type="button" onClick={handleSaveNickname} disabled={loadingAction === 'nickname'} className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
                                    {loadingAction === 'nickname' ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                )}
                {/* Thành viên */}
                {isGroup && (
                    <div
                        className="mt-4 mb-3 overflow-hidden rounded-[24px] border shadow-sm"
                        style={{
                            backgroundColor: themeStyles.header?.backgroundColor || 'white',
                            borderColor: themeStyles.isDark ? 'rgba(255,255,255,0.08)' : 'rgb(239 246 255)',
                        }}
                    >
                        <div
                            className="flex items-center justify-between px-3 py-2"
                            style={{
                                backgroundColor: themeStyles.isDark
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgb(239 246 255 / 0.6)',
                            }}
                        >
                            <span
                                className="text-xs font-medium tracking-widest"
                                style={themeStyles.isDark ? { color: 'rgba(241,245,249,0.5)' } : { color: '#94a3b8' }}
                            >
                                Thành viên · {room?.members?.length || 0}
                            </span>
                            <div className="flex gap-1">
                                {isAdmin && isSuperAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setShowSettings(true)}
                                        className="flex items-center gap-1 rounded-lg bg-gray-100/80 px-2 py-0.5 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-400"
                                    >
                                        <Settings2 className="h-3 w-3" /> Cài đặt
                                    </button>
                                )}
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={loadFriendsToAdd}
                                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary transition hover:bg-primary/20"
                                    >
                                        <UserPlus className="h-3 w-3" /> Thêm
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bỏ phần addingMembers inline — dùng modal riêng */}

                        <div>
                            {room?.members?.map((m, idx) => {
                                const u = m?.user;
                                if (!u) return null;
                                const isMe = u._id === currentUser?._id;
                                const isLast = idx === (room?.members?.length || 0) - 1;
                                return (
                                    <div
                                        key={u._id}
                                        className={`group flex items-center gap-2.5 px-3 py-2.5 transition ${!isLast ? 'border-b' : ''}`}
                                        style={{
                                            borderColor: themeStyles.isDark
                                                ? 'rgba(255,255,255,0.06)'
                                                : 'rgb(239 246 255 / 0.8)',
                                        }}
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar src={u.avatar} name={u.fullName} size="h-9 w-9" />
                                            {!!u.isOnline && (
                                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-[#181b22]" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1">
                                                <p
                                                    className="text-sm font-medium"
                                                    style={
                                                        themeStyles.isDark ? { color: '#e2e8f0' } : { color: '#1e293b' }
                                                    }
                                                >
                                                    {nicknameMap[u._id] || u.fullName}
                                                    {isMe && (
                                                        <span
                                                            className="ml-1 font-normal"
                                                            style={{
                                                                color: themeStyles.isDark
                                                                    ? 'rgba(226,232,240,0.5)'
                                                                    : '#94a3b8',
                                                            }}
                                                        >
                                                            (bạn)
                                                        </span>
                                                    )}
                                                </p>
                                                {m.role === 'superAdmin' && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                                                        Trưởng nhóm
                                                    </span>
                                                )}
                                                {m.role === 'admin' && (
                                                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {u.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                                            </p>
                                        </div>
                                        {!isMe && isAdmin && (
                                            <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                                                {/* Đặt biệt danh */}
                                                <button
                                                    type="button"
                                                    title="Đặt biệt danh"
                                                    onClick={() => {
                                                        setNicknameTargetId(u._id);
                                                        setNicknameInput(nicknameMap[u._id] || '');
                                                        setEditingNickname(true);
                                                    }}
                                                    disabled={!!loadingAction}
                                                    className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50 disabled:opacity-40 dark:hover:bg-blue-500/10"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                {isSuperAdmin && m.role !== 'superAdmin' && (
                                                    <button
                                                        type="button"
                                                        title="Chuyển quyền"
                                                        onClick={() => handleTransferOwner(u._id)}
                                                        disabled={!!loadingAction}
                                                        className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 disabled:opacity-40 dark:hover:bg-amber-500/10"
                                                    >
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                {isSuperAdmin && m.role !== 'superAdmin' && (
                                                    <button
                                                        type="button"
                                                        title={m.role === 'admin' ? 'Hạ xuống' : 'Thăng admin'}
                                                        onClick={() => handleToggleRole(u._id, m.role)}
                                                        disabled={!!loadingAction}
                                                        className="rounded-lg p-1.5 hover:bg-blue-50 disabled:opacity-40 dark:hover:bg-white/10"
                                                    >
                                                        {m.role === 'admin' ? (
                                                            <ShieldOff className="h-3.5 w-3.5 text-orange-400" />
                                                        ) : (
                                                            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                                                        )}
                                                    </button>
                                                )}
                                                {m.role !== 'superAdmin' && (
                                                    <button
                                                        type="button"
                                                        title="Kick"
                                                        onClick={() => handleKick(u._id)}
                                                        disabled={!!loadingAction}
                                                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
                                                    >
                                                        <UserMinus className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Rời nhóm */}
                {isGroup && (
                    <div className="mt-4 pb-2">
                        <button
                            type="button"
                            onClick={handleLeave}
                            disabled={loadingAction === 'leave'}
                            className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-red-100 bg-red-50 py-3.5 text-[15px] font-bold text-red-500 shadow-sm transition hover:bg-red-100 disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                        >
                            <LogOut className="h-4 w-4" />
                            {loadingAction === 'leave' ? 'Đang rời...' : 'Rời nhóm'}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Modals */}
        {showAddMembers && (
            <AddMembersModal
                room={room}
                onClose={() => setShowAddMembers(false)}
                onRoomUpdated={onRoomUpdated}
            />
        )}
        {showSettings && (
            <GroupSettingsModal
                room={room}
                onClose={() => setShowSettings(false)}
                onRoomUpdated={onRoomUpdated}
            />
        )}
        {/* Modal đặt biệt danh trong nhóm */}
        {editingNickname && isGroup && nicknameTargetId && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => { setEditingNickname(false); setNicknameTargetId(null); }}>
                <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#181b22]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4 dark:border-white/10">
                        <h2 className="text-base font-bold dark:text-white">
                            Đặt biệt danh cho {room?.members?.find((m) => m?.user?._id === nicknameTargetId)?.user?.fullName}
                        </h2>
                        <button type="button" onClick={() => { setEditingNickname(false); setNicknameTargetId(null); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="p-5">
                        <input
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            placeholder="Nhập biệt danh..."
                            maxLength={50}
                            autoFocus
                            className="h-11 w-full rounded-2xl border border-blue-100 bg-blue-50/60 px-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => { setEditingNickname(false); setNicknameTargetId(null); }} className="flex-1 rounded-2xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-300">Hủy</button>
                            <button type="button" onClick={handleSaveNickname} disabled={loadingAction === 'nickname'} className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">
                                {loadingAction === 'nickname' ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export default RoomInfoPanel;
