export function getRoomId(room) {
    return room?._id || room?.roomId;
}
export function getMessageRoomId(msg) {
    return msg?.room_chat_id?._id || msg?.room_chat_id || msg?.roomChatId;
}
export function getSenderId(msg) {
    return msg?.user_id?._id || msg?.user_id || msg?.sender?._id || msg?.sender;
}

export function formatTime(v) {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatLastActive(v) {
    if (!v) return 'Ngoại tuyến';

    const date = new Date(v);
    if (Number.isNaN(date.getTime())) return 'Ngoại tuyến';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'Vừa hoạt động';
    }

    if (diffMinutes < 60) {
        return `Hoạt động ${diffMinutes} phút trước`;
    }

    if (diffHours < 24) {
        return `Hoạt động ${diffHours} giờ trước`;
    }

    if (diffDays === 1) {
        return `Hoạt động hôm qua lúc ${formatTime(v)}`;
    }

    if (diffDays < 7) {
        return `Hoạt động ${diffDays} ngày trước`;
    }

    return `Hoạt động lúc ${date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })}`;
}

export function normalizeRoomList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

export function normalizeMessageList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.messages)) return data.messages;
    if (Array.isArray(data?.data?.messages)) return data.data.messages;
    return [];
}
