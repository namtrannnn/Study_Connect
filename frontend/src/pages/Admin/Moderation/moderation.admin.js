import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import ReportsAdmin from '../Reports/reports.admin';
import {
    Search,
    Loader2,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    CheckCircle2,
    XCircle,
    Eye,
    X,
    AlertTriangle,
    Clock,
    Bot,
    User,
    ImageIcon,
    FileText,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Info,
    Scale,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminModerationPending, approveModerationPost, rejectModerationPost, resolveAppeal } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';
import ConfirmModal from '../../../components/ConfirmModal';
import AdminPagination from '../../../components/AdminPagination';

// ─── Helpers ──────────────────────────────────────────────
const RISK_LABELS = {
    sexual: { label: 'Khiêu dâm', color: 'rose' },
    violence: { label: 'Bạo lực', color: 'red' },
    harassment: { label: 'Quấy rối', color: 'orange' },
    hate: { label: 'Thù hằn', color: 'fuchsia' },
    scam: { label: 'Lừa đảo', color: 'amber' },
    spam: { label: 'Spam', color: 'yellow' },
};

function getRiskLevel(risk) {
    if (risk >= 0.8) return { text: 'Rất cao', color: 'red', bg: 'bg-red-500/15 text-red-500 border-red-500/30' };
    if (risk >= 0.6) return { text: 'Cao', color: 'orange', bg: 'bg-orange-500/15 text-orange-500 border-orange-500/30' };
    if (risk >= 0.4) return { text: 'Trung bình', color: 'amber', bg: 'bg-amber-500/15 text-amber-500 border-amber-500/30' };
    return { text: 'Thấp', color: 'emerald', bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' };
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ─── Risk Bar Component ──────────────────────────────────
function RiskBar({ value = 0, label = '', colorClass = 'bg-indigo-500', isDark }) {
    const pct = Math.round(value * 100);
    return (
        <div className="flex items-center gap-2">
            <span className={`w-[72px] text-[10px] font-semibold truncate ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{label}</span>
            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`w-[32px] text-right text-[10px] font-bold ${pct >= 60 ? 'text-red-400' : isDark ? 'text-gray-500' : 'text-slate-400'}`}>{pct}%</span>
        </div>
    );
}

// ─── Detail Modal ─────────────────────────────────────────
function ModerationDetailModal({ post, onClose, onApprove, onReject, onResolveAppeal, isDark, actionLoading }) {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [modalImageIdx, setModalImageIdx] = useState(0);

    if (!post) return null;

    const author = post.author;
    const aiLog = post.aiLog;
    const overallRisk = aiLog?.overallRisk ?? 0;
    const categories = aiLog?.categories || {};
    const riskLevel = getRiskLevel(overallRisk);
    const media = post.media || [];
    const isPendingAppeal = post.isAppealed && post.appealStatus === 'pending';

    const handleRejectSubmit = () => {
        if (isPendingAppeal && onResolveAppeal) {
            onResolveAppeal(post._id, { action: 'reject', note: rejectReason || 'Không chấp thuận khiếu nại' });
        } else {
            onReject(post._id, rejectReason || 'Bị từ chối bởi Quản trị viên');
        }
        setShowRejectInput(false);
        setRejectReason('');
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal Content */}
            <div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${
                    isDark ? 'border-white/10 bg-[#0f172a]' : 'border-slate-200 bg-white'
                }`}
            >
                {/* Header */}
                <div className={`sticky top-0 z-10 flex items-center justify-between p-5 pb-4 border-b backdrop-blur-xl ${
                    isDark ? 'border-white/10 bg-[#0f172a]/95' : 'border-slate-100 bg-white/95'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${riskLevel.bg} border`}>
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Chi tiết bài viết chờ duyệt</h3>
                            <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                ID: {post._id?.slice(-8)} · {formatRelativeTime(post.createdAt)}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Author Info */}
                    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                        <img src={author?.avatar || 'https://via.placeholder.com/150'} alt="" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-black/10" />
                        <div>
                            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {author?.fullName || 'Người dùng'}
                                {author?.isVerified && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1 text-blue-500" />}
                            </h4>
                            <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{author?.username || 'user'}</p>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Nội dung bài viết</span>
                        </div>
                        <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                            {post.caption || post.content || '(Không có nội dung văn bản)'}
                        </p>
                        {post.hashtags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {post.hashtags.map((tag, i) => (
                                    <span key={i} className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">#{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Media */}
                    {media.length > 0 && (
                        <div className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                                <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Hình ảnh đính kèm ({media.length})</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {media.map((m, idx) => (
                                    <img
                                        key={idx}
                                        src={m?.url || m}
                                        alt=""
                                        className="h-28 w-full rounded-xl object-cover border border-black/10 cursor-pointer hover:opacity-80 transition"
                                        onClick={() => setModalImageIdx(idx)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Analysis */}
                    <div className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Bot className={`h-4 w-4 text-indigo-400`} />
                                <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Phân tích AI Moderator</span>
                            </div>
                            {aiLog && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskLevel.bg}`}>
                                    Rủi ro: {Math.round(overallRisk * 100)}% — {riskLevel.text}
                                </span>
                            )}
                        </div>

                        {!aiLog ? (
                            <p className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Chưa có dữ liệu phân tích AI cho bài viết này (có thể do lỗi hệ thống).</p>
                        ) : (
                            <>
                                {/* Risk Gauge */}
                                <div className="mb-4">
                                    <div className={`h-3 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                overallRisk >= 0.8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                                overallRisk >= 0.6 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                                                overallRisk >= 0.4 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                                'bg-gradient-to-r from-emerald-500 to-green-500'
                                            }`}
                                            style={{ width: `${Math.round(overallRisk * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Category Breakdown */}
                                <div className="space-y-1.5">
                                    {Object.entries(RISK_LABELS).map(([key, { label, color }]) => {
                                        const val = categories[key] ?? 0;
                                        return (
                                            <RiskBar
                                                key={key}
                                                value={val}
                                                label={label}
                                                isDark={isDark}
                                                colorClass={
                                                    val >= 0.7 ? 'bg-red-500' :
                                                    val >= 0.4 ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }
                                            />
                                        );
                                    })}
                                </div>

                                {/* AI Reason */}
                                {aiLog.reason && (
                                    <div className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                                        <span className="font-bold">Lý do AI:</span> {aiLog.reason}
                                    </div>
                                )}

                                {/* Meta */}
                                <div className={`mt-3 flex flex-wrap gap-2 text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                    {aiLog.reasonCode && <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md">{aiLog.reasonCode}</span>}
                                    {aiLog.stage && <span className="bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-md">{aiLog.stage}</span>}
                                    {aiLog.processingTimeMs && <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-md">{aiLog.processingTimeMs}ms</span>}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Violation Reason from post */}
                    {post.violationReason && (
                        <div className={`flex items-start gap-2 p-3 rounded-2xl border ${isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{post.violationReason}</p>
                        </div>
                    )}

                    {/* Appeal Info (Kháng cáo từ tác giả) */}
                    {post.isAppealed && (
                        <div className={`p-4 rounded-2xl border ${isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50'}`}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <Scale className="h-4 w-4 text-amber-500" />
                                    <span className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                                        Đơn khiếu nại của tác giả
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    post.appealStatus === 'pending'
                                        ? 'bg-amber-500/20 text-amber-500'
                                        : post.appealStatus === 'approved'
                                        ? 'bg-emerald-500/20 text-emerald-500'
                                        : 'bg-red-500/20 text-red-500'
                                }`}>
                                    {post.appealStatus === 'pending'
                                        ? '⏳ Chờ xem xét'
                                        : post.appealStatus === 'approved'
                                        ? '✅ Đã chấp thuận'
                                        : '❌ Đã bác bỏ'}
                                </span>
                            </div>
                            <p className={`text-xs leading-relaxed italic ${isDark ? 'text-amber-200/90' : 'text-amber-900'}`}>
                                "{post.appealReason || 'Tác giả yêu cầu xem xét lại quyết định.'}"
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {isPendingAppeal ? (
                        !showRejectInput ? (
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => onResolveAppeal(post._id, { action: 'approve', note: 'Chấp thuận khiếu nại của tác giả' })}
                                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-emerald-600 text-white text-sm font-bold transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Chấp thuận khiếu nại
                                </button>
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setShowRejectInput(true)}
                                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-red-600 text-white text-sm font-bold transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Bác bỏ khiếu nại
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-2">
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Nhập lý do bác bỏ khiếu nại (sẽ gửi thông báo cho tác giả)..."
                                    rows={3}
                                    className={`w-full rounded-2xl border p-3 text-xs outline-none resize-none transition ${
                                        isDark
                                            ? 'border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-red-500'
                                            : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-red-500'
                                    }`}
                                />
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={handleRejectSubmit}
                                        className="flex-1 flex items-center justify-center gap-2 h-10 rounded-2xl bg-red-600 text-white text-xs font-bold transition hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                        Xác nhận bác bỏ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                                        className={`h-10 px-5 rounded-2xl text-xs font-bold transition ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )
                    ) : !showRejectInput ? (
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => onApprove(post._id)}
                                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-emerald-600 text-white text-sm font-bold transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                {post.status === 'hidden' ? 'Khôi phục bài viết' : 'Duyệt bài viết'}
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => setShowRejectInput(true)}
                                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-red-600 text-white text-sm font-bold transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
                            >
                                <XCircle className="h-4 w-4" />
                                Từ chối & Ẩn
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối bài viết (không bắt buộc)..."
                                rows={3}
                                className={`w-full rounded-2xl border p-3 text-xs outline-none resize-none transition ${
                                    isDark
                                        ? 'border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-red-500'
                                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-red-500'
                                }`}
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={handleRejectSubmit}
                                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-2xl bg-red-600 text-white text-xs font-bold transition hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    Xác nhận từ chối
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                                    className={`h-10 px-5 rounded-2xl text-xs font-bold transition ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Main Page Component ──────────────────────────────────
function ModerationAdmin() {
    const { isDark } = useAdminTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeMainTab = searchParams.get('tab') === 'reports' ? 'reports' : 'pipeline';

    const handleSwitchMainTab = (tab) => {
        if (tab === 'reports') {
            setSearchParams({ tab: 'reports' });
        } else {
            setSearchParams({});
        }
    };

    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [selectedPost, setSelectedPost] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [statusTab, setStatusTab] = useState('pending');
    const [counts, setCounts] = useState({ pending: 0, appeals: 0, rejected: 0, approved: 0, all: 0 });

    const fetchPosts = useCallback(async (page = 1, currentStatus = statusTab) => {
        try {
            setLoading(true);
            const res = await getAdminModerationPending({ page, limit: 10, status: currentStatus });
            if (res?.code === 200 || res?.data) {
                const data = res?.data || res;
                setPosts(data.posts || []);
                setPagination({
                    page: data.page || 1,
                    limit: 10,
                    totalPages: data.totalPages || 1,
                    total: data.total || 0,
                });
                if (data.counts) {
                    setCounts(data.counts);
                }
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể tải danh sách bài viết kiểm duyệt');
        } finally {
            setLoading(false);
        }
    }, [statusTab]);

    useEffect(() => {
        fetchPosts(1, statusTab);
    }, [fetchPosts, statusTab]);

    const handleApprove = async (postId) => {
        try {
            setActionLoading(true);
            const res = await approveModerationPost(postId);
            if (res?.code === 200) {
                toast.success('✅ Đã duyệt bài viết thành công! Bài viết sẽ hiện trên Feed.');
                setPosts((prev) => prev.filter((p) => p._id !== postId));
                setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
                setSelectedPost(null);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể duyệt bài viết');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (postId, reason) => {
        try {
            setActionLoading(true);
            const res = await rejectModerationPost(postId, reason);
            if (res?.code === 200) {
                toast.success('🚫 Đã từ chối và ẩn bài viết.');
                setPosts((prev) => prev.filter((p) => p._id !== postId));
                setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
                setSelectedPost(null);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể từ chối bài viết');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolveAppeal = async (postId, { action, note }) => {
        try {
            setActionLoading(true);
            const res = await resolveAppeal(postId, { action, note });
            if (res?.code === 200) {
                toast.success(res.message || 'Đã xử lý đơn khiếu nại thành công!');
                setPosts((prev) => prev.filter((p) => p._id !== postId));
                setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
                setCounts((prev) => ({
                    ...prev,
                    appeals: Math.max(0, (prev.appeals || 1) - 1),
                }));
                setSelectedPost(null);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || 'Không thể xử lý khiếu nại');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Master Tab Bar */}
            <div className={`flex items-center gap-2 p-1.5 rounded-2xl border backdrop-blur-xl ${
                isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'
            }`}>
                <button
                    type="button"
                    onClick={() => handleSwitchMainTab('pipeline')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                        activeMainTab === 'pipeline'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                            : isDark
                            ? 'text-gray-400 hover:text-white hover:bg-white/5'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Hàng chờ Phễu 4 Tầng & Khiếu nại</span>
                    {counts.pending > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-sm">
                            {counts.pending}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => handleSwitchMainTab('reports')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                        activeMainTab === 'reports'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                            : isDark
                            ? 'text-gray-400 hover:text-white hover:bg-white/5'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    <Bot className="h-4 w-4" />
                    <span>Báo cáo Vi phạm từ Cộng đồng (AI Gemini)</span>
                </button>
            </div>

            {activeMainTab === 'reports' ? (
                <ReportsAdmin />
            ) : (
                <>
                    {/* Header */}
                    <div className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 backdrop-blur-xl ${
                        isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'
                    }`}>
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Kiểm duyệt nội dung AI
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            Bài viết được Bot AI gắn cờ nghi vấn, cần Quản trị viên xem xét
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pagination.total}</span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>bài chờ duyệt</span>
                    </div>
                    <button
                        onClick={() => fetchPosts(pagination.page)}
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                            isDark ? 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                        title="Làm mới"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                {[
                    { id: 'pending', label: 'Chờ duyệt tay', count: counts.pending, color: 'text-amber-500' },
                    { id: 'appeals', label: 'Khiếu nại', count: counts.appeals, color: 'text-blue-500' },
                    { id: 'rejected', label: 'AI từ chối / Đã ẩn', count: counts.rejected, color: 'text-rose-500' },
                    { id: 'approved', label: 'AI tự động duyệt', count: counts.approved, color: 'text-emerald-500' },
                    { id: 'all', label: 'Tất cả bài viết', count: counts.all, color: 'text-indigo-500' },
                ].map((tab) => {
                    const isActive = statusTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setStatusTab(tab.id);
                                fetchPosts(1, tab.id);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : isDark
                                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isActive
                                    ? 'bg-white/20 text-white'
                                    : isDark
                                    ? 'bg-white/10 text-gray-400'
                                    : 'bg-slate-200 text-slate-700'
                            }`}>
                                {tab.count ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Info Banner */}
            <div className={`flex items-start gap-3 p-4 rounded-2xl border ${isDark ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-indigo-100 bg-indigo-50'}`}>
                <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className={`text-xs leading-relaxed ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    {statusTab === 'pending' && (
                        <span>Đây là các bài viết <strong>vùng xám (Rủi ro 30% - 70%)</strong> do Bot AI Tầng 3 gắn cờ nghi vấn, cần Quản trị viên duyệt hoặc từ chối trước khi hiển thị.</span>
                    )}
                    {statusTab === 'appeals' && (
                        <span>Danh sách các bài viết bị ẩn hoặc vi phạm mà <strong>tác giả đã gửi đơn khiếu nại</strong>, chờ Quản trị viên xem xét lại để khôi phục hoặc bác bỏ.</span>
                    )}
                    {statusTab === 'rejected' && (
                        <span>Đây là danh sách bài viết bị <strong>Bot AI tự động từ chối / Ẩn (Rủi ro trên 70%)</strong> hoặc do Admin ẩn. Bạn có thể bấm xem chi tiết lý do AI phân tích hoặc Khôi phục duyệt lại.</span>
                    )}
                    {statusTab === 'approved' && (
                        <span>Đây là danh sách các bài viết <strong>an toàn (Rủi ro dưới 30%)</strong> đã được Bot AI hoặc Admin tự động phê duyệt hiển thị trên Bảng tin.</span>
                    )}
                    {statusTab === 'all' && (
                        <span>Tổng hợp toàn bộ các bài viết trong hệ thống đã trải qua quy trình Phễu Kiểm duyệt AI 4 Tầng.</span>
                    )}
                </p>
            </div>

            {/* Posts List */}
            {loading ? (
                <div className="flex h-64 flex-col items-center justify-center text-sm text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="mt-2 font-medium">Đang tải dữ liệu bài viết...</p>
                </div>
            ) : posts.length === 0 ? (
                <div className={`flex h-64 flex-col items-center justify-center rounded-3xl border p-8 text-center backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <ShieldCheck className="h-14 w-14 text-emerald-500 mb-3" />
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {statusTab === 'pending' ? 'Không có bài viết nào chờ duyệt!' : 'Không có bài viết nào trong mục này!'}
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        {statusTab === 'pending' ? 'Tất cả nội dung đã được Bot AI xử lý hoặc đã được Quản trị viên thẩm định.' : 'Chưa có dữ liệu bài viết phù hợp với bộ lọc hiện tại.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => {
                        const author = post.author;
                        const aiLog = post.aiLog;
                        const overallRisk = aiLog?.overallRisk ?? 0;
                        const categories = aiLog?.categories || {};
                        const riskLevel = getRiskLevel(overallRisk);
                        const media = post.media || [];
                        const topCategory = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];

                        return (
                            <div
                                key={post._id}
                                className={`group relative overflow-hidden rounded-3xl border backdrop-blur-xl transition hover:shadow-xl ${
                                    isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row">
                                    {/* Left: Post Content */}
                                    <div className="flex-1 p-5">
                                        {/* Author */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <img
                                                src={author?.avatar || 'https://via.placeholder.com/150'}
                                                alt=""
                                                className="h-9 w-9 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`truncate font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {author?.fullName || 'Người dùng'}
                                                    {author?.isVerified && <CheckCircle2 className="inline h-3 w-3 ml-1 text-blue-500" />}
                                                </h4>
                                                <p className={`truncate text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                    @{author?.username || 'user'} · {formatRelativeTime(post.createdAt)}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${riskLevel.bg}`}>
                                                {Math.round(overallRisk * 100)}% {riskLevel.text}
                                            </span>
                                        </div>

                                        {/* Appeal badge if pending appeal */}
                                        {post.isAppealed && post.appealStatus === 'pending' && (
                                            <div className={`flex items-center gap-2 mb-2.5 p-2 rounded-xl text-[11px] font-semibold border ${
                                                isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-800'
                                            }`}>
                                                <Scale className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                <span className="truncate">Khiếu nại: "{post.appealReason}"</span>
                                            </div>
                                        )}

                                        {/* Caption */}
                                        <p className={`text-xs leading-relaxed line-clamp-3 mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                            {post.caption || post.content || '(Không có nội dung văn bản)'}
                                        </p>

                                        {/* Media thumbnails */}
                                        {media.length > 0 && (
                                            <div className="flex gap-1.5 mb-3">
                                                {media.slice(0, 4).map((m, idx) => (
                                                    <img key={idx} src={m?.url || m} alt="" className="h-14 w-14 rounded-xl object-cover border border-black/10" />
                                                ))}
                                                {media.length > 4 && (
                                                    <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                                                        +{media.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* AI Reason preview */}
                                        {aiLog?.reason && (
                                            <div className={`flex items-start gap-2 p-2.5 rounded-xl border text-[11px] ${isDark ? 'border-white/10 bg-white/5 text-gray-400' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                                                <Bot className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{aiLog.reason}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: AI Summary + Actions */}
                                    <div className={`w-full lg:w-[280px] shrink-0 p-5 border-t lg:border-t-0 lg:border-l flex flex-col justify-between ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                                        {/* Top risk categories */}
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Bot className="h-3.5 w-3.5 text-indigo-400" />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Phân loại rủi ro</span>
                                            </div>
                                            {Object.entries(RISK_LABELS).map(([key, { label }]) => {
                                                const val = categories[key] ?? 0;
                                                if (val < 0.05) return null;
                                                return (
                                                    <RiskBar
                                                        key={key}
                                                        value={val}
                                                        label={label}
                                                        isDark={isDark}
                                                        colorClass={val >= 0.7 ? 'bg-red-500' : val >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}
                                                    />
                                                );
                                            })}
                                            {Object.values(categories).every((v) => (v ?? 0) < 0.05) && (
                                                <p className={`text-[10px] italic ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Không có dữ liệu phân loại</p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPost(post)}
                                                className={`w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold transition ${
                                                    isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                                            </button>
                                            <div className="flex gap-2">
                                                {post.status !== 'active' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(post._id)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-600 text-white text-xs font-bold transition hover:bg-emerald-700 active:scale-[0.98]"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> {post.status === 'hidden' ? 'Khôi phục' : 'Duyệt'}
                                                    </button>
                                                )}
                                                {post.status !== 'hidden' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPost(post)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-red-600 text-white text-xs font-bold transition hover:bg-red-700 active:scale-[0.98]"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" /> Từ chối
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            <AdminPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={(p) => fetchPosts(p)}
            />
        </>
    )}

            {/* Detail Modal */}
            <ModerationDetailModal
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
                onApprove={handleApprove}
                onReject={handleReject}
                onResolveAppeal={handleResolveAppeal}
                isDark={isDark}
                actionLoading={actionLoading}
            />

            {/* Confirm Modal */}
            <ConfirmModal {...confirmModal} onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
        </div>
    );
}

export default ModerationAdmin;
