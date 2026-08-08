import { useEffect, useState } from 'react';
import {
    Users,
    FileText,
    MessageSquare,
    Heart,
    RefreshCw,
    Sparkles,
    UserCheck,
    TrendingUp,
    Hash,
    Calendar,
    BarChart3,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminStats } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';

function DashboardAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await getAdminStats();
            if (res?.code === 200) {
                setData(res.data);
            } else {
                toast.error(res?.message || 'Không thể tải thống kê');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const stats = data?.stats || {};
    const weeklyTrend = data?.weeklyTrend || [];
    const trendingHashtags = data?.trendingHashtags || [];
    const recentUsers = data?.recentUsers || [];
    const recentPosts = data?.recentPosts || [];

    // Max values for chart percentage calculation
    const maxUsersInTrend = Math.max(...weeklyTrend.map((t) => t.users), 1);
    const maxPostsInTrend = Math.max(...weeklyTrend.map((t) => t.posts), 1);

    const statCards = [
        {
            title: 'Tổng Người Dùng',
            value: stats.totalUsers || 0,
            highlightLabel: 'User mới hôm nay',
            highlightValue: `+${stats.usersToday || 0}`,
            sub: `${stats.activeUsers || 0} hoạt động • ${stats.blockedUsers || 0} bị khóa`,
            icon: Users,
            gradient: isDark
                ? 'from-blue-600/20 via-indigo-600/20 to-transparent'
                : 'from-blue-50 via-indigo-50 to-white',
            borderColor: isDark ? 'border-blue-500/30' : 'border-blue-200',
            iconBg: 'bg-blue-500/20 text-blue-500',
        },
        {
            title: 'Tổng Bài Viết',
            value: stats.totalPosts || 0,
            highlightLabel: 'Bài mới hôm nay',
            highlightValue: `+${stats.postsToday || 0}`,
            sub: 'Bài viết công khai trên Bảng tin Feed',
            icon: FileText,
            gradient: isDark
                ? 'from-violet-600/20 via-purple-600/20 to-transparent'
                : 'from-violet-50 via-purple-50 to-white',
            borderColor: isDark ? 'border-violet-500/30' : 'border-violet-200',
            iconBg: 'bg-violet-500/20 text-violet-500',
        },
        {
            title: 'Phòng Chat Messenger',
            value: stats.totalRooms || 0,
            highlightLabel: 'Kênh hội thoại',
            highlightValue: 'Hoạt động',
            sub: 'Bao gồm cuộc trò chuyện 1-1 & chat nhóm',
            icon: MessageSquare,
            gradient: isDark
                ? 'from-cyan-600/20 via-teal-600/20 to-transparent'
                : 'from-cyan-50 via-teal-50 to-white',
            borderColor: isDark ? 'border-cyan-500/30' : 'border-cyan-200',
            iconBg: 'bg-cyan-500/20 text-cyan-500',
        },
        {
            title: 'Tổng Tương Tác',
            value: stats.totalInteractions || 0,
            highlightLabel: 'Thích & Bình luận',
            highlightValue: `${stats.totalLikes || 0} L 👍`,
            sub: `${stats.totalLikes || 0} lượt thích • ${stats.totalComments || 0} bình luận`,
            icon: Heart,
            gradient: isDark
                ? 'from-rose-600/20 via-pink-600/20 to-transparent'
                : 'from-rose-50 via-pink-50 to-white',
            borderColor: isDark ? 'border-rose-500/30' : 'border-rose-200',
            iconBg: 'bg-rose-500/20 text-rose-500',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div
                className={`relative overflow-hidden rounded-3xl border p-8 backdrop-blur-xl shadow-2xl transition-all ${
                    isDark
                        ? 'border-indigo-500/20 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80'
                        : 'border-indigo-200 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white'
                }`}
            >
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                                isDark
                                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                                    : 'border-white/30 bg-white/20 text-white'
                            }`}
                        >
                            <Sparkles className="h-3.5 w-3.5" /> StudyConnect Overview Dashboard
                        </div>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Bảng điều khiển Trung tâm Administrator 👋
                        </h1>
                        <p className={`mt-2 max-w-2xl text-sm ${isDark ? 'text-gray-300' : 'text-indigo-100'}`}>
                            Hôm nay ứng dụng có <strong className="text-emerald-400">+{stats.usersToday || 0} user mới</strong> và{' '}
                            <strong className="text-indigo-300">+{stats.postsToday || 0} bài viết mới</strong> được đăng tải.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchStats}
                        disabled={loading}
                        className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/20 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-white/30 active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới chỉ số
                    </button>
                </div>
                <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
            </div>

            {/* 1. MỤC 1: SỐ LIỆU TỔNG QUAN (KPI Cards) */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className={`group relative overflow-hidden rounded-3xl border ${card.borderColor} bg-gradient-to-b ${
                                card.gradient
                            } ${isDark ? 'bg-[#0f172a]/90' : 'bg-white shadow-sm'} p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                    {card.title}
                                </span>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-baseline justify-between">
                                    <div className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {loading ? (
                                            <span className={`inline-block h-8 w-24 animate-pulse rounded-lg ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                        ) : (
                                            card.value.toLocaleString('vi-VN')
                                        )}
                                    </div>
                                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-500 border border-emerald-500/30">
                                        {card.highlightValue}
                                    </span>
                                </div>
                                <p className={`mt-2 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{card.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 2. MỤC 2 & 3: BIỂU ĐỒ TĂNG TRƯỞNG & TOP HASHTAGS TRENDING */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Visual Trend Chart (2 Columns) */}
                <div className={`lg:col-span-2 rounded-3xl border p-6 backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-500">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Biểu đồ Tăng trưởng 7 ngày gần nhất</h3>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Số lượng Bài viết đăng mới & User đăng ký theo ngày/tuần</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-indigo-500">
                                <span className="h-3 w-3 rounded-full bg-indigo-500" /> Bài viết
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-500">
                                <span className="h-3 w-3 rounded-full bg-emerald-500" /> User mới
                            </span>
                        </div>
                    </div>

                    {/* Chart Bars */}
                    {loading ? (
                        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/20" />
                    ) : (
                        <div className="space-y-4">
                            {weeklyTrend.map((day, idx) => {
                                const postPercent = Math.round((day.posts / maxPostsInTrend) * 100);
                                const userPercent = Math.round((day.users / maxUsersInTrend) * 100);

                                return (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{day.label}</span>
                                            <div className="flex items-center gap-3 text-[11px]">
                                                <span className="text-indigo-400">{day.posts} bài viết</span>
                                                <span className="text-emerald-400">{day.users} user mới</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`h-3.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
                                                    style={{ width: `${Math.max(postPercent, 6)}%` }}
                                                />
                                            </div>
                                            <div className={`h-3.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                                                    style={{ width: `${Math.max(userPercent, 6)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top Hashtags Trending Widget (1 Column) */}
                <div className={`rounded-3xl border p-6 backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                                <Hash className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Top Trending Hashtags</h3>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Chủ đề đang hot trên hệ thống</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`h-12 animate-pulse rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                            ))}
                        </div>
                    ) : trendingHashtags.length === 0 ? (
                        <div className={`flex h-48 flex-col items-center justify-center text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Chưa có hashtag nào.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {trendingHashtags.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition ${
                                        isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-xs font-extrabold text-amber-500">
                                            #{idx + 1}
                                        </span>
                                        <span className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>#{item.tag}</span>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isDark ? 'bg-white/5 text-gray-300' : 'bg-slate-200 text-slate-700'}`}>
                                        {item.count} bài
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. MỤC 4: DANH SÁCH USER MỚI NHẤT & BÀI VIẾT MỚI NHẤT */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Recent Posts Feed (2 Columns) */}
                <div className={`lg:col-span-2 rounded-3xl border p-6 backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-500">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Bài viết mới nhất</h3>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Các bài đăng mới đăng tải gần đây</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`h-20 animate-pulse rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                            ))}
                        </div>
                    ) : recentPosts.length === 0 ? (
                        <div className={`flex h-48 flex-col items-center justify-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Chưa có bài viết nào trong hệ thống.
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {recentPosts.map((post) => (
                                <div
                                    key={post._id}
                                    className={`group flex items-start gap-4 rounded-2xl border p-4 transition ${
                                        isDark
                                            ? 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]'
                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-200'
                                    }`}
                                >
                                    <img
                                        src={post.user_id?.avatar || 'https://via.placeholder.com/150'}
                                        alt="Author"
                                        className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {post.user_id?.fullName || 'Người dùng'}
                                            </span>
                                            <span className={`shrink-0 text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                {new Date(post.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={`mt-1 line-clamp-2 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                            {post.content || post.title || 'Bài viết chứa hình ảnh'}
                                        </p>
                                        <div className="mt-2.5 flex items-center gap-4 text-[11px] font-semibold">
                                            <span className="flex items-center gap-1 text-rose-500">
                                                <Heart className="h-3.5 w-3.5" /> {post.likesCount || 0}
                                            </span>
                                            <span className="flex items-center gap-1 text-blue-500">
                                                <MessageSquare className="h-3.5 w-3.5" /> {post.commentsCount || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Registered Users (1 Column) */}
                <div className={`rounded-3xl border p-6 backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>User mới nhất</h3>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Người dùng vừa tạo tài khoản</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`h-16 animate-pulse rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                            ))}
                        </div>
                    ) : recentUsers.length === 0 ? (
                        <div className={`flex h-48 flex-col items-center justify-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Chưa có thành viên nào.
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {recentUsers.map((user) => (
                                <div
                                    key={user._id}
                                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition ${
                                        isDark
                                            ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={user.avatar || 'https://via.placeholder.com/150'}
                                            alt="User Avatar"
                                            className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                        />
                                        <div className="min-w-0">
                                            <h4 className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.fullName}</h4>
                                            <p className={`truncate text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{user.username || 'user'}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                            user.role === 'admin'
                                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                                : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                                        }`}
                                    >
                                        {user.role === 'admin' ? 'Admin' : 'Member'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardAdmin;
