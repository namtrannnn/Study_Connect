import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Loader2 } from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose, formData, onChange, onSave, saving }) {
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAvatarClick = () => fileInputRef.current?.click();

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-3 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
        >
            <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17191f]">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chỉnh sửa trang cá nhân</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-white/10 dark:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
                    {/* Avatar */}
                    <div className="mb-6 flex flex-col items-center gap-3">
                        <div className="relative">
                            <img
                                src={formData.avatar || 'https://i.pravatar.cc/150?img=3'}
                                alt="avatar"
                                className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md dark:ring-white/10"
                            />
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
                            >
                                <Camera size={14} />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="avatar"
                            accept="image/*"
                            onChange={onChange}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Nhấn vào icon để đổi ảnh đại diện</p>
                    </div>

                    <div className="space-y-4">
                        {/* Tên hiển thị */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Tên hiển thị
                            </label>
                            <input
                                name="fullName"
                                value={formData.fullName || ''}
                                onChange={onChange}
                                placeholder="Tên của bạn"
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#20232b]"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Username
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
                                <input
                                    name="username"
                                    value={formData.username || ''}
                                    onChange={onChange}
                                    placeholder="username"
                                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-8 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#20232b]"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Bio
                            </label>
                            <textarea
                                name="bio"
                                rows={3}
                                value={formData.bio || ''}
                                onChange={onChange}
                                placeholder="Giới thiệu về bản thân..."
                                maxLength={150}
                                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#20232b]"
                            />
                            <p className="mt-1 text-right text-xs text-gray-400">
                                {(formData.bio || '').length}/150
                            </p>
                        </div>

                        {/* Riêng tư */}
                        <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tài khoản riêng tư</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Chỉ bạn bè mới xem được bài viết</p>
                            </div>
                            <div
                                onClick={() => onChange({ target: { name: 'isPrivate', type: 'checkbox', checked: !formData.isPrivate } })}
                                className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${formData.isPrivate ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/20'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-gray-100 px-5 py-4 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
