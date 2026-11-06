import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { changePassword } from '../../../services/user.services';
import { toast } from 'react-toastify';

export default function ChangePasswordModal({ isOpen, onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setSuccess(false);
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
            return;
        }

        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!currentPassword) {
            setError('Vui lòng nhập mật khẩu hiện tại');
            return;
        }
        if (!newPassword) {
            setError('Vui lòng nhập mật khẩu mới');
            return;
        }
        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        if (newPassword === currentPassword) {
            setError('Mật khẩu mới không được trùng với mật khẩu cũ');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        try {
            const res = await changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            if (res.code === 200) {
                setSuccess(true);
                toast.success('Đổi mật khẩu thành công!');
                setTimeout(() => {
                    onClose?.();
                }, 1200);
            } else {
                setError(res.message || 'Đổi mật khẩu thất bại, vui lòng thử lại');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) onClose?.();
            }}
        >
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#181b22]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Đổi mật khẩu</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Đổi mật khẩu thành công! Đang đóng cửa sổ...</span>
                        </div>
                    )}

                    {/* Mật khẩu hiện tại */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Mật khẩu hiện tại
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Nhập mật khẩu hiện tại"
                                disabled={loading || success}
                                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((v) => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showCurrent ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mật khẩu mới */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Mật khẩu mới
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Tối thiểu 6 ký tự"
                                disabled={loading || success}
                                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew((v) => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showNew ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                                disabled={loading || success}
                                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-white/10"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}

