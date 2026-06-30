import { useEffect } from 'react';

export default function EditProfileModal({ isOpen, onClose, formData, onChange, onSave }) {
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

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={onClose}
        >
            <div
                className="modal-slide-down custom-scrollbar-hide w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl bg-white p-6 shadow-2xl md:p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Chỉnh sửa trang cá nhân</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full px-3 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
                    >
                        ✕
                    </button>
                </div>

                <div className="mb-6 flex items-center gap-4">
                    <img src={formData.avatar} alt="avatar" className="h-16 w-16 rounded-full border object-cover" />
                    <div className="text-sm text-neutral-500">Ảnh đại diện (URL)</div>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Tên hiển thị</label>
                            <input
                                name="fullName"
                                value={formData.fullName}
                                onChange={onChange}
                                className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Username</label>
                            <input
                                name="username"
                                value={formData.username}
                                onChange={onChange}
                                className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Nghề nghiệp</label>
                        <input
                            name="category"
                            value={formData.category}
                            onChange={onChange}
                            className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Bio</label>
                        <textarea
                            name="bio"
                            rows="3"
                            value={formData.bio}
                            onChange={onChange}
                            className="w-full resize-none rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Địa điểm</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={onChange}
                                className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Tagline</label>
                            <input
                                name="tagline"
                                value={formData.tagline}
                                onChange={onChange}
                                className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Website</label>
                        <input
                            name="website"
                            value={formData.website}
                            onChange={onChange}
                            className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Avatar URL</label>
                        <input
                            name="avatar"
                            value={formData.avatar}
                            onChange={onChange}
                            className="w-full rounded-xl border px-4 py-2.5 outline-none focus:border-black"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-xl border px-5 py-2 text-sm hover:bg-neutral-100">
                        Hủy
                    </button>
                    <button
                        onClick={onSave}
                        className="rounded-xl bg-black px-6 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}
