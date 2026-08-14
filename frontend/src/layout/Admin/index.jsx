import { useState, createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    MessageSquare,
    Bot,
    Hash,
    TrendingUp,
    History,
    Home,
    ChevronLeft,
    ChevronRight,
    Shield,
    Sun,
    Moon,
} from 'lucide-react';
import { TOGGLE_THEME } from '../../redux/themeSlice';

export const AdminThemeContext = createContext({ isDark: true, toggleTheme: () => {} });
export const useAdminTheme = () => useContext(AdminThemeContext);

function AdminLayout({ children }) {
    const currentUser = useSelector((state) => state.user?.infoUser);
    const reduxTheme = useSelector((state) => state.theme?.theme);
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    // Default to true (Dark) if reduxTheme is null/true, otherwise false (Light)
    const [isDark, setIsDark] = useState(reduxTheme === null ? true : Boolean(reduxTheme));
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (reduxTheme !== undefined && reduxTheme !== null) {
            setIsDark(Boolean(reduxTheme));
        }
    }, [reduxTheme]);

    const handleToggleTheme = () => {
        const nextState = !isDark;
        setIsDark(nextState);
        dispatch(TOGGLE_THEME(nextState));
    };

    const navItems = [
        {
            label: 'Tổng quan',
            path: '/admin/dashboard',
            icon: LayoutDashboard,
            description: 'Phân tích & Chỉ số hệ thống',
        },
        {
            label: 'Người dùng',
            path: '/admin/users',
            icon: Users,
            description: 'Quản lý tài khoản & Khóa/Mở',
        },
        {
            label: 'Bài viết',
            path: '/admin/posts',
            icon: FileText,
            description: 'Kiểm duyệt & Ẩn/Xóa bài',
        },
        {
            label: 'Bình luận',
            path: '/admin/comments',
            icon: MessageSquare,
            description: 'Quản lý bình luận vi phạm',
        },
        {
            label: 'Báo cáo & AI',
            path: '/admin/reports',
            icon: Bot,
            description: 'Kiểm duyệt AI Gemini & Report',
        },
        {
            label: 'Quản lý Hashtag',
            path: '/admin/hashtags',
            icon: Hash,
            description: 'Trending & Blacklist cấm',
        },
        {
            label: 'Thống kê Tương tác',
            path: '/admin/analytics',
            icon: TrendingUp,
            description: 'Top bài viết & User tích cực',
        },
        {
            label: 'Nhật ký Hệ thống',
            path: '/admin/logs',
            icon: History,
            description: 'Audit Log thao tác Admin',
        },
    ];

    const getPageTitle = () => {
        if (location.pathname.includes('/users')) return { title: 'Quản lý Người dùng', subtitle: 'Tìm kiếm, phân quyền, khóa/mở khóa và quản lý tài khoản' };
        if (location.pathname.includes('/posts')) return { title: 'Quản lý Bài viết', subtitle: 'Kiểm duyệt bài đăng, xem nội dung và ẩn/xóa bài vi phạm' };
        if (location.pathname.includes('/comments')) return { title: 'Quản lý Bình luận', subtitle: 'Tìm kiếm và dọn dẹp các bình luận vi phạm tiêu chuẩn' };
        if (location.pathname.includes('/reports')) return { title: 'Báo cáo Vi phạm & Gemini AI', subtitle: 'Trí tuệ nhân tạo Gemini tự động phân tích độc hại & gợi ý xử lý' };
        if (location.pathname.includes('/hashtags')) return { title: 'Quản lý Hashtags & Blacklist', subtitle: 'Theo dõi xu hướng hashtag và danh sách từ khóa cấm' };
        if (location.pathname.includes('/analytics')) return { title: 'Thống kê Tương tác', subtitle: 'Top bài viết viral và người dùng có lượng tương tác cao nhất' };
        if (location.pathname.includes('/logs')) return { title: 'Nhật ký Hệ thống (Audit Trail)', subtitle: 'Ghi nhận mọi thao tác xử lý của ban quản trị' };
        return { title: 'Bảng phân tích Tổng quan', subtitle: 'Thống kê chỉ số sức khỏe & tình hình hoạt động của StudyConnect' };
    };

    const { title, subtitle } = getPageTitle();

    return (
        <AdminThemeContext.Provider value={{ isDark, toggleTheme: handleToggleTheme }}>
            <div
                className={`flex h-screen w-screen overflow-hidden antialiased transition-colors duration-300 selection:bg-indigo-500 selection:text-white ${
                    isDark ? 'bg-[#0b0f17] text-gray-100' : 'bg-slate-100 text-slate-900'
                }`}
            >
                {/* Sidebar */}
                <aside
                    className={`group/sidebar relative flex flex-col border-r transition-all duration-300 ${
                        collapsed ? 'w-[76px]' : 'w-72'
                    } ${isDark
                        ? 'border-white/[0.06] bg-gradient-to-b from-[#0c1222] via-[#0f172a] to-[#0c1222]'
                        : 'border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-white shadow-xl shadow-slate-200/50'
                    }`}
                >
                    {/* Subtle gradient glow line on the right edge */}
                    <div className={`absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent ${isDark ? 'opacity-100' : 'opacity-0'}`} />

                    {/* Logo Header */}
                    <div className={`flex h-[72px] items-center justify-between px-5 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} border-b`}>
                        {!collapsed ? (
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/30">
                                    <Shield className="h-5 w-5 text-white" />
                                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0c1222] animate-pulse" />
                                </div>
                                <div>
                                    <h1 className={`flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        StudyConnect
                                        <span className="rounded-md bg-gradient-to-r from-indigo-500/20 to-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                                            Admin
                                        </span>
                                    </h1>
                                    <p className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Control Panel v2.0</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/30">
                                <Shield className="h-5 w-5 text-white" />
                                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0c1222] animate-pulse" />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            className={`hidden md:flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-200 ${
                                isDark
                                    ? 'border-white/[0.08] bg-white/[0.04] text-gray-500 hover:bg-white/[0.08] hover:text-gray-300'
                                    : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                            }`}
                            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                        >
                            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    {/* Nav items */}
                    <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-4 space-y-1">
                        {!collapsed && (
                            <p className={`px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
                                Phân vùng Quản trị
                            </p>
                        )}

                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            // Assign distinct accent colors per nav item
                            const accentColors = {
                                '/admin/dashboard': { bg: 'bg-sky-500/15', text: 'text-sky-400', glow: 'shadow-sky-500/20' },
                                '/admin/users': { bg: 'bg-violet-500/15', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
                                '/admin/posts': { bg: 'bg-blue-500/15', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
                                '/admin/comments': { bg: 'bg-teal-500/15', text: 'text-teal-400', glow: 'shadow-teal-500/20' },
                                '/admin/reports': { bg: 'bg-indigo-500/15', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
                                '/admin/hashtags': { bg: 'bg-pink-500/15', text: 'text-pink-400', glow: 'shadow-pink-500/20' },
                                '/admin/analytics': { bg: 'bg-amber-500/15', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
                                '/admin/logs': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
                            };
                            const accent = accentColors[item.path] || { bg: 'bg-indigo-500/15', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' };

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                                        isActive
                                            ? `bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25`
                                            : isDark
                                            ? 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                                            : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-800'
                                    }`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    {/* Active indicator bar */}
                                    {isActive && (
                                        <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/50" />
                                    )}

                                    {/* Icon with colored badge background */}
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                                        isActive
                                            ? 'bg-white/20 shadow-inner'
                                            : isDark
                                            ? `${accent.bg} ${accent.glow} shadow-sm group-hover:shadow-md`
                                            : `${accent.bg} group-hover:shadow-sm`
                                    }`}>
                                        <Icon
                                            className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                                                isActive ? 'text-white' : accent.text
                                            }`}
                                        />
                                    </span>

                                    {!collapsed && (
                                        <div className="min-w-0 flex-1">
                                            <div className={`truncate font-semibold leading-tight ${isActive ? 'text-white' : ''}`}>{item.label}</div>
                                            <div
                                                className={`truncate text-[10px] mt-0.5 leading-tight ${
                                                    isActive
                                                        ? 'text-indigo-100/60'
                                                        : isDark
                                                        ? 'text-gray-600 group-hover:text-gray-500'
                                                        : 'text-slate-400 group-hover:text-slate-500'
                                                }`}
                                            >
                                                {item.description}
                                            </div>
                                        </div>
                                    )}

                                    {/* Collapsed mode tooltip */}
                                    {collapsed && (
                                        <span className={`pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl ${
                                            isDark
                                                ? 'bg-[#1e293b] text-white border border-white/10'
                                                : 'bg-white text-slate-900 border border-slate-200 shadow-slate-200/50'
                                        }`}>
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}

                        <div className={`my-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />

                        <Link
                            to="/trang-chu"
                            className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                                isDark
                                    ? 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-800'
                            }`}
                            title={collapsed ? 'Về Trang chủ' : undefined}
                        >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-500/10'}`}>
                                <Home className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" />
                            </span>
                            {!collapsed && <span className="font-semibold">Trở về Trang chủ</span>}
                            {collapsed && (
                                <span className={`pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl ${
                                    isDark
                                        ? 'bg-[#1e293b] text-white border border-white/10'
                                        : 'bg-white text-slate-900 border border-slate-200'
                                }`}>
                                    Trở về Trang chủ
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Footer User */}
                    <div className={`border-t p-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                        <div className={`flex items-center gap-3 rounded-2xl p-2 transition ${
                            isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                        } ${collapsed ? 'justify-center' : ''}`}>
                            <div className="relative shrink-0">
                                <img
                                    src={currentUser?.avatar || 'https://via.placeholder.com/150'}
                                    alt="Admin Avatar"
                                    className="h-9 w-9 rounded-xl object-cover ring-2 ring-indigo-500/40"
                                />
                                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ${isDark ? 'ring-[#0c1222]' : 'ring-white'}`} />
                            </div>

                            {!collapsed && (
                                <div className="min-w-0 flex-1">
                                    <h4 className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {currentUser?.fullName || 'Administrator'}
                                    </h4>
                                    <p className={`truncate text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                        @{currentUser?.username || 'admin'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>


                {/* Main Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <header
                        className={`flex h-20 shrink-0 items-center justify-between border-b px-8 backdrop-blur-xl transition-colors ${
                            isDark ? 'border-white/10 bg-[#0f172a]/60' : 'border-slate-200 bg-white/70 shadow-sm'
                        }`}
                    >
                        <div>
                            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{subtitle}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Dark/Light Theme Toggle Button */}
                            <button
                                type="button"
                                onClick={handleToggleTheme}
                                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition ${
                                    isDark
                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                        : 'border-indigo-500/30 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                }`}
                                title={isDark ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
                            >
                                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
                                <span>{isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
                            </button>

                            {/* System Status Pill */}
                            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-500">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                Hệ thống Hoạt động
                            </div>

                            {/* Back to Client App button */}
                            <button
                                type="button"
                                onClick={() => navigate('/trang-chu')}
                                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold transition ${
                                    isDark
                                        ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                        : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                            >
                                <Home className="h-4 w-4 text-indigo-500" />
                                <span>Về Feed</span>
                            </button>
                        </div>
                    </header>

                    <main className="no-scrollbar flex-1 overflow-y-auto p-8">{children}</main>
                </div>
            </div>
        </AdminThemeContext.Provider>
    );
}

export default AdminLayout;
