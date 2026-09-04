import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    Send,
    Volume2,
    VolumeX,
    UserCheck,
} from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';
import { toast } from 'react-toastify';
import { viewStory, getStoryViewers, deleteStory, replyStory } from '../../services/story.services';

moment.locale('vi');

const EMOJI_REACTIONS = ['❤️', '🔥', '😮', '😂', '👏', '💯'];

function StoryViewerModal({ isOpen, onClose, feedGroups = [], initialAuthorId = null, currentUser, onDeleteSuccess }) {
    const [groupIndex, setGroupIndex] = useState(0);
    const [storyIndex, setStoryIndex] = useState(0);

    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef(null);
    const videoRef = useRef(null);

    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const [showViewersModal, setShowViewersModal] = useState(false);
    const [viewersData, setViewersData] = useState({ count: 0, list: [] });
    const [loadingViewers, setLoadingViewers] = useState(false);

    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        if (isOpen && initialAuthorId && feedGroups.length > 0) {
            const idx = feedGroups.findIndex((g) => g.author?._id === initialAuthorId);
            if (idx !== -1) {
                setGroupIndex(idx);
                setStoryIndex(0);
            }
        }
    }, [isOpen, initialAuthorId, feedGroups]);

    const currentGroup = feedGroups[groupIndex];
    const currentStories = currentGroup?.stories || [];
    const currentStory = currentStories[storyIndex];
    const isOwnStory = currentGroup?.author?._id === currentUser?._id;

    const markAsViewed = useCallback(async (storyId) => {
        if (!storyId) return;
        try {
            await viewStory(storyId);
        } catch (err) {
            console.log('Error marking viewed:', err);
        }
    }, []);

    const handleNextStory = useCallback(() => {
        if (storyIndex < currentStories.length - 1) {
            setStoryIndex((prev) => prev + 1);
            setProgress(0);
        } else if (groupIndex < feedGroups.length - 1) {
            setGroupIndex((prev) => prev + 1);
            setStoryIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    }, [storyIndex, currentStories.length, groupIndex, feedGroups.length, onClose]);

    const handlePrevStory = useCallback(() => {
        if (storyIndex > 0) {
            setStoryIndex((prev) => prev - 1);
            setProgress(0);
        } else if (groupIndex > 0) {
            const prevGroupIdx = groupIndex - 1;
            setGroupIndex(prevGroupIdx);
            setStoryIndex((feedGroups[prevGroupIdx]?.stories?.length || 1) - 1);
            setProgress(0);
        }
    }, [storyIndex, groupIndex, feedGroups]);

    useEffect(() => {
        if (currentStory && !isOwnStory && !currentStory.isViewed) {
            markAsViewed(currentStory._id);
        }
    }, [currentStory, isOwnStory, markAsViewed]);

    useEffect(() => {
        if (!isOpen || !currentStory || isPaused || showViewersModal) return;

        // Video stories handle progress via HTML5 video timeupdate & ended events
        if (currentStory.media?.type === 'video') return;

        const durationMs = 5000;
        const interval = 50;
        const stepPct = (interval / durationMs) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    handleNextStory();
                    return 0;
                }
                return prev + stepPct;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [isOpen, currentStory, isPaused, showViewersModal, handleNextStory]);

    // Handle play/pause for video element
    useEffect(() => {
        if (currentStory?.media?.type === 'video' && videoRef.current) {
            if (!isPaused && !showViewersModal) {
                videoRef.current.play().catch((err) => console.log('Video play error:', err));
            } else {
                videoRef.current.pause();
            }
        }
    }, [currentStory, isPaused, showViewersModal]);

    useEffect(() => {
        if (!isOpen || !currentStory?.music?.url) {
            if (audioRef.current) audioRef.current.pause();
            return;
        }

        const audio = audioRef.current;
        if (audio) {
            const soundUrl = currentStory.music.url.startsWith('http://')
                ? currentStory.music.url.replace('http://', 'https://')
                : currentStory.music.url;

            if (audio.src !== soundUrl) {
                audio.src = soundUrl;
            }

            audio.currentTime = currentStory.music.startTime || 0;
            audio.muted = isMuted;

            if (!isPaused && !showViewersModal) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => console.log('Autoplay music blocked:', err));
                }
            } else {
                audio.pause();
            }
        }
    }, [isOpen, currentStory, isPaused, showViewersModal, isMuted]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'ArrowRight') handleNextStory();
            if (e.key === 'ArrowLeft') handlePrevStory();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleNextStory, handlePrevStory, onClose]);

    if (!isOpen || !currentStory) return null;

    const handleOpenViewers = async () => {
        setIsPaused(true);
        setShowViewersModal(true);
        setLoadingViewers(true);
        try {
            const res = await getStoryViewers(currentStory._id);
            if (res.code === 200) {
                setViewersData({
                    count: res.data.viewersCount || 0,
                    list: res.data.viewers || [],
                });
            }
        } catch (err) {
            console.log('Get viewers error:', err);
        } finally {
            setLoadingViewers(false);
        }
    };

    const handleDeleteStory = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa story này?')) return;
        try {
            const res = await deleteStory(currentStory._id);
            if (res.code === 200) {
                toast.success('Đã xóa story thành công');
                onDeleteSuccess?.(currentStory._id);
                handleNextStory();
            } else {
                toast.error(res.message || 'Không thể xóa story');
            }
        } catch (err) {
            toast.error('Lỗi khi xóa story');
        }
    };

    const handleSendReply = async (textToSend) => {
        const content = textToSend || replyText;
        if (!content.trim()) return;

        try {
            setSendingReply(true);
            const res = await replyStory(currentStory._id, content);
            if (res.code === 200) {
                toast.success('Đã gửi phản hồi story!');
                setReplyText('');
            } else {
                toast.error(res.message || 'Không thể phản hồi story');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Gửi phản hồi thất bại');
        } finally {
            setSendingReply(false);
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

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md animate-fadeIn select-none"
        >
            <audio ref={audioRef} loop hidden />

            {/* Left Nav Arrow */}
            {groupIndex > 0 || storyIndex > 0 ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrevStory();
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-xl border border-white/10"
                >
                    <ChevronLeft size={28} />
                </button>
            ) : null}

            {/* Right Nav Arrow */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleNextStory();
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-xl border border-white/10"
            >
                <ChevronRight size={28} />
            </button>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute right-5 top-5 z-50 rounded-full bg-black/60 p-2.5 text-white/80 transition hover:bg-black hover:text-white hover:scale-110"
            >
                <X size={24} />
            </button>

            {/* CENTER 9:16 CONTAINER */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    handleContainerClick(e);
                }}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
                className="relative aspect-[9/16] h-full max-h-[88vh] w-full max-w-[410px] overflow-hidden rounded-[2.5rem] shadow-[0_0_90px_rgba(0,0,0,0.9)] border border-white/15 bg-black cursor-pointer"
                style={{
                    background: currentStory.background?.type === 'color' ? currentStory.background.color : '#000000',
                }}
            >
                {/* 1. PROGRESS BARS */}
                <div className="absolute top-4 left-4 right-4 z-30 flex gap-1.5">
                    {currentStories.map((st, idx) => {
                        let widthPct = '0%';
                        if (idx < storyIndex) widthPct = '100%';
                        else if (idx === storyIndex) widthPct = `${progress}%`;

                        return (
                            <div key={st._id || idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30 backdrop-blur-md">
                                <div
                                    className="h-full bg-white shadow-sm transition-all duration-75 ease-linear"
                                    style={{ width: widthPct }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* 2. HEADER USER INFO */}
                <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 shadow-md">
                            <img
                                src={currentGroup?.author?.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                alt="avatar"
                                className="h-9 w-9 rounded-full object-cover border border-black"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-white drop-shadow-md">
                                {currentGroup?.author?.fullName || 'Người dùng'}
                            </div>
                            <div className="text-[11px] font-medium text-white/70 drop-shadow">
                                {moment(currentStory.createdAt).fromNow()}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {currentStory.music?.url && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMuted(!isMuted);
                                }}
                                className="rounded-full bg-black/50 p-2 text-white backdrop-blur-xl border border-white/10 hover:scale-110 transition"
                            >
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-pink-400 animate-pulse" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. MEDIA CONTENT */}
                {currentStory.background?.type !== 'color' && currentStory.media?.url && (
                    currentStory.media.type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={currentStory.media.url}
                            autoPlay
                            playsInline
                            muted={isMuted}
                            onTimeUpdate={(e) => {
                                const vid = e.currentTarget;
                                if (vid.duration) {
                                    setProgress((vid.currentTime / vid.duration) * 100);
                                }
                            }}
                            onEnded={() => {
                                handleNextStory();
                            }}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <img src={currentStory.media.url} alt="story" className="h-full w-full object-cover" />
                    )
                )}

                {/* 4. TEXT OVERLAYS */}
                {currentStory.textOverlays?.map((item, idx) => (
                    <div
                        key={idx}
                        style={{
                            left: `${item.position?.x || 50}%`,
                            top: `${item.position?.y || 50}%`,
                            transform: 'translate(-50%, -50%)',
                            fontFamily: item.fontFamily,
                            fontSize: `${item.fontSize || 24}px`,
                            color: item.color || '#ffffff',
                            fontWeight: item.isBold ? 'bold' : 'normal',
                            fontStyle: item.isItalic ? 'italic' : 'normal',
                            textShadow: '0 2px 12px rgba(0,0,0,0.85)',
                        }}
                        className="absolute text-center select-none px-3 py-1 rounded-xl backdrop-blur-[1px]"
                    >
                        {item.text}
                    </div>
                ))}

                {/* MUSIC BADGE AT BOTTOM */}
                {currentStory.music?.title && (
                    <div className="absolute bottom-20 left-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 backdrop-blur-xl border border-white/15 text-xs shadow-lg">
                        <Volume2 size={14} className="text-pink-400 animate-pulse" />
                        <span className="font-semibold text-white truncate max-w-[170px]">
                            {currentStory.music.title} • <span className="text-white/60 font-normal">{currentStory.music.artist}</span>
                        </span>
                    </div>
                )}

                {/* 5. FOOTER */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-0 left-0 right-0 z-30 flex flex-col gap-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 pt-10"
                >
                    {isOwnStory ? (
                        <div className="flex w-full items-center justify-between">
                            <button
                                type="button"
                                onClick={handleOpenViewers}
                                className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-xl hover:bg-white/25 transition border border-white/10 shadow-md"
                            >
                                <Eye size={16} className="text-indigo-400" /> {currentStory.viewersCount || 0} người xem
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteStory}
                                className="rounded-full bg-red-500/20 p-2.5 text-red-400 backdrop-blur-xl border border-red-500/30 hover:bg-red-500/30 transition hover:scale-110"
                                title="Xóa story này"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 w-full">
                            {/* Emoji Quick Reactions */}
                            <div className="flex items-center justify-around px-2">
                                {EMOJI_REACTIONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleSendReply(emoji)}
                                        className="text-xl hover:scale-130 active:scale-90 transition-transform duration-150 p-1"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>

                            {/* Reply Input Form */}
                            <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex w-full items-center gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onFocus={() => setIsPaused(true)}
                                    onBlur={() => setIsPaused(false)}
                                    placeholder={`Gửi phản hồi cho ${currentGroup?.author?.fullName || ''}...`}
                                    className="flex-1 rounded-full bg-white/15 px-4 py-2.5 text-xs text-white placeholder-white/60 backdrop-blur-xl border border-white/15 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                />
                                <button
                                    type="submit"
                                    disabled={sendingReply || !replyText.trim()}
                                    className="rounded-full bg-indigo-600 p-2.5 text-white disabled:opacity-40 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all shadow-md"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* VIEWERS DRAWER */}
            {showViewersModal && (
                <div
                    onClick={() => {
                        setShowViewersModal(false);
                        setIsPaused(false);
                    }}
                    className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-md"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#18181b] text-slate-900 dark:text-white p-6 border border-slate-200 dark:border-white/15 shadow-2xl space-y-4 max-h-[70vh] flex flex-col animate-scaleUp"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <UserCheck className="text-indigo-600 dark:text-indigo-400" size={18} /> Danh Sách Người Xem ({viewersData.count})
                            </h4>
                            <button
                                onClick={() => {
                                    setShowViewersModal(false);
                                    setIsPaused(false);
                                }}
                                className="text-slate-400 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingViewers ? (
                            <div className="py-8 text-center text-xs text-slate-400 dark:text-gray-400 animate-pulse">Đang tải người xem...</div>
                        ) : viewersData.list.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400 dark:text-gray-400">Chưa có ai xem story này</div>
                        ) : (
                            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
                                {viewersData.list.map((v, i) => (
                                    <div key={v.user?._id || i} className="flex items-center justify-between text-xs p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={v.user?.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                                alt="viewer"
                                                className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-white/10"
                                            />
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{v.user?.fullName || 'Người dùng'}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-gray-400">@{v.user?.username || 'user'}</div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">
                                            {moment(v.viewedAt).format('HH:mm DD/MM')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StoryViewerModal;
