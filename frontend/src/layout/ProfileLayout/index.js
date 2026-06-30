import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Slider from '../components/Slider';
import ProfilePage from '../../pages/User/ProfilePage';

const STORAGE_KEY = 'sidebar_collapsed';

function ProfileLayout() {
    const user = useSelector((state) => state.user?.infoUser || {});

    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
        catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, String(collapsed)); }
        catch {}
    }, [collapsed]);

    const sidebarWidth = collapsed ? 88 : 285;

    return (
        <div className="h-[100dvh] overflow-hidden bg-white/80 text-gray-900 dark:bg-[#0f1117] dark:text-white">
            <div className="flex h-full w-full">
                {/* Sidebar */}
                <aside
                    className="relative hidden h-full shrink-0 flex-col border-r border-blue-100 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-[#181b22]/80 md:flex"
                    style={{ width: sidebarWidth }}
                >
                    <Slider user={user} collapsed={collapsed} />
                    <button
                        type="button"
                        onClick={() => setCollapsed((p) => !p)}
                        title={collapsed ? 'Mở rộng' : 'Thu nhỏ'}
                        className="absolute -right-3.5 top-1/2 z-50 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white text-gray-400 shadow-md transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#181b22] dark:hover:border-primary dark:hover:text-primary"
                    >
                        {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                    </button>
                </aside>

                {/* Main */}
                <main
                    id="profile-scroll-container"
                    className="min-w-0 flex-1 overflow-y-auto overscroll-contain pb-24 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    <div className="mx-auto w-full max-w-5xl px-4">
                        <ProfilePage />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ProfileLayout;
