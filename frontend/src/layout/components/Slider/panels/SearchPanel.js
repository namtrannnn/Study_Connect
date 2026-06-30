import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';

export default function SearchPanel({ recentSearches = [] }) {
    const [q, setQ] = useState('');
    const [recent, setRecent] = useState(recentSearches);

    const filtered = q.trim()
        ? recent.filter((x) => (x.username + ' ' + (x.name || '')).toLowerCase().includes(q.toLowerCase()))
        : recent;

    return (
        <div className="p-4 space-y-4">
            <div className="bg-muted rounded-full px-4 py-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm kiếm"
                    className="bg-transparent outline-none w-full text-sm"
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="font-semibold">Mới đây</div>
                <button onClick={() => setRecent([])} className="text-sm text-blue-600 hover:underline">
                    Xóa tất cả
                </button>
            </div>

            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Không có kết quả.</div>
                ) : (
                    filtered.map((u) => (
                        <div
                            key={u.id}
                            className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-muted transition"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback>{u.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>

                                <div className="leading-tight">
                                    <div className="font-medium">{u.username}</div>
                                    {(u.name || u.meta) && (
                                        <div className="text-xs text-muted-foreground">
                                            {u.name}
                                            {u.meta ? ` • ${u.meta}` : ''}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setRecent((prev) => prev.filter((x) => x.id !== u.id))}
                                className="p-2 rounded-lg hover:bg-background transition"
                                aria-label="Remove"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
