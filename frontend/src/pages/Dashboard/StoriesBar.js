import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Plus } from 'lucide-react';

function StoriesBar({ user, feedGroups = [], onOpenStoryGroup, onCreateStory }) {
    const scrollerRef = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const STEP = useMemo(() => 100 * 4, []);

    const updateArrows = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 0);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        updateArrows();
        const el = scrollerRef.current;
        if (!el) return;

        const onScroll = () => updateArrows();
        el.addEventListener('scroll', onScroll, { passive: true });

        const ro = new ResizeObserver(() => updateArrows());
        ro.observe(el);

        return () => {
            el.removeEventListener('scroll', onScroll);
            ro.disconnect();
        };
    }, [feedGroups.length]);

    const scrollBy = (dx) => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollBy({ left: dx, behavior: 'smooth' });
    };

    // Separate my story group if present
    const myGroup = feedGroups.find((g) => g.author?._id === user?._id);
    const otherGroups = feedGroups.filter((g) => g.author?._id !== user?._id);

    return (
        <div className="relative mb-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] px-4 py-3.5 shadow-sm transition-all duration-300 select-none">
            {/* Left Scroll Button */}
            {canLeft && (
                <button
                    type="button"
                    onClick={() => scrollBy(-STEP)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 
                     w-8 h-8 rounded-full flex items-center justify-center
                     bg-white/90 dark:bg-[#242526]/90 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-white/10
                     hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all duration-200"
                    aria-label="Scroll left"
                >
                    <FaChevronLeft className="text-xs" />
                </button>
            )}

            {/* Right Scroll Button */}
            {canRight && (
                <button
                    type="button"
                    onClick={() => scrollBy(STEP)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20
                     w-8 h-8 rounded-full flex items-center justify-center
                     bg-white/90 dark:bg-[#242526]/90 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-white/10
                     hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all duration-200"
                    aria-label="Scroll right"
                >
                    <FaChevronRight className="text-xs" />
                </button>
            )}

            {/* Stories Scroller */}
            <div ref={scrollerRef} className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth px-1 py-0.5">
                {/* CREATE STORY / MY STORY */}
                <div className="shrink-0 flex flex-col items-center gap-1.5 w-[78px] group">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                if (myGroup && myGroup.stories?.length > 0) {
                                    onOpenStoryGroup?.(user?._id);
                                } else {
                                    onCreateStory?.();
                                }
                            }}
                            className={`relative w-[66px] h-[66px] rounded-full p-[3px] transition-all duration-300 ${
                                myGroup
                                    ? myGroup.hasUnviewed
                                        ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-400 shadow-md shadow-purple-500/20 group-hover:scale-105'
                                        : 'bg-slate-300 dark:bg-slate-700 group-hover:scale-105'
                                    : 'p-0'
                            }`}
                        >
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-[#18181b]">
                                <img
                                    src={user?.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                    alt="your-story"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                        </button>

                        {/* Plus badge */}
                        <button
                            type="button"
                            onClick={() => onCreateStory?.()}
                            title="Tạo story mới"
                            className="absolute -bottom-0.5 -right-0.5 z-10 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-white dark:ring-[#18181b] shadow-md hover:scale-110 active:scale-95 transition-all duration-200"
                        >
                            <Plus size={15} className="stroke-[3]" />
                        </button>
                    </div>

                    <div className="text-[12px] font-medium tracking-tight text-slate-800 dark:text-slate-200 max-w-[78px] truncate text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Tin của bạn
                    </div>
                </div>

                {/* FRIENDS / FOLLOWINGS STORIES */}
                {otherGroups.map((group) => {
                    const author = group.author || {};
                    const hasUnviewed = group.hasUnviewed;

                    return (
                        <button
                            key={author._id}
                            onClick={() => onOpenStoryGroup?.(author._id)}
                            className="shrink-0 flex flex-col items-center gap-1.5 w-[78px] group text-left cursor-pointer"
                            type="button"
                            title={author.fullName}
                        >
                            <div
                                className={`w-[66px] h-[66px] rounded-full p-[3px] transition-all duration-300 ${
                                    hasUnviewed
                                        ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-400 shadow-md shadow-pink-500/20 group-hover:scale-105 group-hover:rotate-1'
                                        : 'bg-slate-300 dark:bg-slate-700/80 group-hover:scale-105'
                                }`}
                            >
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-[#18181b] bg-slate-100 dark:bg-slate-800">
                                    <img
                                        src={author.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                        alt={author.fullName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                            </div>

                            <div className="text-[12px] font-medium tracking-tight text-slate-800 dark:text-slate-200 max-w-[78px] truncate text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {author.fullName}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default StoriesBar;
