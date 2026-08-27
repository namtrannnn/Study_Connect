import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Check, Search } from 'lucide-react';
import { getMyFriends } from '../../../services/friendServices';
import roomChatApi from '../roomChatApi';
import { getRoomId } from '../helpers';
import Avatar from './Avatar';
import { toast } from 'react-toastify';

function AddMembersModal({ room, onClose, onRoomUpdated }) {
    const [friends, setFriends] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        getMyFriends()
            .then((res) => {
                const all = res?.data?.friends || res?.data || [];
                const memberIds = room?.members?.map((m) => m?.user?._id) || [];
                setFriends(all.filter((f) => !memberIds.includes(f._id)));
            })
            .catch(() => {})
            .finally(() => setFetching(false));
    }, [room]);

    const toggle = (id) =>
        setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const handleAdd = async () => {
        if (selected.length === 0) return;
        try {
            setLoading(true);
            const res = await roomChatApi.addMembers(getRoomId(room), selected);
            onRoomUpdated(res.data?.data?.room || res.data?.room || res.data);
            toast.success(`Đã thêm ${selected.length} thành viên`);
            onClose();
        } catch {
            toast.error('Thêm thành viên thất bại');
        } finally {
            setLoading(false);
        }
    };

    const filtered = friends.filter((f) =>
        (f.fullName || '').toLowerCase().includes(search.toLowerCase()),
    );

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#181b22]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4 dark:border-white/10">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Thêm thành viên</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 pt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm bạn bè..."
                            className="h-10 w-full rounded-2xl border border-blue-100 bg-blue-50/60 pl-9 pr-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                    </div>
                </div>

                {/* Selected chips */}
                {selected.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-5 pt-3">
                        {selected.map((id) => {
                            const f = friends.find((x) => x._id === id);
                            if (!f) return null;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => toggle(id)}
                                    className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                                >
                                    {f.fullName}
                                    <X className="h-3 w-3" />
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* List */}
                <div className="max-h-64 overflow-y-auto px-2 py-3">
                    {fetching ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-400">
                            {friends.length === 0 ? 'Tất cả bạn bè đã trong nhóm' : 'Không tìm thấy'}
                        </p>
                    ) : (
                        filtered.map((f) => {
                            const isSel = selected.includes(f._id);
                            return (
                                <button
                                    key={f._id}
                                    type="button"
                                    onClick={() => toggle(f._id)}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition ${
                                        isSel
                                            ? 'bg-primary/10 ring-1 ring-primary/20'
                                            : 'hover:bg-blue-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <Avatar src={f.avatar} name={f.fullName} size="h-9 w-9" />
                                    <span className="flex-1 text-left text-sm font-medium dark:text-white">
                                        {f.fullName}
                                    </span>
                                    {isSel && <Check className="h-4 w-4 text-primary" />}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-blue-100 px-5 py-4 dark:border-white/10">
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={selected.length === 0 || loading}
                        className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? 'Đang thêm...' : `Thêm ${selected.length > 0 ? `(${selected.length})` : ''}`}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default AddMembersModal;
