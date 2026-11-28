import { useEffect, useState, useMemo } from 'react';
import {
    TrendingUp,
    Heart,
    MessageSquare,
    Users,
    FileText,
    RefreshCw,
    Calendar,
    Flame,
    Award,
    Sparkles,
    Clock,
    Image as ImageIcon,
    BarChart2,
    CheckCircle2,
    Filter,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminInteractionAnalytics } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';

function AnalyticsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7d'); // 'today' | '7d' | '30d' | '90d' | 'custom'
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [chartMetric, setChartMetric] = useState('interactions'); // 'interactions' | 'likes' | 'comments' | 'posts'
    const [data, setData] = useState({
        overview: {},
        timeline: [],
        hourlyDistribution: [],
        contentStats: {},
        topLikedPosts: [],
        topActiveUsers: [],
        topHashtags: [],
    });

    const fetchAnalytics = async (selectedRange = range, sDate = customStart, eDate = customEnd) => {
        try {
            setLoading(true);
            const params = { range: selectedRange };
            if (selectedRange === 'custom') {
                if (!sDate || !eDate) {
                    toast.warning('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
                    setLoading(false);
                    return;
                }
                params.startDate = sDate;
                params.endDate = eDate;
            }

            const res = await getAdminInteractionAnalytics(params);
            if (res?.code === 200) {
                setData(res.data || {});
            } else {
                toast.error(res?.message || 'Không thể tải số liệu phân tích');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải dữ liệu phân tích');
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchAnalytics(range);
    }, [range]);

    const handleApplyCustomDate = () => {
        if (!customStart || !customEnd) {
            toast.warning('Vui lòng chọn cả ngày bắt đầu và kết thúc');
            return;
        }
        if (new Date(customStart) > new Date(customEnd)) {
            toast.warning('Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return;
        }
        setRange('custom');
        fetchAnalytics('custom', customStart, customEnd);
    };

    const overview = data?.overview || {};
    const timeline = useMemo(() => data?.timeline || [], [data?.timeline]);
    const hourly = useMemo(() => data?.hourlyDistribution || [], [data?.hourlyDistribution]);
    const content = data?.contentStats || {};
    const topPosts = data?.topLikedPosts || [];
    const topUsers = data?.topActiveUsers || [];
    const topTags = data?.topHashtags || [];

    // Max value for timeline chart scaling
    const maxTimelineValue = useMemo(() => {
        if (!timeline.length) return 1;
        const vals = timeline.map((item) => {
            if (chartMetric === 'likes') return item.likes || 0;
            if (chartMetric === 'comments') return item.comments || 0;
            if (chartMetric === 'posts') return item.posts || 0;
            return item.interactions || 0;
        });
        return Math.max(...vals, 1);
    }, [timeline, chartMetric]);

    // Max value for hourly distribution
    const maxHourlyValue = useMemo(() => {
        if (!hourly.length) return 1;
        return Math.max(...hourly.map((h) => h.count || 0), 1);
    }, [hourly]);

    // Find peak hour
    const peakHourInfo = useMemo(() => {
        if (!hourly.length) return null;
        let peak = hourly[0];
        hourly.forEach((h) => {
            if ((h.count || 0) > (peak.count || 0)) peak = h;
        });
        return peak?.count > 0 ? peak : null;
    }, [hourly]);

    // Growth indicator helper
    const renderGrowthBadge = (growth) => {
        const val = typeof growth === 'number' ? growth : 0;
        const isPositive = val >= 0;
        return (
            <span
                className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    isPositive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                }`}
            >
                {isPositive ? `+${val}%` : `${val}%`}
                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 ml-0.5">kỳ trước</span>
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            {/* 1. Header & Time Filter Bar */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Phân tích & Thống kê Tương tác
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Khảo sát mức độ gắn kết, xu hướng tăng trưởng và khung giờ vàng của cộng đồng
                            </p>
                        </div>
                    </div>
                </div>

                {/* Range Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className={`inline-flex items-center rounded-xl border p-1 ${
                            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-100/80'
                        }`}
                    >
                        {[
                            { id: 'today', label: 'Hôm nay' },
                            { id: '7d', label: '7 ngày qua' },
                            { id: '30d', label: '30 ngày' },
                            { id: '90d', label: '90 ngày' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setRange(tab.id);
                                    setShowCustomRange(false);
                                }}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                    range === tab.id
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : isDark
                                        ? 'text-slate-400 hover:text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setShowCustomRange(!showCustomRange)}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                range === 'custom' || showCustomRange
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : isDark
                                    ? 'text-slate-400 hover:text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Tùy chọn</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchAnalytics(range, customStart, customEnd)}
                        disabled={loading}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50 ${
                            isDark
                                ? 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-blue-500/50 hover:text-blue-400'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600'
                        }`}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Custom Date Picker Drawer if open */}
            {showCustomRange && (
                <div
                    className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 transition-all ${
                        isDark ? 'border-slate-800/90 bg-[#0c111c]' : 'border-slate-200 bg-white shadow-xs'
                    }`}
                >
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Filter className="h-4 w-4 text-blue-500" />
                        <span>Khoảng ngày cụ thể:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium outline-hidden transition ${
                                isDark
                                    ? 'border-slate-700 bg-slate-900 text-slate-200 focus:border-blue-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500'
                            }`}
                        />
                        <span className="text-xs text-slate-400">đến</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium outline-hidden transition ${
                                isDark
                                    ? 'border-slate-700 bg-slate-900 text-slate-200 focus:border-blue-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500'
                            }`}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleApplyCustomDate}
                        className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                    >
                        Áp dụng lọc
                    </button>
                </div>
            )}

            {/* 2. Key Engagement Metric Cards (5 Cards Grid) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* 1. Tổng Tương tác */}
                <div
                    className={`rounded-2xl border p-4.5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        isDark ? 'border-blue-500/20 bg-gradient-to-b from-blue-950/30 to-[#0c111c]' : 'border-blue-100 bg-white shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Tổng Tương Tác
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Sparkles className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {loading ? '...' : (overview.totalInteractions || 0).toLocaleString('vi-VN')}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Likes + Comments</span>
                            {renderGrowthBadge(overview.interactionsGrowth)}
                        </div>
                    </div>
                </div>

                {/* 2. Lượt Thích */}
                <div
                    className={`rounded-2xl border p-4.5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        isDark ? 'border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-[#0c111c]' : 'border-rose-100 bg-white shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Lượt Thích (Likes)
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <Heart className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {loading ? '...' : (overview.totalLikes || 0).toLocaleString('vi-VN')}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tim & cảm xúc</span>
                            {renderGrowthBadge(overview.likesGrowth)}
                        </div>
                    </div>
                </div>

                {/* 3. Bình luận */}
                <div
                    className={`rounded-2xl border p-4.5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        isDark ? 'border-sky-500/20 bg-gradient-to-b from-sky-950/20 to-[#0c111c]' : 'border-sky-100 bg-white shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Bình luận
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                            <MessageSquare className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {loading ? '...' : (overview.totalComments || 0).toLocaleString('vi-VN')}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Thảo luận trao đổi</span>
                            {renderGrowthBadge(overview.commentsGrowth)}
                        </div>
                    </div>
                </div>

                {/* 4. Tỷ lệ tương tác / Bài */}
                <div
                    className={`rounded-2xl border p-4.5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        isDark ? 'border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-[#0c111c]' : 'border-emerald-100 bg-white shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Tỷ lệ gắn kết
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Flame className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {loading ? '...' : `${overview.avgInteractionsPerPost || 0}`}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tương tác / mỗi bài</span>
                            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Sức sống
                            </span>
                        </div>
                    </div>
                </div>

                {/* 5. Bài viết mới */}
                <div
                    className={`rounded-2xl border p-4.5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        isDark ? 'border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-[#0c111c]' : 'border-amber-100 bg-white shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Bài viết trong kỳ
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {loading ? '...' : (overview.totalPosts || 0).toLocaleString('vi-VN')}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Nội dung đăng tải</span>
                            {renderGrowthBadge(overview.postsGrowth)}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. BIỂU ĐỒ TĂNG TRƯỞNG & PHÂN TÍCH THEO THỜI GIAN */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Timeline Visual Chart (2 Columns) */}
                <div
                    className={`lg:col-span-2 rounded-2xl border p-5 backdrop-blur-xl ${
                        isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200 bg-white shadow-xs'
                    }`}
                >
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <BarChart2 className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Diễn biến Tương tác Theo Thời Gian
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                    Thống kê phân bổ tương tác và bài viết trong khoảng thời gian đã chọn
                                </p>
                            </div>
                        </div>

                        {/* Metric Selector Pills */}
                        <div className="flex items-center gap-1.5 text-xs">
                            {[
                                { id: 'interactions', label: 'Tất cả', color: 'bg-blue-600' },
                                { id: 'likes', label: 'Likes', color: 'bg-rose-500' },
                                { id: 'comments', label: 'Comments', color: 'bg-sky-500' },
                                { id: 'posts', label: 'Bài viết', color: 'bg-amber-500' },
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    type="button"
                                    onClick={() => setChartMetric(btn.id)}
                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                        chartMetric === btn.id
                                            ? `${btn.color} text-white shadow-2xs`
                                            : isDark
                                            ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Interactive Bars */}
                    {loading ? (
                        <div className="h-56 animate-pulse rounded-xl bg-slate-200/20" />
                    ) : timeline.length === 0 ? (
                        <div className="flex h-56 flex-col items-center justify-center text-xs text-slate-400">
                            Chưa có dữ liệu cho khoảng thời gian này.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Bar Graph Simulation */}
                            <div className="flex h-44 items-end gap-2 pt-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
                                {timeline.map((point, idx) => {
                                    let currentVal = point.interactions || 0;
                                    let barColor = 'from-blue-600 to-sky-400';
                                    if (chartMetric === 'likes') {
                                        currentVal = point.likes || 0;
                                        barColor = 'from-rose-600 to-pink-400';
                                    } else if (chartMetric === 'comments') {
                                        currentVal = point.comments || 0;
                                        barColor = 'from-sky-600 to-teal-400';
                                    } else if (chartMetric === 'posts') {
                                        currentVal = point.posts || 0;
                                        barColor = 'from-amber-600 to-yellow-400';
                                    }

                                    const heightPercent = Math.max(8, Math.round((currentVal / maxTimelineValue) * 100));

                                    return (
                                        <div
                                            key={idx}
                                            className="group relative flex flex-1 min-w-[28px] max-w-[48px] flex-col items-center h-full justify-end"
                                        >
                                            {/* Hover Tooltip */}
                                            <div className="absolute -top-11 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block left-1/2 pointer-events-none">
                                                {point.label}: {currentVal} ({point.likes || 0}L • {point.comments || 0}C • {point.posts || 0}P)
                                            </div>

                                            <div
                                                style={{ height: `${heightPercent}%` }}
                                                className={`w-full rounded-t-lg bg-gradient-to-t ${barColor} opacity-85 transition-all duration-300 group-hover:opacity-100 group-hover:scale-y-105 shadow-2xs`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* X-Axis Labels */}
                            <div className="flex justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1 overflow-hidden">
                                <span>{timeline[0]?.label || ''}</span>
                                {timeline.length > 2 && <span>{timeline[Math.floor(timeline.length / 2)]?.label || ''}</span>}
                                <span>{timeline[timeline.length - 1]?.label || ''}</span>
                            </div>

                            {/* Bottom Summary legend */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                                        <span className="h-2 w-2 rounded-full bg-blue-500" /> Tương tác tổng
                                    </span>
                                    <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                                        <span className="h-2 w-2 rounded-full bg-rose-500" /> Likes
                                    </span>
                                    <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                                        <span className="h-2 w-2 rounded-full bg-sky-500" /> Comments
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    Đỉnh điểm: <span className="text-blue-600 dark:text-blue-400 font-bold">{maxTimelineValue}</span> lượt
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hourly Peak Activity Heatmap (1 Column) */}
                <div
                    className={`rounded-2xl border p-5 backdrop-blur-xl ${
                        isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200 bg-white shadow-xs'
                    }`}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Khung Giờ Cao Điểm
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">Mật độ tương tác theo 24 giờ</p>
                            </div>
                        </div>
                    </div>

                    {/* Peak Highlight Pill */}
                    {peakHourInfo && (
                        <div
                            className={`mb-4 flex items-center justify-between rounded-xl border p-3 ${
                                isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200/80 bg-amber-50/60'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                    Giờ vàng: {peakHourInfo.hour} ({peakHourInfo.rawHour}h - {peakHourInfo.rawHour + 1}h)
                                </span>
                            </div>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                                {peakHourInfo.count} tương tác
                            </span>
                        </div>
                    )}

                    {/* Hourly Distribution Grid */}
                    {loading ? (
                        <div className="h-44 animate-pulse rounded-xl bg-slate-200/20" />
                    ) : hourly.length === 0 ? (
                        <div className="flex h-44 items-center justify-center text-xs text-slate-400">
                            Chưa có dữ liệu khung giờ.
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="grid grid-cols-6 gap-1.5">
                                {hourly.map((h, i) => {
                                    const intensity = (h.count || 0) / maxHourlyValue;
                                    let cellBg = isDark ? 'bg-white/5' : 'bg-slate-100';
                                    if (intensity > 0.75) cellBg = 'bg-blue-600 text-white font-bold';
                                    else if (intensity > 0.4) cellBg = 'bg-blue-500/70 text-white font-medium';
                                    else if (intensity > 0.15) cellBg = 'bg-blue-500/30 text-blue-300';
                                    else if (intensity > 0) cellBg = 'bg-blue-500/15 text-blue-400';

                                    return (
                                        <div
                                            key={i}
                                            title={`${h.hour}: ${h.count || 0} tương tác`}
                                            className={`flex flex-col items-center justify-center rounded-lg p-2 text-center text-[10px] transition-all hover:scale-105 cursor-default ${cellBg}`}
                                        >
                                            <span className="text-[9px] opacity-75">{h.hour}</span>
                                            <span className="text-[11px] font-bold">{h.count || 0}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="mt-3 text-center text-[10px] text-slate-400 dark:text-slate-500">
                                Màu càng đậm biểu thị khung giờ có lượng tương tác tập trung nhiều nhất
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. CONTENT BREAKDOWN & HASHTAGS ROW */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Content Quality & Media Type (1 Column) */}
                <div
                    className={`rounded-2xl border p-5 backdrop-blur-xl ${
                        isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200 bg-white shadow-xs'
                    }`}
                >
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <ImageIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Cơ Cấu Định Dạng Bài Viết
                            </h3>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">Phân loại nội dung đăng tải</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Media vs Text Ratio Bar */}
                        <div>
                            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                    <ImageIcon className="h-3.5 w-3.5" /> Có hình ảnh ({content.postsWithImage || 0})
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                    <FileText className="h-3.5 w-3.5" /> Chỉ văn bản ({content.postsTextOnly || 0})
                                </span>
                            </div>
                            {(() => {
                                const total = (content.postsWithImage || 0) + (content.postsTextOnly || 0) || 1;
                                const imgPercent = Math.round(((content.postsWithImage || 0) / total) * 100);
                                return (
                                    <div className={`h-2.5 w-full rounded-full overflow-hidden flex ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <div style={{ width: `${imgPercent}%` }} className="h-full bg-blue-600 transition-all duration-500" />
                                        <div style={{ width: `${100 - imgPercent}%` }} className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-500" />
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Status Breakdown Pills */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <div
                                className={`rounded-xl border p-3 ${
                                    isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
                                }`}
                            >
                                <div className="text-[11px] font-semibold text-slate-400">Đang hoạt động</div>
                                <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    {content.activePostsCount || 0}
                                </div>
                            </div>
                            <div
                                className={`rounded-xl border p-3 ${
                                    isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
                                }`}
                            >
                                <div className="text-[11px] font-semibold text-slate-400">Đang ẩn / Xem xét</div>
                                <div className="mt-1 text-lg font-black text-rose-500">
                                    {content.hiddenPostsCount || 0}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" /> Bình luận trung bình:
                            </span>
                            <span className="font-bold">{overview.avgCommentsPerPost || 0} bl / bài</span>
                        </div>
                    </div>
                </div>

                {/* Top Hashtags Analytics (2 Columns) */}
                <div
                    className={`lg:col-span-2 rounded-2xl border p-5 backdrop-blur-xl ${
                        isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200 bg-white shadow-xs'
                    }`}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                <Flame className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Chủ Đề & Hashtags Tạo Tương Tác Cao Nhất
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                    Các hashtag kích thích người dùng bàn luận và thả tim nhiều nhất
                                </p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-44 animate-pulse rounded-xl bg-slate-200/20" />
                    ) : topTags.length === 0 ? (
                        <div className="flex h-44 items-center justify-center text-xs text-slate-400">
                            Chưa có dữ liệu hashtag trong kỳ.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {topTags.map((tag, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between rounded-xl border p-3 transition hover:border-blue-500/30 ${
                                        isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                                            #{idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="truncate block text-xs font-bold text-blue-600 dark:text-blue-400">
                                                #{tag.tag}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {tag.count || 0} bài viết chứa tag
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                            {tag.interactions || 0}
                                        </span>
                                        <span className="text-[9px] text-slate-400">tương tác</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 5. TOP VIRAL POSTS & TOP INFLUENTIAL USERS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top Liked Posts */}
                <div
                    className={`rounded-2xl border p-5 backdrop-blur-xl ${
                        isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200 bg-white shadow-xs'
                    }`}
                >
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <Heart className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Top Bài Viết Nhiều Tim & Viral Nhất
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">Các bài đăng có sức hút cộng đồng lớn nhất</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`h-16 animate-pulse rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                            ))}
                        </div>
                    ) : topPosts.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">Chưa có bài viết nào trong kỳ.</div>
                    ) : (
                        <div className="space-y-3">
                            {topPosts.map((post, idx) => (
                                <div
                                    key={post._id}
                                    className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition ${
                                        isDark
                                            ? 'border-white/5 bg-white/[0.02] hover:border-blue-500/30 hover:bg-white/[0.04]'
                                            : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-xs font-black text-rose-600 dark:text-rose-400">
                                            #{idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {post.user_id?.fullName || 'Người dùng'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">@{post.user_id?.username || 'user'}</span>
                                            </div>
                                            <p className={`mt-1 line-clamp-2 text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                {post.content || post.title || 'Bài viết chứa hình ảnh'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-black text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                        <Heart className="h-3.5 w-3.5 fill-current" /> {post.likesCount || 0}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Active & Influential Users */}
                <div
                    className={`rounded-2xl border p-5 backdrop-blur-xl ${
                        isDark ? 'border-slate-800/80 bg-[#0c111c]/90 shadow-lg shadow-black/20' : 'border-slate-200 bg-white shadow-xs'
                    }`}
                >
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Award className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Top Thành Viên Tích Cực & Ảnh Hưởng
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">Người dùng có lượt theo dõi và đóng góp cao nhất</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`h-16 animate-pulse rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                            ))}
                        </div>
                    ) : topUsers.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">Chưa có dữ liệu thành viên.</div>
                    ) : (
                        <div className="space-y-3">
                            {topUsers.map((user, idx) => (
                                <div
                                    key={user._id}
                                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                                        isDark
                                            ? 'border-white/5 bg-white/[0.02] hover:border-blue-500/30 hover:bg-white/[0.04]'
                                            : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-xs font-black text-blue-600 dark:text-blue-400">
                                            #{idx + 1}
                                        </span>
                                        <img
                                            src={user.avatar || 'https://via.placeholder.com/150'}
                                            alt="Avatar"
                                            className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {user.fullName}
                                                </h4>
                                                {user.role === 'admin' && (
                                                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-bold text-amber-500 border border-amber-500/25">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <p className="truncate text-[10px] text-slate-400">
                                                @{user.username || 'user'} • {user.postsCount || 0} bài viết đã đăng
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                        <Users className="h-3.5 w-3.5" /> {user.followers?.length || 0} followers
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AnalyticsAdmin;
