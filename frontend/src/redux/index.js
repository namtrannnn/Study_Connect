import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import userReducer from './userSlice';
import presenceReducer from './slices/presenceSlice';
import notificationReducer from './slices/notificationSlice';
import chatReducer from './slices/chatSlice';
import nicknameReducer from './slices/nicknameSlice';

const store = configureStore({
    reducer: {
        theme: themeReducer,
        user: userReducer,
        presence: presenceReducer,
        notification: notificationReducer,
        chat: chatReducer,
        nickname: nicknameReducer,
    },
});

export default store;
