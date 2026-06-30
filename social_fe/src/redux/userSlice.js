import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const initialState = {
    isLoggedIn: !!Cookies.get('accessToken'),
    infoUser: JSON.parse(localStorage.getItem('infoUser')) || null,
};

const userSlice = createSlice({
    name: 'user',
    initialState: initialState,
    reducers: {
        LOGIN: (state, action) => {
            localStorage.setItem('infoUser', JSON.stringify(action.payload));
            state.isLoggedIn = true;
            state.infoUser = action.payload;
        },

        LOGOUT: (state) => {
            Cookies.remove('accessToken');
            localStorage.removeItem('infoUser');

            state.isLoggedIn = false;
            state.infoUser = null;
        },
    },
});

export const { LOGIN, LOGOUT } = userSlice.actions;
export default userSlice.reducer;
