import { useState, createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    MessageSquare,
    Hash,
    TrendingUp,
    History,
    Home,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    Sun,
    Moon,
    LogOut,
    Sparkles,
} from 'lucide-react';
import { TOGGLE_THEME } from '../../redux/themeSlice';
import { LOGOUT } from '../../redux/userSlice';

export const AdminThemeContext = createContext({ isDark: false, toggleTheme: () => { } });
export const useAdminTheme = () => useContext(AdminThemeContext);

function AdminLayout({ children }) {
    const currentUser = useSelector((state) => state.user?.infoUser);
    const reduxTheme = useSelector((state) => state.theme?.theme);
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    // Default to false (Light). Dark only if reduxTheme is 'dark' or true
    const isThemeDark = reduxTheme === 'dark' || reduxTheme === true;
    const [isDark, setIsDark] = useState(isThemeDark);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        setIsDark(reduxTheme === 'dark' || reduxTheme === true);
    }, [reduxTheme]);

    const handleToggleTheme = () => {
        const nextState = !isDark;
        setIsDark(nextState);
        dispatch(TOGGLE_THEME(nextState ? 'dark' : null));
    };

    const handleLogout = () => {
        dispatch(LOGOUT());
        navigate('/login', { replace: true });
    };

    const navSections = [
        {
            id: 'analytics',
            title: 'Tổng quan & Số liệu',
            items: [
                {
                    label: 'Tổng quan',
                    path: '/admin/dashboard',
                    icon: LayoutDashboard,
                },
                {
                    label: 'Phân tích & Thống kê',
                    path: '/admin/analytics',
                    icon: TrendingUp,
                },
            ],
        },
        {
            id: 'management',
            title: 'Quản trị Nội dung',
            items: [
                {
                    label: 'Người dùng',
                    path: '/admin/users',
                    icon: Users,
                },
                {
                    label: 'Bài viết',
                    path: '/admin/posts',
                    icon: FileText,
                },
                {
                    label: 'Bình luận',
                    path: '/admin/comments',
                    icon: MessageSquare,
                },
                {
                    label: 'Quản lý Hashtag',
                    path: '/admin/hashtags',
                    icon: Hash,
                },
            ],
        },
        {
            id: 'security',
            title: 'An ninh & Vận hành',
            items: [
                {
                    label: 'Trung tâm Kiểm duyệt',
                    path: '/admin/moderation',
                    icon: ShieldAlert,
                    badge: 'AI Phễu',
                },
                {
                    label: 'Nhật ký Hệ thống',
                    path: '/admin/logs',
                    icon: History,
                },
            ],
        },
    ];

    const isItemActive = (path) => {
        if (path === '/admin/dashboard') {
            return location.pathname === '/admin/dashboard' || location.pathname === '/admin' || location.pathname === '/admin/';
        }
        if (path === '/admin/moderation') {
            return location.pathname.startsWith('/admin/moderation') || location.pathname.startsWith('/admin/reports');
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const getPageTitle = () => {
        if (location.pathname.includes('/users')) return { title: 'Quản lý Người dùng', subtitle: 'Tìm kiếm, phân quyền, khóa/mở khóa và quản lý tài khoản' };
        if (location.pathname.includes('/posts')) return { title: 'Quản lý Bài viết', subtitle: 'Kiểm duyệt bài đăng, xem nội dung và ẩn/xóa bài vi phạm' };
        if (location.pathname.includes('/comments')) return { title: 'Quản lý Bình luận', subtitle: 'Tìm kiếm và dọn dẹp các bình luận vi phạm tiêu chuẩn' };
        if (location.pathname.includes('/reports') || location.pathname.includes('/moderation')) return { title: 'Trung tâm Kiểm duyệt & Báo cáo', subtitle: 'Quản lý phễu 4 tầng tự động AI và xử lý báo cáo từ cộng đồng' };
        if (location.pathname.includes('/hashtags')) return { title: 'Quản lý Hashtags & Blacklist', subtitle: 'Theo dõi xu hướng hashtag và danh sách từ khóa cấm' };
        if (location.pathname.includes('/analytics')) return { title: 'Phân tích & Thống kê Tương tác', subtitle: 'Biểu đồ tăng trưởng, khung giờ vàng và phân tích hành vi cộng đồng' };
        if (location.pathname.includes('/logs')) return { title: 'Nhật ký Hệ thống (Audit Trail)', subtitle: 'Ghi nhận mọi thao tác xử lý của ban quản trị' };
        return { title: 'Bảng phân tích Tổng quan', subtitle: 'Thống kê chỉ số sức khỏe & tình hình hoạt động của hệ thống' };
    };

    const { title, subtitle } = getPageTitle();

    return (
        <AdminThemeContext.Provider value={{ isDark, toggleTheme: handleToggleTheme }}>
            <div
                className={`flex h-screen w-screen overflow-hidden antialiased transition-colors duration-200 selection:bg-blue-600 selection:text-white ${isDark ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50/60 text-slate-900'
                    }`}
            >
                {/* Brand-new Modern Sidebar */}
                <aside
                    className={`relative flex flex-col border-r transition-[width] duration-300 ease-in-out shrink-0 select-none ${collapsed ? 'w-[72px]' : 'w-64'
                        } ${isDark
                            ? 'bg-[#0a0e17] border-slate-800/80 shadow-2xl shadow-black/40'
                            : 'bg-white border-slate-200/90 shadow-sm'
                        }`}
                >
                    {/* Header: Admin Identity & Quick Controls */}
                    <div
                        className={`flex h-[72px] items-center px-3.5 border-b transition-colors shrink-0 ${collapsed ? 'justify-center' : 'justify-between'
                            } ${isDark ? 'border-slate-800/80 bg-[#0f1422]/60' : 'border-slate-100 bg-slate-50/60'}`}
                    >
                        {!collapsed ? (
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                <div className="relative shrink-0">
                                    <img
                                        src={currentUser?.avatar || 'https://via.placeholder.com/150'}
                                        alt="Admin Avatar"
                                        className="h-10 w-10 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-sm"
                                    />
                                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ${isDark ? 'ring-[#0a0e17]' : 'ring-white'}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className={`text-[13px] font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {currentUser?.fullName || 'Trần Nhật Nam'}
                                        </h4>
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/25 shrink-0 leading-none">
                                            Admin
                                        </span>
                                    </div>
                                    <p className={`text-[11px] font-medium leading-tight mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Quản trị viên
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="group relative">
                                <div className="relative">
                                    <img
                                        src={currentUser?.avatar || 'https://via.placeholder.com/150'}
                                        alt="Admin Avatar"
                                        className="h-10 w-10 rounded-2xl object-cover ring-2 ring-blue-500/30 cursor-pointer shadow-sm"
                                    />
                                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ${isDark ? 'ring-[#0a0e17]' : 'ring-white'}`} />
                                </div>
                                {/* Floating Tooltip on Collapsed */}
                                <div
                                    className={`pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-xl p-2.5 text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isDark
                                        ? 'bg-slate-800 text-white border border-slate-700 shadow-black/50'
                                        : 'bg-slate-900 text-white shadow-slate-900/25'
                                        }`}
                                >
                                    <p className="font-bold">{currentUser?.fullName || 'Trần Nhật Nam'}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-[10px] text-slate-400">Quản trị viên</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                            {!collapsed && (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${isDark
                                        ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/15'
                                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                        }`}
                                    title="Đăng xuất"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setCollapsed(!collapsed)}
                                className={`hidden md:flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${collapsed ? 'absolute -right-3.5 top-5 z-20 shadow-md border' : ''
                                    } ${isDark
                                        ? 'bg-[#151c28] border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800'
                                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 shadow-xs'
                                    }`}
                                title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                            >
                                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Items (Native Buttons without link hover previews) */}
                    <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-3.5 space-y-4">
                        {navSections.map((section) => (
                            <div key={section.id} className="space-y-1">
                                {!collapsed && (
                                    <p className={`px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'
                                        }`}>
                                        {section.title}
                                    </p>
                                )}

                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isItemActive(item.path);

                                    return (
                                        <button
                                            key={item.path}
                                            type="button"
                                            onClick={() => {
                                                if (active) return;
                                                navigate(item.path);
                                            }}
                                            className={`group relative flex items-center rounded-xl text-xs font-medium border text-left outline-none cursor-pointer transition-colors duration-150 ${collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full'
                                                } ${active
                                                    ? isDark
                                                        ? 'bg-gradient-to-r from-blue-600/20 to-sky-500/10 text-blue-300 font-semibold border-blue-500/30 shadow-sm shadow-blue-500/10'
                                                        : 'bg-blue-50 text-blue-700 font-semibold border-blue-200/80 shadow-xs'
                                                    : isDark
                                                        ? 'border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
                                                        : 'border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                                }`}
                                        >
                                            {/* Active side indicator */}
                                            {active && !collapsed && (
                                                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-500/40" />
                                            )}

                                            <Icon
                                                className={`h-4 w-4 shrink-0 transition-colors ${active
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : isDark
                                                        ? 'text-slate-400 group-hover:text-slate-200'
                                                        : 'text-slate-400 group-hover:text-slate-700'
                                                    }`}
                                            />

                                            {!collapsed && (
                                                <span className="truncate flex-1 font-medium">{item.label}</span>
                                            )}

                                            {!collapsed && item.badge && (
                                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200/60 dark:border-rose-500/25 flex items-center gap-1">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    {item.badge}
                                                </span>
                                            )}

                                            {/* Tooltip on Collapsed (No Browser Link Bar) */}
                                            {collapsed && (
                                                <div
                                                    className={`pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isDark
                                                        ? 'bg-slate-800 text-white border border-slate-700 shadow-black/50'
                                                        : 'bg-slate-900 text-white shadow-slate-900/20'
                                                        }`}
                                                >
                                                    {item.label}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Footer System Status */}
                    {!collapsed && (
                        <div className={`px-4 py-3 border-t text-center transition-colors ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                            <p className="text-[10px] font-semibold tracking-wider uppercase">Nexus Admin</p>
                        </div>
                    )}
                </aside>


                {/* Main Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <header
                        className={`flex h-20 shrink-0 items-center justify-between border-b px-8 backdrop-blur-xl transition-colors ${isDark ? 'border-white/10 bg-[#0f172a]/60' : 'border-slate-200 bg-white/70 shadow-sm'
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
                                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition ${isDark
                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                    : 'border-blue-500/30 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    }`}
                                title={isDark ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
                            >
                                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
                                <span>{isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
                            </button>

                            {/* Back to Client App button */}
                            <button
                                type="button"
                                onClick={() => navigate('/trang-chu')}
                                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold transition ${isDark
                                    ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                                    }`}
                            >
                                <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span>Về Feed</span>
                            </button>
                        </div>
                    </header>

                    <main className="no-scrollbar flex-1 overflow-y-auto p-8">{children || <Outlet />}</main>
                </div>
            </div>
        </AdminThemeContext.Provider>
    );
}

export default AdminLayout;
