import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Trash2 } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';
import { toast } from 'react-toastify';
import ConfirmModal from '../../../components/ConfirmModal';
import { deleteHighlight } from '../../../services/story.services';

moment.locale('vi');

export default function StoryHighlightModal({
    isOpen,
    onClose,
    highlight,
    currentUser,
    onHighlightDeleted,
}) {
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const videoRef = useRef(null);
    const audioRef = useRef(null);

    const stories = highlight?.stories || [];
    const currentStory = stories[storyIndex];
    const author = highlight?.author || currentUser;
    const isOwner = currentUser?._id === author?._id;

    // Reset when highlight changes or opens
    useEffect(() => {
        if (isOpen) {
            setStoryIndex(0);
            setProgress(0);
            setIsPaused(false);
        }
    }, [isOpen, highlight]);

    const handleNext = useCallback(() => {
        if (storyIndex < stories.length - 1) {
            setStoryIndex((prev) => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    }, [storyIndex, stories.length, onClose]);

    const handlePrev = useCallback(() => {
        if (storyIndex > 0) {
            setStoryIndex((prev) => prev - 1);
            setProgress(0);
        }
    }, [storyIndex]);

    // Timer & Video handling for progress
    useEffect(() => {
        if (!isOpen || !currentStory || isPaused) return;

        let interval;
        const type = currentStory.type;

        if (type === 'video') {
            if (videoRef.current) {
                videoRef.current.currentTime = (progress / 100) * (videoRef.current.duration || 5);
                videoRef.current.play().catch(() => {});
            }
        }

        if (currentStory.audio?.url && audioRef.current) {
            audioRef.current.play().catch(() => {});
        }

        const duration = currentStory.duration || 5; // seconds
        const step = 100 / (duration * 20); // 50ms updates

        interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    handleNext();
                    return 0;
                }
                return prev + step;
            });
        }, 50);

        return () => {
            clearInterval(interval);
            if (videoRef.current) videoRef.current.pause();
            if (audioRef.current) audioRef.current.pause();
        };
    }, [isOpen, currentStory, storyIndex, isPaused, handleNext, progress]);

    // Toggle pause/play
    const togglePause = (e) => {
        e.stopPropagation();
        setIsPaused((prev) => {
            const next = !prev;
            if (next) {
                if (videoRef.current) videoRef.current.pause();
                if (audioRef.current) audioRef.current.pause();
            } else {
                if (videoRef.current) videoRef.current.play().catch(() => {});
                if (audioRef.current) audioRef.current.play().catch(() => {});
            }
            return next;
        });
    };

    const handleDelete = async () => {
        if (!highlight?._id) return;
        setDeleting(true);
        try {
            const res = await deleteHighlight(highlight._id);
            if (res.code === 200) {
                toast.success('Đã xóa tin nổi bật!');
                if (onHighlightDeleted) onHighlightDeleted(highlight._id);
                onClose();
            } else {
                toast.error(res.message || 'Lỗi khi xóa!');
            }
        } catch (err) {
            toast.error('Lỗi khi xóa tin nổi bật!');
        } finally {
            setDeleting(false);
            setShowConfirmDelete(false);
        }
    };

    if (!isOpen || !highlight || stories.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            {/* Click backdrop (empty space left/right) to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Main Container */}
            <div
                className="relative z-10 flex h-full max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-2xl transition-all md:max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-3">
                    {stories.map((s, idx) => (
                        <div key={s._id || idx} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                            <div
                                className="h-full bg-white transition-all duration-75 ease-linear"
                                style={{
                                    width:
                                        idx < storyIndex
                                            ? '100%'
                                            : idx === storyIndex
                                            ? `${progress}%`
                                            : '0%',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-4 left-0 right-0 z-30 flex items-center justify-between px-4 pt-2 text-white">
                    <div className="flex items-center gap-3">
                        <img
                            src={author?.avatar || '/default-avatar.png'}
                            alt={author?.fullName}
                            className="h-9 w-9 rounded-full border-2 border-indigo-500 object-cover"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm drop-shadow">{author?.fullName}</span>
                                <span className="rounded-full bg-indigo-500/80 px-2 py-0.5 font-medium text-[10px] text-white backdrop-blur-sm">
                                    {highlight.title}
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-300 drop-shadow">
                                {currentStory ? moment(currentStory.createdAt).fromNow() : ''}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Play / Pause */}
                        <button
                            onClick={togglePause}
                            className="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                        >
                            {isPaused ? <Play size={18} /> : <Pause size={18} />}
                        </button>

                        {/* Mute toggle for video/audio */}
                        {(currentStory?.type === 'video' || currentStory?.audio?.url) && (
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        )}

                        {/* Delete Highlight (Owner only) */}
                        {isOwner && (
                            <button
                                onClick={() => setShowConfirmDelete(true)}
                                className="rounded-full bg-black/40 p-2 text-red-400 transition hover:bg-red-500/30"
                                title="Xóa tin nổi bật này"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Left/Right Click zones for navigation */}
                <button
                    onClick={handlePrev}
                    disabled={storyIndex === 0}
                    className="absolute top-1/2 left-2 z-30 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-0"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={handleNext}
                    className="absolute top-1/2 right-2 z-30 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Story Content Canvas */}
                <div className="relative flex-1 bg-black">
                    {/* Media render */}
                    {currentStory?.type === 'image' && (
                        <img
                            src={currentStory.mediaUrl}
                            alt="Story media"
                            className="h-full w-full object-cover"
                        />
                    )}

                    {currentStory?.type === 'video' && (
                        <video
                            ref={videoRef}
                            src={currentStory.mediaUrl}
                            muted={isMuted}
                            playsInline
                            className="h-full w-full object-cover"
                        />
                    )}

                    {currentStory?.type === 'text' && (
                        <div
                            className="flex h-full w-full items-center justify-center p-8 text-center font-bold text-2xl"
                            style={{
                                background: currentStory.backgroundColor || 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: currentStory.textColor || '#ffffff',
                                fontFamily: currentStory.fontFamily || 'sans-serif',
                            }}
                        >
                            {currentStory.textContent}
                        </div>
                    )}

                    {/* Background audio if present */}
                    {currentStory?.audio?.url && (
                        <audio
                            ref={audioRef}
                            src={currentStory.audio.url}
                            muted={isMuted}
                            loop
                        />
                    )}
                </div>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={showConfirmDelete}
                onClose={() => setShowConfirmDelete(false)}
                onConfirm={handleDelete}
                title="Xóa Album Tin Nổi Bật"
                message={`Bạn có chắc chắn muốn xóa album "${highlight.title}"? Thao tác này sẽ không xóa các story gốc trong Kho lưu trữ.`}
                confirmText="Xóa Album"
                confirmColor="red"
                isLoading={deleting}
            />
        </div>
    );
}
