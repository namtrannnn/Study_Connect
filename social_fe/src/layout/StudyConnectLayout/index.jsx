import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import Slider from '../components/Slider';
import Suggest from '../components/Suggest/Suggest';
import SearchPanel from '../components/search/SearchPanel';

const STORAGE_KEY = 'sidebar_collapsed';

function StudyConnectLayout({
    children,
    showSuggest = true,
    contentClassName = 'max-w-[680px]',
    mainId = 'social-scroll-container',
}) {
    const user = useSelector((state) => state.user?.infoUser || {});

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
    const sidebarWidth = collapsed ? 88 : 285;

    const handleOpenSearch = () => {
        setOpenPanel((prev) => (prev === 'search' ? null : 'search'));
    };

    const handleClosePanel = () => {
        setOpenPanel(null);
    };

    return (
        <div className="h-[100dvh] overflow-hidden bg-white text-gray-900 dark:bg-[#0f1117] dark:text-white">
            <div className="flex h-full w-full">
                {/* Sidebar */}
                <aside
                    className="relative hidden h-full shrink-0 flex-col border-r border-blue-100 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-[#181b22]/80 md:flex"
                    style={{ width: sidebarWidth }}
                >
                    <Slider
                        user={user}
                        collapsed={collapsed}
                        activePanel={openPanel}
                        onOpenSearch={handleOpenSearch}
                        onClosePanel={handleClosePanel}
                    />

                    <button
                        type="button"
                        onClick={() => setCollapsed((p) => !p)}
                        title={collapsed ? 'Mở rộng' : 'Thu nhỏ'}
                        className="absolute -right-3.5 top-1/2 z-50 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white text-gray-400 shadow-md transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#181b22] dark:hover:border-primary dark:hover:text-primary"
                    >
                        {collapsed ? (
                            <PanelLeftOpen className="h-3.5 w-3.5" />
                        ) : (
                            <PanelLeftClose className="h-3.5 w-3.5" />
                        )}
                    </button>
                </aside>

                {/* Main + Suggest */}
                <div className="flex min-w-0 flex-1 overflow-hidden">
                    <main
                        id={mainId}
                        className="min-w-0 flex-1 overflow-y-auto overscroll-contain pb-24 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <div className={`mx-auto w-full px-4 py-4 ${contentClassName}`}>{children}</div>
                    </main>

                    {showSuggest && (
                        <aside className="hidden h-full w-[300px] shrink-0 overflow-y-auto overscroll-contain border-l border-blue-100 bg-white/80 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#181b22]/80 lg:block">
                            <Suggest />
                        </aside>
                    )}
                </div>
            </div>

            {/* Search overlay */}
            <button
                type="button"
                onClick={handleClosePanel}
                className={`fixed inset-0 z-30 hidden bg-black/10 backdrop-blur-[1px] transition-opacity duration-300 ease-out md:block ${
                    isSearchOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-label="Đóng tìm kiếm"
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
        </div>
    );
}

export default StudyConnectLayout;
