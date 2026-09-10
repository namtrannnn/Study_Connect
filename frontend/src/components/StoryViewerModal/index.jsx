import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    Send,
    Volume2,
    VolumeX,
    Loader2,
    Play,
    Pause,
} from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';
import { toast } from 'react-toastify';
import ConfirmModal from '../ConfirmModal';
import {
    viewStory,
    getStoryViewers,
    deleteStory,
    replyStory,
    deleteHighlight,
} from '../../services/story.services';

moment.locale('vi');

const EMOJI_REACTIONS = ['❤️', '🔥', '😮', '😂', '👏', '💯'];

/**
 * Unified & Reusable StoryViewerModal component
 * Supports modes:
 *  - feed: Multiple author groups (Dashboard)
 *  - highlight: Single highlight album (Profile)
 *  - archive: Personal historical archive (Profile)
 *  - active: Direct user active stories (Profile Avatar click)
 */
export default function StoryViewerModal({
    isOpen,
    onClose,
    mode = 'feed', // 'feed' | 'highlight' | 'archive' | 'active'
    feedGroups = [],
    initialAuthorId = null,
    highlight = null,
    stories = [],
    initialStoryIndex = 0,
    currentUser,
    onDeleteSuccess,
    onHighlightDeleted,
}) {
    const navigate = useNavigate();

    // Group & Story indices
    const [groupIndex, setGroupIndex] = useState(0);
    const [storyIndex, setStoryIndex] = useState(0);

    // Audio & Video controls
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Viewers modal state (for story owner)
    const [showViewersModal, setShowViewersModal] = useState(false);
    const [viewersData, setViewersData] = useState({ count: 0, list: [] });
    const [viewersPage, setViewersPage] = useState(1);
    const [hasMoreViewers, setHasMoreViewers] = useState(false);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const [loadingMoreViewers, setLoadingMoreViewers] = useState(false);

    // Interaction states (for non-owner on active stories)
    const [floatingEmojis, setFloatingEmojis] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Delete confirm modal state
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showConfirmDeleteHighlight, setShowConfirmDeleteHighlight] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const audioRef = useRef(null);
    const videoRef = useRef(null);

    // ── Build normalized feed structure ──
    const effectiveGroups = React.useMemo(() => {
        if (mode === 'feed' && feedGroups.length > 0) {
            return feedGroups;
        }
        if (mode === 'highlight' && highlight) {
            return [{ author: highlight.author || currentUser, stories: highlight.stories || [] }];
        }
        if (stories.length > 0) {
            const author = stories[0]?.author || highlight?.author || currentUser;
            return [{ author, stories }];
        }
        return [];
    }, [mode, feedGroups, highlight, stories, currentUser]);

    // Ref to track modal open state
    const prevIsOpenRef = useRef(false);

    // Reset when modal opens or input props change on open
    useEffect(() => {
        if (isOpen && (!prevIsOpenRef.current || mode === 'highlight' || mode === 'archive')) {
            if (mode === 'feed' && initialAuthorId && effectiveGroups.length > 0) {
                const idx = effectiveGroups.findIndex((g) => g.author?._id === initialAuthorId);
                setGroupIndex(idx !== -1 ? idx : 0);
                setStoryIndex(0);
            } else {
                setGroupIndex(0);
                setStoryIndex(initialStoryIndex || 0);
            }
            setProgress(0);
            setIsPaused(false);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, initialAuthorId, initialStoryIndex, mode]);

    const currentGroup = effectiveGroups[groupIndex];
    const currentStories = currentGroup?.stories || [];
    const currentStory = currentStories[storyIndex];

    const currentAuthor = currentStory?.author || currentGroup?.author || currentUser;
    const isOwnStory = currentAuthor?._id === currentUser?._id;

    // Normalizers for story data fields
    const mediaUrl = currentStory?.mediaUrl || currentStory?.media?.url || '';
    const mediaType =
        currentStory?.type === 'video' || currentStory?.media?.type === 'video'
            ? 'video'
            : (currentStory?.mediaUrl || currentStory?.media?.url)
            ? 'image'
            : 'text';
    const textContent = currentStory?.textContent || currentStory?.textOverlays?.[0]?.text || currentStory?.caption || '';
    const backgroundColor = currentStory?.backgroundColor || currentStory?.background?.color || 'linear-gradient(135deg, #6366f1, #a855f7)';
    const audioUrl = currentStory?.audio?.url || currentStory?.music?.url || '';
    const effectiveDurationSec =
        currentStory?.music?.duration || currentStory?.audio?.duration || currentStory?.duration || 5;

    // Record view for active stories
    const markAsViewed = useCallback(async (storyId) => {
        if (!storyId) return;
        try {
            await viewStory(storyId);
        } catch (err) {
            console.log('Error marking viewed:', err);
        }
    }, []);

    useEffect(() => {
        if (isOpen && currentStory && !isOwnStory && !currentStory.isViewed && (mode === 'feed' || mode === 'active')) {
            markAsViewed(currentStory._id);
        }
    }, [isOpen, currentStory, isOwnStory, markAsViewed, mode]);

    // Navigation handlers
    const handleNextStory = useCallback(() => {
        if (storyIndex < currentStories.length - 1) {
            setStoryIndex((prev) => prev + 1);
            setProgress(0);
        } else if (groupIndex < effectiveGroups.length - 1) {
            setGroupIndex((prev) => prev + 1);
            setStoryIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    }, [storyIndex, currentStories.length, groupIndex, effectiveGroups.length, onClose]);

    const handlePrevStory = useCallback(() => {
        if (storyIndex > 0) {
            setStoryIndex((prev) => prev - 1);
            setProgress(0);
        } else if (groupIndex > 0) {
            const prevGroupIdx = groupIndex - 1;
            setGroupIndex(prevGroupIdx);
            setStoryIndex((effectiveGroups[prevGroupIdx]?.stories?.length || 1) - 1);
            setProgress(0);
        }
    }, [storyIndex, groupIndex, effectiveGroups]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen || showViewersModal) return;
            if (e.key === 'ArrowRight') handleNextStory();
            if (e.key === 'ArrowLeft') handlePrevStory();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showViewersModal, handleNextStory, handlePrevStory, onClose]);

    // Audio playback control
    useEffect(() => {
        const audio = audioRef.current;
        if (!isOpen || !audioUrl || !audio) {
            if (audio) audio.pause();
            return;
        }

        const soundUrl = audioUrl.startsWith('http://') ? audioUrl.replace('http://', 'https://') : audioUrl;
        if (audio.src !== soundUrl) {
            audio.src = soundUrl;
        }
        audio.currentTime = currentStory?.music?.startTime || 0;
    }, [isOpen, storyIndex, audioUrl, currentStory?.music?.startTime]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!isOpen || !audioUrl || !audio) return;

        audio.muted = isMuted;
        if (!isPaused && !showViewersModal) {
            audio.play().catch(() => {});
        } else {
            audio.pause();
        }
    }, [isOpen, audioUrl, isPaused, showViewersModal, isMuted, storyIndex]);

    // Video playback control
    useEffect(() => {
        if (mediaType === 'video' && videoRef.current) {
            if (!isPaused && !showViewersModal && isOpen) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [mediaType, isPaused, showViewersModal, isOpen, storyIndex]);

    // Progress bar timer for Non-video Stories (Smooth 100ms interval)
    useEffect(() => {
        if (!isOpen || !currentStory || isPaused || showViewersModal || mediaType === 'video') return;

        const durationMs = effectiveDurationSec * 1000;
        const intervalMs = 100;
        const stepPct = (intervalMs / durationMs) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    handleNextStory();
                    return 0;
                }
                return prev + stepPct;
            });
        }, intervalMs);

        return () => clearInterval(timer);
    }, [isOpen, currentStory?._id, storyIndex, groupIndex, isPaused, showViewersModal, mediaType, effectiveDurationSec, handleNextStory]);

    // Viewers modal handler
    const handleOpenViewers = async () => {
        if (!currentStory?._id) return;
        setIsPaused(true);
        setShowViewersModal(true);
        setLoadingViewers(true);
        setViewersPage(1);
        try {
            const res = await getStoryViewers(currentStory._id, 1, 10);
            if (res.code === 200) {
                setViewersData({
                    count: res.data?.total || 0,
                    list: res.data?.viewers || [],
                });
                setHasMoreViewers(res.data?.hasMore || false);
            }
        } catch (err) {
            toast.error('Không thể tải danh sách người xem');
        } finally {
            setLoadingViewers(false);
        }
    };

    const handleLoadMoreViewers = async () => {
        if (loadingMoreViewers || !hasMoreViewers) return;
        try {
            setLoadingMoreViewers(true);
            const nextPage = viewersPage + 1;
            const res = await getStoryViewers(currentStory._id, nextPage, 10);
            if (res.code === 200) {
                setViewersData((prev) => ({
                    count: res.data?.total || prev.count,
                    list: [...prev.list, ...(res.data?.viewers || [])],
                }));
                setViewersPage(nextPage);
                setHasMoreViewers(res.data?.hasMore || false);
            }
        } catch (err) {
            toast.error('Không thể tải thêm người xem');
        } finally {
            setLoadingMoreViewers(false);
        }
    };

    // Reply & Emoji reaction handlers
    const handleSendReply = async (customContent = null) => {
        const content = customContent || replyText;
        if (!content || !content.trim() || !currentStory?._id) return;

        const isEmoji = EMOJI_REACTIONS.includes(content.trim());
        if (isEmoji) {
            const newFloating = Array.from({ length: 3 }).map((_, i) => ({
                id: Date.now() + Math.random() + i,
                emoji: content.trim(),
                left: 25 + Math.random() * 50,
                delay: i * 0.15,
            }));
            setFloatingEmojis((prev) => [...prev, ...newFloating]);
            setTimeout(() => {
                setFloatingEmojis((prev) => prev.filter((item) => !newFloating.includes(item)));
            }, 1800);
        }

        try {
            setSendingReply(true);
            const res = await replyStory(currentStory._id, content);
            if (res.code === 200 && !isEmoji) {
                toast.success('Đã gửi phản hồi');
                setReplyText('');
            }
        } catch (err) {
            if (!isEmoji) toast.error('Gửi phản hồi thất bại');
        } finally {
            setSendingReply(false);
        }
    };

    // Delete story handler
    const handleDeleteCurrentStory = async () => {
        if (!currentStory?._id) return;
        setDeleting(true);
        try {
            const res = await deleteStory(currentStory._id);
            if (res.code === 200) {
                toast.success('Đã xóa story');
                setShowConfirmDelete(false);
                if (onDeleteSuccess) onDeleteSuccess(currentStory._id);

                if (currentStories.length === 1) {
                    onClose();
                } else {
                    handleNextStory();
                }
            }
        } catch (err) {
            toast.error('Xóa story thất bại');
        } finally {
            setDeleting(false);
        }
    };

    // Delete highlight album handler
    const handleDeleteCurrentHighlight = async () => {
        if (!highlight?._id) return;
        setDeleting(true);
        try {
            const res = await deleteHighlight(highlight._id);
            if (res.code === 200) {
                toast.success('Đã xóa tin nổi bật!');
                if (onHighlightDeleted) onHighlightDeleted(highlight._id);
                onClose();
            }
        } catch (err) {
            toast.error('Xóa tin nổi bật thất bại');
        } finally {
            setDeleting(false);
            setShowConfirmDeleteHighlight(false);
        }
    };

    const handleContainerClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width * 0.35) {
            handlePrevStory();
        } else {
            handleNextStory();
        }
    };

    const handleBackdropClick = (e) => {
        const clickX = e.clientX;
        const halfWidth = window.innerWidth / 2;
        if (clickX < halfWidth) {
            handlePrevStory();
        } else {
            handleNextStory();
        }
    };

    if (!isOpen || !currentStory) return null;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                handleBackdropClick(e);
            }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md animate-fadeIn select-none cursor-pointer"
        >
            <audio ref={audioRef} loop hidden />

            {/* Left Nav Arrow (Desktop) */}
            {(storyIndex > 0 || groupIndex > 0) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrevStory();
                    }}
                    title="Story trước"
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-xl border border-white/10 cursor-pointer"
                >
                    <ChevronLeft size={28} />
                </button>
            )}

            {/* Right Nav Arrow (Desktop) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleNextStory();
                }}
                title="Story tiếp theo"
                className="absolute right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-xl border border-white/10 cursor-pointer"
            >
                <ChevronRight size={28} />
            </button>

            {/* Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute right-5 top-5 z-50 rounded-full bg-black/60 p-2.5 text-white/80 transition hover:bg-black hover:text-white hover:scale-110 cursor-pointer"
            >
                <X size={24} />
            </button>

            {/* CENTER 9:16 CANVAS CONTAINER */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    handleContainerClick(e);
                }}
                className="relative aspect-[9/16] h-full max-h-[92vh] w-full max-w-[450px] overflow-hidden rounded-xl bg-black cursor-pointer shadow-2xl"
            >
                {/* Paused indicator */}
                {isPaused && !showViewersModal && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white tracking-wider animate-fadeIn select-none pointer-events-none">
                        <Pause size={12} className="fill-white" /> ĐÃ TẠM DỪNG
                    </div>
                )}

                {/* Floating Emojis */}
                <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                    {floatingEmojis.map((item) => (
                        <span
                            key={item.id}
                            className="absolute bottom-16 text-3xl animate-floatUp opacity-0 drop-shadow-md"
                            style={{
                                left: `${item.left}%`,
                                animationDelay: `${item.delay}s`,
                            }}
                        >
                            {item.emoji}
                        </span>
                    ))}
                </div>

                {/* 1. Progress Bars */}
                <div className="absolute top-4 left-4 right-4 z-30 flex gap-1.5">
                    {currentStories.map((st, idx) => {
                        let widthPct = '0%';
                        if (idx < storyIndex) widthPct = '100%';
                        else if (idx === storyIndex) widthPct = `${progress}%`;

                        return (
                            <div key={st._id || idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30 backdrop-blur-md">
                                <div className="h-full bg-white shadow-sm transition-[width] duration-100 ease-linear" style={{ width: widthPct }} />
                            </div>
                        );
                    })}
                </div>

                {/* 2. Header: User Info & Controls */}
                <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 shadow-md">
                            <img
                                src={currentAuthor?.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                alt="avatar"
                                className="h-9 w-9 rounded-full object-cover border border-black"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-white drop-shadow">
                                <span>{currentAuthor?.fullName || 'Người dùng'}</span>
                                {highlight?.title && (
                                    <span className="rounded-full bg-indigo-500/80 px-2 py-0.5 font-semibold text-[10px] text-white backdrop-blur-sm">
                                        {highlight.title}
                                    </span>
                                )}
                                {mode === 'archive' && (
                                    <span className="rounded-full bg-indigo-500/80 px-2 py-0.5 font-semibold text-[10px] text-white backdrop-blur-sm">
                                        Kho lưu trữ
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] font-medium text-white/70">
                                {currentStory.createdAt ? moment(currentStory.createdAt).fromNow() : ''}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Pause / Play button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPaused((prev) => !prev);
                            }}
                            className="rounded-full bg-black/40 p-2 text-white backdrop-blur-xl border border-white/15 hover:scale-110 hover:bg-black/60 transition cursor-pointer"
                        >
                            {isPaused ? <Play size={16} className="fill-white ml-0.5 text-white" /> : <Pause size={16} />}
                        </button>

                        {/* Mute button */}
                        {(audioUrl || mediaType === 'video') && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMuted(!isMuted);
                                }}
                                className="rounded-full bg-black/40 p-2 text-white backdrop-blur-xl border border-white/15 hover:scale-110 hover:bg-black/60 transition cursor-pointer"
                            >
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-pink-400" />}
                            </button>
                        )}

                        {/* Delete Story button (Owner) */}
                        {isOwnStory && mode !== 'highlight' && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsPaused(true);
                                    setShowConfirmDelete(true);
                                }}
                                className="rounded-full bg-black/40 p-2 text-red-400 backdrop-blur-xl border border-white/15 hover:scale-110 hover:bg-red-500/20 transition cursor-pointer"
                                title="Xóa story"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        {/* Delete Highlight Album button (Owner) */}
                        {isOwnStory && mode === 'highlight' && highlight?._id && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsPaused(true);
                                    setShowConfirmDeleteHighlight(true);
                                }}
                                className="rounded-full bg-black/40 p-2 text-red-400 backdrop-blur-xl border border-white/15 hover:scale-110 hover:bg-red-500/20 transition cursor-pointer"
                                title="Xóa tin nổi bật"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Media Render */}
                {mediaType === 'image' && (
                    <img src={mediaUrl} alt="story" className="h-full w-full object-cover" />
                )}

                {mediaType === 'video' && (
                    <video
                        ref={videoRef}
                        src={mediaUrl}
                        playsInline
                        muted={isMuted}
                        onTimeUpdate={(e) => {
                            const vid = e.currentTarget;
                            if (vid.duration) {
                                setProgress((vid.currentTime / vid.duration) * 100);
                            }
                        }}
                        onEnded={handleNextStory}
                        className="h-full w-full object-cover"
                    />
                )}

                {mediaType === 'text' && (
                    <div
                        className="flex h-full w-full items-center justify-center p-8 text-center font-bold text-2xl"
                        style={{ background: backgroundColor, color: '#ffffff' }}
                    >
                        {textContent}
                    </div>
                )}

                {/* 4. Footer Bar */}
                {/* Case A: Story Owner -> Viewers count button */}
                {isOwnStory && (
                    <div className="absolute bottom-4 left-4 z-30">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenViewers();
                            }}
                            className="flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/20 hover:bg-black/75 transition cursor-pointer"
                        >
                            <Eye size={15} />
                            <span>{currentStory.viewersCount || viewersData.count || 0} người xem</span>
                        </button>
                    </div>
                )}

                {/* Case B: Non-Owner on Active Story -> Reply bar & Emojis */}
                {!isOwnStory && (mode === 'feed' || mode === 'active') && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-4 left-4 right-4 z-30 flex flex-col gap-2"
                    >
                        <div className="flex items-center justify-between px-1">
                            {EMOJI_REACTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleSendReply(emoji)}
                                    className="text-2xl hover:scale-130 active:scale-90 transition-transform duration-150 drop-shadow cursor-pointer"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSendReply();
                                }}
                                onFocus={() => setIsPaused(true)}
                                onBlur={() => setIsPaused(false)}
                                placeholder={`Gửi phản hồi cho ${currentAuthor?.fullName || 'tác giả'}...`}
                                className="flex-1 rounded-full bg-black/40 px-4 py-2.5 text-xs text-white placeholder-white/60 backdrop-blur-md border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/50"
                            />
                            {replyText.trim() && (
                                <button
                                    type="button"
                                    onClick={() => handleSendReply()}
                                    disabled={sendingReply}
                                    className="rounded-full bg-indigo-600 p-2.5 text-white shadow-md hover:bg-indigo-500 transition cursor-pointer"
                                >
                                    <Send size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 5. Viewers Modal Popup */}
            {showViewersModal && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowViewersModal(false);
                        setIsPaused(false);
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#18181b] text-slate-900 dark:text-white p-5 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[60vh] animate-scaleUp"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                            <div className="flex items-center gap-2 font-bold text-sm">
                                <Eye size={16} className="text-indigo-500" />
                                <span>Người xem ({viewersData.count})</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowViewersModal(false);
                                    setIsPaused(false);
                                }}
                                className="rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-3 space-y-3">
                            {loadingViewers ? (
                                <div className="flex justify-center py-6 text-slate-400">
                                    <Loader2 className="animate-spin" size={20} />
                                </div>
                            ) : viewersData.list.length === 0 ? (
                                <div className="text-center py-6 text-xs text-slate-400">Chưa có người xem nào</div>
                            ) : (
                                viewersData.list.map((item, idx) => {
                                    const viewerUser = item.user || item;
                                    return (
                                        <div
                                            key={viewerUser._id || idx}
                                            onClick={() => {
                                                setShowViewersModal(false);
                                                onClose();
                                                navigate(`/profile/${viewerUser.username || viewerUser._id}`);
                                            }}
                                            className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded-xl transition cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={viewerUser.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                                    alt={viewerUser.fullName}
                                                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10"
                                                />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                                                        {viewerUser.fullName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        @{viewerUser.username || 'user'}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                                {item.viewedAt ? moment(item.viewedAt).fromNow() : ''}
                                            </span>
                                        </div>
                                    );
                                })
                            )}

                            {hasMoreViewers && (
                                <button
                                    type="button"
                                    onClick={handleLoadMoreViewers}
                                    disabled={loadingMoreViewers}
                                    className="w-full text-center text-xs font-semibold text-indigo-500 py-1 cursor-pointer"
                                >
                                    {loadingMoreViewers ? 'Đang tải...' : 'Xem thêm'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Story Modal */}
            <ConfirmModal
                isOpen={showConfirmDelete}
                onClose={() => setShowConfirmDelete(false)}
                onConfirm={handleDeleteCurrentStory}
                title="Xóa story này"
                message="Bạn có chắc chắn muốn xóa story này? Thao tác này không thể hoàn tác."
                confirmText="Xóa Story"
                confirmColor="red"
                isLoading={deleting}
            />

            {/* Confirm Delete Highlight Album Modal */}
            <ConfirmModal
                isOpen={showConfirmDeleteHighlight}
                onClose={() => setShowConfirmDeleteHighlight(false)}
                onConfirm={handleDeleteCurrentHighlight}
                title="Xóa Album Tin Nổi Bật"
                message={`Bạn có chắc chắn muốn xóa album "${highlight?.title}"? Các story gốc trong kho lưu trữ sẽ không bị ảnh hưởng.`}
                confirmText="Xóa Album"
                confirmColor="red"
                isLoading={deleting}
            />
        </div>
    );
}
