import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Loader2, Plus, Trash2, Globe, Link2, Sparkles, BookOpen } from 'lucide-react';

const fieldsList = [
    { value: 'technology', label: 'Công nghệ' },
    { value: 'finance_banking', label: 'Tài chính - Ngân hàng' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'design', label: 'Thiết kế' },
    { value: 'business', label: 'Kinh doanh' },
    { value: 'language', label: 'Ngoại ngữ' },
    { value: 'education', label: 'Giáo dục' },
    { value: 'science', label: 'Khoa học' },
    { value: 'startup', label: 'Khởi nghiệp' },
    { value: 'art', label: 'Nghệ thuật' },
    { value: 'music', label: 'Âm nhạc' },
    { value: 'health', label: 'Sức khỏe' },
    { value: 'other', label: 'Khác' }
];

const linkTypes = [
    { value: 'github', label: 'GitHub' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'behance', label: 'Behance' },
    { value: 'figma', label: 'Figma' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'website', label: 'Website' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'other', label: 'Khác' }
];

export default function EditProfileModal({ isOpen, onClose, formData, onChange, onLinksChange, onSave, saving }) {
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'academic'

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAvatarClick = () => fileInputRef.current?.click();

    // Portfolio link helpers
    const addLink = () => {
        const updated = [...(formData.portfolioLinks || []), { title: '', url: '', type: 'website' }];
        onLinksChange(updated);
    };

    const removeLink = (index) => {
        const updated = (formData.portfolioLinks || []).filter((_, idx) => idx !== index);
        onLinksChange(updated);
    };

    const updateLink = (index, field, value) => {
        const updated = (formData.portfolioLinks || []).map((link, idx) => {
            if (idx === index) return { ...link, [field]: value };
            return link;
        });
        onLinksChange(updated);
    };

    // Toggle interest items
    const handleInterestToggle = (value) => {
        const currentInterests = formData.interests || [];
        let updated;
        if (currentInterests.includes(value)) {
            updated = currentInterests.filter(i => i !== value);
        } else {
            updated = [...currentInterests, value];
        }
        onChange({ target: { name: 'interests', value: updated } });
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-3 py-6 backdrop-blur-sm overflow-y-auto"
            onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
        >
            <div className="relative w-full max-w-xl my-auto overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#12141c]">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chỉnh sửa hồ sơ cá nhân</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Tùy biến thương hiệu cá nhân của bạn</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-white/5 dark:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tab select */}
                <div className="flex border-b border-gray-100 px-6 bg-slate-50/50 dark:bg-white/5 dark:border-white/5">
                    <button 
                        onClick={() => setActiveTab('basic')}
                        className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'basic' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400'}`}>
                        <Globe size={15} /> Thông tin cơ bản
                    </button>
                    <button 
                        onClick={() => setActiveTab('academic')}
                        className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'academic' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400'}`}>
                        <BookOpen size={15} /> Học tập & Liên kết
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-5">
                    {activeTab === 'basic' && (
                        <>
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-3 py-2">
                                <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                                    <img
                                        src={formData.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                        alt="avatar"
                                        className="h-24 w-24 rounded-[24px] object-cover ring-4 ring-white shadow-md group-hover:brightness-90 transition dark:ring-white/10"
                                    />
                                    <div className="absolute inset-0 bg-black/20 rounded-[24px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <Camera size={20} className="text-white" />
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="avatar"
                                    accept="image/*"
                                    onChange={onChange}
                                    className="hidden"
                                />
                                <p className="text-[11px] font-medium text-gray-400">Định dạng PNG, JPG. Dung lượng tối đa 5MB</p>
                            </div>

                            {/* Name fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Họ và tên
                                    </label>
                                    <input
                                        name="fullName"
                                        value={formData.fullName || ''}
                                        onChange={onChange}
                                        placeholder="Họ và tên"
                                        className="w-full rounded-xl border border-gray-200/80 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:bg-[#1a1d24]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
                                        <input
                                            name="username"
                                            value={formData.username || ''}
                                            onChange={onChange}
                                            placeholder="username"
                                            className="w-full rounded-xl border border-gray-200/80 bg-gray-50 py-2.5 pl-8 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:bg-[#1a1d24]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Tiểu sử ngắn (Bio)
                                </label>
                                <textarea
                                    name="bio"
                                    rows={3}
                                    value={formData.bio || ''}
                                    onChange={onChange}
                                    placeholder="Giới thiệu nhanh về bản thân..."
                                    maxLength={150}
                                    className="w-full resize-none rounded-xl border border-gray-200/80 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:bg-[#1a1d24]"
                                />
                                <p className="mt-1 text-right text-xs text-gray-400 font-bold">
                                    {(formData.bio || '').length}/150
                                </p>
                            </div>

                            {/* Privacy toggle */}
                            <div className="flex items-center justify-between rounded-2xl border border-gray-200/80 p-4 dark:border-white/5 dark:bg-white/5">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Tài khoản riêng tư</p>
                                    <p className="text-xs text-gray-400">Chỉ bạn bè được phép xem hoạt động học tập</p>
                                </div>
                                <div
                                    onClick={() => onChange({ target: { name: 'isPrivate', type: 'checkbox', checked: !formData.isPrivate } })}
                                    className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${formData.isPrivate ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/10'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'academic' && (
                        <>
                            {/* Headline */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Sparkles size={13} /> Dòng giới thiệu nhanh (Headline)
                                </label>
                                <input
                                    name="headline"
                                    value={formData.headline || ''}
                                    onChange={onChange}
                                    placeholder="Ví dụ: Sinh viên Khoa học Máy tính @ HUST"
                                    className="w-full rounded-xl border border-gray-200/80 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:bg-[#1a1d24]"
                                />
                            </div>

                            {/* Field of Study */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Ngành học chính (Lĩnh vực)
                                </label>
                                <select
                                    name="fieldOfStudy"
                                    value={formData.fieldOfStudy || 'other'}
                                    onChange={onChange}
                                    className="w-full rounded-xl border border-gray-200/80 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:bg-[#1a1d24]"
                                >
                                    {fieldsList.map((f) => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Skills */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Kỹ năng cá nhân (phân cách bằng dấu phẩy)
                                </label>
                                <input
                                    name="skills"
                                    value={formData.skills || ''}
                                    onChange={onChange}
                                    placeholder="Ví dụ: React, Node.js, Python, Figma"
                                    className="w-full rounded-xl border border-gray-200/80 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:bg-[#1a1d24]"
                                />
                            </div>

                            {/* Interests (Checkbox items) */}
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Lĩnh vực quan tâm học tập
                                </label>
                                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-slate-100 rounded-xl bg-slate-50/50 dark:bg-white/5 dark:border-white/5">
                                    {fieldsList.map((f) => {
                                        const isSelected = (formData.interests || []).includes(f.value);
                                        return (
                                            <button
                                                key={f.value}
                                                type="button"
                                                onClick={() => handleInterestToggle(f.value)}
                                                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white hover:bg-slate-50 dark:bg-[#1b1d24] dark:hover:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-300 dark:border-white/5'}`}
                                            >
                                                {f.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Portfolio Links (dynamic list manager) */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Link2 size={13} /> Portfolio & Liên kết ngoài
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addLink}
                                        className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-500 hover:text-blue-600"
                                    >
                                        <Plus size={14} /> Thêm link
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-48 overflow-y-auto p-1 bg-slate-50/30 rounded-xl dark:bg-white/5">
                                    {(formData.portfolioLinks || []).length === 0 ? (
                                        <p className="text-xs text-center text-gray-400 py-3">Chưa có liên kết nào.</p>
                                    ) : (
                                        formData.portfolioLinks.map((link, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-white dark:bg-[#1a1d24] p-3 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                                                <select
                                                    value={link.type || 'website'}
                                                    onChange={(e) => updateLink(idx, 'type', e.target.value)}
                                                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold outline-none dark:border-white/5 dark:bg-[#12141c] dark:text-white"
                                                >
                                                    {linkTypes.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                
                                                <input
                                                    type="text"
                                                    value={link.title || ''}
                                                    placeholder="Tên web (VD: Github)"
                                                    onChange={(e) => updateLink(idx, 'title', e.target.value)}
                                                    className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs outline-none dark:border-white/5 dark:bg-[#12141c] dark:text-white"
                                                />
                                                
                                                <input
                                                    type="text"
                                                    value={link.url || ''}
                                                    placeholder="Link URL"
                                                    onChange={(e) => updateLink(idx, 'url', e.target.value)}
                                                    className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs outline-none dark:border-white/5 dark:bg-[#12141c] dark:text-white"
                                                />
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => removeLink(idx)}
                                                    className="text-red-400 hover:text-red-500 shrink-0 p-1 hover:bg-red-50 rounded-lg dark:hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition dark:border-white/5 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-cyan-600 transition disabled:opacity-60"
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
