import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
    name: 'notification',
    initialState: {
        unreadCount: 0,
    },
    reducers: {
        setUnreadCount(state, action) {
            state.unreadCount = action.payload ?? 0;
        },
        incrementUnread(state) {
            state.unreadCount += 1;
        },
        decrementUnread(state) {
            state.unreadCount = Math.max(state.unreadCount - 1, 0);
        },
        resetUnread(state) {
            state.unreadCount = 0;
        },
    },
});

export const { setUnreadCount, incrementUnread, decrementUnread, resetUnread } = notificationSlice.actions;
export default notificationSlice.reducer;
