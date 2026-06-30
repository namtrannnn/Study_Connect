import httpRequest from '../config/axios';

export const getCommentsByPost = async (postId, params = {}) => {
    try {
        const res = await httpRequest.get(`/post/comment/${postId}`, {
            params,
        });
        console.log(res.data);
        return res.data;
    } catch (error) {
        throw error;
    }
};

export const createComment = async (postId, payload) => {
    try {
        const res = await httpRequest.post(`/post/comment/${postId}`, payload);

        return res.data;
    } catch (error) {
        throw error;
    }
};

export const getRepliesByComment = async (commentId, params = {}) => {
    try {
        const res = await httpRequest.get(`/post/comment/replies/${commentId}`, {
            params,
        });

        return res.data;
    } catch (error) {
        throw error;
    }
};

export const editComment = async (commentId, payload) => {
    try {
        const res = await httpRequest.patch(`/post/comment/edit/${commentId}`, payload);

        return res.data;
    } catch (error) {
        throw error;
    }
};

export const deleteComment = async (commentId) => {
    try {
        const res = await httpRequest.patch(`/post/comment/delete/${commentId}`);

        return res.data;
    } catch (error) {
        throw error;
    }
};

export const undoDeleteComment = async (commentId) => {
    try {
        const res = await httpRequest.patch(`/post/comment/undo-delete/${commentId}`);

        return res.data;
    } catch (error) {
        throw error;
    }
};

export const toggleLikeComment = async (commentId) => {
    try {
        const res = await httpRequest.patch(`/post/comment/like/${commentId}`);

        return res.data;
    } catch (error) {
        throw error;
    }
};
