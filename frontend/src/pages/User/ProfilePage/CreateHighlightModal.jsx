import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { createHighlight } from '../../../services/story.services';

export default function CreateHighlightModal({
    isOpen,
    onClose,
    selectedStoryIds = [],
    selectedStories = [],
    onCreated,
    onSuccess,
}) {
    const [title, setTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const actualStoryIds = selectedStoryIds.length > 0 ? selectedStoryIds : selectedStories;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.warn('Vui lòng nhập tên cho tin nổi bật');
            return;
        }
        if (actualStoryIds.length === 0) {
            toast.warn('Vui lòng chọn ít nhất 1 story');
            return;
        }

        try {
            setSubmitting(true);
            const res = await createHighlight({
                title: title.trim(),
                storyIds: actualStoryIds,
                coverImage: '',
            });
            if (res.code === 201) {
                toast.success('Tạo tin nổi bật thành công!');
                onCreated?.(res.data);
                onSuccess?.(res.data);
                onClose();
                setTitle('');
            }
        } catch (err) {
            console.error('createHighlight error:', err);
            toast.error('Không thể tạo tin nổi bật');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200 dark:border-white/15 p-6 space-y-5 animate-scaleUp"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-amber-500" size={20} />
                        <h3 className="text-base font-bold">Tạo Tin Nổi Bật</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-slate-100 dark:bg-white/10 p-1.5 text-slate-500 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/20 transition cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5">
                            Tên tin nổi bật
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Góc Học Tập, Kỷ Niệm..."
                            maxLength={50}
                            autoFocus
                            className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                        <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 text-right">
                            {title.length}/50
                        </p>
                    </div>

                    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-3">
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            📌 {actualStoryIds.length} story đã được chọn
                        </p>
                        <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/60 mt-0.5">
                            Ảnh bìa sẽ được tự động lấy từ story đầu tiên
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !title.trim()}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-40 cursor-pointer"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {submitting ? 'Đang tạo...' : 'Tạo Tin Nổi Bật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
