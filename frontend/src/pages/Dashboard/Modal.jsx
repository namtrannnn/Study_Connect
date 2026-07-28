import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    ImagePlus,
    Sparkles,
    Globe2,
    Users,
    Lock,
    Loader2,
    Trash2,
    Settings2,
    MessageCircleOff,
    EyeOff,
    Share2,
    MapPin,
    UserCheck,
    Pencil,
} from 'lucide-react';
import { toast } from 'react-toastify';

import * as PostServices from '../../services/posts.services';
import * as UserServices from '../../services/user.services';
import VisibilitySelector from '../../components/VisibilitySelector';


const VISIBILITIES = [
    {
        value: 'public',
        label: 'Công khai',
        icon: Globe2,
    },
    {
        value: 'followers',
        label: 'Người theo dõi',
        icon: Users,
    },
    {
        value: 'friends',
        label: 'Bạn bè (Mutual follow)',
        icon: Users,
    },
    {
        value: 'private',
        label: 'Chỉ mình tôi',
        icon: Lock,
    },
    {
        value: 'custom',
        label: 'Tùy chỉnh',
        icon: UserCheck,
    },
];

function Modal({ setOpenModal, user, onCreated, mode = 'create', post, onUpdated }) {
    const isEdit = mode === 'edit';

    const [caption, setCaption] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState('');
    // Ảnh cũ đã có trên server (chỉ dùng ở mode edit)
    const [existingMedia, setExistingMedia] = useState([]);
    const [selectedMentions, setSelectedMentions] = useState([]);
    const [mentionKeyword, setMentionKeyword] = useState('');
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [selectedCustomUsers, setSelectedCustomUsers] = useState([]);
    const [allowedUsersText, setAllowedUsersText] = useState('');

    const [allowComments, setAllowComments] = useState(true);
    const [hideLikeCount, setHideLikeCount] = useState(false);
    const [hideShare, setHideShare] = useState(false);

    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Điền dữ liệu cũ khi ở mode edit
    useEffect(() => {
        if (!isEdit || !post) return;

        setCaption(post.caption || post.content || '');
        setVisibility(post.visibility || post.privacy || 'public');
        setLocation(post.location || '');
        setAllowComments(post.allowComments ?? true);
        setHideLikeCount(post.hideLikeCount ?? false);
        setHideShare(post.hideShare ?? false);
        setImages([]);
        // Load ảnh cũ đã có trên server
        setExistingMedia(Array.isArray(post.media) ? post.media : []);
    }, [isEdit, post]);
    const selectedVisibility = VISIBILITIES.find((item) => item.value === visibility);
    const SelectedVisibilityIcon = selectedVisibility?.icon || Globe2;

    useEffect(() => {
        if (!showMentionSuggestions) {
            setMentionSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await UserServices.searchUsers({
                    keyword: mentionKeyword,
                    scope: 'mention',
                    limit: 10,
                });

                setMentionSuggestions(res?.data || []);
            } catch (error) {
                console.log('Search mention error:', error);
                setMentionSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [mentionKeyword, showMentionSuggestions]);

    const handleClose = () => {
        if (loading) return;
        setOpenModal(false);
    };
    const handleSelectMention = (selectedUser) => {
        const username = selectedUser.username || '';
        const userId = selectedUser._id || selectedUser.id;

        if (!userId || !username) return;

        setCaption((prev) => {
            const words = prev.split(/\s/);
            words[words.length - 1] = `@${username}`;
            return `${words.join(' ')} `;
        });

        setSelectedMentions((prev) => {
            const existed = prev.some((item) => {
                const id = item._id || item.id;
                return id === userId;
            });

            if (existed) return prev;

            return [...prev, selectedUser];
        });

        setMentionKeyword('');
        setMentionSuggestions([]);
        setShowMentionSuggestions(false);
    };
    const handleCaptionChange = (value) => {
        setCaption(value);

        const words = value.split(/\s/);
        const lastWord = words[words.length - 1];

        // Gõ @ hoặc @n đều mở mention dropdown
        if (lastWord.startsWith('@')) {
            const keyword = lastWord.slice(1);

            setMentionKeyword(keyword);
            setShowMentionSuggestions(true);
            return;
        }

        setMentionKeyword('');
        setShowMentionSuggestions(false);
        setMentionSuggestions([]);
    };

    const handleSelectImages = (e) => {
        const files = Array.from(e.target.files || []);

        if (files.length + images.length > 10) {
            toast.error('Một bài viết chỉ được tối đa 10 ảnh');
            return;
        }

        setImages((prev) => [...prev, ...files]);
        e.target.value = '';
    };

    const handleRemoveImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const parseIdList = (text) => {
        return text
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    };
    const validateForm = () => {
        if (!caption.trim() && images.length === 0) {
            toast.error('Vui lòng nhập nội dung hoặc thêm ảnh');
            return false;
        }
        return true;
    };
    const renderCaptionHighlight = (text = '') => {
        if (!text) return null;

        const parts = text.split(/(@[a-zA-Z0-9._-]+)/g);

        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                return (
                    <span key={index} className="font-semibold text-blue-600 dark:text-blue-400">
                        {part}
                    </span>
                );
            }

            return <span key={index}>{part}</span>;
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const formData = new FormData();

            formData.append('postType', 'normal');
            formData.append('caption', caption);
            formData.append('location', location);
            formData.append('visibility', visibility);

            formData.append('allowComments', String(allowComments));
            formData.append('hideLikeCount', String(hideLikeCount));
            formData.append('hideShare', String(hideShare));

            if (!isEdit) {
                const mentions = selectedMentions
                    .filter((item) => {
                        const username = item.username || '';
                        return username && caption.includes(`@${username}`);
                    })
                    .map((item) => item._id || item.id)
                    .filter(Boolean);

                const allowedUsers = visibility === 'custom' ? selectedCustomUsers.map((u) => u._id || u.id).filter(Boolean) : [];
                formData.append('mentions', JSON.stringify(mentions));
                formData.append('allowedUsers', JSON.stringify(allowedUsers));
            }

            images.forEach((image) => {
                formData.append('images', image);
            });

            if (isEdit) {
                // Chỉnh sửa bài viết
                const postId = post?._id || post?.id;
                const res = await PostServices.editPost(postId, formData);

                if (res.code === 200) {
                    toast.success(res.message || 'Cập nhật bài viết thành công');
                    onUpdated?.(res.data);
                    setOpenModal(false);
                } else {
                    toast.error(res.message || 'Không thể cập nhật bài viết');
                }
            } else {
                // Tạo bài viết mới
                const res = await PostServices.createPost(formData);

                if (res.code === 201) {
                    toast.success(res.message || 'Tạo bài viết thành công');
                    onCreated?.(res.data);

                    // Reset form
                    setCaption('');
                    setImages([]);
                    setVisibility('public');
                    setLocation('');
                    setShowMentionSuggestions(false);
                    setSelectedMentions([]);
                    setAllowedUsersText('');
                    setAllowComments(true);
                    setHideLikeCount(false);
                    setHideShare(false);
                    setShowAdvancedOptions(false);
                    setOpenModal(false);
                } else {
                    toast.error(res.message || 'Tạo bài viết thất bại');
                }
            }
        } catch (error) {
            console.log('Submit post error:', error);
            toast.error(error?.response?.data?.message || (isEdit ? 'Không thể cập nhật bài viết' : 'Tạo bài viết thất bại'));
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-3 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17191f]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />
                <div className="flex max-h-[92vh] flex-col">
                    <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#17191f]/90">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                                        {isEdit ? <Pencil size={20} /> : <Sparkles size={20} />}
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {isEdit ? 'Chỉnh sửa bài viết' : 'Có gì mới?'}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {isEdit ? 'Cập nhật nội dung hoặc cài đặt hiển thị' : 'Chia sẻ suy nghĩ, ảnh hoặc khoảnh khắc của bạn'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="custom-modal-scroll overflow-y-auto px-5 py-5">
                        <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-white/10 dark:from-white/5 dark:to-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <img
                                    src={user?.avatar || 'https://i.pravatar.cc/150?img=3'}
                                    alt="avatar"
                                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white shadow-md dark:ring-white/10"
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-semibold text-gray-900 dark:text-white">
                                        {user?.fullName || user?.username || 'Người dùng'}
                                    </div>

                                    <div className="mt-1">
                                        <VisibilitySelector
                                            value={visibility}
                                            onChange={setVisibility}
                                            selectedCustomUsers={selectedCustomUsers}
                                            onCustomUsersChange={setSelectedCustomUsers}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="relative mt-4">
                                <div className="relative min-h-[100px] overflow-hidden rounded-2xl border border-gray-200 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b]">
                                    {/* Lớp hiển thị text màu xanh cho @mention */}
                                    <div className="pointer-events-none absolute inset-0 min-h-[100px] whitespace-pre-wrap break-words px-4 py-3 text-[15px] leading-6 text-gray-900 dark:text-white">
                                        {caption ? (
                                            renderCaptionHighlight(caption)
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">
                                                {`${user?.fullName || 'Bạn'} ơi, hôm nay bạn muốn chia sẻ điều gì? Gõ @ để nhắc tên`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Textarea thật để nhập, nhưng chữ transparent */}
                                    <textarea
                                        value={caption}
                                        onChange={(e) => handleCaptionChange(e.target.value)}
                                        rows={3}
                                        className="relative z-10 min-h-[100px] w-full resize-none border-none bg-transparent px-4 py-3 text-[15px] leading-6 text-transparent caret-gray-900 outline-none placeholder:text-transparent focus:outline-none dark:caret-white"
                                    />
                                </div>

                                {showMentionSuggestions && mentionSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-[99999] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#20232b]">
                                        {mentionSuggestions.map((item) => (
                                            <button
                                                key={item._id || item.id}
                                                type="button"
                                                onClick={() => handleSelectMention(item)}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/10"
                                            >
                                                <img
                                                    src={item.avatar || 'https://i.pravatar.cc/150?img=3'}
                                                    alt="avatar"
                                                    className="h-9 w-9 rounded-full object-cover"
                                                />

                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                        {item.fullName || item.username || 'Người dùng'}
                                                    </div>
                                                    <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                                        @{item.username || item.email}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedMentions.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedMentions.map((item) => {
                                            const id = item._id || item.id;

                                            return (
                                                <span
                                                    key={id}
                                                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                                                >
                                                    @{item.username || item.fullName}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedMentions((prev) =>
                                                                prev.filter((user) => (user._id || user.id) !== id),
                                                            )
                                                        }
                                                        className="text-blue-500 hover:text-red-500"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Nút bật/tắt Tùy chọn nâng cao nhỏ gọn */}
                        <div className="mt-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setShowAdvancedOptions((prev) => !prev)}
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                    showAdvancedOptions
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10'
                                }`}
                            >
                                <Settings2 size={15} />
                                <span>Tùy chọn nâng cao</span>
                            </button>
                        </div>

                            {showAdvancedOptions && (
                                <div className="mt-3 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                    <div className="relative">
                                        <MapPin
                                            size={17}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                        <input
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Vị trí, ví dụ: TP. Hồ Chí Minh"
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <div 
                                            onClick={() => setAllowComments(!allowComments)}
                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 transition hover:bg-gray-100 dark:border-white/10 dark:bg-[#20232b] dark:hover:bg-white/10"
                                        >
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                    <MessageCircleOff size={15} className="text-blue-500" />
                                                    Bình luận
                                                </div>
                                                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                    {allowComments ? 'Đang bật' : 'Đang tắt'}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={allowComments}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAllowComments(!allowComments);
                                                }}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    allowComments ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/20'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                                        allowComments ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        <div 
                                            onClick={() => setHideLikeCount(!hideLikeCount)}
                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 transition hover:bg-gray-100 dark:border-white/10 dark:bg-[#20232b] dark:hover:bg-white/10"
                                        >
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                    <EyeOff size={15} className="text-purple-500" />
                                                    Ẩn lượt thích
                                                </div>
                                                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                    {hideLikeCount ? 'Sẽ ẩn' : 'Đang hiện'}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={hideLikeCount}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setHideLikeCount(!hideLikeCount);
                                                }}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    hideLikeCount ? 'bg-purple-600' : 'bg-gray-300 dark:bg-white/20'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                                        hideLikeCount ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        <div 
                                            onClick={() => setHideShare(!hideShare)}
                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 transition hover:bg-gray-100 dark:border-white/10 dark:bg-[#20232b] dark:hover:bg-white/10"
                                        >
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                    <Share2 size={15} className="text-cyan-500" />
                                                    Ẩn chia sẻ
                                                </div>
                                                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                    {hideShare ? 'Sẽ ẩn' : 'Đang hiện'}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={hideShare}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setHideShare(!hideShare);
                                                }}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    hideShare ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-white/20'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                                        hideShare ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        <div className="mt-5 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                                <ImagePlus size={20} />
                                Thêm ảnh vào bài viết
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleSelectImages}
                                    className="hidden"
                                />
                            </label>

                            {/* Ảnh cũ (chỉ hiện ở mode edit) */}
                            {isEdit && existingMedia.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {existingMedia.map((media, index) => (
                                        <div
                                            key={media.public_id || media.url || index}
                                            className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/10"
                                        >
                                            <img
                                                src={media.url || media}
                                                alt={`existing-${index}`}
                                                className="h-32 w-full object-cover transition group-hover:scale-105"
                                            />
                                            <div className="absolute bottom-1 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                                                Ảnh hiện tại
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setExistingMedia((prev) => prev.filter((_, i) => i !== index))}
                                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Ảnh mới upload */}
                            {images.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {images.map((image, index) => (
                                        <div
                                            key={`${image.name}-${index}`}
                                            className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/10"
                                        >
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt="preview"
                                                className="h-32 w-full object-cover transition group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition hover:bg-red-600"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 -mx-5 mt-5 border-t border-gray-100 bg-white/90 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#17191f]/90">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading && <Loader2 size={18} className="animate-spin" />}
                                {loading ? (isEdit ? 'Đang lưu...' : 'Đang đăng bài...') : (isEdit ? 'Lưu thay đổi' : 'Đăng bài')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default Modal;
