import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Header from '../components/Header';
import Slider from '../components/Slider';
import Suggest from '../components/Suggest/Suggest';

const STORAGE_KEY = 'sidebar_collapsed';

function DefaultLayout({ children }) {
    const { theme } = useSelector((state) => state.theme);
    const user = useSelector((state) => state.user);

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

    const sidebarWidth = collapsed ? 88 : 300;

    return (
        <div className="min-h-screen bg-bg-light dark:bg-surface-darker">
            <Header />
            <div className="pt-[38px] md:pt-[59px]">
                <div className="flex h-[calc(100vh-59px)] w-full overflow-hidden">
                    {/* Sidebar */}
                    <div
                        className="relative hidden h-full shrink-0 bg-white transition-all duration-300 dark:bg-surface-cardDark md:block"
                        style={{ width: sidebarWidth }}
                    >
                        <Slider collapsed={collapsed} />
                        <button
                            type="button"
                            onClick={() => setCollapsed((p) => !p)}
                            title={collapsed ? 'Mở rộng' : 'Thu nhỏ'}
                            className="absolute -right-3.5 top-1/2 z-50 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white text-gray-400 shadow-md transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-surface-cardDark dark:hover:border-primary dark:hover:text-primary"
                        >
                            {collapsed ? (
                                <PanelLeftOpen className="h-3.5 w-3.5" />
                            ) : (
                                <PanelLeftClose className="h-3.5 w-3.5" />
                            )}
                        </button>
                    </div>

                    {/* Main + Suggest */}
                    <main className="min-w-0 flex-1 overflow-y-auto">
                        <div className="grid min-h-full w-full grid-cols-1 gap-6 py-3 pb-20 md:py-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="min-w-0 px-3 md:px-5">{children}</div>
                            <aside className="hidden h-full bg-white lg:block dark:bg-surface-cardDark">
                                <Suggest />
                            </aside>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default DefaultLayout;
