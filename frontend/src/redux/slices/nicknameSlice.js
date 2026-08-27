import { createSlice } from '@reduxjs/toolkit';

// nicknames: { [targetUserId]: nickname }
const nicknameSlice = createSlice({
    name: 'nickname',
    initialState: {
        map: {}, // { userId: nickname }
        loaded: false,
    },
    reducers: {
        setNicknameMap(state, action) {
            state.map = action.payload || {};
            state.loaded = true;
        },
        upsertNickname(state, action) {
            const { targetId, nickname } = action.payload;
            if (nickname) {
                state.map[targetId] = nickname;
            } else {
                delete state.map[targetId];
            }
        },
    },
});

export const { setNicknameMap, upsertNickname } = nicknameSlice.actions;
export default nicknameSlice.reducer;
