import { useEffect, useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { getMyFriends } from '../../../services/friendServices';
import { createGroupRoom } from '../../../services/chatServices';
import Avatar from './Avatar';

function CreateGroupModal({ onClose, onCreated }) {
    const [friends, setFriends] = useState([]);
    const [selected, setSelected] = useState([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        getMyFriends()
            .then((res) => setFriends(res?.data?.friends || res?.data || []))
            .catch(() => {})
            .finally(() => setFetching(false));
    }, []);

    const toggle = (id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const handleCreate = async () => {
        if (selected.length < 2) return;
        try {
            setLoading(true);
            const room = await createGroupRoom({ title: title.trim() || 'Nhóm mới', usersId: selected });
            onCreated(room);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#181b22]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Tạo nhóm chat</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-1.5 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tên nhóm (tuỳ chọn)"
                    className="mb-4 w-full rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                />
                <p className="mb-2 text-xs text-gray-500">Chọn ít nhất 2 bạn bè</p>
                <div className="max-h-60 space-y-1 overflow-y-auto">
                    {fetching ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : friends.length === 0 ? (
                        <p className="py-4 text-center text-sm text-gray-400">Chưa có bạn bè nào</p>
                    ) : (
                        friends.map((f) => {
                            const isSel = selected.includes(f._id);
                            return (
                                <button
                                    key={f._id}
                                    type="button"
                                    onClick={() => toggle(f._id)}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition ${isSel ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-blue-50 dark:hover:bg-white/5'}`}
                                >
                                    <Avatar src={f.avatar} name={f.fullName} size="h-9 w-9" />
                                    <span className="flex-1 text-left text-sm font-medium">{f.fullName}</span>
                                    {isSel && <Check className="h-4 w-4 text-primary" />}
                                </button>
                            );
                        })
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={selected.length < 2 || loading}
                    className="mt-4 w-full rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? 'Đang tạo...' : `Tạo nhóm (${selected.length} người)`}
                </button>
            </div>
        </div>
    );
}

export default CreateGroupModal;
