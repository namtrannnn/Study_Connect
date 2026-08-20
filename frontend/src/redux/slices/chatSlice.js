import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        totalUnread: 0,
        activeRoomId: null,
    },
    reducers: {
        setTotalUnread(state, action) {
            state.totalUnread = Math.max(0, action.payload ?? 0);
        },
        resetTotalUnread(state) {
            state.totalUnread = 0;
        },
        setActiveRoomId(state, action) {
            state.activeRoomId = action.payload || null;
        },
    },
});

export const { setTotalUnread, resetTotalUnread, setActiveRoomId } = chatSlice.actions;
export default chatSlice.reducer;
