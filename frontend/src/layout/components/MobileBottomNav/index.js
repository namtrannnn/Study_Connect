import { useMemo } from 'react';
import { Home, MessageCircle, Search, Heart, Users, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import config from '../../../config';

export default function MobileBottomNav({ onOpenSearch, onOpenNotifications, activePanel = null }) {
    const location = useLocation();
    const currentUser = useSelector((state) => state.user?.infoUser || {});
    const unreadNotifCount = useSelector((state) => state.notification?.unreadCount || 0);
    const unreadChatCount = useSelector((state) => state.chat?.totalUnread || 0);

    const isProfileActive = location.pathname.startsWith('/profile');

    const navItems = useMemo(
        () => [
            { id: 'home', label: 'Trang chủ', icon: Home, path: '/trang-chu' },
            { id: 'messages', label: 'Tin nhắn', icon: MessageCircle, path: config.routes.messenger },
            { id: 'friends', label: 'Bạn bè', icon: Users, path: config.routes.friends },
            { id: 'notifications', label: 'Thông báo', icon: Heart, action: onOpenNotifications },
            { id: 'profile', label: 'Cá nhân', icon: User, path: '/profile', isProfile: true },
        ],
        [onOpenNotifications],
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-blue-100/80 bg-white/90 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-[#181b22]/90 dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] md:hidden safe-bottom">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isPanelActive =
                    (item.id === 'search' && activePanel === 'search') ||
                    (item.id === 'notifications' && activePanel === 'notifications');

                if (item.action) {
                    return (
                        <button
                            type="button"
                            key={item.id}
                            onClick={item.action}
                            className={`group relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-all duration-200 active:scale-90 ${
                                isPanelActive
                                    ? 'text-primary dark:text-blue-400 font-semibold'
                                    : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-blue-300'
                            }`}
                        >
                            <div className="relative">
                                <Icon
                                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                                        isPanelActive ? 'scale-110' : ''
                                    }`}
                                />
                                {item.id === 'notifications' && unreadNotifCount > 0 && (
                                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white shadow-sm shadow-red-500/40">
                                        {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium transition-colors truncate max-w-full px-0.5">{item.label}</span>
                            {isPanelActive && (
                                <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-primary dark:bg-blue-400 transition-all duration-300" />
                            )}
                        </button>
                    );
                }

                const isActive = item.isProfile ? isProfileActive : undefined;

                return (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive: navActive }) => {
                            const active = isActive !== undefined ? isActive : navActive;
                            return `group relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-all duration-200 active:scale-90 ${
                                active
                                    ? 'text-primary dark:text-blue-400 font-semibold'
                                    : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-blue-300'
                            }`;
                        }}
                    >
                        {({ isActive: navActive }) => {
                            const active = isActive !== undefined ? isActive : navActive;
                            return (
                                <>
                                    <div className="relative flex items-center justify-center">
                                        {item.isProfile ? (
                                            currentUser?.avatar ? (
                                                <img
                                                    src={currentUser.avatar}
                                                    alt="Profile"
                                                    className={`h-5 w-5 rounded-full object-cover ring-2 transition-transform duration-200 group-hover:scale-110 ${
                                                        active
                                                            ? 'ring-primary dark:ring-blue-400 scale-110'
                                                            : 'ring-gray-300 dark:ring-gray-600'
                                                    }`}
                                                />
                                            ) : (
                                                <Icon
                                                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                                                        active ? 'scale-110' : ''
                                                    }`}
                                                />
                                            )
                                        ) : (
                                            <Icon
                                                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                                                    active ? 'scale-110' : ''
                                                }`}
                                            />
                                        )}
                                        {item.id === 'messages' && unreadChatCount > 0 && (
                                            <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white shadow-sm shadow-red-500/40">
                                                {unreadChatCount > 99 ? '99+' : unreadChatCount}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium transition-colors truncate max-w-full px-0.5">{item.label}</span>
                                    {active && (
                                        <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-primary dark:bg-blue-400 transition-all duration-300" />
                                    )}
                                </>
                            );
                        }}
                    </NavLink>
                );
            })}
        </nav>
    );
}
