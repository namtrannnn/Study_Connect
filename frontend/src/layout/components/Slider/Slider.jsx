import { useMemo, useState, useEffect } from 'react';
import {
    Home,
    MessageCircle,
    Search,
    Compass,
    Heart,
    PlusSquare,
    User,
    Users,
    Menu,
    Sun,
    Moon,
    LogOut,
    Settings,
    Activity,
    Bookmark,
    Bug,
    Repeat,
} from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { LOGOUT } from '../../../redux/userSlice';
// import NotificationsPanel from './panels/NotificationsPanel';
import { TOGGLE_THEME } from '../../../redux/themeSlice';
import config from '../../../config';

export default function Slider({
    user,
    collapsed: externalCollapsed = false,
    activePanel,
    onOpenSearch,
    onOpenNotifications,
    onOpenCreatePost,
    onClosePanel,
}) {
    const [panel, setPanel] = useState(null);
    const [moreOpen, setMoreOpen] = useState(false);
    const [isMd, setIsMd] = useState(() => window.innerWidth >= 768);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const infoUser = useSelector((state) => state.user?.infoUser);
    const currentUser = user || infoUser;
    const theme = useSelector((state) => state.theme?.theme);
    const unreadNotifCount = useSelector((state) => state.notification?.unreadCount || 0);
    const unreadChatCount = useSelector((state) => state.chat?.totalUnread || 0);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    const handleLogout = () => {
        dispatch(LOGOUT());
        setMoreOpen(false);
        setPanel(null);
        onClosePanel?.();
        navigate('/login', { replace: true });
    };
    const handleToggleTheme = () => {
        const newTheme = theme === 'dark' ? null : 'dark';
        dispatch(TOGGLE_THEME(newTheme));
    };
    useEffect(() => {
        const handleResize = () => setIsMd(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isNotificationPanelOpen = panel === 'notifications';
    // eslint-disable-next-line no-unused-vars
    const isSearchPanelOpen = activePanel === 'search';
    const collapsed = isMd && (externalCollapsed || isNotificationPanelOpen);
    // const sidebarWidth = collapsed ? 88 : 280;

    const togglePanel = (panelName) => {
        if (panelName === 'search') {
            setMoreOpen(false);
            setPanel(null);
            onOpenSearch?.();
            return;
        }

        if (panelName === 'notifications') {
            setMoreOpen(false);
            setPanel(null);
            onOpenNotifications?.();
            return;
        }

        onClosePanel?.();
        setPanel((prev) => (prev === panelName ? null : panelName));
    };

    const navItems = useMemo(
        () => [
            { id: 'home', label: 'Trang chủ', icon: Home, path: '/trang-chu' },
            { id: 'messages', label: 'Tin nhắn', icon: MessageCircle, path: config.routes.messenger },
            { id: 'friends', label: 'Đang theo dõi', icon: Users, path: config.routes.friends },
            { id: 'search', label: 'Tìm kiếm', icon: Search, action: () => togglePanel('search') },
            { id: 'notifications', label: 'Thông báo', icon: Heart, action: () => togglePanel('notifications') },
            {
                id: 'create',
                label: 'Tạo',
                icon: PlusSquare,
                action: () => {
                    setMoreOpen(false);
                    onClosePanel?.();
                    onOpenCreatePost?.();
                },
            },
            {
                id: 'profile',
                label: 'Trang cá nhân',
                icon: User,
                path: '/profile',
                isProfile: true,
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [onOpenCreatePost],
    );

    const bottomItems = useMemo(
        () => [
            {
                id: 'more',
                label: 'Xem thêm',
                icon: Menu,
                action: () => setMoreOpen((prev) => !prev),
            },
        ],
        [],
    );
    const moreMenuItems = [
        {
            id: 'settings',
            label: 'Cài đặt',
            icon: Settings,
            path: '/settings',
        },
        {
            id: 'activity',
            label: 'Hoạt động học tập',
            icon: Activity,
            path: '/activity',
        },
        {
            id: 'saved',
            label: 'Đã lưu',
            icon: Bookmark,
            path: '/saved',
        },
        {
            id: 'theme',
            label: theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối',
            icon: theme === 'dark' ? Sun : Moon,
            action: handleToggleTheme,
        },
        {
            id: 'report',
            label: 'Báo cáo sự cố',
            icon: Bug,
            path: '/report',
        },
    ];

    const panelTitle = panel === 'search' ? 'Tìm kiếm' : 'Thông báo'; // eslint-disable-line no-unused-vars

    const renderItem = (item) => {
        const Icon = item.icon;

        const getItemClass = (isActive = false) => `
        group w-full h-[60px] flex items-center rounded-xl transition-all duration-200
        ${collapsed ? 'justify-center px-2' : 'gap-3 px-2.5'}
        ${
            isActive
                ? 'bg-blue-50 text-primary font-semibold dark:bg-blue-500/10 dark:text-blue-300'
                : 'text-slate-800 hover:bg-blue-50 dark:text-gray-100 dark:hover:bg-white/10'
        }
    `;

        const renderContent = (isActive = false) => (
            <>
                <div
                    className={`
                    relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                    bg-blue-50 text-primary transition-all duration-200
                    dark:bg-white/10 dark:text-blue-300
                    ${isActive ? 'ring-1 ring-blue-200 dark:ring-blue-400/30' : ''}
                `}
                >
                    {item.isProfile ? (
                        <img
                            src={currentUser?.avatar || 'https://i.pravatar.cc/150?img=3'}
                            alt="avatar"
                            className={`
                            h-7 w-7 rounded-full object-cover
                            ${isActive ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-surface-cardDark' : ''}
                        `}
                        />
                    ) : (
                        <Icon className="h-5 w-5" />
                    )}

                    {item.id === 'notifications' && unreadNotifCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[10px] font-bold text-white dark:border-surface-cardDark">
                            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                        </span>
                    )}
                    {item.id === 'messages' && unreadChatCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[10px] font-bold text-white dark:border-surface-cardDark">
                            {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                    )}
                </div>

                {!collapsed && <span className="truncate text-[15px] font-semibold">{item.label}</span>}
            </>
        );

        if (item.action) {
            const isActive = item.id === 'search' ? activePanel === 'search' : panel === item.id;

            return (
                <button type="button" key={item.id} onClick={item.action} className={getItemClass(isActive)}>
                    {renderContent(isActive)}
                </button>
            );
        }

        return (
            <NavLink
                key={item.id}
                to={item.path}
                onClick={() => {
                    setPanel(null);
                    setMoreOpen(false);
                    onClosePanel?.();
                }}
                className={({ isActive }) => getItemClass(isActive)}
            >
                {({ isActive }) => renderContent(isActive)}
            </NavLink>
        );
    };

    return (
        <div className="relative flex h-full w-full overflow-visible bg-background text-foreground">
            {/* Mobile overlay */}
            {!isMd && isNotificationPanelOpen && (
                <button
                    type="button"
                    onClick={() => setPanel(null)}
                    className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[1px]"
                    aria-label="Close overlay"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
        relative z-40 flex h-full shrink-0 flex-col justify-between
        overflow-visible border-r border-blue-100 bg-white
        shadow-[8px_0_30px_rgba(37,99,235,0.06)]
        transition-all duration-300
        dark:border-white/10 dark:bg-surface-cardDark
        ${collapsed ? 'w-[88px]' : 'w-full'}
        ${!isMd ? 'hidden md:flex' : 'flex'}
    `}
            >
                <div className="flex h-full flex-col">
                    <div className={`px-3 pb-4 pt-5 ${collapsed ? 'flex justify-center' : ''}`}>
                        {collapsed ? (
                            <img src="/nexus-logo.svg" alt="Nexus" className="h-11 w-11" />
                        ) : (
                            <div className="flex items-center gap-2.5 px-1 py-1">
                                <img src="/nexus-logo.svg" alt="Nexus" className="h-11 w-11" />
                                <span
                                    className="text-[28px] tracking-wide text-gray-900 dark:text-white"
                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 700 }}
                                >
                                    Nexus
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-1 px-3 pt-2">{navItems.map((item) => renderItem(item))}</div>

                    <div className="space-y-2 border-t border-blue-100 px-3 py-4 dark:border-white/10">
                        {moreOpen && !collapsed && (
                            <div className="absolute bottom-[88px] left-3 right-3 z-50 overflow-hidden rounded-[22px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(37,99,235,0.18)] dark:border-white/10 dark:bg-surface-cardDark">
                                <div className="bg-brand-gradient-soft p-2 dark:bg-none">
                                    {moreMenuItems.map((item) => {
                                        const Icon = item.icon;

                                        const content = (
                                            <>
                                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-white/10 dark:text-blue-300">
                                                    <Icon className="h-5 w-5" />
                                                </span>

                                                <span className="text-[15px] font-medium text-gray-800 dark:text-gray-100">
                                                    {item.label}
                                                </span>
                                            </>
                                        );

                                        if (item.action) {
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        item.action();
                                                        setMoreOpen(false);
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-blue-50 dark:hover:bg-white/10"
                                                >
                                                    {content}
                                                </button>
                                            );
                                        }

                                        return (
                                            <NavLink
                                                key={item.id}
                                                to={item.path}
                                                onClick={() => {
                                                    setMoreOpen(false);
                                                    setPanel(null);
                                                    onClosePanel?.();
                                                }}
                                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-blue-50 dark:hover:bg-white/10"
                                            >
                                                {content}
                                            </NavLink>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-blue-100 bg-white p-2 dark:border-white/10 dark:bg-surface-cardDark">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-white/10"
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-primary dark:bg-white/10 dark:text-blue-300">
                                            <Repeat className="h-5 w-5" />
                                        </span>

                                        <span className="text-[15px] font-medium text-gray-800 dark:text-gray-100">
                                            Chuyển tài khoản
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-red-50 dark:hover:bg-red-500/10"
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
                                            <LogOut className="h-5 w-5" />
                                        </span>

                                        <span className="text-[15px] font-semibold text-red-500">Đăng xuất</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        {bottomItems.map((item) => renderItem(item, true))}
                    </div>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            {!isMd && (
                <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background md:hidden">
                    {navItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        const active = panel === item.id;

                        if (item.action) {
                            return (
                                <button
                                    type="button"
                                    key={item.id}
                                    onClick={item.action}
                                    className="flex flex-col items-center justify-center gap-1"
                                >
                                    <Icon className={`h-6 w-6 ${active ? 'scale-110' : ''}`} />
                                </button>
                            );
                        }

                        return (
                            <a
                                key={item.id}
                                href={item.path}
                                className="flex flex-col items-center justify-center gap-1"
                            >
                                <Icon className="h-6 w-6" />
                            </a>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
