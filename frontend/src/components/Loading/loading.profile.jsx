export default function LoadingProfile() {
    return (
        <div className="animate-pulse py-6">
            <div className="mx-auto w-full max-w-[680px] space-y-4">
                {/* Header Skeleton Card */}
                <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#18181b] sm:p-6">
                    <div className="flex items-start gap-4 sm:gap-5">
                        {/* Avatar Skeleton */}
                        <div className="h-24 w-24 shrink-0 rounded-full bg-slate-200 dark:bg-white/10 sm:h-28 sm:w-28" />

                        {/* Info Skeleton */}
                        <div className="flex-1 space-y-3 pt-1">
                            <div className="h-7 w-48 rounded-xl bg-slate-200 dark:bg-white/10" />
                            <div className="h-4 w-32 rounded-lg bg-slate-200 dark:bg-white/10" />
                            <div className="h-4 w-full max-w-sm rounded-lg bg-slate-200 dark:bg-white/10" />
                            <div className="h-3.5 w-36 rounded-lg bg-slate-200 dark:bg-white/10" />
                        </div>
                    </div>

                    {/* Stats Row Skeleton */}
                    <div className="mt-5 flex gap-6 border-t border-gray-100 pt-4 dark:border-white/10">
                        <div className="h-5 w-28 rounded-lg bg-slate-200 dark:bg-white/10" />
                        <div className="h-5 w-28 rounded-lg bg-slate-200 dark:bg-white/10" />
                    </div>

                    {/* Buttons Skeleton */}
                    <div className="mt-4 flex gap-2">
                        <div className="h-10 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
                    </div>

                    {/* Tabs Skeleton */}
                    <div className="-mb-5 mt-5 flex border-t border-gray-200/80 pt-3 dark:border-white/10 sm:-mb-6">
                        <div className="h-6 flex-1 rounded-lg bg-slate-200 dark:bg-white/10" />
                        <div className="h-6 flex-1 rounded-lg bg-slate-200 dark:bg-white/10" />
                    </div>
                </div>

                {/* Posts Feed Skeleton */}
                <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#18181b]"
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-white/10" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />
                                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-full rounded bg-slate-200 dark:bg-white/10" />
                                <div className="h-4 w-[75%] rounded bg-slate-200 dark:bg-white/10" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
