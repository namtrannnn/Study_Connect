import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Flag, Loader2, ShieldAlert, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { createReport } from '../../services/report.services';

const REASON_CATEGORIES = [
    { value: 'spam', label: 'Spam / Quảng cáo rác', desc: 'Nội dung quảng cáo, link rác, gửi lặp lại' },
    { value: 'violence', label: 'Nội dung bạo lực', desc: 'Hình ảnh hoặc mô tả bạo lực, nguy hiểm' },
    { value: 'harassment', label: 'Quấy rối / Bắt nạt', desc: 'Nhắm vào cá nhân, đe dọa, bắt nạt' },
    { value: 'hate_speech', label: 'Ngôn từ thù địch', desc: 'Kỳ thị về chủng tộc, giới tính, tôn giáo...' },
    { value: 'misinformation', label: 'Thông tin sai lệch', desc: 'Tin giả, thông tin gây hiểu nhầm' },
    { value: 'sexual_content', label: 'Nội dung 18+', desc: 'Nội dung khiêu dâm hoặc không phù hợp' },
    { value: 'other', label: 'Lý do khác', desc: 'Vi phạm không thuộc các danh mục trên' },
];

/**
 * @param {Object} props
 * @param {Function} props.onClose
 * @param {'post'|'comment'|'user'} props.targetType
 * @param {string} props.targetId
 */
function ReportModal({ onClose, targetType, targetId }) {
    const [step, setStep] = useState(1); // 1: chọn category, 2: mô tả thêm + confirm
    const [selectedCategory, setSelectedCategory] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSelectCategory = (value) => {
        setSelectedCategory(value);
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
        setReason('');
    };

    const handleSubmit = async () => {
        if (!selectedCategory) return;
        try {
            setLoading(true);
            const res = await createReport({
                target_type: targetType,
                target_id: targetId,
                reasonCategory: selectedCategory,
                reason: reason.trim(),
            });
            if (res?.code === 201) {
                toast.success(res.message || 'Đã gửi báo cáo thành công');
                onClose();
            } else {
                toast.error(res?.message || 'Gửi báo cáo thất bại');
            }
        } catch (err) {
            const msg = err?.response?.data?.message || 'Gửi báo cáo thất bại';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const selectedLabel = REASON_CATEGORIES.find((c) => c.value === selectedCategory)?.label || '';

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17191f]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top accent bar */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 via-orange-400 to-red-500" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 pt-6 pb-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                                aria-label="Quay lại"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" />
                            </button>
                        )}
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                {step === 1 ? 'Báo cáo vi phạm' : 'Xác nhận báo cáo'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {step === 1
                                    ? 'Chọn lý do phù hợp với nội dung vi phạm'
                                    : `Phân loại: ${selectedLabel}`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                        aria-label="Đóng"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Step 1: Chọn category */}
                {step === 1 && (
                    <ul className="divide-y divide-gray-100 px-2 py-2 dark:divide-white/5">
                        {REASON_CATEGORIES.map((cat) => (
                            <li key={cat.value}>
                                <button
                                    type="button"
                                    onClick={() => handleSelectCategory(cat.value)}
                                    className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {cat.label}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {cat.desc}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Step 2: Mô tả thêm + submit */}
                {step === 2 && (
                    <div className="px-5 py-5 space-y-4">
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/20 dark:bg-rose-500/10">
                            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                                <Flag className="h-3.5 w-3.5" />
                                {selectedLabel}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Mô tả thêm <span className="font-normal text-gray-400">(không bắt buộc)</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                maxLength={300}
                                rows={3}
                                placeholder="Cho chúng tôi biết thêm về vi phạm này..."
                                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                            />
                            <div className="mt-1 text-right text-xs text-gray-400">
                                {reason.length}/300
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Báo cáo của bạn sẽ được xem xét bởi đội ngũ kiểm duyệt. Chúng tôi sẽ không tiết lộ danh tính của bạn với người bị báo cáo.
                        </p>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white shadow transition hover:bg-rose-700 disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Flag className="h-4 w-4" />
                                    Gửi báo cáo
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}

export default ReportModal;
