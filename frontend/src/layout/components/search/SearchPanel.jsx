import { useEffect, useState } from 'react';
import { Search, X, Clock, FileText, FolderKanban, CircleHelp, GraduationCap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { searchStudyConnect } from '../../../services/SearchServices';

const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'users', label: 'Người dùng' },
    { id: 'posts', label: 'Bài viết' },
    { id: 'project', label: 'Dự án' },
    { id: 'question', label: 'Câu hỏi' },
];

function getRelationButtonText(status) {
    switch (status) {
        case 'mutual':
        case 'friend':
            return 'Đang theo dõi (Bạn bè)';
        case 'following':
            return 'Đang theo dõi';
        case 'follower':
            return 'Theo dõi lại';
        case 'pending_sent':
            return 'Đã gửi yêu cầu';
        case 'pending_received':
            return 'Chấp nhận';
        default:
            return 'Theo dõi';
    }
}

function getFollowButtonText(status) {
    switch (status) {
        case 'following':
            return 'Đang theo dõi';
        case 'followed_by':
            return 'Theo dõi lại';
        case 'mutual_follow':
            return 'Theo dõi nhau';
        default:
            return 'Theo dõi';
    }
}

function getPostTypeLabel(type) {
    switch (type) {
        case 'project':
            return 'Dự án';
        case 'question':
            return 'Câu hỏi';
        case 'knowledge':
            return 'Kiến thức';
        case 'learning':
            return 'Học tập';
        case 'collaboration':
            return 'Cộng tác';
        case 'achievement':
            return 'Thành tựu';
        default:
            return 'Bài viết';
    }
}

function getPostIcon(type) {
    if (type === 'project') return FolderKanban;
    if (type === 'question') return CircleHelp;
    if (type === 'learning') return GraduationCap;
    if (type === 'collaboration') return Users;
    return FileText;
}

function SearchPanel({ onClose }) {
    const navigate = useNavigate();

    const [keyword, setKeyword] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const trimmedKeyword = keyword.trim();
    const hasResult = users.length > 0 || posts.length > 0;

    const showUsers = activeTab === 'all' || activeTab === 'users';
    const showPosts = activeTab !== 'users';

    useEffect(() => {
        if (!trimmedKeyword) {
            setUsers([]);
            setPosts([]);
            setError('');
            setLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setError('');

                const res = await searchStudyConnect({
                    keyword: trimmedKeyword,
                    type: activeTab,
                    limit: activeTab === 'all' ? 6 : 15,
                });

                const data = res?.data || {};

                setUsers(data.users || []);
                setPosts(data.posts || []);
            } catch (err) {
                console.log('Search error:', err);
                setUsers([]);
                setPosts([]);
                setError('Không thể tìm kiếm lúc này. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [trimmedKeyword, activeTab]);

    const handleGoProfile = (userId) => {
        if (!userId) return;
        onClose?.();
        navigate(`/profile/${userId}`);
    };

    const handleGoPost = (postId) => {
        if (!postId) return;
        onClose?.();
        navigate(`/post/${postId}`);
    };

    return (
        <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-[#181b22] dark:text-white">
            <div className="border-b border-blue-100 px-5 py-4 dark:border-white/10">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Tìm kiếm</h2>
                        <p className="text-xs font-medium text-slate-400">Tìm bạn học, bài viết, dự án, câu hỏi</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-blue-200 dark:bg-white/10 dark:focus-within:bg-white/10 dark:focus-within:ring-blue-400/30">
                    <Search className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Nhập tên, @username, React..."
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                        autoFocus
                    />

                    {keyword && (
                        <button
                            type="button"
                            onClick={() => setKeyword('')}
                            className="rounded-full bg-slate-200 p-1 text-slate-500 transition hover:bg-slate-300 dark:bg-white/10 dark:text-slate-300"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {tabs.map((tab) => {
                        const active = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition
                                    ${
                                        active
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
                {!trimmedKeyword && (
                    <div className="space-y-4">
                        <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-4 dark:border-white/10 dark:bg-white/5">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">Bạn muốn tìm gì hôm nay?</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Có thể tìm theo tên, @username, kỹ năng, hashtag, dự án hoặc câu hỏi học tập.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {['react', '@nam', 'studyconnect', 'nodejs', 'jwt'].map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setKeyword(item)}
                                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-white/10"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                                        <Clock className="h-5 w-5" />
                                    </span>

                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {trimmedKeyword && loading && (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
                                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <div className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {trimmedKeyword && !loading && error && (
                    <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-500 dark:bg-red-500/10">
                        {error}
                    </div>
                )}

                {trimmedKeyword && !loading && !error && !hasResult && (
                    <div className="flex h-[260px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                            <Search className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Không tìm thấy kết quả</p>
                        <p className="mt-1 max-w-[260px] text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Thử tìm bằng tên, @username, kỹ năng, hashtag hoặc tên dự án khác.
                        </p>
                    </div>
                )}

                {trimmedKeyword && !loading && !error && hasResult && (
                    <div className="space-y-6">
                        {showUsers && users.length > 0 && (
                            <section>
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Người dùng liên quan
                                    </h3>

                                    {activeTab === 'all' && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('users')}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            Xem thêm
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {users.map((user) => (
                                        <div
                                            key={user._id}
                                            className="rounded-3xl border border-transparent p-3 transition hover:border-blue-100 hover:bg-blue-50/70 dark:hover:border-white/10 dark:hover:bg-white/5"
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleGoProfile(user._id)}
                                                    className="shrink-0"
                                                >
                                                    <img
                                                        src={user.avatar || 'https://i.pravatar.cc/150?img=3'}
                                                        alt={user.fullName}
                                                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-white/10"
                                                    />
                                                </button>

                                                <div className="min-w-0 flex-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGoProfile(user._id)}
                                                        className="block max-w-full truncate text-left text-sm font-black text-slate-900 hover:underline dark:text-white"
                                                    >
                                                        {user.fullName}
                                                    </button>

                                                    <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                        @{user.username}
                                                        {user.headline ? ` · ${user.headline}` : ''}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className={`
                                                                rounded-full px-3 py-1.5 text-xs font-black transition
                                                                ${
                                                                    user.relationStatus === 'friend'
                                                                        ? 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                                                                        : user.relationStatus === 'pending_received'
                                                                          ? 'bg-blue-600 text-white'
                                                                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300'
                                                                }
                                                            `}
                                                        >
                                                            {getRelationButtonText(user.relationStatus)}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={`
                                                                rounded-full px-3 py-1.5 text-xs font-black transition
                                                                ${
                                                                    user.followStatus === 'following' ||
                                                                    user.followStatus === 'mutual_follow'
                                                                        ? 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                                                                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10'
                                                                }
                                                            `}
                                                        >
                                                            {getFollowButtonText(user.followStatus)}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {showPosts && posts.length > 0 && (
                            <section>
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Bài viết liên quan
                                    </h3>

                                    {activeTab === 'all' && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('posts')}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            Xem thêm
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {posts.map((post) => {
                                        const TypeIcon = getPostIcon(post.postType);
                                        const firstMedia = post.media?.[0];

                                        return (
                                            <button
                                                key={post._id}
                                                type="button"
                                                onClick={() => handleGoPost(post._id)}
                                                className="w-full rounded-3xl border border-blue-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <img
                                                                src={
                                                                    post.author?.avatar ||
                                                                    'https://i.pravatar.cc/150?img=5'
                                                                }
                                                                alt={post.author?.fullName || 'avatar'}
                                                                className="h-8 w-8 rounded-full object-cover"
                                                            />

                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                                                                    {post.author?.fullName || 'Người dùng'}
                                                                </p>
                                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                    @{post.author?.username || 'user'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                                                            <TypeIcon className="h-3.5 w-3.5" />
                                                            {getPostTypeLabel(post.postType)}
                                                        </div>

                                                        {post.project?.projectName && (
                                                            <p className="mt-2 line-clamp-1 text-sm font-black text-slate-900 dark:text-white">
                                                                {post.project.projectName}
                                                            </p>
                                                        )}

                                                        {post.question?.title && (
                                                            <p className="mt-2 line-clamp-1 text-sm font-black text-slate-900 dark:text-white">
                                                                {post.question.title}
                                                            </p>
                                                        )}

                                                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                            {post.caption ||
                                                                post.project?.summary ||
                                                                post.question?.detail ||
                                                                post.learning?.progressText ||
                                                                post.collaboration?.description ||
                                                                'Không có nội dung mô tả.'}
                                                        </p>

                                                        <div className="mt-3 flex items-center gap-3 text-xs font-bold text-slate-400">
                                                            <span>{post.likesCount || 0} thích</span>
                                                            <span>{post.commentsCount || 0} bình luận</span>
                                                        </div>
                                                    </div>

                                                    {firstMedia?.url && (
                                                        <img
                                                            src={firstMedia.url}
                                                            alt=""
                                                            className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchPanel;
