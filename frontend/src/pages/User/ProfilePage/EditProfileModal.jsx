import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Loader2, Lock, Globe } from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose, formData, onChange, onSave, saving }) {
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('Ảnh không được vượt quá 5MB');
            return;
        }
        onChange('avatarFile', file);
        onChange('avatar', URL.createObjectURL(file));
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !saving) onClose?.();
            }}
        >
            <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#181b22]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chỉnh sửa hồ sơ</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="group relative">
                            <img
                                src={
                                    formData.avatar ||
                                    'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'
                                }
                                alt="Avatar"
                                className="h-24 w-24 rounded-full border-4 border-gray-100 object-cover dark:border-white/10"
                            />
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100"
                            >
                                <Camera className="h-6 w-6 text-white" />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
                        >
                            Đổi ảnh đại diện
                        </button>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Tên hiển thị
                        </label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => onChange('fullName', e.target.value)}
                            maxLength={50}
                            placeholder="Tên hiển thị của bạn"
                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                                @
                            </span>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => onChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                                maxLength={30}
                                placeholder="username"
                                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50/80 pl-8 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Privacy Toggle */}
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 p-4 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            {formData.isPrivate ? (
                                <Lock className="h-5 w-5 text-amber-500" />
                            ) : (
                                <Globe className="h-5 w-5 text-blue-500" />
                            )}
                            <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formData.isPrivate ? 'Tài khoản riêng tư' : 'Tài khoản công khai'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formData.isPrivate
                                        ? 'Chỉ người theo dõi mới xem được bài viết'
                                        : 'Mọi người đều có thể xem bài viết của bạn'}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={formData.isPrivate}
                            onClick={() => onChange('isPrivate', !formData.isPrivate)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                formData.isPrivate ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/20'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    formData.isPrivate ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-white/10"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
