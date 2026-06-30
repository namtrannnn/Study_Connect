import { useMemo, useState } from 'react';
import { X, Globe, Lock, Users, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import MessengerShareModal from './MessengerShareModal';

export default function ShareModal({
    open,
    onClose,
    post,
    currentUser,
    onShare, // optional callback
}) {
    const [caption, setCaption] = useState('');
    const [privacy, setPrivacy] = useState('ONLY_ME'); // PUBLIC | FRIENDS | ONLY_ME
    const [openMessenger, setOpenMessenger] = useState(false);

    const privacyMeta = useMemo(() => {
        if (privacy === 'PUBLIC') return { label: 'Công khai', Icon: Globe };
        if (privacy === 'FRIENDS') return { label: 'Bạn bè', Icon: Users };
        return { label: 'Chỉ mình tôi', Icon: Lock };
    }, [privacy]);

    // fake messenger list (sau nối API)
    const messengerList = useMemo(
        () => [
            { id: 'm1', name: 'ẩn danh', avatar: '' },
            { id: 'm2', name: 'Ngọc Linh', avatar: 'https://i.pravatar.cc/150?img=5' },
            { id: 'm3', name: 'Ae Cây Khế', avatar: 'https://i.pravatar.cc/150?img=15' },
            { id: 'm4', name: 'Nguyễn Minh', avatar: 'https://i.pravatar.cc/150?img=20' },
            { id: 'm5', name: 'Minh Anh', avatar: 'https://i.pravatar.cc/150?img=33' },
        ],
        [],
    );

    if (!open) return null;

    const { Icon } = privacyMeta;

    const handleShareNow = () => {
        // TODO: call API create shared post / send to feed
        toast('Đã chia sẻ 🎉');
        onShare?.({ caption, privacy, postId: post?.id });
        onClose?.();
    };

    return (
        <>
            {!openMessenger && (
                <div className="fixed inset-0 z-[9999]">
                    {/* overlay */}
                    <div className="absolute inset-0 bg-black/60" onClick={onClose} />

                    {/* modal */}
                    <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#242526] text-white shadow-xl border border-white/10 overflow-hidden">
                        {/* header */}
                        <div className="relative px-5 py-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold text-center">Chia sẻ</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* body top */}
                        <div className="px-5 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={currentUser?.avatar} />
                                    <AvatarFallback>{currentUser?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                    <div className="font-semibold leading-5 truncate">
                                        {currentUser?.fullName || 'User'}
                                    </div>

                                    <div className="mt-1 flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold"
                                            onClick={() => toast('Đang cập nhật: chọn nơi đăng')}
                                        >
                                            Bảng feed
                                        </button>

                                        <div className="relative">
                                            <button
                                                type="button"
                                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-semibold flex items-center gap-2"
                                                onClick={() => {
                                                    // toggle privacy nhanh (demo)
                                                    setPrivacy((p) =>
                                                        p === 'ONLY_ME'
                                                            ? 'FRIENDS'
                                                            : p === 'FRIENDS'
                                                              ? 'PUBLIC'
                                                              : 'ONLY_ME',
                                                    );
                                                }}
                                                title="Bấm để đổi quyền riêng tư (demo)"
                                            >
                                                <Icon className="w-4 h-4" />
                                                {privacyMeta.label}
                                                <ChevronDown className="w-4 h-4 opacity-80" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* caption */}
                            <div className="mt-4">
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Hãy nói gì đó về nội dung này..."
                                    className="w-full min-h-[92px] resize-none rounded-xl bg-transparent outline-none text-[15px] placeholder:text-white/50"
                                />
                            </div>

                            {/* share now */}
                            <div className="mt-3 flex justify-end">
                                <Button
                                    onClick={handleShareNow}
                                    className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700"
                                >
                                    Chia sẻ ngay
                                </Button>
                            </div>
                        </div>

                        {/* messenger row */}
                        <div className="px-5 py-4 border-b border-white/10">
                            <div onClick={() => setOpenMessenger(true)} className="font-semibold mb-3">
                                Gửi bằng Messenger
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {messengerList.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        className="shrink-0 w-[74px] text-center"
                                        onClick={() => setOpenMessenger(true)}
                                    >
                                        <div className="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                            {u.avatar ? (
                                                <img
                                                    src={u.avatar}
                                                    alt={u.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xl font-semibold">?</span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs text-white/80 truncate">{u.name}</div>
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="shrink-0 w-[74px] text-center"
                                    onClick={() => toast('Next (demo)')}
                                >
                                    <div className="mx-auto w-14 h-14 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center">
                                        <span className="text-xl">›</span>
                                    </div>
                                    <div className="mt-2 text-xs text-white/70">Xem thêm</div>
                                </button>
                            </div>
                        </div>

                        {/* share to */}
                        <div className="px-5 py-4">
                            <div className="font-semibold mb-3">Chia sẻ lên</div>

                            <div className="flex flex-wrap gap-3">
                                <ShareOption label="Messenger" onClick={() => setOpenMessenger(true)} />

                                <ShareOption label="WhatsApp" onClick={() => toast('WhatsApp (demo)')} />
                                <ShareOption
                                    label="Sao chép liên kết"
                                    onClick={async () => {
                                        try {
                                            const url = `${window.location.origin}/posts/${post?.id}`;
                                            await navigator.clipboard.writeText(url);
                                            toast('Đã sao chép liên kết');
                                        } catch {
                                            toast('Không thể sao chép liên kết');
                                        }
                                    }}
                                />
                                <ShareOption label="Nhóm" onClick={() => toast('Nhóm (demo)')} />
                                <ShareOption label="Trang cá nhân bạn bè" onClick={() => toast('Bạn bè (demo)')} />
                                <ShareOption label="X" onClick={() => toast('X (demo)')} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <MessengerShareModal
                open={openMessenger}
                onClose={() => setOpenMessenger(false)}
                onBack={() => setOpenMessenger(false)}
                post={post}
                currentUser={currentUser}
                friends={messengerList} // hoặc list bạn bè thật
                onSend={(payload) => console.log('send messenger payload:', payload)}
            />
        </>
    );
}

function ShareOption({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15"
        >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-sm">◎</span>
            </div>
            <div className="text-sm font-semibold">{label}</div>
        </button>
    );
}
