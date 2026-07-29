export default function LoadingFriends() {
    return (
        <div className="animate-pulse py-6">
            <div className="mx-auto w-full max-w-5xl space-y-6">
                {/* Search Bar Skeleton */}
                <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-white/10" />

                {/* Tabs Skeleton */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="h-10 w-32 shrink-0 rounded-2xl bg-slate-200 dark:bg-white/10" />
                    ))}
                </div>

                {/* Grid of Friends Cards Skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center justify-between rounded-[24px] border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#18181b]"
                        >
                            <div className="flex flex-col items-center text-center w-full">
                                <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-white/10 mb-3" />
                                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10 mb-1.5" />
                                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/10 mb-4" />
                            </div>
                            <div className="h-9 w-full rounded-xl bg-slate-200 dark:bg-white/10" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
