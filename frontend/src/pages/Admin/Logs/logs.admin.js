import { useEffect, useState } from 'react';
import { History, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminActivityLogs } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';

function LogsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAdminActivityLogs({ page, limit: 15 });
            if (res?.code === 200) {
                setLogs(res.data.logs || []);
                setPagination(res.data.pagination || { page: 1, limit: 15, totalPages: 1, total: 0 });
            } else {
                toast.error(res?.message || 'Không thể tải nhật ký');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải nhật ký');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, []);

    const actionPillStyle = (action) => {
        if (action.includes('ban') || action.includes('delete')) return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
        if (action.includes('hide') || action.includes('blacklist')) return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
        return 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30';
    };

    return (
        <div className="space-y-6">
            <div className={`flex items-center justify-between gap-4 rounded-3xl border p-6 backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-500">
                        <History className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Nhật ký Thao tác Hệ thống (Audit Log)</h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Ghi nhận toàn bộ các thao tác quản trị của Ban Quản Trị theo mốc thời gian</p>
                    </div>
                </div>

                <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    Tổng số bản ghi: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pagination.total}</span>
                </div>
            </div>

            <div className={`overflow-hidden rounded-3xl border backdrop-blur-xl shadow-2xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white'}`}>
                {loading ? (
                    <div className="py-16 text-center text-gray-400">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                        <p className="mt-2 font-medium">Đang tải nhật ký thao tác...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-16 text-center text-xs text-gray-400">Chưa có nhật ký thao tác nào.</div>
                ) : (
                    <div className={`divide-y p-4 ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                        {logs.map((log) => {
                            const admin = log.admin_id;

                            return (
                                <div key={log._id} className={`flex items-start justify-between gap-4 p-4 transition rounded-2xl ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-start gap-3 min-w-0">
                                        <img
                                            src={admin?.avatar || 'https://via.placeholder.com/150'}
                                            alt="Admin Avatar"
                                            className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-2 ring-indigo-500/40"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{admin?.fullName || 'Admin'}</span>
                                                <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>(@{admin?.username || 'admin'})</span>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${actionPillStyle(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </div>
                                            <p className={`mt-1 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{log.details}</p>
                                        </div>
                                    </div>

                                    <div className={`flex shrink-0 items-center gap-1 text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between border-t px-6 py-4 text-xs font-semibold ${isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                        <span>Trang {pagination.page} / {pagination.totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pagination.page <= 1 || loading}
                                onClick={() => fetchLogs(pagination.page - 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                                    isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                } disabled:opacity-30`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                disabled={pagination.page >= pagination.totalPages || loading}
                                onClick={() => fetchLogs(pagination.page + 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                                    isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                } disabled:opacity-30`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LogsAdmin;
