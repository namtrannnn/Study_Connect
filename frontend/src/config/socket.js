import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket = null;

export const connectSocket = () => {
    const token = Cookies.get('accessToken');

    if (!token) {
        console.log('No access token, socket not connected');
        return null;
    }

    if (socket?.connected) {
        return socket;
    }

    socket = io('http://localhost:5000', {
        transports: ['websocket'],
        auth: {
            token,
        },
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.log('Socket connect error:', error.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
