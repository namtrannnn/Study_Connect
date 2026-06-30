import { Avatar, AvatarFallback } from '../../../../components/ui/avatar';
import { Button } from '../../../../components/ui/button';

export default function NotificationsPanel({ suggestFollows = [] }) {
    return (
        <div className="p-4 space-y-4">
            <div className="rounded-xl border border-border p-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full border border-border flex items-center justify-center">
                    <span className="text-xl">♡</span>
                </div>
                <div className="mt-3 font-semibold">Hoạt động trên bài viết của bạn</div>
                <div className="mt-1 text-sm text-muted-foreground">
                    Khi có người thích hoặc bình luận về bài viết của bạn, bạn sẽ thấy nó ở đây.
                </div>
            </div>

            <div>
                <div className="font-semibold mb-2">Gợi ý cho bạn</div>

                <div className="space-y-2">
                    {suggestFollows.map((u) => (
                        <div
                            key={u.id}
                            className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-muted transition"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarFallback>{u.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>

                                <div className="leading-tight">
                                    <div className="font-medium flex items-center gap-2">
                                        {u.username}
                                        {u.verified && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{u.name}</div>
                                </div>
                            </div>

                            <Button size="sm" className="rounded-full">
                                Theo dõi
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
