import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import ErrorPage from '../../pages/Error';

function AdminProtectedRoute({ children }) {
    const user = useSelector((state) => state.user?.infoUser);
    const accessToken = Cookies.get('accessToken');

    // Check if logged in & has admin role
    if (!accessToken || !user || user.role !== 'admin') {
        return (
            <ErrorPage
                code="403"
                title="403 - KHÔNG CÓ QUYỀN TRUY CẬP"
                subTitle="Tài khoản của bạn không có quyền truy cập vào Trang Quản Trị (Admin Panel)."
            />
        );
    }

    return children;
}

export default AdminProtectedRoute;
