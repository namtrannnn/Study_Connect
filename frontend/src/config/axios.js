import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const httpRequest = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để thêm JWT vào header
httpRequest.interceptors.request.use(
    (config) => {
        const token = Cookies.get('accessToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Interceptor xử lý lỗi response
httpRequest.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                Cookies.remove('accessToken');
                localStorage.removeItem('infoUser');

                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            } else {
                toast.error(error.response.data?.message || 'Có lỗi xảy ra!');
            }
        } else {
            toast.error('Lỗi kết nối tới server.');
        }

        return Promise.reject(error);
    },
);

export default httpRequest;
