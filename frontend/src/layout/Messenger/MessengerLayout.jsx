import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Slider from '../components/Slider/Slider';
import MobileBottomNav from '../components/MobileBottomNav';
import SearchPanel from '../components/search/SearchPanel';
import NotificationsPanel from '../components/Slider/panels/NotificationsPanel';

const STORAGE_KEY = 'sidebar_collapsed';

function MessengerLayout({ children }) {
    const user = useSelector((state) => state.user?.infoUser || {});
    const activeRoomId = useSelector((state) => state.chat?.activeRoomId);

    const [openPanel, setOpenPanel] = useState(null);
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, String(collapsed));
        } catch {}
    }, [collapsed]);

    const isSearchOpen = openPanel === 'search';
    const isNotifOpen = openPanel === 'notifications';
    const sidebarWidth = collapsed ? 88 : 285;

    const handleOpenSearch = () => {
        setOpenPanel((prev) => (prev === 'search' ? null : 'search'));
    };

    const handleOpenNotifications = () => {
        setOpenPanel((prev) => (prev === 'notifications' ? null : 'notifications'));
    };

    const handleClosePanel = () => {
        setOpenPanel(null);
    };

    return (
        <div className="h-[100dvh] overflow-hidden bg-[#f4f7fb] text-gray-900 dark:bg-[#0f1117] dark:text-white">
            <div className="flex h-full w-full">
                {/* Sidebar — chỉ hiện từ md trở lên */}
                <aside
                    className="relative hidden h-full shrink-0 flex-col border-r border-blue-100 bg-white/90 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-[#181b22]/90 md:flex"
                    style={{ width: sidebarWidth }}
                >
                    <Slider
                        user={user}
                        collapsed={collapsed}
                        activePanel={openPanel}
                        onOpenSearch={handleOpenSearch}
                        onOpenNotifications={handleOpenNotifications}
                        onClosePanel={handleClosePanel}
                    />

                    {/* Nút toggle collapse */}
                    <button
                        type="button"
                        onClick={() => setCollapsed((p) => !p)}
                        title={collapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
                        className="absolute -right-3.5 top-1/2 z-50 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white text-gray-400 shadow-md transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#181b22] dark:hover:border-primary dark:hover:text-primary"
                    >
                        {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                    </button>
                </aside>

                {/* Main content */}
                <main className="min-w-0 flex-1 overflow-hidden">
                    {children}
                </main>
            </div>

            {/* Search overlay desktop */}
            <button
                type="button"
                onClick={handleClosePanel}
                className={`fixed inset-0 z-30 hidden bg-black/10 backdrop-blur-[1px] transition-opacity duration-300 ease-out md:block ${
                    isSearchOpen || isNotifOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-label="Đóng panel"
            />

            {/* Search panel desktop */}
            <div
                className={`fixed bottom-4 top-4 z-40 hidden w-[420px] overflow-hidden rounded-[28px] border border-blue-100/80 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-2xl transition-all duration-300 ease-out dark:border-white/10 dark:bg-[#181b22]/95 md:block ${
                    isSearchOpen
                        ? 'translate-x-0 scale-100 opacity-100'
                        : 'pointer-events-none -translate-x-8 scale-[0.97] opacity-0'
                }`}
                style={{ left: sidebarWidth + 16 }}
            >
                <SearchPanel onClose={handleClosePanel} />
            </div>

            {/* Notification panel desktop */}
            <div
                className={`fixed bottom-4 top-4 z-40 hidden w-[420px] overflow-hidden rounded-[28px] border border-blue-100/80 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-2xl transition-all duration-300 ease-out dark:border-white/10 dark:bg-[#181b22]/95 md:block ${
                    isNotifOpen
                        ? 'translate-x-0 scale-100 opacity-100'
                        : 'pointer-events-none -translate-x-8 scale-[0.97] opacity-0'
                }`}
                style={{ left: sidebarWidth + 16 }}
            >
                <NotificationsPanel onClose={handleClosePanel} />
            </div>

            {/* Search panel mobile */}
            <div
                className={`fixed inset-0 z-50 bg-white transition-all duration-300 ease-out dark:bg-[#181b22] md:hidden ${
                    isSearchOpen
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none translate-y-6 scale-[0.98] opacity-0'
                }`}
            >
                <SearchPanel onClose={handleClosePanel} />
            </div>

            {/* Notification panel mobile */}
            <div
                className={`fixed inset-0 z-50 bg-white transition-all duration-300 ease-out dark:bg-[#181b22] md:hidden ${
                    isNotifOpen
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none translate-y-6 scale-[0.98] opacity-0'
                }`}
            >
                <NotificationsPanel onClose={handleClosePanel} />
            </div>

            {/* Mobile Bottom Nav — hiện khi KHÔNG trong phòng chat cụ thể trên mobile */}
            {!activeRoomId && (
                <MobileBottomNav
                    onOpenSearch={handleOpenSearch}
                    onOpenNotifications={handleOpenNotifications}
                    activePanel={openPanel}
                />
            )}
        </div>
    );
}

export default MessengerLayout;
