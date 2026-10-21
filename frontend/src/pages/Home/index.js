import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Eye, EyeOff, Loader2, Mail, User as UserIcon, Sun, Moon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { useGoogleLogin } from '@react-oauth/google';

import { LOGIN } from '../../redux/userSlice';
import { TOGGLE_THEME } from '../../redux/themeSlice';
import * as UserService from '../../services/user.services';
import config from '../../config';

import logo from '../../assets/nexus-logo.png';
import bgHome1 from '../../assets/bg-home-1.png';
import bgHome2 from '../../assets/bg-home-2.png';
import earth from '../../assets/bg-home-earth.jpg';
import darkBackground from '../../assets/bg-home-dark.jpg';
import iconGG from '../../assets/icon-gg.png';

// Validation Schema cho Đăng nhập
const loginSchema = yup.object({
    email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
    password: yup.string().min(6, 'Mật khẩu ít nhất 6 ký tự').required('Vui lòng nhập mật khẩu'),
});

// Validation Schema cho Đăng ký
const registerSchema = yup.object({
    fullName: yup.string().required('Vui lòng nhập họ và tên'),
    email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
    password: yup.string().min(8, 'Mật khẩu ít nhất 8 ký tự').required('Vui lòng nhập mật khẩu'),
    rePassword: yup
        .string()
        .oneOf([yup.ref('password'), null], 'Mật khẩu xác nhận không khớp')
        .required('Vui lòng xác nhận mật khẩu'),
});

const Home = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const dark = useSelector((state) => state.theme?.theme);

    // Chuyển đổi giao diện sáng / tối
    useEffect(() => {
        if (dark === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [dark]);

    const handleToggleTheme = () => {
        const newTheme = dark === 'dark' ? null : 'dark';
        dispatch(TOGGLE_THEME(newTheme));
    };

    // Chế độ auth: 'login' hoặc 'register'
    const [authMode, setAuthMode] = useState('login');
    const [loading, setLoading] = useState(false);

    // Ẩn / hiện mật khẩu
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegRePassword, setShowRegRePassword] = useState(false);

    // Nếu đã có token đăng nhập thì chuyển thẳng vào trang chủ Dashboard
    useEffect(() => {
        const token = Cookies.get('accessToken');
        if (token) {
            navigate(config.routes.dashboard);
        }
    }, [navigate]);

    // Form Đăng nhập
    const {
        register: registerLogin,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors },
    } = useForm({
        resolver: yupResolver(loginSchema),
    });

    // Form Đăng ký
    const {
        register: registerReg,
        handleSubmit: handleRegisterSubmit,
        formState: { errors: regErrors },
        reset: resetRegForm,
    } = useForm({
        resolver: yupResolver(registerSchema),
    });

    // Xử lý gửi Đăng nhập
    const onLogin = async (data) => {
        setLoading(true);
        try {
            const res = await UserService.login(data);
            if (res?.code === 200) {
                Cookies.set('accessToken', res.token, {
                    expires: 7,
                    path: '/',
                });
                dispatch(LOGIN(res.user));
                toast.success(res.message || 'Đăng nhập thành công!');
                navigate(config.routes.dashboard);
            } else {
                toast.error(res?.message || 'Đăng nhập thất bại!');
            }
        } catch (error) {
            toast.error(error?.message || 'Lỗi kết nối máy chủ!');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý gửi Đăng ký
    const onRegister = async (data) => {
        setLoading(true);
        try {
            const { rePassword, ...submitData } = data;
            const res = await UserService.register(submitData);
            if (res?.code === 200) {
                toast.success(res.message || 'Đăng ký thành công! Vui lòng đăng nhập.');
                resetRegForm();
                setAuthMode('login');
            } else {
                toast.error(res?.message || 'Đăng ký thất bại!');
            }
        } catch (error) {
            toast.error(error?.message || 'Lỗi kết nối máy chủ!');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý Đăng nhập bằng Google
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                const res = await UserService.googleLogin(tokenResponse.access_token);
                if (res?.code === 200) {
                    Cookies.set('accessToken', res.token, {
                        expires: 7,
                        path: '/',
                    });
                    dispatch(LOGIN(res.user));
                    toast.success(res.message || 'Đăng nhập Google thành công!');
                    navigate(config.routes.dashboard);
                } else {
                    toast.error(res?.message || 'Đăng nhập Google thất bại!');
                }
            } catch (error) {
                toast.error(error?.message || 'Lỗi kết nối máy chủ!');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            toast.error('Đăng nhập Google không thành công hoặc đã bị huỷ!');
        },
    });

    return (
        <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto relative transition-colors duration-300 bg-[#f7f9fa] dark:bg-[#18191a]">
            {/* ================= FLOATING TOP BAR (TRONG SUỐT, KHÔNG DẢI HEADER) ================= */}
            <div className="absolute top-0 left-0 w-full flex items-center justify-between px-6 sm:px-12 py-5 z-50">
                {/* Logo & Tên thương hiệu */}
                <div className="flex items-center gap-3 select-none">
                    <img src={logo} alt="Nexus" className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        Nexus
                    </span>
                </div>

                {/* Nút chuyển đổi Sáng / Tối dạng Pill Floating */}
                <div
                    className="flex items-center p-1 w-[55px] h-[30px] rounded-full border-2 cursor-pointer border-black/70 dark:bg-[#3A3B3C] bg-white/80 backdrop-blur-md dark:border-[#929292] relative shadow-md transition-all duration-300 hover:scale-105 select-none"
                    onClick={handleToggleTheme}
                    role="button"
                    title={dark === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                >
                    <Sun size={20} className="absolute left-1.5 text-black/80 font-extrabold transition-all duration-300 dark:translate-x-[15px] dark:opacity-0" />
                    <Moon size={20} className="absolute right-1 font-extrabold text-white transition-all duration-300 dark:translate-x-0 translate-x-[-15px] opacity-0 dark:opacity-100" />
                </div>
            </div>

            {/* ================= MAIN CONTENT TRÀN VIỀN ================= */}
            <div className="relative w-full min-h-screen flex items-center justify-center lg:justify-between">
                {/* Background hình vũ trụ chế độ tối */}
                {dark === 'dark' && (
                    <div
                        style={{ backgroundImage: `url('${darkBackground}')` }}
                        className="fixed w-full h-full bottom-0 left-0 opacity-70 wave object-contain pointer-events-none"
                    />
                )}

                {/* Phần bên trái: Form Đăng nhập / Đăng ký trực tiếp */}
                <div className="w-full lg:w-[48%] xl:w-[42%] flex flex-col items-center justify-center px-4 sm:px-8 lg:pl-12 xl:pl-16 z-20 pt-24 pb-12">
                    <div className="w-full max-w-[430px] bg-white/95 dark:bg-[#242526]/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-6 sm:p-8 transition-all duration-300">
                        {/* Tiêu đề & chuyển đổi Tab */}
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 mb-5">
                            <div className="flex gap-x-2 bg-gray-100 dark:bg-[#18191a] p-1.5 rounded-2xl w-full">
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('login')}
                                    className={`flex-1 py-2 text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 ${
                                        authMode === 'login'
                                            ? 'bg-white dark:bg-[#3a3b3c] text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('register')}
                                    className={`flex-1 py-2 text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 ${
                                        authMode === 'register'
                                            ? 'bg-white dark:bg-[#3a3b3c] text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Đăng ký
                                </button>
                            </div>
                        </div>

                        {/* ================= FORM ĐĂNG NHẬP ================= */}
                        {authMode === 'login' ? (
                            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                                <div className="text-left">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Chào mừng trở lại!
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Nơi câu chuyện của bạn bắt đầu lan toả.
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            {...registerLogin('email')}
                                            type="email"
                                            placeholder="namtran@gmail.com"
                                            disabled={loading}
                                            className="w-full h-11 px-4 pr-10 rounded-xl bg-gray-50 dark:bg-[#18191a] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                        />
                                        <Mail size={18} className="absolute right-3 text-gray-400" />
                                    </div>
                                    {loginErrors.email && (
                                        <p className="text-xs text-red-500 mt-1">{loginErrors.email.message}</p>
                                    )}
                                </div>

                                {/* Mật khẩu */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            Mật khẩu
                                        </label>
                                        <Link
                                            to="/forget-password"
                                            className="text-xs text-orange-500 hover:underline"
                                        >
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
                                    <div className="relative flex items-center">
                                        <input
                                            {...registerLogin('password')}
                                            type={showLoginPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            disabled={loading}
                                            className="w-full h-11 px-4 pr-10 rounded-xl bg-gray-50 dark:bg-[#18191a] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {loginErrors.password && (
                                        <p className="text-xs text-red-500 mt-1">{loginErrors.password.message}</p>
                                    )}
                                </div>

                                {/* Nút Đăng nhập */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 mt-2 bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white font-semibold rounded-xl border border-gray-300 dark:border-transparent shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        'Đăng nhập'
                                    )}
                                </button>

                                {/* Đăng nhập bằng Google */}
                                <div className="pt-2">
                                    <div className="relative flex items-center justify-center text-xs text-gray-400 mb-3">
                                        <div className="border-t border-gray-200 dark:border-white/10 w-full" />
                                        <span className="bg-white dark:bg-[#242526] px-3 z-10 shrink-0">
                                            Hoặc tiếp tục với
                                        </span>
                                        <div className="border-t border-gray-200 dark:border-white/10 w-full" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleGoogleLogin()}
                                        disabled={loading}
                                        className="w-full h-11 flex items-center justify-center gap-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3a3b3c] transition-all bg-white dark:bg-[#18191a] text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm active:scale-[0.98] disabled:opacity-70"
                                    >
                                        <img src={iconGG} alt="Google" className="w-5 h-5 rounded-full" />
                                        <span>Google</span>
                                    </button>
                                </div>

                                {/* Chuyển sang Đăng ký */}
                                <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 pt-2">
                                    Chưa có tài khoản?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('register')}
                                        className="text-gray-900 dark:text-white font-semibold hover:underline"
                                    >
                                        Đăng ký miễn phí
                                    </button>
                                </p>
                            </form>
                        ) : (
                            /* ================= FORM ĐĂNG KÝ ================= */
                            <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-3 sm:space-y-3.5">
                                <div className="text-left">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Tạo tài khoản mới
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Tham gia cộng đồng Nexus ngay hôm nay.
                                    </p>
                                </div>

                                {/* Họ tên */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Họ và tên
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            {...registerReg('fullName')}
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            disabled={loading}
                                            className="w-full h-10 px-4 pr-10 rounded-xl bg-gray-50 dark:bg-[#18191a] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                        <UserIcon size={18} className="absolute right-3 text-gray-400" />
                                    </div>
                                    {regErrors.fullName && (
                                        <p className="text-xs text-red-500 mt-0.5">{regErrors.fullName.message}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            {...registerReg('email')}
                                            type="email"
                                            placeholder="namtran@gmail.com"
                                            disabled={loading}
                                            className="w-full h-10 px-4 pr-10 rounded-xl bg-gray-50 dark:bg-[#18191a] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                        <Mail size={18} className="absolute right-3 text-gray-400" />
                                    </div>
                                    {regErrors.email && (
                                        <p className="text-xs text-red-500 mt-0.5">{regErrors.email.message}</p>
                                    )}
                                </div>

                                {/* Mật khẩu */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Mật khẩu
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            {...registerReg('password')}
                                            type={showRegPassword ? 'text' : 'password'}
                                            placeholder="Ít nhất 8 ký tự"
                                            disabled={loading}
                                            className="w-full h-10 px-4 pr-10 rounded-xl bg-gray-50 dark:bg-[#18191a] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegPassword(!showRegPassword)}
                                            className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {regErrors.password && (
                                        <p className="text-xs text-red-500 mt-0.5">{regErrors.password.message}</p>
                                    )}
                                </div>

                                {/* Nhập lại mật khẩu */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Xác nhận mật khẩu
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            {...registerReg('rePassword')}
                                            type={showRegRePassword ? 'text' : 'password'}
                                            placeholder="Nhập lại mật khẩu"
                                            disabled={loading}
                                            className="w-full h-10 px-4 pr-10 rounded-xl bg-gray-50 dark:bg-[#18191a] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegRePassword(!showRegRePassword)}
                                            className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            {showRegRePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {regErrors.rePassword && (
                                        <p className="text-xs text-red-500 mt-0.5">{regErrors.rePassword.message}</p>
                                    )}
                                </div>

                                {/* Nút Đăng ký */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 mt-1 bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white font-semibold rounded-xl border border-gray-300 dark:border-transparent shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        'Đăng ký tài khoản'
                                    )}
                                </button>

                                {/* Đăng ký bằng Google */}
                                <div className="pt-1">
                                    <div className="relative flex items-center justify-center text-xs text-gray-400 mb-2.5">
                                        <div className="border-t border-gray-200 dark:border-white/10 w-full" />
                                        <span className="bg-white dark:bg-[#242526] px-3 z-10 shrink-0">
                                            Hoặc tiếp tục với
                                        </span>
                                        <div className="border-t border-gray-200 dark:border-white/10 w-full" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleGoogleLogin()}
                                        disabled={loading}
                                        className="w-full h-11 flex items-center justify-center gap-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3a3b3c] transition-all bg-white dark:bg-[#18191a] text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm active:scale-[0.98] disabled:opacity-70"
                                    >
                                        <img src={iconGG} alt="Google" className="w-5 h-5 rounded-full" />
                                        <span>Google</span>
                                    </button>
                                </div>

                                {/* Chuyển sang Đăng nhập */}
                                <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 pt-1">
                                    Đã có tài khoản?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('login')}
                                        className="text-gray-900 dark:text-white font-semibold hover:underline"
                                    >
                                        Đăng nhập ngay
                                    </button>
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                {/* Phần bên phải: Trái đất và phi thuyền không gian (giữ nguyên đồ họa đẹp mắt) */}
                <div className="hidden lg:block relative w-[52%] xl:w-[58%] h-screen pointer-events-none">
                    <img
                        src={earth}
                        alt="earth"
                        className="absolute left-0 top-0 h-full w-full object-cover transition-50 z-10 opacity-100 dark:opacity-0"
                    />
                    <img
                        src={bgHome1}
                        alt="rocket light"
                        className="absolute left-0 top-[55px] object-contain transition-50 z-10 dark:translate-x-[100%] dark:opacity-0 max-h-[85vh]"
                    />
                    <img
                        src={bgHome2}
                        alt="rocket dark"
                        className="absolute top-[45px] object-contain transition-50 z-10 opacity-0 translate-x-[100%] dark:translate-x-0 dark:opacity-100 max-h-[85vh]"
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
