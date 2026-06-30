import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    onlineUsers: [],
};

const presenceSlice = createSlice({
    name: 'presence',
    initialState,
    reducers: {
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload || [];
        },

        addOnlineUser: (state, action) => {
            const userId = action.payload;

            if (!userId) return;

            if (!state.onlineUsers.includes(userId)) {
                state.onlineUsers.push(userId);
            }
        },

        removeOnlineUser: (state, action) => {
            const userId = action.payload;

            state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
        },

        clearOnlineUsers: (state) => {
            state.onlineUsers = [];
        },
    },
});

export const { setOnlineUsers, addOnlineUser, removeOnlineUser, clearOnlineUsers } = presenceSlice.actions;

export default presenceSlice.reducer;
