import { useEffect, useState } from 'react';
import {
    Bot,
    ShieldAlert,
    Sparkles,
    Loader2,
    Trash2,
    EyeOff,
    UserX,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminReports, analyzeReportWithAI, resolveReport } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';

function ReportsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [analyzingId, setAnalyzingId] = useState('');
    const [resolvingId, setResolvingId] = useState('');

    const fetchReports = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAdminReports({ status: statusFilter, page, limit: 10 });
            if (res?.code === 200) {
                setReports(res.data.reports || []);
                setPagination(res.data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
            } else {
                toast.error(res?.message || 'Không thể tải báo cáo');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải báo cáo');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(1);
    }, [statusFilter]);

    const handleAnalyzeAI = async (reportId) => {
        try {
            setAnalyzingId(reportId);
            const res = await analyzeReportWithAI(reportId);
            if (res?.code === 200) {
                toast.success('Đã phân tích báo cáo bằng Gemini AI!');
                setReports((prev) =>
                    prev.map((r) => (r._id === reportId ? { ...r, aiAnalysis: res.data } : r)),
                );
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể phân tích bằng AI');
        } finally {
            setAnalyzingId('');
        }
    };

    const handleResolveAction = async (reportId, action) => {
        const actionLabels = {
            dismiss: 'Bỏ qua báo cáo',
            hide_post: 'Ẩn bài viết',
            delete_post: 'Xóa vĩnh viễn bài viết',
            ban_user: 'Khóa tài khoản người dùng',
        };

        if (!window.confirm(`Xác nhận thực hiện hành động: ${actionLabels[action]}?`)) return;

        try {
            setResolvingId(reportId);
            const res = await resolveReport(reportId, action);
            if (res?.code === 200) {
                toast.success(`Đã xử lý báo cáo (${actionLabels[action]})`);
                setReports((prev) =>
                    prev.map((r) => (r._id === reportId ? { ...r, status: 'resolved', resolvedAction: action } : r)),
                );
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Xử lý thất bại');
        } finally {
            setResolvingId('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Toolbar */}
            <div
                className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 backdrop-blur-xl ${
                    isDark
                        ? 'border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#0f172a]/90 to-purple-950/40'
                        : 'border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-purple-50 shadow-sm'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Trung tâm Báo cáo & Kiểm duyệt AI Gemini
                            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-500 border border-indigo-500/30">
                                AI POWERED
                            </span>
                        </h3>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            AI Gemini tự động phân tích độc hại, tóm tắt lý do vi phạm và đưa ra khuyến nghị xử lý.
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                    {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'pending', label: 'Chờ xử lý' },
                        { id: 'resolved', label: 'Đã giải quyết' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setStatusFilter(item.id)}
                            className={`rounded-xl px-3.5 py-1.5 transition ${
                                statusFilter === item.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : isDark
                                    ? 'text-gray-400 hover:text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="flex h-64 flex-col items-center justify-center text-sm text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="mt-2 font-medium">Đang tải danh sách báo cáo...</p>
                </div>
            ) : reports.length === 0 ? (
                <div className={`flex h-64 flex-col items-center justify-center rounded-3xl border p-8 text-center backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <ShieldAlert className="h-12 w-12 text-gray-400 mb-2" />
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Chưa có báo cáo nào</h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Hệ thống đang hoạt động an toàn và chưa phát hiện vi phạm.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => {
                        const ai = report.aiAnalysis || {};
                        const isAnalyzing = analyzingId === report._id;
                        const isResolving = resolvingId === report._id;

                        return (
                            <div
                                key={report._id}
                                className={`rounded-3xl border p-6 backdrop-blur-xl transition shadow-xl space-y-4 ${
                                    isDark ? 'border-white/10 bg-[#0f172a]/90' : 'border-slate-200 bg-white'
                                }`}
                            >
                                {/* Report Header */}
                                <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={report.reporter_id?.avatar || 'https://via.placeholder.com/150'}
                                            alt="Reporter"
                                            className="h-10 w-10 rounded-2xl object-cover ring-1 ring-black/10"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.reporter_id?.fullName || 'Người dùng'}</h4>
                                                <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>đã báo cáo đối tượng ({report.target_type})</span>
                                            </div>
                                            <p className="text-xs text-rose-500 font-medium mt-0.5">
                                                Phân loại: "{
                                                    {
                                                        spam: 'Spam / Quảng cáo rác',
                                                        violence: 'Nội dung bạo lực',
                                                        harassment: 'Quấy rối / Bắt nạt',
                                                        hate_speech: 'Ngôn từ thù địch',
                                                        misinformation: 'Thông tin sai lệch',
                                                        sexual_content: 'Nội dung 18+',
                                                        other: 'Lý do khác',
                                                    }[report.reasonCategory] || report.reasonCategory
                                                }"
                                                {report.reason && (
                                                    <span className="text-gray-400 font-normal"> — {report.reason}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                                                report.status === 'resolved'
                                                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                                    : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                            }`}
                                        >
                                            {report.status === 'resolved' ? 'Đã xử lý' : 'Chờ xử lý'}
                                        </span>
                                        <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                            {new Date(report.createdAt).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                {/* Target Content Preview */}
                                {report.targetDetails && (
                                    <div className={`rounded-2xl border p-4 text-xs ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                        <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Nội dung bị báo cáo:</div>
                                        <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                                            {report.targetDetails.content || report.targetDetails.title || 'Nội dung bị ảnh hưởng'}
                                        </p>
                                    </div>
                                )}

                                {/* Gemini AI Analysis Box */}
                                <div className={`rounded-2xl border p-4 space-y-2 ${isDark ? 'border-indigo-500/30 bg-indigo-950/30' : 'border-indigo-200 bg-indigo-50/50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-500">
                                            <Sparkles className="h-4 w-4" /> Kết quả đánh giá từ Gemini AI:
                                        </div>
                                        {!ai.toxicScore ? (
                                            <button
                                                type="button"
                                                disabled={isAnalyzing}
                                                onClick={() => handleAnalyzeAI(report._id)}
                                                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                                                Phân tích AI ngay
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-semibold text-indigo-500">
                                                Tỷ lệ vi phạm: <strong className="text-rose-500">{ai.toxicScore}%</strong>
                                            </span>
                                        )}
                                    </div>

                                    {ai.summary && (
                                        <div className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                            <p><strong className="text-indigo-500">Tóm tắt lý do:</strong> {ai.summary}</p>
                                            <p className="mt-1">
                                                <strong className="text-indigo-500">Gợi ý hành động:</strong>{' '}
                                                <span className="text-amber-500 font-bold uppercase">{ai.suggestedAction}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Decision Actions */}
                                {report.status !== 'resolved' && (
                                    <div className={`flex flex-wrap items-center justify-end gap-2 border-t pt-3 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                                        <button
                                            type="button"
                                            disabled={isResolving}
                                            onClick={() => handleResolveAction(report._id, 'dismiss')}
                                            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                                                isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            Bỏ qua báo cáo
                                        </button>
                                        {report.target_type === 'post' && (
                                            <button
                                                type="button"
                                                disabled={isResolving}
                                                onClick={() => handleResolveAction(report._id, 'hide_post')}
                                                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-500 transition hover:bg-amber-500/20"
                                            >
                                                <EyeOff className="h-3.5 w-3.5" /> Ẩn bài viết
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={isResolving}
                                            onClick={() => handleResolveAction(report._id, 'delete_post')}
                                            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-500 transition hover:bg-rose-500/20"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Xóa nội dung
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isResolving}
                                            onClick={() => handleResolveAction(report._id, 'ban_user')}
                                            className="flex items-center gap-1.5 rounded-xl border border-red-600/40 bg-red-600/20 px-3.5 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-600/30"
                                        >
                                            <UserX className="h-3.5 w-3.5" /> Khóa tài khoản
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ReportsAdmin;
