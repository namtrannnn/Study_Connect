import Cookies from 'js-cookie';
import config from '../../config';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function isTokenExpired(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));

        if (!decodedPayload.exp) {
            return false;
        }

        const currentTime = Date.now() / 1000;

        return decodedPayload.exp < currentTime;
    } catch (error) {
        return true;
    }
}

function ProtectedRoute({ children }) {
    const navigate = useNavigate();
    const accessToken = Cookies.get('accessToken');

    useEffect(() => {
        if (!accessToken || isTokenExpired(accessToken)) {
            Cookies.remove('accessToken');
            localStorage.removeItem('infoUser');

            navigate(config.routes.home);
        }
    }, [accessToken, navigate]);

    if (!accessToken || isTokenExpired(accessToken)) {
        return null;
    }

    return children;
}

export default ProtectedRoute;
