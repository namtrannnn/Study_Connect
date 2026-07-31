export default function LoadingSearch() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200 dark:bg-white/10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
                        <div className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
                    </div>
                </div>
            ))}
        </div>
    );
}
