import { Bell, Search } from 'lucide-react';

export default function SliderActions({ panel, setPanel }) {
    return (
        <div className="px-2 pb-2 relative z-10">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPanel(panel === 'search' ? null : 'search')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition w-full ${
                        panel === 'search' ? 'bg-muted' : ''
                    }`}
                >
                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
                        <Search className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Tìm kiếm</span>
                </button>

                <button
                    onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition w-full ${
                        panel === 'notifications' ? 'bg-muted' : ''
                    }`}
                >
                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
                        <Bell className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Thông báo</span>
                </button>
            </div>
        </div>
    );
}
