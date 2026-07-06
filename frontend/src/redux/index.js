import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import userReducer from './userSlice';
import presenceReducer from './slices/presenceSlice';
import notificationReducer from './slices/notificationSlice';

const store = configureStore({
    reducer: {
        theme: themeReducer,
        user: userReducer,
        presence: presenceReducer,
        notification: notificationReducer,
    },
});

export default store;
