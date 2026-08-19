import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        totalUnread: 0,
    },
    reducers: {
        setTotalUnread(state, action) {
            state.totalUnread = Math.max(0, action.payload ?? 0);
        },
        incrementTotalUnread(state) {
            state.totalUnread += 1;
        },
        resetTotalUnread(state) {
            state.totalUnread = 0;
        },
    },
});

export const { setTotalUnread, incrementTotalUnread, resetTotalUnread } = chatSlice.actions;
export default chatSlice.reducer;
