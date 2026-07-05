import { useEffect, useState } from 'react';

const bgOptions = ['bg-orange-100', 'bg-amber-100', 'bg-pink-100', 'bg-violet-100', 'bg-sky-100', 'bg-emerald-100'];

export default function CreateStoryModal({ isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        label: '',
        cover: '',
        bg: 'bg-orange-100',
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                label: '',
                cover: '',
                bg: 'bg-orange-100',
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = () => {
        if (!formData.label.trim()) return;
        onSave({
            label: formData.label.trim(),
            cover: formData.cover.trim(),
            bg: formData.bg,
        });
    };

    return (
        <div
            className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={onClose}
        >
            <div
                className="modal-slide-down custom-scrollbar-hide w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Tạo tin mới</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full px-3 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Tên tin</label>
                        <input
                            name="label"
                            value={formData.label}
                            onChange={handleChange}
                            placeholder="Ví dụ: Du lịch, Cafe, OOTD..."
                            className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Ảnh bìa URL</label>
                        <input
                            name="cover"
                            value={formData.cover}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Màu nền dự phòng</label>
                        <div className="flex flex-wrap gap-3">
                            {bgOptions.map((bg) => (
                                <button
                                    key={bg}
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, bg }))}
                                    className={`h-10 w-10 rounded-full border-2 ${bg} ${
                                        formData.bg === bg ? 'border-neutral-900' : 'border-transparent'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Xem trước</label>
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-neutral-200 shadow-sm ${
                                    formData.bg
                                }`}
                            >
                                {formData.cover ? (
                                    <img src={formData.cover} alt="preview" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-sm font-medium text-neutral-600">
                                        {formData.label ? formData.label[0].toUpperCase() : '+'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-neutral-900">
                                    {formData.label || 'Tên tin mới'}
                                </div>
                                <div className="text-xs text-neutral-500">Highlight preview</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-xl border px-5 py-2 text-sm hover:bg-neutral-100">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="rounded-xl bg-black px-6 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        Tạo tin
                    </button>
                </div>
            </div>
        </div>
    );
}
