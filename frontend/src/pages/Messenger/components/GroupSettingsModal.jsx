import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import roomChatApi from '../roomChatApi';
import { getRoomId } from '../helpers';
import { toast } from 'react-toastify';

function GroupSettingsModal({ room, onClose, onRoomUpdated }) {
    const settings = room?.groupSettings || {};
    const [form, setForm] = useState({
        onlyAdminCanAddMember: settings.onlyAdminCanAddMember ?? true,
        onlyAdminCanChangeInfo: settings.onlyAdminCanChangeInfo ?? true,
        onlyAdminCanChangeTheme: settings.onlyAdminCanChangeTheme ?? false,
        onlyAdminCanSendMessage: settings.onlyAdminCanSendMessage ?? false,
    });
    const [loading, setLoading] = useState(false);

    const toggle = (key) => setForm((p) => ({ ...p, [key]: !p[key] }));

    const handleSave = async () => {
        try {
            setLoading(true);
            const res = await roomChatApi.updateGroupSettings(getRoomId(room), form);
            onRoomUpdated(res.data?.data?.room || res.data?.room || res.data);
            toast.success('Đã cập nhật cài đặt nhóm');
            onClose();
        } catch {
            toast.error('Cập nhật thất bại');
        } finally {
            setLoading(false);
        }
    };

    const options = [
        { key: 'onlyAdminCanSendMessage', label: 'Chỉ admin được nhắn tin', desc: 'Thành viên thường không thể gửi tin nhắn' },
        { key: 'onlyAdminCanAddMember', label: 'Chỉ admin được thêm thành viên', desc: 'Thành viên thường không thể thêm người vào nhóm' },
        { key: 'onlyAdminCanChangeInfo', label: 'Chỉ admin được đổi tên/ảnh nhóm', desc: 'Thành viên thường không thể thay đổi thông tin nhóm' },
        { key: 'onlyAdminCanChangeTheme', label: 'Chỉ admin được đổi giao diện', desc: 'Thành viên thường không thể thay đổi theme' },
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#181b22]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4 dark:border-white/10">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Cài đặt nhóm</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="divide-y divide-blue-50 px-5 dark:divide-white/5">
                    {options.map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between gap-4 py-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                                <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={form[key]}
                                onClick={() => toggle(key)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                    form[key] ? 'bg-primary' : 'bg-gray-200 dark:bg-white/20'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                                        form[key] ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="border-t border-blue-100 px-5 py-4 dark:border-white/10">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Lưu cài đặt'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default GroupSettingsModal;
