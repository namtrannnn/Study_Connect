import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import userReducer from './userSlice';
import presenceReducer from './slices/presenceSlice';
const store = configureStore({
    reducer: {
        theme: themeReducer,
        user: userReducer,
        presence: presenceReducer,
    },
});

export default store;
