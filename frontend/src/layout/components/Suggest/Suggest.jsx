import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import {
    BadgeCheck,
    Brain,
    Flame,
    Hash,
    Heart,
    MessageCircle,
    TrendingUp,
    UserPlus,
    Users,
    Zap,
    GraduationCap,
} from 'lucide-react';
import { getSuggestSummary } from '../../../services/suggest.services';
import { followUser } from '../../../services/friend.services';
import { toast } from 'react-toastify';

// ─── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonLine({ className = '' }) {
    return <div className={`animate-pulse rounded-full bg-gray-200 dark:bg-white/8 ${className}`} />;
}

function SuggestSkeleton() {
    return (
        <div className="space-y-3 pb-6">
            {[80, 60, 90, 70].map((w, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/8 dark:bg-[#1c1f27]"
                >
                    <SkeletonLine className="mb-4 h-4 w-28" />
                    <div className="space-y-3">
                        {[1, 2, 3].map((j) => (
                            <div key={j} className="flex items-center gap-3">
                                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-white/8" />
                                <div className="flex-1 space-y-1.5">
                                    <SkeletonLine className={`h-3 w-[${w}%]`} />
                                    <SkeletonLine className="h-2.5 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Shared UI ───────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
    return (
        <div
            className={`rounded-2xl border border-gray-100 bg-white dark:border-white/8 dark:bg-[#1c1f27] ${className}`}
        >
            {children}
        </div>
    );
}

function SectionTitle({ icon: Icon, label, color = 'text-primary' }) {
    return (
        <div className="mb-3 flex items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            <span className="text-[13px] font-bold text-gray-800 dark:text-white">{label}</span>
        </div>
    );
}

function EmptyHint({ text = 'Chưa có dữ liệu' }) {
    return (
        <p className="rounded-xl bg-gray-50 py-3 text-center text-xs text-gray-400 dark:bg-white/5 dark:text-gray-500">
            {text}
        </p>
    );
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    return `${Math.floor(h / 24)} ngày trước`;
}

// ─── People to follow ────────────────────────────────────────────────────────
function PeopleToFollow({ people = [] }) {
    const navigate = useNavigate();
    const [followed, setFollowed] = useState({});

    const handleFollow = async (user) => {
        if (followed[user._id]) return;
        try {
            await followUser(user._id);
            setFollowed((prev) => ({ ...prev, [user._id]: true }));
            toast.success(`Đã theo dõi ${user.fullName}`);
        } catch {
            toast.error('Không thể theo dõi');
        }
    };

    return (
        <Card className="p-4">
            <SectionTitle icon={Users} label="Gợi ý kết bạn" />
            {people.length === 0 ? (
                <EmptyHint text="Không có gợi ý nào" />
            ) : (
                <div className="space-y-1">
                    {people.map((user) => (
                        <div
                            key={user._id}
                            className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                            {/* Avatar */}
                            <button
                                type="button"
                                onClick={() => navigate(`/profile/${user.username}`)}
                                className="shrink-0"
                            >
                                <Avatar className="h-10 w-10 ring-2 ring-gray-100 dark:ring-white/10">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-sm font-bold">
                                        {user.fullName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </button>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/profile/${user.username}`)}
                                    className="block"
                                >
                                    <div className="flex items-center gap-1">
                                        <span className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary dark:text-white dark:group-hover:text-primary">
                                            {user.fullName}
                                        </span>
                                        {user.followersCount > 100 && (
                                            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        )}
                                    </div>
                                    <div className="truncate text-xs text-gray-400 dark:text-gray-500">
                                        {user.mutualCount > 0
                                            ? `${user.mutualCount} bạn chung`
                                            : `@${user.username}`}
                                    </div>
                                </button>
                            </div>

                            {/* Follow button */}
                            <button
                                type="button"
                                onClick={() => handleFollow(user)}
                                disabled={!!followed[user._id]}
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                                    followed[user._id]
                                        ? 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500'
                                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white dark:bg-primary/20 dark:hover:bg-primary'
                                }`}
                            >
                                <UserPlus className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Trending Hashtags ───────────────────────────────────────────────────────
function TrendingHashtags({ hashtags = [] }) {
    const maxCount = hashtags[0]?.count || 1;

    return (
        <Card className="p-4">
            <SectionTitle icon={TrendingUp} label="Đang thịnh hành" color="text-orange-500" />
            {hashtags.length === 0 ? (
                <EmptyHint text="Chưa có hashtag nổi bật" />
            ) : (
                <div className="space-y-2">
                    {hashtags.map((tag, i) => {
                        const pct = Math.round((tag.count / maxCount) * 100);
                        return (
                            <button
                                key={tag.name}
                                type="button"
                                className="group w-full text-left"
                            >
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <div className="flex items-center gap-1.5">
                                        {i === 0 && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                                        {i !== 0 && <Hash className="h-3.5 w-3.5 text-gray-400" />}
                                        <span className="font-semibold text-gray-800 group-hover:text-primary dark:text-gray-200 dark:group-hover:text-primary transition">
                                            #{tag.name}
                                        </span>
                                    </div>
                                    <span className="text-gray-400 dark:text-gray-500">{tag.count} bài</span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/8">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            i === 0
                                                ? 'bg-orange-400'
                                                : 'bg-primary/50'
                                        }`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

// ─── Hot Posts ───────────────────────────────────────────────────────────────
function HotPosts({ posts = [] }) {
    const navigate = useNavigate();

    return (
        <Card className="p-4">
            <SectionTitle icon={Flame} label="Bài viết nổi bật" color="text-rose-500" />
            {posts.length === 0 ? (
                <EmptyHint text="Chưa có bài viết nổi bật" />
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => (
                        <button
                            key={post._id}
                            type="button"
                            onClick={() => navigate(`/posts/${post._id}`)}
                            className="group w-full rounded-xl p-2 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                            <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div className="relative shrink-0">
                                    {post.thumbnail ? (
                                        <img
                                            src={post.thumbnail}
                                            alt=""
                                            className="h-14 w-14 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10">
                                            <Flame className="h-6 w-6 text-primary/60" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    {/* Author */}
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={post.author?.avatar} />
                                            <AvatarFallback className="text-[8px]">
                                                {post.author?.fullName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                            {post.author?.fullName}
                                        </span>
                                        <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                            {timeAgo(post.createdAt)}
                                        </span>
                                    </div>

                                    {/* Caption */}
                                    <p className="line-clamp-2 text-xs font-medium leading-4 text-gray-700 group-hover:text-primary dark:text-gray-300 dark:group-hover:text-primary transition">
                                        {post.caption || 'Bài viết không có nội dung'}
                                    </p>

                                    {/* Stats */}
                                    <div className="mt-1.5 flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                            <Heart className="h-3 w-3" />
                                            {post.likesCount || 0}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                            <MessageCircle className="h-3 w-3" />
                                            {post.commentsCount || 0}
                                        </span>
                                        {post.hashtags?.slice(0, 1).map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-primary/15"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Suggested Quiz ──────────────────────────────────────────────────────────
function SuggestedQuiz({ quizzes = [] }) {
    const navigate = useNavigate();

    return (
        <Card className="p-4">
            <SectionTitle icon={Brain} label="Quiz nổi bật" color="text-violet-500" />
            {quizzes.length === 0 ? (
                <EmptyHint text="Chưa có quiz nào" />
            ) : (
                <div className="space-y-2">
                    {quizzes.map((quiz) => (
                        <button
                            key={quiz._id}
                            type="button"
                            onClick={() => navigate(`/posts/${quiz._id}`)}
                            className="group flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                            {/* Icon */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10">
                                <Zap className="h-5 w-5 text-violet-500" />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-xs font-semibold leading-4 text-gray-800 group-hover:text-violet-600 dark:text-gray-200 dark:group-hover:text-violet-400 transition">
                                    {quiz.caption || 'Quiz không có tiêu đề'}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                                        {quiz.optionsCount} lựa chọn
                                    </span>
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                        {quiz.totalAnswers} lượt làm
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Active Learners ─────────────────────────────────────────────────────────
function ActiveLearners({ learners = [] }) {
    const navigate = useNavigate();

    if (learners.length === 0) return null;

    return (
        <Card className="p-4">
            <SectionTitle icon={GraduationCap} label="Đang online" color="text-emerald-500" />
            <div className="flex flex-wrap gap-3">
                {learners.map((user) => (
                    <button
                        key={user._id}
                        type="button"
                        onClick={() => navigate(`/profile/${user.username}`)}
                        className="group flex flex-col items-center gap-1"
                        title={user.fullName}
                    >
                        <div className="relative">
                            <Avatar className="h-11 w-11 ring-2 ring-white dark:ring-[#1c1f27]">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="text-sm font-bold">
                                    {user.fullName?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#1c1f27]" />
                        </div>
                        <span className="max-w-[52px] truncate text-[10px] text-gray-500 group-hover:text-primary dark:text-gray-400 transition">
                            {user.fullName?.split(' ').pop()}
                        </span>
                    </button>
                ))}
            </div>
        </Card>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Suggest() {
    const [data, setData] = useState({
        peopleToFollow: [],
        trendingHashtags: [],
        hotPosts: [],
        suggestedQuiz: [],
        activeLearners: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSuggestSummary()
            .then((res) => {
                if (res?.data) setData(res.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <SuggestSkeleton />;

    const { peopleToFollow, trendingHashtags, hotPosts, suggestedQuiz, activeLearners } = data;

    return (
        <div className="space-y-3 pb-6">
            {/* Active Learners - compact row */}
            <ActiveLearners learners={activeLearners} />

            {/* People to follow */}
            <PeopleToFollow people={peopleToFollow} />

            {/* Trending hashtags */}
            <TrendingHashtags hashtags={trendingHashtags} />

            {/* Hot posts */}
            <HotPosts posts={hotPosts} />

            {/* Suggested quiz */}
            <SuggestedQuiz quizzes={suggestedQuiz} />

            {/* Footer */}
            <p className="px-2 text-center text-[11px] text-gray-300 dark:text-gray-600">
                StudyConnect · {new Date().getFullYear()}
            </p>
        </div>
    );
}
