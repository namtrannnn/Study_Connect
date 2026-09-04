import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Image as ImageIcon,
    MessageCircle,
    MoreHorizontal,
    Search,
    Send,
    Smile,
    Plus,
    Loader2,
    UserRound,
    Trash2,
    Pin,
    BellOff,
    Archive,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setTotalUnread, setActiveRoomId } from '../../redux/slices/chatSlice';

import {
    getChatRooms,
    getMessagesByRoom,
    getOrCreateFriendRoom,
    uploadChatImages,
} from '../../services/chatServices';
import {
    joinChatRoom,
    leaveChatRoom,
    registerChatSocketEvents,
    sendChatMessage,
    startTyping,
    stopTyping,
    unregisterChatSocketEvents,
} from '../../sockets/chat.socket';

import {
    getRoomId,
    getMessageRoomId,
    getSenderId,
    formatLastActive,
    normalizeRoomList,
    normalizeMessageList,
} from './helpers';
import roomChatApi from './roomChatApi';
import Avatar from './components/Avatar';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import RoomInfoPanel from './components/RoomInfoPanel';
import CreateGroupModal from './components/CreateGroupModal';
import NewChatModal from './components/NewChatModal';
import EmojiPicker from './components/EmojiPicker';

function Messenger() {
    const currentUser = useSelector((state) => state.user?.infoUser);
    const dispatch = useDispatch();
    const nicknameMap = useSelector((state) => state.nickname?.map || {});
    const onlineUsers = useSelector((state) => state.presence?.onlineUsers || []);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomIdFromUrl = searchParams.get('roomId');

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [messageText, setMessageText] = useState('');
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const [hasAutoSelected, setHasAutoSelected] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [openingFriendChat, setOpeningFriendChat] = useState(false);
    const [openRoomMenuId, setOpenRoomMenuId] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [collapsedSystemGroups, setCollapsedSystemGroups] = useState(new Set());
    const [pendingImages, setPendingImages] = useState([]); // files chờ gửi
    const [uploadingImages, setUploadingImages] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const imageInputRef = useRef(null);
    const bottomRef = useRef(null);
    const typingTimerRef = useRef(null);
    const roomMenuRef = useRef(null);
    const selectedRoomId = selectedRoom?._id || selectedRoom?.roomId;
    const roomTheme = useMemo(() => selectedRoom?.themeConfig || {}, [selectedRoom?.themeConfig]);
    // Apply theme khi không phải Default (cả preset lẫn AI)
    const hasTheme = Boolean(roomTheme?.name && roomTheme.name !== 'Default');

    const themeStyles = useMemo(() => {
        if (!hasTheme)
            return {
                shell: {},
                header: {},
                body: {},
                footer: {},
                input: {},
                bubbleMe: {},
                bubbleOther: {},
                isDark: false,
            };

        // Detect dark theme bằng cách parse luminance của background
        const bg = roomTheme.background || '#f4f7fb';
        const hex = bg.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const isDark = luminance < 0.4;

        return {
            shell: { background: roomTheme.background },
            header: {
                backgroundColor: roomTheme.headerBackground,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
            body: { background: roomTheme.background },
            footer: {
                backgroundColor: roomTheme.headerBackground,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
            input: {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
            },
            bubbleMe: { backgroundColor: roomTheme.bubbleMe, color: roomTheme.textMe || '#ffffff' },
            bubbleOther: { backgroundColor: roomTheme.bubbleOther, color: roomTheme.textOther || '#111827' },
            isDark,
        };
    }, [hasTheme, roomTheme]);

    const otherUser = useMemo(() => {
        if (!selectedRoom || !currentUser?._id) return null;
        return selectedRoom.members?.find((m) => m?.user?._id !== currentUser._id)?.user;
    }, [selectedRoom, currentUser?._id]);

    const selectedRoomDisplay = useMemo(() => {
        if (!selectedRoom) return null;

        if (selectedRoom.typeRoom === 'group') {
            const onlineMemberCount =
                selectedRoom.members?.filter((m) => {
                    const memberId = m?.user?._id;
                    if (!memberId) return false;
                    if (memberId === currentUser?._id) return false;

                    return onlineUsers.includes(memberId);
                })?.length || 0;

            return {
                name: selectedRoom.title || 'Nhóm chat',
                avatar: selectedRoom.avatar || '',
                sub:
                    onlineMemberCount > 0
                        ? `${onlineMemberCount} người đang hoạt động`
                        : `${selectedRoom.members?.length || 0} thành viên`,
                isOnline: onlineMemberCount > 0,
                isGroup: true,
            };
        }

        const isOnline =
            onlineUsers.includes(otherUser?._id) || otherUser?.isOnline === true || otherUser?.isOnline === 1;

        const lastActiveAt = otherUser?.lastActiveAt || otherUser?.last_active_at;

        // Dùng nickname nếu có
        const otherMember = selectedRoom.members?.find((m) => m?.user?._id !== currentUser?._id);
        const displayName = nicknameMap[otherUser?._id] || otherMember?.nickname || otherUser?.fullName || 'Người dùng';

        return {
            name: displayName,
            avatar: otherUser?.avatar || '',
            sub: isOnline ? 'Đang hoạt động' : formatLastActive(lastActiveAt),
            isOnline,
            isGroup: false,
        };
    }, [selectedRoom, otherUser, onlineUsers, currentUser?._id]);

    const hasRealMessage = (room) => Boolean(room?.lastMessage && (room.lastMessage.message_id || room.lastMessage._id));

    // Kiểm tra user có quyền gửi tin nhắn không
    const canSendMessage = useMemo(() => {
        if (!selectedRoom) return false;
        if (selectedRoom.typeRoom !== 'group') return true;
        if (!selectedRoom.groupSettings?.onlyAdminCanSendMessage) return true;
        const myMember = selectedRoom.members?.find((m) => m?.user?._id === currentUser?._id);
        return ['admin', 'superAdmin'].includes(myMember?.role);
    }, [selectedRoom, currentUser?._id]);

    const filteredRooms = useMemo(() => {
        const selectedId = selectedRoomId;
        const activeRooms = rooms.filter(
            (room) => {
                const archived = room.currentUserRoomState?.archived || false;
                const lastDeletedAt = room.currentUserRoomState?.lastDeletedAt;
                const lastMsgTime = room.lastMessage?.createdAt ? new Date(room.lastMessage.createdAt) : null;

                // Ẩn room nếu đã xóa và chưa có tin nhắn mới sau thời điểm xóa
                if (lastDeletedAt && (!lastMsgTime || lastMsgTime <= new Date(lastDeletedAt))) {
                    return false;
                }

                if (showArchived) return archived;
                return !archived && (hasRealMessage(room) || room.typeRoom === 'group' || getRoomId(room) === selectedId);
            }
        );

        const kw = searchKeyword.trim().toLowerCase();
        const matched = !kw ? activeRooms : activeRooms.filter((room) => {
            if (room.typeRoom === 'group') return (room.title || '').toLowerCase().includes(kw);
            const friend = room.members?.find((m) => m?.user?._id !== currentUser?._id)?.user;
            return (friend?.fullName || '').toLowerCase().includes(kw);
        });

        // Pinned luôn lên đầu
        return [...matched].sort((a, b) => {
            const aPinned = a.currentUserRoomState?.pinned ? 1 : 0;
            const bPinned = b.currentUserRoomState?.pinned ? 1 : 0;
            if (bPinned !== aPinned) return bPinned - aPinned;
            const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return bTime - aTime;
        });
    }, [rooms, searchKeyword, selectedRoomId, currentUser?._id, showArchived]);

    function getRoomDisplay(room) {
        if (room.typeRoom === 'group') {
            const onlineMemberCount =
                room.members?.filter((m) => {
                    const memberId = m?.user?._id;
                    if (!memberId) return false;
                    if (memberId === currentUser?._id) return false;

                    return onlineUsers.includes(memberId);
                })?.length || 0;

            return {
                name: room.title || 'Nhóm chat',
                avatar: room.avatar || '',
                sub:
                    onlineMemberCount > 0
                        ? `${onlineMemberCount} người đang hoạt động`
                        : `${room.members?.length || 0} thành viên`,
                isOnline: onlineMemberCount > 0,
                isGroup: true,
                onlineMemberCount,
            };
        }

        const friend = room.members?.find((m) => m?.user?._id !== currentUser?._id);
        const friendUser = friend?.user;

        const isOnline = onlineUsers.includes(friendUser?._id) || friendUser?.isOnline === true || friendUser?.isOnline === 1;

        const lastActiveAt = friendUser?.lastActiveAt || friendUser?.last_active_at;

        // Dùng nickname nếu có
        const displayName = nicknameMap[friendUser?._id] || friend?.nickname || friendUser?.fullName || 'Người dùng';

        return {
            name: displayName,
            avatar: friendUser?.avatar || '',
            sub: isOnline ? 'Đang hoạt động' : formatLastActive(lastActiveAt),
            isOnline,
            isGroup: false,
        };
    }

    function getLastMessageText(room, display) {
        if (!hasRealMessage(room)) return display.sub || 'Bắt đầu trò chuyện';
        const lm = room.lastMessage;

        if (lm.type === 'system') {
            return lm.content || 'Tin nhắn hệ thống';
        }

        const senderId = lm.sender?._id || lm.sender || lm.user_id?._id || lm.user_id;
        const isMine = senderId === currentUser?._id;

        if (lm.type === 'image') {
            return isMine ? 'Bạn đã gửi một hình ảnh' : 'Đã gửi một hình ảnh';
        }

        if (lm.type === 'mixed') {
            if (lm.content) {
                return isMine ? `Bạn: ${lm.content}` : lm.content;
            }

            return isMine ? 'Bạn đã gửi hình ảnh' : 'Đã gửi hình ảnh';
        }

        const content = lm.content || display.sub || 'Bắt đầu trò chuyện';

        return isMine ? `Bạn: ${content}` : content;
    }

    function getLastMessageTime(room) {
        if (!hasRealMessage(room)) return '';
        const timeValue = room.lastMessage.createdAt;
        if (!timeValue) return '';

        const date = new Date(timeValue);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();

        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        if (isYesterday) return 'Hôm qua';

        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
        });
    }

    function getTypingText(roomId) {
        const t = typingUsers[roomId];
        if (!t || t.userId === currentUser?._id) return '';
        return `${t.fullName || 'Ai đó'} đang nhập...`;
    }

    function upsertRoomLastMessage(message) {
        setRooms((prev) => {
            const msgRoomId = getMessageRoomId(message);
            const updated = prev.map((room) => {
                if (getRoomId(room) !== msgRoomId) return room;
                const isMine = getSenderId(message) === currentUser?._id;
                const isCurrentRoom = selectedRoomId === msgRoomId;
                return {
                    ...room,
                    currentUserRoomState: {
                        ...(room.currentUserRoomState || {}),
                        unreadCount: isCurrentRoom || isMine ? 0 : (room.currentUserRoomState?.unreadCount || 0) + 1,
                    },
                    lastMessage: {
                        message_id: message._id,
                        sender: getSenderId(message),
                        type: message.type || (message.images?.length ? 'mixed' : 'text'),
                        content: message.content || '',
                        imagesCount: message.images?.length || 0,
                        createdAt: message.createdAt || new Date().toISOString(),
                    },
                };
            });
            return updated.sort(
                (a, b) =>
                    new Date(b.lastMessage?.createdAt || b.updatedAt || 0) -
                    new Date(a.lastMessage?.createdAt || a.updatedAt || 0),
            );
        });
    }

    const loadRooms = async () => {
        try {
            setLoadingRooms(true);
            const data = await getChatRooms();
            const list = normalizeRoomList(data);
            setRooms(list);
            if (!hasAutoSelected && !selectedRoom && list.length > 0) {
                const fromUrl = roomIdFromUrl ? list.find((r) => getRoomId(r) === roomIdFromUrl) : null;
                if (fromUrl) {
                    setSelectedRoom(fromUrl);
                    dispatch(setActiveRoomId(getRoomId(fromUrl)));
                }
                // Không auto-select room đầu tiên nữa — để user tự chọn
                setHasAutoSelected(true);
            }
        } catch (e) {
            console.log('loadRooms error:', e);
        } finally {
            setLoadingRooms(false);
        }
    };

    const loadMessages = async (roomId) => {
        try {
            setLoadingMessages(true);
            const data = await getMessagesByRoom({ roomId, page: 1, limit: 50 });
            setMessages(normalizeMessageList(data));
        } catch (e) {
            console.log('loadMessages error:', e);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        loadRooms();

        return () => {
            dispatch(setActiveRoomId(null));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!openRoomMenuId) return;

            if (roomMenuRef.current && !roomMenuRef.current.contains(e.target)) {
                setOpenRoomMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openRoomMenuId]);
    useEffect(() => {
        const timer = setTimeout(() => {
            registerChatSocketEvents({
                onReceiveMessage: (message) => {
                    const msgRoomId = getMessageRoomId(message);
                    setMessages((prev) => {
                        if (prev.some((m) => m._id === message._id)) return prev;
                        if (selectedRoomId && msgRoomId !== selectedRoomId) return prev;
                        return [...prev, message];
                    });
                    upsertRoomLastMessage(message);

                    // Play sound nếu tin nhắn không phải của mình và room không bị mute
                    const senderId = getSenderId(message);
                    if (senderId !== currentUser?._id) {
                        setRooms((prev) => {
                            const room = prev.find((r) => getRoomId(r) === msgRoomId);
                            const isMuted = room?.currentUserRoomState?.muted;
                            if (!isMuted) {
                                try {
                                    const audio = new Audio('/sounds/message_sound.mp3');
                                    audio.volume = 0.5;
                                    audio.play().catch(() => {});
                                } catch {}
                            }
                            return prev;
                        });
                    }
                },
                onTypingStart: (data) => {
                    const id = data.room_chat_id || data.roomChatId;
                    if (id) setTypingUsers((prev) => ({ ...prev, [id]: data }));
                },
                onTypingStop: (data) => {
                    const id = data.room_chat_id || data.roomChatId;
                    if (id)
                        setTypingUsers((prev) => {
                            const n = { ...prev };
                            delete n[id];
                            return n;
                        });
                },
                onChatListUpdated: (data) => {
                    setRooms((prev) =>
                        prev
                            .map((r) => {
                                if (getRoomId(r) !== data.roomId) return r;
                                const updated = { ...r, lastMessage: data.lastMessage };
                                // Cập nhật unreadCount từ server nếu có
                                if (typeof data.roomUnreadCount === 'number') {
                                    updated.currentUserRoomState = {
                                        ...(r.currentUserRoomState || {}),
                                        unreadCount: data.roomUnreadCount,
                                    };
                                }
                                return updated;
                            })
                            .sort(
                                (a, b) =>
                                    new Date(b.lastMessage?.createdAt || b.updatedAt || 0) -
                                    new Date(a.lastMessage?.createdAt || a.updatedAt || 0),
                            ),
                    );
                },
                onRoomUpdated: (data) => {
                    // data = { roomId, type, room }
                    if (!data?.room) return;
                    const updatedRoom = data.room;
                    const id = updatedRoom._id || updatedRoom.roomId;
                    setRooms((prev) => prev.map((r) => (getRoomId(r) === id ? { ...r, ...updatedRoom } : r)));
                    setSelectedRoom((prev) => {
                        if (!prev) return prev;
                        if ((prev._id || prev.roomId) !== id) return prev;
                        return { ...prev, ...updatedRoom };
                    });
                },
                onAddedToRoom: ({ room }) => {
                    if (!room) return;

                    setRooms((prev) => {
                        const exists = prev.some((r) => getRoomId(r) === getRoomId(room));

                        if (exists) {
                            return prev.map((r) =>
                                getRoomId(r) === getRoomId(room)
                                    ? { ...r, ...room }
                                    : r,
                            );
                        }

                        return [room, ...prev];
                    });

                    toast.info('Bạn vừa được thêm vào một nhóm chat');
                },

                onLeftRoom: ({ roomId }) => {
                    if (!roomId) return;

                    setRooms((prev) => prev.filter((room) => getRoomId(room) !== roomId));

                    setSelectedRoom((prev) => {
                        if (!prev) return prev;
                        if (getRoomId(prev) !== roomId) return prev;
                        return null;
                    });

                    setShowInfo(false);
                },

                onKickedFromRoom: ({ roomId }) => {
                    if (!roomId) return;

                    toast.warning('Bạn đã bị xóa khỏi nhóm');

                    setRooms((prev) => prev.filter((room) => getRoomId(room) !== roomId));

                    setSelectedRoom((prev) => {
                        if (!prev) return prev;
                        if (getRoomId(prev) !== roomId) return prev;
                        return null;
                    });

                    setShowInfo(false);
                },

                onRoomStateUpdated: ({ roomId, currentUserRoomState }) => {
                    if (!roomId || !currentUserRoomState) return;

                    setRooms((prev) =>
                        prev.map((room) =>
                            getRoomId(room) !== roomId
                                ? room
                                : {
                                      ...room,
                                      currentUserRoomState: {
                                          ...(room.currentUserRoomState || {}),
                                          ...currentUserRoomState,
                                      },
                                  },
                        ),
                    );

                    setSelectedRoom((prev) => {
                        if (!prev) return prev;
                        if (getRoomId(prev) !== roomId) return prev;

                        return {
                            ...prev,
                            currentUserRoomState: {
                                ...(prev.currentUserRoomState || {}),
                                ...currentUserRoomState,
                            },
                        };
                    });
                },

                onRoomDeletedForMe: ({ roomId }) => {
                    setRooms((prev) => prev.filter((room) => getRoomId(room) !== roomId));

                    setSelectedRoom((prev) => {
                        if (!prev) return prev;
                        if (getRoomId(prev) !== roomId) return prev;
                        return null;
                    });
                },

                onMessageRevoked: ({ messageId, roomId }) => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m._id === messageId
                                ? { ...m, revoked: true, content: '', images: [] }
                                : m,
                        ),
                    );
                    // Cập nhật preview lastMessage trong room list
                    if (roomId) {
                        setRooms((prev) =>
                            prev.map((r) => {
                                if (getRoomId(r) !== roomId) return r;
                                const lm = r.lastMessage;
                                if (!lm || String(lm.message_id) !== String(messageId)) return r;
                                return {
                                    ...r,
                                    lastMessage: { ...lm, content: 'Tin nhắn đã được thu hồi', imagesCount: 0 },
                                };
                            }),
                        );
                    }
                },

                onMessageReacted: ({ messageId, reactions }) => {
                    setMessages((prev) =>
                        prev.map((m) => m._id === messageId ? { ...m, reactions } : m),
                    );
                },
            });
        }, 300);
        return () => {
            clearTimeout(timer);
            unregisterChatSocketEvents();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoomId, currentUser?._id]);

    useEffect(() => {
        if (!selectedRoomId) return;
        joinChatRoom(selectedRoomId);
        loadMessages(selectedRoomId);

        return () => {
            leaveChatRoom(selectedRoomId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoomId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, selectedRoomId, pendingImages.length]);

    const handleSelectRoom = (room) => {
        const roomId = getRoomId(room);

        setSelectedRoom(room);
        setHasAutoSelected(true);
        setShowInfo(false);
        setOpenRoomMenuId(null);

        // Cập nhật room đang xem để global listener không increment badge
        dispatch(setActiveRoomId(roomId));

        setRooms((prev) =>
            prev
                .filter((r) => hasRealMessage(r) || r.typeRoom === 'group' || getRoomId(r) === roomId)
                .map((r) =>
                    getRoomId(r) !== roomId
                        ? r
                        : {
                              ...r,
                              currentUserRoomState: {
                                  ...(r.currentUserRoomState || {}),
                                  unreadCount: 0,
                              },
                          },
                ),
        );

        markRoomAsRead(room);
    };

    const handleSendMessage = async () => {
        const content = messageText.trim();
        if ((!content && pendingImages.length === 0) || !selectedRoomId) return;
        if (!canSendMessage) return;

        if (pendingImages.length > 0) {
            try {
                setUploadingImages(true);
                const uploaded = await uploadChatImages(pendingImages);
                sendChatMessage({ roomChatId: selectedRoomId, content, images: uploaded });
                setPendingImages([]);
            } catch {
                // silent
            } finally {
                setUploadingImages(false);
            }
        } else {
            sendChatMessage({ roomChatId: selectedRoomId, content, type: 'text' });
        }
        setMessageText('');
        stopTyping(selectedRoomId);
    };

    const handleSelectImages = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const valid = files.filter((f) => f.type.startsWith('image/'));
        setPendingImages((prev) => [...prev, ...valid].slice(0, 10));
        e.target.value = '';
    };

    const handleRemovePendingImage = (index) => {
        setPendingImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChangeMessage = (e) => {
        setMessageText(e.target.value);
        if (!selectedRoomId) return;
        startTyping(selectedRoomId);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => stopTyping(selectedRoomId), 800);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleRoomUpdated = (updatedRoom) => {
        if (!updatedRoom) return;
        const id = getRoomId(updatedRoom);
        setRooms((prev) => prev.map((r) => (getRoomId(r) === id ? { ...r, ...updatedRoom } : r)));
        if (getRoomId(selectedRoom) === id) setSelectedRoom((prev) => ({ ...prev, ...updatedRoom }));
    };

    const handleLeaveOrDelete = (roomId) => {
        setRooms((prev) => prev.filter((r) => getRoomId(r) !== roomId));
        if (getRoomId(selectedRoom) === roomId) {
            setSelectedRoom(null);
            setShowInfo(false);
        }
    };
    const updateRoomStateForMe = ({ roomId, currentUserRoomState }) => {
        if (!roomId || !currentUserRoomState) return;

        setRooms((prev) => {
            const updated = prev.map((room) =>
                getRoomId(room) !== roomId
                    ? room
                    : {
                          ...room,
                          currentUserRoomState: {
                              ...(room.currentUserRoomState || {}),
                              ...currentUserRoomState,
                          },
                      },
            );
            // Re-sort: pinned lên đầu
            return [...updated].sort((a, b) => {
                const aPinned = a.currentUserRoomState?.pinned ? 1 : 0;
                const bPinned = b.currentUserRoomState?.pinned ? 1 : 0;
                if (bPinned !== aPinned) return bPinned - aPinned;
                const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
                const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
                return bTime - aTime;
            });
        });

        setSelectedRoom((prev) => {
            if (!prev) return prev;
            if (getRoomId(prev) !== roomId) return prev;

            return {
                ...prev,
                currentUserRoomState: {
                    ...(prev.currentUserRoomState || {}),
                    ...currentUserRoomState,
                },
            };
        });
    };
    const markRoomAsRead = async (room) => {
        const roomId = getRoomId(room);
        if (!roomId) return;

        // Don't call markAsRead for rooms with no real messages
        if (!hasRealMessage(room)) return;

        const lastMessageId = room?.lastMessage?.message_id || room?.lastMessage?._id;

        try {
            const res = await roomChatApi.markAsRead(roomId, lastMessageId);

            if (typeof res?.data?.chatBadgeCount === 'number') {
                dispatch(setTotalUnread(res.data.chatBadgeCount));
            }

            updateRoomStateForMe({
                roomId,
                currentUserRoomState: {
                    unreadCount: 0,
                    lastReadAt: new Date().toISOString(),
                    lastReadMessage: lastMessageId || null,
                },
            });
        } catch (error) {
            console.log('markRoomAsRead error:', error);
        }
    };
    const handleGroupCreated = (room) => {
        setShowCreateGroup(false);
        if (!room) return;
        const normalized = room._id ? room : room.data || room;
        setRooms((prev) => [normalized, ...prev]);
        setSelectedRoom(normalized);
    };

    const handleOpenFriendChat = async (userId) => {
        try {
            setOpeningFriendChat(true);
            const data = await getOrCreateFriendRoom(userId);
            const room = data?._id ? data : data?.data || data;
            if (!room?._id) return;
            setShowNewChat(false);
            setRooms((prev) => {
                const cleaned = prev.filter((r) => hasRealMessage(r) || r.typeRoom === 'group' || getRoomId(r) === room._id);
                const exists = cleaned.some((r) => getRoomId(r) === room._id);
                return exists ? cleaned.map((r) => (getRoomId(r) === room._id ? { ...r, ...room } : r)) : [room, ...cleaned];
            });
            setSelectedRoom(room);
            setHasAutoSelected(true);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không thể mở đoạn chat');
        } finally {
            setOpeningFriendChat(false);
        }
    };

    const handleDeleteRoomFromSidebar = async (e, roomId) => {
        e.stopPropagation();
        setOpenRoomMenuId(null);
        try {
            await roomChatApi.deleteForMe(roomId);
            handleLeaveOrDelete(roomId);
            toast.success('Đã xóa đoạn chat');
        } catch (err) {
            console.log('deleteRoom error:', err);
            toast.error(err?.response?.data?.message || 'Xóa thất bại');
        }
    };
    const shouldShowTimeDivider = (currentMessage, previousMessage) => {
        if (!currentMessage?.createdAt) return false;
        if (!previousMessage?.createdAt) return true;

        const currentTime = new Date(currentMessage.createdAt).getTime();
        const previousTime = new Date(previousMessage.createdAt).getTime();

        return currentTime - previousTime >= 30 * 60 * 1000;
    };

    const formatTimeDivider = (dateValue) => {
        const date = new Date(dateValue);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();

        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const time = date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });

        if (isToday) return time;
        if (isYesterday) return `Hôm qua ${time}`;

        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const handleViewProfileFromSidebar = (e, room) => {
        e.stopPropagation();
        setOpenRoomMenuId(null);

        if (room.typeRoom === 'group') {
            toast.info('Nhóm chat chưa có trang cá nhân');
            return;
        }

        const friend = room.members?.find((m) => m?.user?._id !== currentUser?._id)?.user;

        if (!friend?._id) {
            toast.error('Không tìm thấy người dùng');
            return;
        }

        navigate(`/profile/${friend.username || friend._id}`);
    };
    return (
        <div className="h-full overflow-hidden bg-[#f4f7fb] p-3 text-gray-900 dark:bg-[#0f1117] dark:text-white">
            <div
                className="grid h-full min-h-0 overflow-hidden rounded-[28px] border shadow-sm"
                style={{
                    gridTemplateColumns: showInfo ? '320px minmax(0, 1fr) 360px' : '320px minmax(0, 1fr)',
                    background: themeStyles.shell?.background || '#ffffff',
                    borderColor: themeStyles.header?.borderColor || 'rgb(219 234 254)',
                }}
            >
                {/* Sidebar */}
                <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-blue-100 bg-white dark:border-white/10 dark:bg-[#181b22]">
                    <div className="border-b border-blue-100 p-4 dark:border-white/10">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h1 className="text-xl font-bold">{showArchived ? 'Lưu trữ' : 'Tin nhắn'}</h1>
                                <p className="text-xs text-gray-400">{filteredRooms.length} đoạn chat</p>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowArchived((p) => !p)}
                                    title={showArchived ? 'Quay lại' : 'Xem lưu trữ'}
                                    className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${showArchived ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' : 'bg-blue-50 text-gray-500 hover:bg-blue-100 dark:bg-white/5 dark:hover:bg-white/10'}`}
                                >
                                    <Archive className="h-4 w-4" />
                                </button>
                                {!showArchived && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewChat(true)}
                                            title="Nhắn tin mới"
                                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-gray-500 transition hover:bg-blue-100 dark:bg-white/5 dark:hover:bg-white/10"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateGroup(true)}
                                            title="Tạo nhóm"
                                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-gray-500 transition hover:bg-blue-100 dark:bg-white/5 dark:hover:bg-white/10"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Tìm kiếm..."
                                className="h-10 w-full rounded-2xl border border-blue-100 bg-blue-50/70 pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/10"
                            />
                        </div>
                    </div>
                    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
                        {loadingRooms ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-400">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Đang tải...
                            </div>
                        ) : filteredRooms.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-sm text-gray-400">
                                <MessageCircle className="mb-2 h-8 w-8 opacity-30" /> Chưa có đoạn chat nào.
                            </div>
                        ) : (
                            filteredRooms.map((room) => {
                                const roomId = getRoomId(room);
                                const display = getRoomDisplay(room);
                                const active = selectedRoomId === roomId;
                                const unread = room.currentUserRoomState?.unreadCount || 0;
                                const typingText = getTypingText(roomId);
                                const lastTime = getLastMessageTime(room);
                                return (
                                    <div
                                        key={roomId}
                                        className={`group relative mb-1 ${openRoomMenuId === roomId ? 'z-50' : 'z-0'}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleSelectRoom(room)}
                                            className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${active ? 'bg-primary/10 ring-1 ring-primary/20 dark:bg-primary/20' : 'hover:bg-blue-50/80 dark:hover:bg-white/5'}`}
                                        >
                                            <div className="relative h-11 w-11 shrink-0">
                                                <Avatar
                                                    src={display.avatar}
                                                    name={display.name}
                                                    isGroup={display.isGroup}
                                                    size="h-11 w-11"
                                                />
                                                {display.isOnline && !display.isGroup && (
                                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-[#181b22]" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="min-w-0 truncate text-sm font-semibold">
                                                        {display.name}
                                                    </span>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        {room.currentUserRoomState?.pinned && (
                                                            <Pin className="h-3 w-3 text-amber-500" />
                                                        )}
                                                        {room.currentUserRoomState?.muted && (
                                                            <BellOff className="h-3 w-3 text-gray-400" />
                                                        )}
                                                        {lastTime && (
                                                            <span className="text-[11px] font-medium text-gray-400">
                                                                {lastTime}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                                    <p
                                                        className={`min-w-0 flex-1 truncate text-xs ${
                                                            typingText
                                                                ? 'font-medium text-primary'
                                                                : unread > 0 && !active
                                                                  ? 'font-semibold text-gray-700 dark:text-gray-200'
                                                                  : 'text-gray-400'
                                                        }`}
                                                    >
                                                        {typingText || getLastMessageText(room, display)}
                                                    </p>

                                                    {unread > 0 && !active && (
                                                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                                            {unread > 99 ? '99+' : unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                        <div
                                            ref={openRoomMenuId === roomId ? roomMenuRef : null}
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenRoomMenuId((prev) => (prev === roomId ? null : roomId));
                                                }}
                                                title="Tùy chọn"
                                                className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm transition hover:bg-blue-50 hover:text-primary dark:bg-[#181b22] dark:hover:bg-white/10 ${
                                                    openRoomMenuId === roomId
                                                        ? 'opacity-100'
                                                        : 'opacity-0 group-hover:opacity-100'
                                                }`}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>

                                            {openRoomMenuId === roomId && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute right-0 top-9 z-[999] w-44 overflow-hidden rounded-2xl border border-blue-100 bg-white py-1.5 shadow-2xl dark:border-white/10 dark:bg-[#181b22]"
                                                >
                                                    {room.typeRoom !== 'group' && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleViewProfileFromSidebar(e, room)}
                                                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-primary dark:text-gray-300 dark:hover:bg-white/10"
                                                        >
                                                            <UserRound className="h-4 w-4" />
                                                            Xem trang cá nhân
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            handleDeleteRoomFromSidebar(e, roomId);
                                                            setOpenRoomMenuId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Xóa đoạn chat
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Chat area */}
                <main
                    className="flex h-full min-h-0 flex-col overflow-hidden bg-blue-50/40 dark:bg-[#0f1117]"
                    style={themeStyles.shell}
                >
                    {!selectedRoom ? (
                        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary shadow-sm dark:bg-white/10">
                                <MessageCircle className="h-9 w-9" />
                            </div>
                            <h2 className="text-xl font-bold">Chọn một đoạn chat</h2>
                            <p className="mt-2 max-w-xs text-sm text-gray-400">
                                Chọn bạn bè hoặc nhóm ở danh sách bên trái để bắt đầu trò chuyện.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div
                                className="flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-blue-100 bg-white px-5 dark:border-white/10 dark:bg-[#181b22]"
                                style={themeStyles.header}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="relative h-10 w-10 shrink-0">
                                        <Avatar
                                            src={selectedRoomDisplay?.avatar}
                                            name={selectedRoomDisplay?.name}
                                            isGroup={selectedRoomDisplay?.isGroup}
                                            size="h-10 w-10"
                                        />
                                        {selectedRoomDisplay?.isOnline && !selectedRoomDisplay?.isGroup && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-[#181b22]" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2
                                            className="truncate text-sm font-bold"
                                            style={themeStyles.isDark ? { color: '#f1f5f9' } : {}}
                                        >
                                            {selectedRoomDisplay?.name}
                                        </h2>
                                        <p
                                            className="truncate text-xs"
                                            style={
                                                themeStyles.isDark ? { color: 'rgba(241,245,249,0.6)' } : { color: '' }
                                            }
                                        >
                                            {getTypingText(selectedRoomId) || selectedRoomDisplay?.sub}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowInfo((p) => !p)}
                                        title="Thông tin"
                                        className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${showInfo ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-gray-500 hover:bg-blue-100 dark:bg-white/5 dark:hover:bg-white/10'}`}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4"
                                style={themeStyles.body}
                            >
                                {loadingMessages ? (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" /> Đang tải tin
                                            nhắn...
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-400">
                                        <MessageCircle className="mb-2 h-9 w-9 opacity-30" />
                                        <p className="font-medium">Chưa có tin nhắn nào</p>
                                        <p className="mt-1 text-xs opacity-60">Hãy bắt đầu cuộc trò chuyện 👋</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 pb-2">
                                        {(() => {
                                            // Gom system messages liên tiếp thành groups
                                            const groups = [];
                                            let i = 0;
                                            while (i < messages.length) {
                                                const msg = messages[i];
                                                if (msg.type === 'system') {
                                                    const group = [msg];
                                                    while (i + 1 < messages.length && messages[i + 1].type === 'system') {
                                                        i++;
                                                        group.push(messages[i]);
                                                    }
                                                    groups.push({ type: 'system-group', group, key: msg._id });
                                                } else {
                                                    groups.push({ type: 'message', msg, index: i });
                                                }
                                                i++;
                                            }

                                            return groups.map((item) => {
                                                if (item.type === 'system-group') {
                                                    const { group, key } = item;
                                                    const isCollapsed = !collapsedSystemGroups.has(key);
                                                    const showCollapse = group.length >= 3;
                                                    const visible = showCollapse && isCollapsed ? [group[0]] : group;
                                                    return (
                                                        <div key={key}>
                                                            {visible.map((msg) => (
                                                                <MessageBubble
                                                                    key={msg._id}
                                                                    message={msg}
                                                                    isMe={false}
                                                                    isGroup={selectedRoom.typeRoom === 'group'}
                                                                />
                                                            ))}
                                                            {showCollapse && (
                                                                <div className="flex justify-center py-0.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCollapsedSystemGroups((prev) => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(key)) next.delete(key);
                                                                            else next.add(key);
                                                                            return next;
                                                                        })}
                                                                        className="text-[11px] font-medium text-primary/70 hover:text-primary"
                                                                    >
                                                                        {isCollapsed ? `Xem thêm ${group.length - 1} thông báo` : 'Thu gọn'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                const { msg: message, index } = item;
                                                const previousMessage = messages[index - 1];
                                                const showTimeDivider = shouldShowTimeDivider(message, previousMessage);
                                                const isLastMessage = index === messages.length - 1;

                                                const senderId = getSenderId(message);
                                                const isMe = senderId === currentUser?._id;
                                                const senderMember = selectedRoom.members?.find((m) => m?.user?._id === senderId);
                                                const senderUser =
                                                    message.user_id && typeof message.user_id === 'object'
                                                        ? message.user_id
                                                        : senderMember?.user;
                                                const sender = senderUser
                                                    ? { ...senderUser, fullName: nicknameMap[senderId] || senderMember?.nickname || senderUser.fullName }
                                                    : senderUser;

                                                return (
                                                    <div key={message._id}>
                                                        {showTimeDivider && (
                                                            <div className="my-4 flex justify-center">
                                                                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-gray-400 shadow-sm dark:bg-white/10 dark:text-gray-300">
                                                                    {formatTimeDivider(message.createdAt)}
                                                                </span>
                                                            </div>
                                                        )}

                                                    <MessageBubble
                                                        message={message}
                                                        isMe={isMe}
                                                        sender={sender}
                                                        isGroup={selectedRoom.typeRoom === 'group'}
                                                        myStyle={themeStyles.bubbleMe}
                                                        otherStyle={themeStyles.bubbleOther}
                                                        alwaysShowTime={isLastMessage}
                                                        onRevoked={(msgId) => setMessages((prev) =>
                                                            prev.map((m) => m._id === msgId ? { ...m, revoked: true, content: '', images: [] } : m)
                                                        )}
                                                        onDeletedForMe={(msgId) => setMessages((prev) => prev.filter((m) => m._id !== msgId))}
                                                        onReacted={(msgId, reactions) => setMessages((prev) =>
                                                            prev.map((m) => m._id === msgId ? { ...m, reactions } : m)
                                                        )}
                                                    />
                                                </div>
                                            );
                                            }); // end groups.map
                                        })()} {/* end IIFE */}
                                        {Object.values(typingUsers).map((t) => {
                                            if (t.user_id === currentUser?._id || t.userId === currentUser?._id)
                                                return null;
                                            const tRoomId = t.room_chat_id || t.roomChatId;
                                            if (tRoomId !== selectedRoomId) return null;
                                            return (
                                                <TypingIndicator
                                                    key={t.user_id || t.userId}
                                                    name={selectedRoom.typeRoom === 'group' ? t.fullName : null}
                                                />
                                            );
                                        })}
                                        <div ref={bottomRef} className="h-2" />
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div
                                className="shrink-0 border-t border-blue-100 bg-white p-3 dark:border-white/10 dark:bg-[#181b22]"
                                style={themeStyles.footer}
                            >
                                {/* Preview ảnh chờ gửi */}
                                {pendingImages.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2 px-1">
                                        {pendingImages.map((file, idx) => (
                                            <div key={idx} className="relative">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt="preview"
                                                    className="h-16 w-16 rounded-xl object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePendingImage(idx)}
                                                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div
                                    className="flex items-end gap-2 rounded-3xl border border-blue-100 bg-blue-50/70 p-2 dark:border-white/10 dark:bg-white/5"
                                    style={themeStyles.input}
                                >
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleSelectImages}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={!canSendMessage}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-gray-400 transition hover:bg-white hover:text-primary disabled:opacity-40 dark:hover:bg-white/10"
                                    >
                                        <ImageIcon className="h-5 w-5" />
                                    </button>
                                    <textarea
                                        value={messageText}
                                        onChange={handleChangeMessage}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        disabled={!canSendMessage}
                                        placeholder={canSendMessage ? 'Nhập tin nhắn...' : 'Chỉ admin/trưởng nhóm mới được phép nhắn tin'}
                                        className={`max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none ${themeStyles.isDark ? 'text-white placeholder:text-white/40' : ''} ${!canSendMessage ? 'cursor-not-allowed opacity-60 font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker((p) => !p)}
                                        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-gray-400 transition hover:bg-white hover:text-primary dark:hover:bg-white/10"
                                    >
                                        <Smile className="h-5 w-5" />
                                        {showEmojiPicker && (
                                            <EmojiPicker
                                                onSelect={(emoji) => setMessageText((prev) => prev + emoji)}
                                                onClose={() => setShowEmojiPicker(false)}
                                            />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSendMessage}
                                        disabled={(!messageText.trim() && pendingImages.length === 0) || !canSendMessage || uploadingImages}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </main>

                {/* Info panel */}
                {showInfo && selectedRoom && (
                    <RoomInfoPanel
                        room={selectedRoom}
                        currentUser={currentUser}
                        onClose={() => setShowInfo(false)}
                        onRoomUpdated={handleRoomUpdated}
                        onLeaveOrDelete={handleLeaveOrDelete}
                        themeStyles={themeStyles}
                    />
                )}
            </div>

            {showCreateGroup && (
                <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreated={handleGroupCreated} />
            )}
            {showNewChat && (
                <NewChatModal
                    onClose={() => setShowNewChat(false)}
                    onSelect={(userId) => {
                        setShowNewChat(false);
                        handleOpenFriendChat(userId);
                    }}
                    loading={openingFriendChat}
                />
            )}
        </div>
    );
}

export default Messenger;
