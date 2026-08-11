import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { useAdminTheme } from '../../layout/Admin/index.jsx';


function ConfirmModal({
    isOpen,
    title = 'Xác nhận thao tác',
    message = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    type = 'danger', // 'danger' | 'warning' | 'info'
    loading = false,
    onConfirm,
    onClose,
}) {
    const themeCtx = useAdminTheme();
    const isDark = themeCtx ? themeCtx.isDark : true;

    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    iconBg: 'bg-rose-500/20 text-rose-500 border-rose-500/30',
                    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20',
                    icon: <Trash2 className="h-6 w-6" />,
                };
            case 'warning':
                return {
                    iconBg: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
                    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20',
                    icon: <AlertTriangle className="h-6 w-6" />,
                };
            default:
                return {
                    iconBg: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
                    confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20',
                    icon: <Info className="h-6 w-6" />,
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl space-y-5 ${
                    isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'
                }`}
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${styles.iconBg}`}>
                            {styles.icon}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base leading-snug">{title}</h3>
                            <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{message}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                            isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onClose}
                        className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
                            isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        } disabled:opacity-50`}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${styles.confirmBtn} disabled:opacity-50`}
                    >
                        {loading && (
                            <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
