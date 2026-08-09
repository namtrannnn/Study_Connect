import { useEffect, useState } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { getMyFriends } from '../../../services/friendServices';
import { searchStudyConnect } from '../../../services/SearchServices';
import useDebounce from '../../../hooks/useDebounce';
import Avatar from './Avatar';

function NewChatModal({ onClose, onSelect, loading }) {
    const [initialUsers, setInitialUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search.trim(), 350);

    // Initial load: fetch friends/following users
    useEffect(() => {
        getMyFriends()
            .then((res) => setInitialUsers(res?.data?.friends || res?.data || []))
            .catch(() => {})
            .finally(() => setFetching(false));
    }, []);

    // Search globally across all users when searching
    useEffect(() => {
        if (!debouncedSearch) {
            setSearchResults([]);
            return;
        }

        let isMounted = true;
        setFetching(true);

        searchStudyConnect({ keyword: debouncedSearch, type: 'users', limit: 15 })
            .then((res) => {
                if (isMounted) {
                    setSearchResults(res?.data?.users || []);
                }
            })
            .catch(() => {
                if (isMounted) setSearchResults([]);
            })
            .finally(() => {
                if (isMounted) setFetching(false);
            });

        return () => {
            isMounted = false;
        };
    }, [debouncedSearch]);

    const displayList = debouncedSearch
        ? searchResults
        : initialUsers.filter((f) => (f.fullName || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#181b22]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Nhắn tin mới</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-1.5 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm tên, @username bất kỳ..."
                        className="h-10 w-full rounded-2xl border border-blue-100 bg-blue-50/60 pl-9 pr-4 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5"
                    />
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                    {fetching ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : displayList.length === 0 ? (
                        <p className="py-4 text-center text-sm text-gray-400">Không tìm thấy người dùng</p>
                    ) : (
                        displayList.map((f) => (
                            <button
                                key={f._id}
                                type="button"
                                onClick={() => onSelect(f._id)}
                                disabled={loading}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-blue-50 disabled:opacity-60 dark:hover:bg-white/5"
                            >
                                <Avatar src={f.avatar} name={f.fullName} size="h-10 w-10" />
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-semibold">{f.fullName}</p>
                                    <p className="truncate text-xs text-gray-400">@{f.username}</p>
                                </div>
                                {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default NewChatModal;
