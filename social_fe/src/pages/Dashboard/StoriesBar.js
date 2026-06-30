import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function StoriesBar({ user, stories = [], onOpenStory, onCreateStory }) {
    const scrollerRef = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    // mỗi item ~ 86px + gap 12px => ~98px
    const STEP = useMemo(() => 98 * 4, []); // scroll 4 stories/lần

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

        // update khi resize
        const ro = new ResizeObserver(() => updateArrows());
        ro.observe(el);

        return () => {
            el.removeEventListener('scroll', onScroll);
            ro.disconnect();
        };
    }, [stories.length]);

    const scrollBy = (dx) => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollBy({ left: dx, behavior: 'smooth' });
    };

    return (
        <div className="dark:bg-[#242526] bg-white mb-5 rounded-lg px-2 md:px-4 py-3 relative">
            {/* Nút trái */}
            {canLeft && (
                <button
                    type="button"
                    onClick={() => scrollBy(-STEP)}
                    className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 
                     w-9 h-9 rounded-full flex items-center justify-center
                     bg-white/90 dark:bg-[#3a3b3c]/90 shadow hover:scale-[1.03] transition"
                    aria-label="Scroll left"
                >
                    <FaChevronLeft className="text-[#65676b] dark:text-[#e4e6eb]" />
                </button>
            )}

            {/* Nút phải */}
            {canRight && (
                <button
                    type="button"
                    onClick={() => scrollBy(STEP)}
                    className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-10
                     w-9 h-9 rounded-full flex items-center justify-center
                     bg-white/90 dark:bg-[#3a3b3c]/90 shadow hover:scale-[1.03] transition"
                    aria-label="Scroll right"
                >
                    <FaChevronRight className="text-[#65676b] dark:text-[#e4e6eb]" />
                </button>
            )}

            {/* scroller */}
            <div ref={scrollerRef} className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth px-1">
                {/* Create story */}
                <button
                    onClick={() => onCreateStory?.()}
                    className="shrink-0 flex flex-col items-center gap-2 w-[86px] group"
                    type="button"
                >
                    <div className="relative">
                        <div className="w-[70px] h-[70px] rounded-full overflow-hidden ring-2 ring-transparent">
                            <img
                                src={user?.avatar}
                                alt="your-story"
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition"
                            />
                        </div>

                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full dark:bg-[#242526] bg-white flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[18px] leading-none">
                                +
                            </div>
                        </div>
                    </div>

                    <div className="text-[12px] dark:text-[#e4e6eb] text-[#1c1e21] max-w-[86px] truncate">
                        Tin của bạn
                    </div>
                </button>

                {/* Stories */}
                {stories.map((st) => {
                    const isSeen = !!st.seen;

                    return (
                        <button
                            key={st.id}
                            onClick={() => onOpenStory?.(st)}
                            className="shrink-0 flex flex-col items-center gap-2 w-[86px] group"
                            type="button"
                            title={st.name}
                        >
                            <div
                                className={[
                                    'p-[3px] rounded-full',
                                    isSeen
                                        ? 'bg-[#3a3b3c]'
                                        : 'bg-gradient-to-tr from-[#ff2d55] via-[#b337ff] to-[#ffd400]',
                                ].join(' ')}
                            >
                                <div className="w-[70px] h-[70px] rounded-full overflow-hidden dark:bg-[#242526] bg-white">
                                    <img
                                        src={st.avatar}
                                        alt={st.name}
                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition"
                                    />
                                </div>
                            </div>

                            <div className="text-[12px] dark:text-[#e4e6eb] text-[#1c1e21] max-w-[86px] truncate">
                                {st.name}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default StoriesBar;
