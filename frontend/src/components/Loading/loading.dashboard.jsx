export default function LoadingDashboard() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div
                    key={idx}
                    className="animate-pulse rounded-[28px] border border-gray-200/50 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#12141c]/90"
                >
                    {/* Header */}
                    <div className="mb-4 flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-slate-200 dark:bg-white/5" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 rounded-md bg-slate-200 dark:bg-white/5" />
                            <div className="h-3 w-20 rounded-md bg-slate-200 dark:bg-white/5" />
                        </div>
                    </div>
                    {/* Caption */}
                    <div className="mb-4 space-y-2.5">
                        <div className="h-4 w-full rounded-md bg-slate-200 dark:bg-white/5" />
                        <div className="h-4 w-[92%] rounded-md bg-slate-200 dark:bg-white/5" />
                        <div className="h-4 w-[65%] rounded-md bg-slate-200 dark:bg-white/5" />
                    </div>
                    {/* Shimmer media box */}
                    {idx === 0 && (
                        <div className="mb-4 h-48 w-full rounded-[20px] bg-slate-200 dark:bg-white/5 md:h-[350px]" />
                    )}
                    {/* Footer buttons */}
                    <div className="mt-2 flex gap-4 border-t border-slate-100 pt-3.5 dark:border-white/5">
                        <div className="h-4 w-12 rounded-md bg-slate-200 dark:bg-white/5" />
                        <div className="h-4 w-16 rounded-md bg-slate-200 dark:bg-white/5" />
                    </div>
                </div>
            ))}
        </div>
    );
}
