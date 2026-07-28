import { useState, useRef, useEffect } from 'react';
import {
    Globe2,
    Users,
    UserCheck,
    Lock,
    ChevronDown,
    Check,
    X,
    Search,
    UserPlus,
} from 'lucide-react';
import * as UserServices from '../../services/user.services';

const VISIBILITY_OPTIONS = [
    {
        value: 'public',
        label: 'Công khai',
        desc: 'Bất kỳ ai trên StudyConnect',
        icon: Globe2,
        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/15',
    },
    {
        value: 'followers',
        label: 'Người theo dõi',
        desc: 'Những người đang theo dõi bạn',
        icon: Users,
        color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/15',
    },
    {
        value: 'friends',
        label: 'Bạn bè (Mutual)',
        desc: 'Người theo dõi qua lại với bạn',
        icon: UserCheck,
        color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/15',
    },
    {
        value: 'custom',
        label: 'Tùy chọn người xem',
        desc: 'Chỉ những người cụ thể được chọn',
        icon: UserPlus,
        color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/15',
    },
    {
        value: 'private',
        label: 'Chỉ mình tôi',
        desc: 'Chỉ riêng bạn có thể xem bài viết',
        icon: Lock,
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/15',
    },
];

export default function VisibilitySelector({
    value = 'public',
    onChange,
    selectedCustomUsers = [],
    onCustomUsersChange,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const containerRef = useRef(null);

    const currentOption = VISIBILITY_OPTIONS.find((opt) => opt.value === value) || VISIBILITY_OPTIONS[0];
    const CurrentIcon = currentOption.icon;

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search users for Custom visibility (searches followers/following)
    useEffect(() => {
        if (value !== 'custom' || !searchKeyword.trim()) {
            setUserSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearching(true);
                const res = await UserServices.searchUsers({
                    keyword: searchKeyword.trim(),
                    limit: 8,
                });
                setUserSuggestions(res?.data || []);
            } catch {
                setUserSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchKeyword, value]);

    const handleSelectOption = (optValue) => {
        onChange?.(optValue);
        setIsOpen(false);
    };

    const handleAddUser = (user) => {
        const userId = user._id || user.id;
        if (!userId) return;

        const exists = selectedCustomUsers.some(
            (u) => (u._id || u.id) === userId
        );

        if (!exists) {
            onCustomUsersChange?.([...selectedCustomUsers, user]);
        }
        setSearchKeyword('');
        setUserSuggestions([]);
    };

    const handleRemoveUser = (userId) => {
        onCustomUsersChange?.(
            selectedCustomUsers.filter((u) => (u._id || u.id) !== userId)
        );
    };

    return (
        <div ref={containerRef} className="relative inline-block w-full text-left">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
            >
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${currentOption.color}`}>
                    <CurrentIcon size={12} />
                </div>
                <span>{currentOption.label}</span>
                <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 top-full z-[99999] mt-2 w-72 origin-top-left rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#1e2029]">
                    <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Ai có thể xem bài viết này?
                    </div>

                    <div className="space-y-0.5">
                        {VISIBILITY_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isSelected = opt.value === value;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelectOption(opt.value)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                                        isSelected
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${opt.color}`}>
                                        <Icon size={16} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold">{opt.label}</div>
                                        <div className="truncate text-[11px] opacity-70">{opt.desc}</div>
                                    </div>

                                    {isSelected && <Check size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Custom User Picker Panel (Automatically opens below when "custom" is selected) */}
            {value === 'custom' && (
                <div className="mt-3 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 p-3.5 dark:border-purple-500/20 dark:from-purple-950/20 dark:via-white/5 dark:to-indigo-950/20">
                    <div className="mb-2 text-xs font-bold text-gray-900 dark:text-white">
                        Chọn người được phép xem bài viết
                    </div>

                    {/* Selected Users Chips */}
                    {selectedCustomUsers.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                            {selectedCustomUsers.map((u) => {
                                const uId = u._id || u.id;
                                return (
                                    <span
                                        key={uId}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                                    >
                                        <img
                                            src={u.avatar || 'https://i.pravatar.cc/150?img=3'}
                                            alt="avatar"
                                            className="h-4 w-4 rounded-full object-cover"
                                        />
                                        {u.fullName || u.username}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(uId)}
                                            className="rounded-full hover:text-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="Nhập tên hoặc @username người theo dõi..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-white/10 dark:bg-[#1f222e] dark:text-white"
                        />
                    </div>

                    {/* Suggestions list */}
                    {userSuggestions.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1f222e]">
                            {userSuggestions.map((u) => (
                                <button
                                    key={u._id || u.id}
                                    type="button"
                                    onClick={() => handleAddUser(u)}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    <img
                                        src={u.avatar || 'https://i.pravatar.cc/150?img=3'}
                                        alt="avatar"
                                        className="h-6 w-6 rounded-full object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-semibold text-gray-900 dark:text-white">
                                            {u.fullName || u.username}
                                        </div>
                                        <div className="truncate text-[10px] text-gray-400">
                                            @{u.username}
                                        </div>
                                    </div>
                                    <UserPlus size={14} className="text-purple-500 shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
