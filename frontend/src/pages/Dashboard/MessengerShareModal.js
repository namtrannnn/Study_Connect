import { useEffect, useMemo, useState } from 'react';
import { X, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '../../components/ui/utils'; // nếu bạn có cn ở chỗ khác thì sửa path
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';

export default function MessengerShareModal({
    open,
    onClose,
    onBack, // optional: để quay lại ShareModal
    currentUser,
    post,
    friends = [], // list người nhận: [{id, name, avatar}]
    onSend, // (payload) => void
}) {
    const [q, setQ] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [note, setNote] = useState('');

    // reset khi mở
    useEffect(() => {
        if (open) {
            setQ('');
            setSelected(new Set());
            setNote('');
        }
    }, [open]);

    const list = useMemo(() => {
        const data =
            friends?.length > 0
                ? friends
                : [
                      { id: 'u1', name: 'ẩn danh', avatar: 'https://i.pravatar.cc/150?img=32' },
                      { id: 'u2', name: 'Phạm Thị Ngọc Linh', avatar: '' },
                      { id: 'u3', name: 'Ae Cây Khế 🐔', avatar: 'https://i.pravatar.cc/150?img=15' },
                      { id: 'u4', name: 'Nguyễn Minh Quang', avatar: 'https://i.pravatar.cc/150?img=20' },
                      { id: 'u5', name: 'Nguyễn Minh Anh', avatar: 'https://i.pravatar.cc/150?img=33' },
                  ];

        const keyword = q.trim().toLowerCase();
        if (!keyword) return data;

        return data.filter((u) => u.name?.toLowerCase().includes(keyword));
    }, [friends, q]);

    if (!open) return null;

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const canSend = selected.size > 0;

    const handleSend = () => {
        if (!canSend) return;

        const payload = {
            postId: post?.id,
            receivers: Array.from(selected),
            note: note.trim(),
        };

        toast('Đã gửi (demo) ✅');
        onSend?.(payload);
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-[10000]">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            {/* modal */}
            <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#242526] text-white shadow-xl border border-white/10 overflow-hidden">
                {/* header */}
                <div className="relative px-5 py-4 border-b border-white/10 flex items-center justify-center">
                    {/* back */}
                    <button
                        type="button"
                        onClick={onBack || onClose}
                        className="absolute left-4 top-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <h2 className="text-lg font-semibold">Gửi đến</h2>

                    {/* close */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* search */}
                <div className="px-5 py-4">
                    <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2">
                        <Search className="w-5 h-5 text-white/70" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Tìm kiếm người và nhóm"
                            className="w-full bg-transparent outline-none text-sm placeholder:text-white/50"
                        />
                    </div>
                </div>

                {/* list */}
                <div className="px-2 pb-2 max-h-[45vh] overflow-y-auto">
                    {list.map((u) => {
                        const checked = selected.has(u.id);
                        return (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => toggle(u.id)}
                                className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-white/5"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={u.avatar} />
                                        <AvatarFallback>{u?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>

                                    <div className="text-left min-w-0">
                                        <div className="font-semibold truncate">{u.name}</div>
                                    </div>
                                </div>

                                {/* checkbox */}
                                <div
                                    className={cn(
                                        'h-6 w-6 rounded border border-white/30 flex items-center justify-center',
                                        checked ? 'bg-blue-600 border-blue-600' : 'bg-transparent',
                                    )}
                                >
                                    {checked ? <span className="text-sm">✓</span> : null}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* note */}
                <div className="px-5 py-4 border-t border-white/10">
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Thêm tin nhắn tại đây (không bắt buộc)..."
                        className="w-full rounded-full bg-white/10 px-4 py-3 outline-none text-sm placeholder:text-white/50"
                    />
                </div>

                {/* send button */}
                <div className="px-5 pb-5">
                    <Button
                        onClick={handleSend}
                        disabled={!canSend}
                        className={cn(
                            'w-full rounded-xl py-6',
                            canSend ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/10 text-white/40 hover:bg-white/10',
                        )}
                    >
                        Gửi
                    </Button>
                </div>
            </div>
        </div>
    );
}
