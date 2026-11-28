import { useEffect, useState } from 'react';
import {
    Users,
    FileText,
    MessageSquare,
    Heart,
    RefreshCw,
    Sparkles,
    UserCheck,
    Hash,
    BarChart3,
    ArrowUpRight,
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
            highlightLabel: 'User mới',
            highlightValue: `+ ${stats.usersToday || 0}`,
            sub: `${stats.activeUsers || 0} đang hoạt động • ${stats.blockedUsers || 0} bị khóa`,
            icon: Users,
            gradient: isDark
                ? 'from-blue-600/15 via-blue-900/10 to-transparent'
                : 'from-blue-50 via-sky-50/40 to-white',
            borderColor: isDark ? 'border-blue-500/20' : 'border-blue-100',
            iconBg: isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600',
            accentText: 'text-blue-500',
        },
        {
            title: 'Tổng Bài Viết',
            value: stats.totalPosts || 0,
            highlightLabel: 'Bài mới',
            highlightValue: `+ ${stats.postsToday || 0}`,
            sub: 'Bài viết công khai trên Bảng tin Feed',
            icon: FileText,
            gradient: isDark
                ? 'from-sky-600/15 via-cyan-900/10 to-transparent'
                : 'from-sky-50 via-cyan-50/40 to-white',
            borderColor: isDark ? 'border-sky-500/20' : 'border-sky-100',
            iconBg: isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600',
            accentText: 'text-sky-500',
        },
        {
            title: 'Phòng Chat Messenger',
            value: stats.totalRooms || 0,
            highlightLabel: 'Kênh trò chuyện',
            highlightValue: 'Trực tuyến',
            sub: 'Bao gồm cuộc hội thoại 1-1 & nhóm học',
            icon: MessageSquare,
            gradient: isDark
                ? 'from-teal-600/15 via-emerald-900/10 to-transparent'
                : 'from-teal-50 via-emerald-50/40 to-white',
            borderColor: isDark ? 'border-teal-500/20' : 'border-teal-100',
            iconBg: isDark ? 'bg-teal-500/15 text-teal-400' : 'bg-teal-50 text-teal-600',
            accentText: 'text-teal-500',
        },
        {
            title: 'Tổng Tương Tác',
            value: stats.totalInteractions || 0,
            highlightLabel: 'Thích & Bình luận',
            highlightValue: `${stats.totalLikes || 0} Likes`,
            sub: `${stats.totalLikes || 0} lượt thích • ${stats.totalComments || 0} bình luận`,
            icon: Heart,
            gradient: isDark
                ? 'from-rose-600/15 via-pink-900/10 to-transparent'
                : 'from-rose-50 via-pink-50/40 to-white',
            borderColor: isDark ? 'border-rose-500/20' : 'border-rose-100',
            iconBg: isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600',
            accentText: 'text-rose-500',
        },
    ];

    return (
        <div className="space-y-6">
            {/* 1. Header Section - Nexus Clean Modern Style */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Tổng quan hệ thống
                        </h1>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Nexus Live
                        </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Theo dõi hiệu suất và tăng trưởng thời gian thực</span>
                        <span className="hidden sm:inline">•</span>
                        <div className="inline-flex items-center gap-2">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {`+ ${stats.usersToday || 0} user mới hôm nay`}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {`+ ${stats.postsToday || 0} bài viết mới`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={fetchStats}
                        disabled={loading}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50 ${
                            isDark
                                ? 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-blue-500/50 hover:bg-slate-800 hover:text-blue-400'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600'
                        }`}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* 2. KPI Cards */}
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                {statCards.map((card, idx) => {
                                    const Icon = card.icon;
                                    return (
                                        <div
                                            key={idx}
                                            className={`group relative overflow-hidden rounded-2xl border ${card.borderColor} bg-gradient-to-b ${card.gradient
                                                } ${isDark ? 'bg-[#0e1320]/90 shadow-lg shadow-black/20' : 'bg-white shadow-xs'} p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {card.title}
                                                </span>
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} transition-transform group-hover:scale-110 shadow-xs`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="mt-3.5">
                                                <div className="flex items-baseline justify-between">
                                                    <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                        {loading ? (
                                                            <span className={`inline-block h-7 w-20 animate-pulse rounded-lg ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                                        ) : (
                                                            card.value.toLocaleString('vi-VN')
                                                        )}
                                                    </div>
                                                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                                        {card.highlightValue}
                                                    </span>
                                                </div>
                                                <p className={`mt-1.5 text-[11px] font-medium leading-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.sub}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 3. BIỂU ĐỒ TĂNG TRƯỞNG & TOP HASHTAGS */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                {/* Visual Trend Chart (2 Columns) */}
                                <div className={`lg:col-span-2 rounded-2xl border p-5 backdrop-blur-xl ${isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200/90 bg-white shadow-xs'}`}>
                                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <BarChart3 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Tăng trưởng 7 ngày gần nhất</h3>
                                                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bài viết đăng mới & thành viên đăng ký theo ngày</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3.5 text-xs font-semibold">
                                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400" /> Bài viết
                                            </span>
                                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> User mới
                                            </span>
                                        </div>
                                    </div>

                                    {/* Chart Bars */}
                                    {loading ? (
                                        <div className="h-44 animate-pulse rounded-xl bg-slate-200/20" />
                                    ) : (
                                        <div className="space-y-3.5">
                                            {weeklyTrend.map((day, idx) => {
                                                const postPercent = Math.round((day.posts / maxPostsInTrend) * 100);
                                                const userPercent = Math.round((day.users / maxUsersInTrend) * 100);

                                                return (
                                                    <div key={idx} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs font-semibold">
                                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{day.label}</span>
                                                            <div className="flex items-center gap-3 text-[11px]">
                                                                <span className="text-blue-600 dark:text-blue-400 font-bold">{day.posts} bài</span>
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{day.users} user</span>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-500"
                                                                    style={{ width: `${Math.max(postPercent, 5)}%` }}
                                                                />
                                                            </div>
                                                            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                                                                    style={{ width: `${Math.max(userPercent, 5)}%` }}
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
                                <div className={`rounded-2xl border p-5 backdrop-blur-xl ${isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200/90 bg-white shadow-xs'}`}>
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                                <Hash className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Top Hashtags Trending</h3>
                                                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chủ đề sôi nổi nhất hệ thống</p>
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="space-y-2.5">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className={`h-11 animate-pulse rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                                            ))}
                                        </div>
                                    ) : trendingHashtags.length === 0 ? (
                                        <div className={`flex h-44 flex-col items-center justify-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Chưa có hashtag nào.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {trendingHashtags.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/80 hover:bg-slate-100/80'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black ${idx === 0
                                                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                                                                : idx === 1
                                                                    ? 'bg-slate-400/15 text-slate-400 border border-slate-400/25'
                                                                    : idx === 2
                                                                        ? 'bg-amber-700/15 text-amber-600 border border-amber-700/25'
                                                                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                            }`}>
                                                            #{idx + 1}
                                                        </span>
                                                        <span className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>#{item.tag}</span>
                                                    </div>
                                                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                                                        {item.count} bài
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 4. DANH SÁCH BÀI VIẾT MỚI & USER MỚI */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                {/* Recent Posts Feed (2 Columns) */}
                                <div className={`lg:col-span-2 rounded-2xl border p-5 backdrop-blur-xl ${isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200/90 bg-white shadow-xs'}`}>
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Bài viết mới nhất</h3>
                                                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hoạt động đăng bài gần đây</p>
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className={`h-18 animate-pulse rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                                            ))}
                                        </div>
                                    ) : recentPosts.length === 0 ? (
                                        <div className={`flex h-44 flex-col items-center justify-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Chưa có bài viết nào trong hệ thống.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentPosts.map((post) => (
                                                <div
                                                    key={post._id}
                                                    className={`group flex items-start gap-3 rounded-xl border p-3 transition ${isDark
                                                            ? 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-200'
                                                        }`}
                                                >
                                                    <img
                                                        src={post.user_id?.avatar || 'https://via.placeholder.com/150'}
                                                        alt="Author"
                                                        className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                {post.user_id?.fullName || 'Người dùng'}
                                                            </span>
                                                            <span className={`shrink-0 text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                {new Date(post.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className={`mt-0.5 line-clamp-2 text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            {post.content || post.title || 'Bài viết chứa hình ảnh'}
                                                        </p>
                                                        <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
                                                            <span className="flex items-center gap-1 text-rose-500">
                                                                <Heart className="h-3.5 w-3.5" /> {post.likesCount || 0}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
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
                                <div className={`rounded-2xl border p-5 backdrop-blur-xl ${isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200/90 bg-white shadow-xs'}`}>
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <UserCheck className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Thành viên mới</h3>
                                                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tài khoản vừa gia nhập hệ thống</p>
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className={`h-14 animate-pulse rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                                            ))}
                                        </div>
                                    ) : recentUsers.length === 0 ? (
                                        <div className={`flex h-44 flex-col items-center justify-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Chưa có thành viên nào.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {recentUsers.map((user) => (
                                                <div
                                                    key={user._id}
                                                    className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition ${isDark
                                                            ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <img
                                                            src={user.avatar || 'https://via.placeholder.com/150'}
                                                            alt="User Avatar"
                                                            className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
                                                        />
                                                        <div className="min-w-0">
                                                            <h4 className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.fullName}</h4>
                                                            <p className={`truncate text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>@{user.username || 'user'}</p>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold ${user.role === 'admin'
                                                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                                                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                                                            }`}
                                                    >
                                                        {user.role === 'admin' ? 'Admin' : 'Thành viên'}
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
