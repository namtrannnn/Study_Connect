import React, { useState, useEffect, useCallback } from 'react';
import { Archive, X, Loader2, Plus, Check, Image, Film, Music, Type, ChevronDown } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';
import { toast } from 'react-toastify';
import { getStoryArchive } from '../../../services/story.services';

moment.locale('vi');

export default function StoryArchiveModal({ isOpen, onClose, onCreateHighlight }) {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    // Selection mode for creating highlights
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const fetchArchive = useCallback(async (pageNum = 1, append = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await getStoryArchive(pageNum, 20);
            if (res.code === 200) {
                const data = res.data;
                setStories((prev) => (append ? [...prev, ...data.stories] : data.stories));
                setTotal(data.total);
                setHasMore(data.hasMore);
                setPage(pageNum);
            }
        } catch (err) {
            console.error('fetchArchive error:', err);
            toast.error('Không thể tải kho lưu trữ');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchArchive(1);
            setSelectMode(false);
            setSelectedIds([]);
        }
    }, [isOpen, fetchArchive]);

    const toggleSelect = (storyId) => {
        setSelectedIds((prev) => (prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]));
    };

    const handleCreateHighlight = () => {
        if (selectedIds.length === 0) {
            toast.warn('Vui lòng chọn ít nhất 1 story');
            return;
        }
        onCreateHighlight(selectedIds);
        setSelectMode(false);
        setSelectedIds([]);
    };

    const getStoryPreview = (story) => {
        if (story.media?.url) {
            if (story.media.type === 'video') {
                return { type: 'video', src: story.media.url };
            }
            return { type: 'image', src: story.media.url };
        }
        return { type: 'color', color: story.background?.color || '#2189f8' };
    };

    const getStoryIcon = (story) => {
        if (story.media?.type === 'video') return <Film size={12} className="text-white" />;
        if (story.music?.url) return <Music size={12} className="text-white" />;
        if (story.textOverlays?.length > 0 && !story.media?.url) return <Type size={12} className="text-white" />;
        return <Image size={12} className="text-white" />;
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200 dark:border-white/15 flex flex-col max-h-[85vh] animate-scaleUp overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                        <Archive className="text-indigo-600 dark:text-indigo-400" size={22} />
                        <div>
                            <h3 className="text-base font-bold">Kho Lưu Trữ Story</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400">{total} story đã đăng</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!selectMode ? (
                            <button
                                type="button"
                                onClick={() => setSelectMode(true)}
                                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition cursor-pointer"
                            >
                                <Plus size={14} /> Tạo Tin Nổi Bật
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                    Đã chọn: {selectedIds.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCreateHighlight}
                                    disabled={selectedIds.length === 0}
                                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-40 cursor-pointer"
                                >
                                    <Check size={14} /> Tiếp Tục
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectMode(false);
                                        setSelectedIds([]);
                                    }}
                                    className="text-xs font-semibold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                >
                                    Hủy
                                </button>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full bg-slate-100 dark:bg-white/10 p-1.5 text-slate-500 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/20 transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <span className="text-sm text-slate-500 dark:text-gray-400">Đang tải kho lưu trữ...</span>
                        </div>
                    ) : stories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Archive className="h-12 w-12 text-slate-300 dark:text-gray-600" />
                            <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">Chưa có story nào</p>
                            <p className="text-xs text-slate-400 dark:text-gray-500">Hãy đăng story đầu tiên của bạn!</p>
                        </div>
                    ) : (
                        <>
                            {/* Group by month */}
                            {(() => {
                                const groups = {};
                                stories.forEach((s) => {
                                    const key = moment(s.createdAt).format('MM/YYYY');
                                    if (!groups[key]) groups[key] = [];
                                    groups[key].push(s);
                                });

                                return Object.entries(groups).map(([monthKey, monthStories]) => (
                                    <div key={monthKey} className="mb-6">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3">
                                            {moment(monthKey, 'MM/YYYY').format('MMMM YYYY')}
                                        </h4>
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                                            {monthStories.map((story) => {
                                                const preview = getStoryPreview(story);
                                                const isSelected = selectedIds.includes(story._id);

                                                return (
                                                    <button
                                                        key={story._id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (selectMode) {
                                                                toggleSelect(story._id);
                                                            }
                                                        }}
                                                        className={`relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group ${
                                                            isSelected
                                                                ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-[0.97]'
                                                                : 'border-transparent hover:border-slate-300 dark:hover:border-white/20'
                                                        }`}
                                                    >
                                                        {/* Preview */}
                                                        {preview.type === 'image' && (
                                                            <img src={preview.src} alt="" className="h-full w-full object-cover" />
                                                        )}
                                                        {preview.type === 'video' && (
                                                            <video src={preview.src} muted className="h-full w-full object-cover" />
                                                        )}
                                                        {preview.type === 'color' && (
                                                            <div className="h-full w-full flex items-center justify-center" style={{ background: preview.color }}>
                                                                {story.textOverlays?.[0]?.text && (
                                                                    <span className="text-white text-[10px] font-bold px-2 text-center line-clamp-3 drop-shadow">
                                                                        {story.textOverlays[0].text}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Media type badge */}
                                                        <div className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1">
                                                            {getStoryIcon(story)}
                                                        </div>

                                                        {/* Expired badge */}
                                                        {story.isExpired && (
                                                            <div className="absolute top-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white/80">
                                                                Hết hạn
                                                            </div>
                                                        )}

                                                        {/* Date */}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-4">
                                                            <span className="text-[9px] font-semibold text-white/90">
                                                                {moment(story.createdAt).format('DD/MM')}
                                                            </span>
                                                        </div>

                                                        {/* Selection checkbox */}
                                                        {selectMode && (
                                                            <div
                                                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                    isSelected
                                                                        ? 'bg-indigo-600 border-indigo-600'
                                                                        : 'bg-black/30 border-white/70 group-hover:bg-black/50'
                                                                }`}
                                                            >
                                                                {isSelected && <Check size={14} className="text-white" />}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ));
                            })()}

                            {/* Load more */}
                            {hasMore && (
                                <div className="flex justify-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => fetchArchive(page + 1, true)}
                                        disabled={loadingMore}
                                        className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/20 transition disabled:opacity-50 cursor-pointer"
                                    >
                                        {loadingMore ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <ChevronDown size={14} />
                                        )}
                                        Tải thêm
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
