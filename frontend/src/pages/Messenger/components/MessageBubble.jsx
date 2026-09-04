import { useState } from 'react';
import { MoreHorizontal, Trash2, RotateCcw, UserRound } from 'lucide-react';
import { formatTime } from '../helpers';
import { revokeMessage, deleteMessageForMe, reactToMessage } from '../../../services/chatServices';
import { toast } from 'react-toastify';

const QUICK_REACTIONS = ['❤️', '😆', '😮', '😢', '😡', '👍'];

function renderSystemContent(content) {
    const daIdx = content.indexOf(' đã ');
    if (daIdx <= 0) return content;
    const actorName = content.slice(0, daIdx);
    const rest = content.slice(daIdx);
    const bold = (t) => <strong key={t} className="font-semibold text-gray-700 dark:text-gray-200">{t}</strong>;

    const choIdx = rest.indexOf(' cho ');
    const themIdx = rest.indexOf(' thêm ');
    const xoaIdx = rest.indexOf(' xóa ');

    if (choIdx > 0) return <>{bold(actorName)}{rest.slice(0, choIdx + 5)}{bold(rest.slice(choIdx + 5))}</>;
    if (themIdx > 0) {
        const after = rest.slice(themIdx + 6);
        const vaoIdx = after.indexOf(' vào ');
        if (vaoIdx > 0) return <>{bold(actorName)}{rest.slice(0, themIdx + 6)}{bold(after.slice(0, vaoIdx))}{after.slice(vaoIdx)}</>;
    }
    if (xoaIdx > 0) {
        const after = rest.slice(xoaIdx + 5);
        const khoiIdx = after.indexOf(' khỏi ');
        if (khoiIdx > 0) return <>{bold(actorName)}{rest.slice(0, xoaIdx + 5)}{bold(after.slice(0, khoiIdx))}{after.slice(khoiIdx)}</>;
    }
    return <>{bold(actorName)}{rest}</>;
}

function MessageBubble({
    message,
    isMe,
    sender,
    isGroup,
    myStyle,
    otherStyle,
    alwaysShowTime = false,
    onRevoked,
    onDeletedForMe,
    onReacted,
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState('');

    const hasImages = message.images?.length > 0;
    const hasText = Boolean(message.content);
    const imageCount = message.images?.length || 0;

    const handleRevoke = async () => {
        setShowMenu(false);
        try {
            setLoading('revoke');
            await revokeMessage(message._id);
            onRevoked?.(message._id);
        } catch {
            toast.error('Thu hồi thất bại');
        } finally {
            setLoading('');
        }
    };

    const handleDeleteForMe = async () => {
        setShowMenu(false);
        try {
            setLoading('delete');
            await deleteMessageForMe(message._id);
            onDeletedForMe?.(message._id);
        } catch {
            toast.error('Xóa thất bại');
        } finally {
            setLoading('');
        }
    };

    const handleReact = async (emoji) => {
        try {
            const res = await reactToMessage(message._id, emoji);
            onReacted?.(message._id, res?.data?.reactions);
        } catch {
            toast.error('Không thể thả cảm xúc');
        }
    };

    const MenuButton = () => (
        <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
                type="button"
                onClick={() => setShowMenu((p) => !p)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
            >
                <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {showMenu && (
                <div
                    className={`absolute bottom-8 z-50 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#1e2028] ${isMe ? 'right-0' : 'left-0'}`}
                    onMouseLeave={() => setShowMenu(false)}
                >
                    {isMe && (
                        <button
                            type="button"
                            onClick={handleRevoke}
                            disabled={loading === 'revoke'}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Thu hồi
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleDeleteForMe}
                        disabled={loading === 'delete'}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa phía tôi
                    </button>
                </div>
            )}
        </div>
    );

    if (message.type === 'system') {
        return (
            <div className="msg-system flex justify-center py-1">
                <div className="rounded-full bg-white/80 px-4 py-1.5 text-xs text-gray-500 shadow-sm backdrop-blur-sm dark:bg-white/10 dark:text-gray-300">
                    {renderSystemContent(message.content || '')}
                </div>
            </div>
        );
    }

    if (message.revoked) {
        return (
            <div className={`${isMe ? 'msg-me' : 'msg-other'} flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10">
                        {sender?.avatar
                            ? <img src={sender.avatar} alt={sender.fullName} className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center text-primary"><UserRound className="h-4 w-4" /></div>}
                    </div>
                )}
                <div className={`rounded-3xl border px-4 py-2.5 text-sm italic opacity-60 ${isMe ? 'rounded-br-md border-primary/20 bg-primary/5 text-primary' : 'rounded-bl-md border-blue-100 bg-white text-gray-500 dark:border-white/10 dark:bg-[#181b22]'}`}>
                    Tin nhắn đã được thu hồi
                </div>
            </div>
        );
    }

    return (
        <div className={`${isMe ? 'msg-me' : 'msg-other'} group flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar người khác */}
            {!isMe && (
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-2 ring-white dark:ring-[#181b22]">
                    {sender?.avatar
                        ? <img src={sender.avatar} alt={sender.fullName} className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center text-primary"><UserRound className="h-4 w-4" /></div>}
                </div>
            )}

            {/* Menu bên trái bubble (tin của mình) */}
            {isMe && <MenuButton />}

            {/* Bubble content */}
            <div className={`flex max-w-[68%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && isGroup && (
                    <div className="px-1 text-xs font-semibold text-primary/80">{sender?.fullName || 'Người dùng'}</div>
                )}

                {message.reply_to && (
                    <div className={`max-w-full rounded-2xl border-l-4 px-3 py-2 text-xs ${isMe ? 'border-white/60 bg-primary/20 text-white/80' : 'border-primary/40 bg-blue-50/80 text-gray-600 dark:bg-white/5 dark:text-gray-300'}`}>
                        <div className="mb-0.5 font-semibold">{message.reply_to.user_id?.fullName || 'Tin nhắn'}</div>
                        <div className="line-clamp-1 opacity-80">
                            {message.reply_to.revoked ? 'Tin nhắn đã được thu hồi' : message.reply_to.content || '📷 Hình ảnh'}
                        </div>
                    </div>
                )}

                {hasImages && (
                    <div className={`overflow-hidden rounded-2xl ${imageCount === 1 ? 'max-w-[220px]' : 'grid grid-cols-2 gap-1 max-w-[260px]'}`}>
                        {message.images.map((img, i) => (
                            <img
                                key={img.public_id || img.url || i}
                                src={img.url}
                                alt="message"
                                onLoad={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
                                className={`msg-image cursor-pointer rounded-xl object-cover ${imageCount === 1 ? 'h-auto max-h-64 w-full' : 'h-28 w-full'}`}
                            />
                        ))}
                    </div>
                )}

                {hasText && (
                    <div
                        className={`relative rounded-[20px] px-3.5 py-2 text-sm leading-snug shadow-sm ${isMe ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm border border-blue-100 bg-white text-gray-900 dark:border-white/10 dark:bg-[#181b22] dark:text-white'}`}
                        style={isMe ? myStyle : otherStyle}
                    >
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        {message.reactions?.length > 0 && (
                            <div className={`-mb-1 mt-1.5 flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {message.reactions.slice(0, 5).map((r, i) => (
                                    <span key={`${r.user_id}-${r.emoji}-${i}`} className="reaction-pop inline-flex items-center rounded-full bg-white/20 px-1.5 py-0.5 text-xs backdrop-blur-sm dark:bg-black/20">
                                        {r.emoji}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className={`flex items-center px-1 transition-opacity duration-150 ${alwaysShowTime ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[11px] text-gray-400">{formatTime(message.createdAt)}</span>
                </div>

                {/* Quick reaction bar — hiện khi hover */}
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {QUICK_REACTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReact(emoji)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-base transition hover:scale-125 hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu bên phải bubble (tin của người khác) */}
            {!isMe && <MenuButton />}

            {isMe && <div className="w-8 shrink-0" />}
        </div>
    );
}

export default MessageBubble;
