import { useEffect, useMemo, useRef, useState } from 'react';
import { X, MoreHorizontal, Heart, SendHorizontal, MessageCircle, Pencil, Trash2, Bookmark, ChevronDown, ChevronUp, CornerDownRight, Loader2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import { createPortal } from 'react-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { toast } from 'react-toastify';
import * as CommentServices from '../../services/comment.services';
import * as PostServices from '../../services/posts.services';
import { registerPostCommentSocketEvents, unregisterPostCommentSocketEvents } from '../../sockets/postComment.socket';

/* ───────── helpers ───────── */
function timeAgo(dateStr) {
    if (!dateStr) return 'Vừa xong';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

/* ───────── Skeleton ───────── */
function CommentSkeleton() {
    return (
        <div className="space-y-5 px-1">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-white/[.06]" />
                    <div className="flex-1 space-y-2 pt-0.5">
                        <div className="h-3.5 w-28 rounded-md bg-slate-200 dark:bg-white/[.06]" />
                        <div className="h-3.5 w-full rounded-md bg-slate-100 dark:bg-white/[.04]" />
                        <div className="h-3 w-20 rounded-md bg-slate-100 dark:bg-white/[.04]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ───────── Single comment ───────── */
function CommentItem({
    comment,
    currentUser,
    postAuthorId,
    likedCommentIds,
    commentLikeCounts,
    expandedReplies,
    loadingReplies,
    editingCommentId,
    editingContent,
    setEditingContent,
    openCommentMenuId,
    savingEdit,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDelete,
    onLikeComment,
    onToggleReplies,
    onReply,
    onMenuToggle,
    isReply = false,
}) {
    const authorName = comment?.user?.fullName || comment?.user?.name || 'Người dùng';
    const username = comment?.user?.username || authorName;
    const currentUserId = currentUser?._id || currentUser?.id;
    const commentUserId = comment?.user?._id || comment?.user?.id;
    const isMyComment = String(commentUserId) === String(currentUserId);
    const isPostOwner = String(postAuthorId) === String(currentUserId);
    const canManage = isMyComment || isPostOwner;
    const commentId = comment._id?.toString();
    const isEditing = editingCommentId === comment._id;

    return (
        <div className={`group/comment flex items-start gap-3 ${isReply ? '' : ''}`}>
            {/* Avatar */}
            <div className="relative shrink-0">
                <Avatar className={`${isReply ? 'h-8 w-8' : 'h-9 w-9'} ring-2 ring-white dark:ring-white/5`}>
                    <AvatarImage src={comment?.user?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-[11px] font-bold text-white">
                        {authorName?.charAt(0) || 'U'}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Body */}
            <div className="min-w-0 flex-1">
                {isEditing ? (
                    <div className="mt-0.5">
                        <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            autoFocus
                            rows={2}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-indigo-500/20"
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') onCancelEdit();
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSaveEdit(comment._id);
                                }
                            }}
                        />
                        <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => onSaveEdit(comment._id)}
                                disabled={savingEdit || !editingContent.trim()}
                                className="rounded-lg bg-indigo-500 px-3 py-1.5 text-white transition hover:bg-indigo-600 disabled:opacity-40"
                            >
                                {savingEdit ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                                type="button"
                                onClick={onCancelEdit}
                                className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-white/[.04]">
                        <p className="text-[13px] leading-[1.65]">
                            <span className="mr-1.5 font-bold text-slate-900 dark:text-white">{username}</span>

                            {comment?.replyToUser?.username && (
                                <span className="mr-1 font-semibold text-indigo-500">
                                    @{comment.replyToUser.username}{' '}
                                </span>
                            )}

                            <span className="text-slate-700 dark:text-slate-300">{comment?.content}</span>

                            {comment?.isEdited && (
                                <span className="ml-1.5 text-[11px] italic text-slate-400">(đã sửa)</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Meta row */}
                {!isEditing && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 pl-1 text-[11px] font-semibold text-slate-400">
                        <span>{timeAgo(comment?.createdAt)}</span>

                        <button
                            type="button"
                            onClick={() => onReply(comment)}
                            className="transition hover:text-indigo-500"
                        >
                            Trả lời
                        </button>

                        {!isReply && (comment?.repliesCount || 0) > 0 && (
                            <button
                                type="button"
                                onClick={() => onToggleReplies(comment)}
                                className="flex items-center gap-1 text-indigo-500 transition hover:text-indigo-600"
                            >
                                {loadingReplies.has(comment._id) ? (
                                    <Loader2 size={11} className="animate-spin" />
                                ) : expandedReplies.has(comment._id) ? (
                                    <ChevronUp size={12} />
                                ) : (
                                    <ChevronDown size={12} />
                                )}
                                {loadingReplies.has(comment._id)
                                    ? 'Đang tải...'
                                    : expandedReplies.has(comment._id)
                                      ? 'Ẩn phản hồi'
                                      : `${comment.repliesCount} phản hồi`}
                            </button>
                        )}

                        {/* Menu */}
                        {canManage && !isEditing && (
                            <div className="relative opacity-0 transition-opacity group-hover/comment:opacity-100">
                                <button
                                    type="button"
                                    className="flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-slate-200 dark:hover:bg-white/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMenuToggle(comment._id);
                                    }}
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>

                                {openCommentMenuId === comment._id && (
                                    <div className="absolute left-0 top-6 z-50 min-w-[120px] overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#1e2030]">
                                        {isMyComment && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onMenuToggle(null);
                                                    onStartEdit(comment);
                                                }}
                                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                                            >
                                                <Pencil className="h-3.5 w-3.5" /> Sửa
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onMenuToggle(null);
                                                onDelete(comment._id);
                                            }}
                                            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Replies */}
                {!isReply && expandedReplies.has(comment._id) && comment?.replies?.length > 0 && (
                    <div className="mt-3 space-y-3 border-l-2 border-indigo-100 pl-4 dark:border-indigo-500/20">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply._id}
                                comment={reply}
                                currentUser={currentUser}
                                postAuthorId={postAuthorId}
                                likedCommentIds={likedCommentIds}
                                commentLikeCounts={commentLikeCounts}
                                expandedReplies={expandedReplies}
                                loadingReplies={loadingReplies}
                                editingCommentId={editingCommentId}
                                editingContent={editingContent}
                                setEditingContent={setEditingContent}
                                openCommentMenuId={openCommentMenuId}
                                savingEdit={savingEdit}
                                onStartEdit={onStartEdit}
                                onCancelEdit={onCancelEdit}
                                onSaveEdit={onSaveEdit}
                                onDelete={onDelete}
                                onLikeComment={onLikeComment}
                                onToggleReplies={onToggleReplies}
                                onReply={onReply}
                                onMenuToggle={onMenuToggle}
                                isReply={true}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Like button */}
            {!isEditing && (
                <button
                    type="button"
                    onClick={() => onLikeComment(commentId)}
                    className={`mt-2 flex shrink-0 flex-col items-center gap-0.5 transition-all duration-200 ${
                        likedCommentIds.has(commentId)
                            ? 'text-rose-500 scale-110'
                            : 'text-slate-300 hover:text-rose-400 dark:text-white/20'
                    }`}
                    aria-label="Thích bình luận"
                >
                    <Heart className={`h-4 w-4 transition ${likedCommentIds.has(commentId) ? 'fill-current' : ''}`} />
                    {(commentLikeCounts[commentId] ?? comment?.likesCount ?? 0) > 0 && (
                        <span className="text-[10px] font-bold leading-none">
                            {commentLikeCounts[commentId] ?? comment.likesCount}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Main PostDetailModal
   ═══════════════════════════════════════════════ */
export default function PostDetailModal({ open, onClose, post, currentUser, onSubmitComment }) {
    const [commentText, setCommentText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [deletedCommentInfo, setDeletedCommentInfo] = useState(null);
    const [replyingComment, setReplyingComment] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [commentMeta, setCommentMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [submittingComment, setSubmittingComment] = useState(false);
    const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
    const [likedCommentIds, setLikedCommentIds] = useState(new Set());
    const [commentLikeCounts, setCommentLikeCounts] = useState({});
    const [expandedReplies, setExpandedReplies] = useState(new Set());
    const [loadingReplies, setLoadingReplies] = useState(new Set());
    const [isSaved, setIsSaved] = useState(false);
    const [savingPost, setSavingPost] = useState(false);
    const [loadingMoreComments, setLoadingMoreComments] = useState(false);
    const postId = post?._id || post?.id;
    const inputRef = useRef(null);

    const loadMoreComments = async () => {
        if (!postId || loadingMoreComments || commentMeta.page >= commentMeta.totalPages) return;
        const nextPage = commentMeta.page + 1;
        try {
            setLoadingMoreComments(true);
            const res = await CommentServices.getCommentsByPost(postId, { page: nextPage, limit: 10, sort: 'newest' });
            if (res.code === 200) {
                const newComments = res.data || [];
                setComments((prev) => {
                    const existedIds = new Set(prev.map((c) => c._id?.toString()));
                    const filtered = newComments.filter((c) => !existedIds.has(c._id?.toString()));
                    return [...prev, ...filtered];
                });
                setCommentMeta({
                    page: res.meta?.page || nextPage,
                    limit: res.meta?.limit || 10,
                    total: res.meta?.total || 0,
                    totalPages: res.meta?.totalPages || 0,
                });
                
                setLikedCommentIds((prev) => {
                    const next = new Set(prev);
                    newComments.filter((c) => c.isLiked).forEach((c) => next.add(c._id.toString()));
                    return next;
                });
                setCommentLikeCounts((prev) => {
                    const next = { ...prev };
                    newComments.forEach((c) => { next[c._id.toString()] = c.likesCount ?? 0; });
                    return next;
                });
            }
        } catch (error) {
            console.log('Error loading more comments:', error);
        } finally {
            setLoadingMoreComments(false);
        }
    };

    const handleScroll = (e) => {
        const container = e.currentTarget;
        if (container.scrollHeight - container.scrollTop - container.clientHeight < 40) {
            if (commentMeta.page < commentMeta.totalPages && !loadingMoreComments) {
                loadMoreComments();
            }
        }
    };

    /* ── Lock scroll ── */
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => inputRef.current?.focus(), 100);
        const scrollContainer = document.getElementById('dashboard-scroll-container');
        if (scrollContainer) scrollContainer.style.overflow = 'hidden';
        else document.body.style.overflow = 'hidden';

        return () => {
            clearTimeout(timer);
            if (scrollContainer) scrollContainer.style.overflow = '';
            else document.body.style.overflow = '';
        };
    }, [open]);

    /* ── Fetch comments ── */
    useEffect(() => {
        if (!open || !postId) return;
        
        // Luôn fetch bình luận từ server để đảm bảo đồng bộ mới nhất
        // Tuy nhiên sẽ không hiển thị loading xoay vòng nếu trong cache đã có sẵn bình luận trước đó
        fetchComments(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, postId]);

    const mediaItems = useMemo(() => {
        if (Array.isArray(post?.media) && post.media.length > 0) return post.media;
        if (post?.firstMedia) return [post.firstMedia];
        if (post?.image) return [{ url: post.image, type: 'image' }];
        return [];
    }, [post]);

    const authorName = post?.author?.fullName || post?.author?.name || currentUser?.fullName || 'Người dùng';
    const authorUsername = post?.author?.username || currentUser?.username || 'studyconnect';
    const authorAvatar = post?.author?.avatar || currentUser?.avatar || '';
    const caption = post?.caption || post?.content || '';
    const createdAt = post?.createdAt || post?.timestamp || '';
    const postAuthorId = post?.author?._id || post?.author?.id;

    const isSelf = String(postAuthorId) === String(currentUser?._id || currentUser?.id || currentUser?.userId);
    const isFriend = useMemo(() => {
        if (!currentUser?.friendList || !postAuthorId) return false;
        return currentUser.friendList.some(
            (f) => String(f.user_id) === String(postAuthorId)
        );
    }, [currentUser?.friendList, postAuthorId]);

    /* ── API calls ── */
    const fetchComments = async (page = 1) => {
        if (!postId) return;
        try {
            // Chỉ hiện skeleton loading nếu chưa có bình luận nào trong cache
            // Nếu có rồi thì hiển thị tức thì, cập nhật ngầm trong background
            const isInitial = comments.length === 0;
            if (isInitial) {
                setLoadingComments(true);
            }
            
            // Nếu đã tải nhiều hơn 10 bình luận trước đó, ta sẽ refresh toàn bộ danh sách đã tải bằng cách tăng limit tương ứng.
            // Điều này giải quyết triệt để TH2 (không bị co cụm lại còn 10 cái).
            const limitToFetch = Math.max(comments.length, 10);

            const res = await CommentServices.getCommentsByPost(postId, { 
                page: 1, 
                limit: limitToFetch, 
                sort: 'newest' 
            });

            if (res.code === 200) {
                const fetchedComments = res.data || [];
                
                // Giải quyết TH1: bảo toàn các replies (phản hồi) đã bấm xem của các bình luận trong bộ nhớ cũ
                setComments((prev) => {
                    if (isInitial) return fetchedComments;
                    
                    const prevMap = new Map(prev.map((c) => [c._id?.toString(), c]));
                    return fetchedComments.map((newComment) => {
                        const oldComment = prevMap.get(newComment._id?.toString());
                        if (oldComment) {
                            return {
                                ...newComment,
                                replies: oldComment.replies || [], // Giữ lại replies đã tải
                                repliesCount: newComment.repliesCount ?? oldComment.repliesCount,
                            };
                        }
                        return {
                            ...newComment,
                            replies: [],
                        };
                    });
                });

                const likedIds = new Set(fetchedComments.filter((c) => c.isLiked).map((c) => c._id.toString()));
                const likeCounts = {};
                fetchedComments.forEach((c) => { likeCounts[c._id.toString()] = c.likesCount ?? 0; });
                setLikedCommentIds(likedIds);
                setCommentLikeCounts(likeCounts);
                
                // Thiết lập meta dựa trên số lượng limit đã fetch thực tế để loadMore tiếp tục đúng trang tiếp theo
                const currentPage = Math.ceil(limitToFetch / 10);
                setCommentMeta({ 
                    page: currentPage, 
                    limit: 10, 
                    total: res.meta?.total || 0, 
                    totalPages: res.meta?.totalPages || 0 
                });
            } else {
                toast.error(res.message || 'Không thể tải bình luận');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể tải bình luận');
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSubmit = async () => {
        const value = commentText.trim();
        if (!value || !postId || submittingComment) return;
        try {
            setSubmittingComment(true);
            const payload = { content: value };
            if (replyingComment?._id) {
                payload.replyToComment = replyingComment._id;
                payload.replyToUser = replyingComment?.user?._id;
            }
            const res = await CommentServices.createComment(postId, payload);
            if (res.code === 201) {
                setCommentText('');
                setReplyingComment(null);
                onSubmitComment?.(value);
                setTimeout(() => inputRef.current?.focus(), 100);
                if (res.data) {
                    const newComment = res.data;
                    setComments((prev) => {
                        const existed = prev.some((item) => String(item._id) === String(newComment._id));
                        if (existed) return prev;
                        if (newComment.parentComment) {
                            return prev.map((item) => {
                                if (String(item._id) !== String(newComment.parentComment)) return item;
                                return {
                                    ...item,
                                    repliesCount: (item.repliesCount || 0) + 1,
                                    replies: expandedReplies.has(String(item._id))
                                        ? [...(item.replies || []), newComment]
                                        : item.replies || [],
                                };
                            });
                        }
                        return [{ ...newComment, replies: [] }, ...prev];
                    });
                }
            } else {
                toast.error(res.message || 'Không thể bình luận');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể bình luận');
        } finally {
            setSubmittingComment(false);
        }
    };

    /* ── Socket handlers ── */
    const handleSocketNewComment = ({ postId: socketPostId, comment }) => {
        if (!comment || String(socketPostId) !== String(postId)) return;
        setComments((prev) => {
            const existed = prev.some((item) => String(item._id) === String(comment._id));
            if (existed) return prev;
            if (comment.parentComment) {
                return prev.map((item) => {
                    if (String(item._id) !== String(comment.parentComment)) return item;
                    return { ...item, repliesCount: (item.repliesCount || 0) + 1, replies: [...(item.replies || []), comment] };
                });
            }
            return [{ ...comment, replies: comment.replies || [] }, ...prev];
        });
        setCommentMeta((prev) => ({ ...prev, total: (prev.total || 0) + 1 }));
    };

    const handleSocketUpdateComment = ({ postId: socketPostId, comment }) => {
        if (!comment || String(socketPostId) !== String(postId)) return;
        setComments((prev) =>
            prev.map((item) => {
                if (String(item._id) === String(comment._id)) return { ...item, ...comment, replies: item.replies || [] };
                if (item.replies?.length > 0) {
                    return { ...item, replies: item.replies.map((r) => String(r._id) === String(comment._id) ? { ...r, ...comment } : r) };
                }
                return item;
            }),
        );
    };

    const handleSocketPendingDeleteComment = ({ postId: socketPostId, commentId, parentComment }) => {
        if (String(socketPostId) !== String(postId)) return;
        setComments((prev) => {
            if (parentComment) {
                return prev.map((item) => {
                    if (String(item._id) !== String(parentComment)) return item;
                    return { ...item, repliesCount: Math.max((item.repliesCount || 0) - 1, 0), replies: (item.replies || []).filter((r) => String(r._id) !== String(commentId)) };
                });
            }
            return prev.filter((item) => String(item._id) !== String(commentId));
        });
        setCommentMeta((prev) => ({ ...prev, total: Math.max((prev.total || 0) - 1, 0) }));
    };

    const handleSocketUndoDeleteComment = ({ postId: socketPostId, comment }) => {
        if (!comment || String(socketPostId) !== String(postId)) return;
        setComments((prev) => {
            const existed = prev.some((item) => String(item._id) === String(comment._id));
            if (existed) return prev;
            if (comment.parentComment) {
                return prev.map((item) => {
                    if (String(item._id) !== String(comment.parentComment)) return item;
                    const replies = item.replies || [];
                    if (replies.some((r) => String(r._id) === String(comment._id))) return item;
                    return { ...item, repliesCount: (item.repliesCount || 0) + 1, replies: [...replies, comment] };
                });
            }
            return [{ ...comment, replies: comment.replies || [] }, ...prev];
        });
        setCommentMeta((prev) => ({ ...prev, total: (prev.total || 0) + 1 }));
    };

    useEffect(() => {
        if (!open || !postId) return;
        registerPostCommentSocketEvents({
            onNewComment: handleSocketNewComment,
            onUpdateComment: handleSocketUpdateComment,
            onPendingDeleteComment: handleSocketPendingDeleteComment,
            onUndoDeleteComment: handleSocketUndoDeleteComment,
        });
        return () => unregisterPostCommentSocketEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, postId]);

    /* ── Comment actions ── */
    const handleStartEditComment = (comment) => { setEditingCommentId(comment._id); setEditingContent(comment.content || ''); };
    const handleCancelEditComment = () => { setEditingCommentId(null); setEditingContent(''); };

    const handleSaveEditComment = async (commentId) => {
        const value = editingContent.trim();
        if (!value) { toast.error('Nội dung bình luận không được để trống'); return; }
        try {
            setSavingEdit(true);
            const res = await CommentServices.editComment(commentId, { content: value });
            if (res.code === 200) { setEditingCommentId(null); setEditingContent(''); }
            else toast.error(res.message || 'Không thể sửa bình luận');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể sửa bình luận');
        } finally { setSavingEdit(false); }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const res = await CommentServices.deleteComment(commentId);
            if (res.code === 200) {
                setDeletedCommentInfo({ commentId, canUndoUntil: res.data?.canUndoUntil });
                setTimeout(() => { setDeletedCommentInfo((prev) => prev?.commentId === commentId ? null : prev); }, 5000);
            } else toast.error(res.message || 'Không thể xóa bình luận');
        } catch (error) { toast.error(error?.response?.data?.message || 'Không thể xóa bình luận'); }
    };

    const handleUndoDeleteComment = async (commentId) => {
        try {
            const res = await CommentServices.undoDeleteComment(commentId);
            if (res.code === 200) setDeletedCommentInfo(null);
            else toast.error(res.message || 'Không thể hoàn tác');
        } catch (error) { toast.error(error?.response?.data?.message || 'Không thể hoàn tác'); }
    };

    const handleLikeComment = async (commentId) => {
        const isLiked = likedCommentIds.has(commentId);
        setLikedCommentIds((prev) => { const n = new Set(prev); isLiked ? n.delete(commentId) : n.add(commentId); return n; });
        setCommentLikeCounts((prev) => ({ ...prev, [commentId]: Math.max((prev[commentId] ?? 0) + (isLiked ? -1 : 1), 0) }));
        try { await CommentServices.toggleLikeComment(commentId); } catch {
            setLikedCommentIds((prev) => { const n = new Set(prev); isLiked ? n.add(commentId) : n.delete(commentId); return n; });
            setCommentLikeCounts((prev) => ({ ...prev, [commentId]: Math.max((prev[commentId] ?? 0) + (isLiked ? 1 : -1), 0) }));
        }
    };

    const handleToggleReplies = async (comment) => {
        const commentId = comment._id;
        if (expandedReplies.has(commentId)) { setExpandedReplies((prev) => { const n = new Set(prev); n.delete(commentId); return n; }); return; }
        if (comment.replies?.length > 0) { setExpandedReplies((prev) => new Set([...prev, commentId])); return; }
        try {
            setLoadingReplies((prev) => new Set([...prev, commentId]));
            const res = await CommentServices.getRepliesByComment(commentId, { limit: 20 });
            if (res.code === 200) {
                const replies = res.data || [];
                setComments((prev) => prev.map((c) => String(c._id) === String(commentId) ? { ...c, replies } : c));
                setLikedCommentIds((prev) => { const n = new Set(prev); replies.filter((r) => r.isLiked).forEach((r) => n.add(r._id.toString())); return n; });
                setCommentLikeCounts((prev) => { const n = { ...prev }; replies.forEach((r) => { n[r._id.toString()] = r.likesCount ?? 0; }); return n; });
                setExpandedReplies((prev) => new Set([...prev, commentId]));
            }
        } catch { toast.error('Không thể tải phản hồi'); }
        finally { setLoadingReplies((prev) => { const n = new Set(prev); n.delete(commentId); return n; }); }
    };

    const handleSavePost = async () => {
        if (savingPost) return;
        try {
            setSavingPost(true);
            await PostServices.toggleLikePost(postId);
            setIsSaved((prev) => !prev);
            toast(isSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết');
        } catch { toast.error('Không thể lưu bài viết'); }
        finally { setSavingPost(false); }
    };

    if (!open) return null;

    /* ═══════════════════════════════════ RENDER ═══════════════════════════════════ */
    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 animate-[fadeIn_200ms_ease-out]"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div className="relative grid h-[92vh] w-full max-w-[1100px] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-[#12141c] dark:ring-white/5 md:grid-cols-[minmax(0,1fr)_420px]">
                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-md transition hover:bg-black/60 hover:text-white active:scale-95"
                    aria-label="Đóng"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* ══════ LEFT: Media ══════ */}
                <div className="hidden min-w-0 bg-black md:flex md:items-center md:justify-center">
                    {mediaItems.length > 0 ? (
                        <Swiper
                            modules={[Navigation, Pagination, Keyboard]}
                            navigation={mediaItems.length > 1}
                            pagination={mediaItems.length > 1 ? { clickable: true } : false}
                            keyboard={{ enabled: true }}
                            className="h-full w-full"
                            style={{ height: '100%' }}
                        >
                            {mediaItems.map((media, index) => {
                                const mediaUrl = media?.url || media;
                                const mediaType = media?.type || 'image';
                                return (
                                    <SwiperSlide key={media?.public_id || mediaUrl || index} className="h-full">
                                        <div className="h-full w-full bg-black">
                                            {mediaType === 'video' ? (
                                                <video src={mediaUrl} controls className="h-full w-full object-cover animate-[fadeIn_300ms_ease-out]" />
                                            ) : (
                                                <img src={mediaUrl} alt={`post-media-${index}`} className="h-full w-full object-cover animate-[fadeIn_300ms_ease-out]" />
                                            )}
                                        </div>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center px-10 text-center">
                            <p className="max-w-xl text-xl font-semibold leading-9 text-white/80">
                                {caption || 'Bài viết không có ảnh'}
                            </p>
                        </div>
                    )}
                </div>

                {/* ══════ RIGHT: Info + Comments Panel ══════ */}
                <div className="z-10 flex h-full max-h-[92vh] min-w-0 flex-col bg-white dark:bg-[#12141c] overflow-hidden">
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-white/5">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="rounded-[14px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px]">
                                <Avatar className="h-10 w-10 rounded-[12px] border-2 border-white dark:border-[#12141c]">
                                    <AvatarImage src={authorAvatar} className="rounded-[10px]" />
                                    <AvatarFallback className="rounded-[10px] bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">
                                        {authorName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{authorUsername}</p>
                                    {post?.author?.isVerified && (
                                        <span className="text-[11px] text-indigo-500">✓</span>
                                    )}
                                    <span className="text-[10px] text-slate-300 dark:text-white/10">•</span>
                                    {isSelf ? (
                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">Bạn</span>
                                    ) : isFriend ? (
                                        <span className="rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-extrabold text-green-600 dark:bg-green-500/10 dark:text-green-400 flex items-center gap-0.5">
                                            👥 Bạn bè
                                        </span>
                                    ) : (
                                        <button type="button" className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 hover:underline">
                                            Theo dõi
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] font-medium text-slate-400">{timeAgo(createdAt)}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5">
                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                        </Button>
                    </div>

                    {/* ── Comments scroll area ── */}
                    <div
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/25"
                    >
                        <div className="space-y-4">
                            {/* Caption */}
                            {caption && (
                                <div className="flex items-start gap-3 pb-3 border-b border-slate-50 dark:border-white/5">
                                    <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white dark:ring-white/5">
                                        <AvatarImage src={authorAvatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-[11px] font-bold text-white">
                                            {authorName?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-white/[.04]">
                                            <p className="text-[13px] leading-[1.65]">
                                                <span className="mr-1.5 font-bold text-slate-900 dark:text-white">{authorUsername}</span>
                                                <span className="text-slate-700 dark:text-slate-300">{caption}</span>
                                            </p>
                                        </div>
                                        <p className="mt-1.5 pl-1 text-[11px] font-semibold text-slate-400">
                                            {timeAgo(createdAt)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Comment list */}
                            {loadingComments ? (
                                <CommentSkeleton />
                            ) : comments.length === 0 ? (
                                <div className="flex min-h-[220px] flex-col items-center justify-center text-center py-8">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-white/5">
                                        <MessageCircle className="h-7 w-7 text-slate-300 dark:text-white/20" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-white">Chưa có bình luận nào</h3>
                                    <p className="mt-1 max-w-[240px] text-[13px] leading-5 text-slate-400">
                                        Hãy là người đầu tiên bình luận bài viết này.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {comments.map((comment) => (
                                        <CommentItem
                                            key={comment._id || comment.id}
                                            comment={comment}
                                            currentUser={currentUser}
                                            postAuthorId={postAuthorId}
                                            likedCommentIds={likedCommentIds}
                                            commentLikeCounts={commentLikeCounts}
                                            expandedReplies={expandedReplies}
                                            loadingReplies={loadingReplies}
                                            editingCommentId={editingCommentId}
                                            editingContent={editingContent}
                                            setEditingContent={setEditingContent}
                                            openCommentMenuId={openCommentMenuId}
                                            savingEdit={savingEdit}
                                            onStartEdit={handleStartEditComment}
                                            onCancelEdit={handleCancelEditComment}
                                            onSaveEdit={handleSaveEditComment}
                                            onDelete={handleDeleteComment}
                                            onLikeComment={handleLikeComment}
                                            onToggleReplies={handleToggleReplies}
                                            onReply={(c) => { setReplyingComment(c); setTimeout(() => inputRef.current?.focus(), 50); }}
                                            onMenuToggle={(id) => setOpenCommentMenuId((prev) => prev === id ? null : id)}
                                        />
                                    ))}

                                    {loadingMoreComments && (
                                        <div className="py-3 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse flex items-center justify-center gap-1.5 select-none">
                                            <Loader2 size={12} className="animate-spin text-indigo-500" /> Đang tải thêm bình luận...
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Footer: actions + input ── */}
                    <div className="border-t border-slate-100 dark:border-white/5 pt-2">

                        {/* Undo delete snackbar */}
                        {deletedCommentInfo && (
                            <div className="mx-5 mb-3 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-white/10">
                                <span className="font-medium">Bình luận đã được xóa</span>
                                <button
                                    type="button"
                                    onClick={() => handleUndoDeleteComment(deletedCommentInfo.commentId)}
                                    className="font-bold text-indigo-300 transition hover:text-indigo-200"
                                >
                                    Hoàn tác
                                </button>
                            </div>
                        )}

                        {/* Reply indicator */}
                        {replyingComment && (
                            <div className="mx-5 mb-2 flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-2.5 text-sm dark:bg-indigo-500/10">
                                <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-300">
                                    <CornerDownRight size={14} />
                                    Đang trả lời @{replyingComment?.user?.username || replyingComment?.user?.fullName}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setReplyingComment(null)}
                                    className="font-semibold text-indigo-500 transition hover:text-indigo-700 dark:hover:text-indigo-200"
                                >
                                    Hủy
                                </button>
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex items-center gap-3 px-5 pb-4 pt-1">
                            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white dark:ring-white/5">
                                <AvatarImage src={currentUser?.avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-[10px] font-bold text-white">
                                    {currentUser?.fullName?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:focus-within:ring-indigo-500/20">
                                <input
                                    ref={inputRef}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                                    placeholder="Thêm bình luận..."
                                    className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/30"
                                />
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!commentText.trim() || submittingComment}
                                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-600 disabled:opacity-30 active:scale-95"
                                >
                                    {submittingComment ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <SendHorizontal size={14} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
