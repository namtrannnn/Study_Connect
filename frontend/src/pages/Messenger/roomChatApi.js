import httpRequest from '../../config/axios';

const roomChatApi = {
    muteRoom: (id, muted) => httpRequest.patch(`/room-chat/${id}/mute`, { muted }),
    pinRoom: (id, pinned) => httpRequest.patch(`/room-chat/${id}/pin`, { pinned }),
    archiveRoom: (id, archived) => httpRequest.patch(`/room-chat/${id}/archive`, { archived }),
    deleteForMe: (id) => httpRequest.patch(`/room-chat/${id}/delete-for-me`),
    updateTitle: (id, title) => httpRequest.patch(`/room-chat/${id}/title`, { title }),
    uploadAvatar: (id, file) => {
        const form = new FormData();
        form.append('avatar', file);
        return httpRequest.patch(`/room-chat/${id}/avatar/upload`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    updateTheme: (id, themeConfig) => httpRequest.patch(`/room-chat/${id}/theme`, { themeConfig }),
    updateNickname: (id, nickname, targetUserId) => httpRequest.patch(`/room-chat/${id}/nickname`, { nickname, targetUserId }),
    addMembers: (id, usersId) => httpRequest.patch(`/room-chat/${id}/members/add`, { usersId }),
    leaveGroup: (id) => httpRequest.patch(`/room-chat/${id}/leave`),
    kickMember: (id, userId) => httpRequest.patch(`/room-chat/${id}/members/${userId}/kick`),
    updateRole: (id, userId, role) => httpRequest.patch(`/room-chat/${id}/members/${userId}/role`, { role }),
    transferOwner: (id, userId) => httpRequest.patch(`/room-chat/${id}/transfer-owner`, { userId }),
    markAsRead: (roomId, lastMessageId) => {
        return httpRequest.patch(`/room-chat/${roomId}/read`, {
            lastMessageId,
        });
    },

    updateGroupSettings: (roomId, settings) => {
        return httpRequest.patch(`/room-chat/${roomId}/settings`, settings);
    },
};

export default roomChatApi;
