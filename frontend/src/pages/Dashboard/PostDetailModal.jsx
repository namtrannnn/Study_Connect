import { useEffect, useMemo, useRef, useState } from 'react';
import { X, MoreHorizontal, Heart, SendHorizontal, MessageCircle, Pencil, Trash2, Bookmark } from 'lucide-react';
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

export default function PostDetailModal({ open, onClose, post, currentUser, onSubmitComment }) {
    const [commentText, setCommentText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [deletedCommentInfo, setDeletedCommentInfo] = useState(null);
    const [replyingComment, setReplyingComment] = useState(null);
    const [commentMeta, setCommentMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [submittingComment, setSubmittingComment] = useState(false);
    const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
    // Like comment
    const [likedCommentIds, setLikedCommentIds] = useState(new Set());
    const [commentLikeCounts, setCommentLikeCounts] = useState({});
    // Replies
    const [expandedReplies, setExpandedReplies] = useState(new Set());
    const [loadingReplies, setLoadingReplies] = useState(new Set());
    // Save post
    const [isSaved, setIsSaved] = useState(false);
    const [savingPost, setSavingPost] = useState(false);
    const postId = post?._id || post?.id;
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            clearTimeout(timer);
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open || !postId) return;

        fetchComments(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, postId]);
    const mediaItems = useMemo(() => {
        if (Array.isArray(post?.media) && post.media.length > 0) {
            return post.media;
        }

        if (post?.firstMedia) {
            return [post.firstMedia];
        }

        if (post?.image) {
            return [{ url: post.image, type: 'image' }];
        }

        return [];
    }, [post]);
    const authorName = post?.author?.fullName || post?.author?.name || currentUser?.fullName || 'Người dùng';

    const authorUsername = post?.author?.username || currentUser?.username || 'studyconnect';

    const authorAvatar = post?.author?.avatar || currentUser?.avatar || '';

    const caption = post?.caption || post?.content || '';

    const createdAt = post?.createdAt || post?.timestamp || '';
    const fetchComments = async (page = 1) => {
        if (!postId) return;

        try {
            setLoadingComments(true);

            const res = await CommentServices.getCommentsByPost(postId, {
                page,
                limit: 10,
                sort: 'newest',
            });

            if (res.code === 200) {
                setComments(res.data || []);
                // Khởi tạo liked state từ data trả về
                const likedIds = new Set(
                    (res.data || [])
                        .filter((c) => c.isLiked)
                        .map((c) => c._id.toString())
                );
                const likeCounts = {};
                (res.data || []).forEach((c) => {
                    likeCounts[c._id.toString()] = c.likesCount ?? 0;
                });
                setLikedCommentIds(likedIds);
                setCommentLikeCounts(likeCounts);
                setCommentMeta({
                    page: res.meta?.page || 1,
                    limit: res.meta?.limit || 10,
                    total: res.meta?.total || 0,
                    totalPages: res.meta?.totalPages || 0,
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

            const payload = {
                content: value,
            };

            if (replyingComment?._id) {
                payload.replyToComment = replyingComment._id;
                payload.replyToUser = replyingComment?.user?._id;
            }

            const res = await CommentServices.createComment(postId, payload);

            if (res.code === 201) {
                setCommentText('');
                onSubmitComment?.(value);
                setTimeout(() => inputRef.current?.focus(), 100);
            } else {
                toast.error(res.message || 'Không thể bình luận');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể bình luận');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleSocketNewComment = ({ postId: socketPostId, comment }) => {
        if (!comment) return;

        if (String(socketPostId) !== String(postId)) return;

        setComments((prev) => {
            const existed = prev.some((item) => String(item._id) === String(comment._id));

            if (existed) return prev;

            // Nếu là reply thì gắn vào comment cha
            if (comment.parentComment) {
                return prev.map((item) => {
                    if (String(item._id) !== String(comment.parentComment)) return item;

                    return {
                        ...item,
                        repliesCount: (item.repliesCount || 0) + 1,
                        replies: [...(item.replies || []), comment],
                    };
                });
            }

            // Nếu là comment cha thì thêm lên đầu
            return [
                {
                    ...comment,
                    replies: comment.replies || [],
                },
                ...prev,
            ];
        });

        setCommentMeta((prev) => ({
            ...prev,
            total: (prev.total || 0) + 1,
        }));
    };

    const handleSocketUpdateComment = ({ postId: socketPostId, comment }) => {
        if (!comment) return;
        if (String(socketPostId) !== String(postId)) return;

        setComments((prev) =>
            prev.map((item) => {
                // Nếu edit comment cha
                if (String(item._id) === String(comment._id)) {
                    return {
                        ...item,
                        ...comment,
                        replies: item.replies || [],
                    };
                }

                // Nếu edit reply
                if (item.replies?.length > 0) {
                    return {
                        ...item,
                        replies: item.replies.map((reply) =>
                            String(reply._id) === String(comment._id)
                                ? {
                                      ...reply,
                                      ...comment,
                                  }
                                : reply,
                        ),
                    };
                }

                return item;
            }),
        );
    };

    useEffect(() => {
        if (!open || !postId) return;

        registerPostCommentSocketEvents({
            onNewComment: handleSocketNewComment,
            onUpdateComment: handleSocketUpdateComment,
            onPendingDeleteComment: handleSocketPendingDeleteComment,
            onUndoDeleteComment: handleSocketUndoDeleteComment,
        });

        return () => {
            unregisterPostCommentSocketEvents();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, postId]);

    const handleStartEditComment = (comment) => {
        setEditingCommentId(comment._id);
        setEditingContent(comment.content || '');
    };

    const handleCancelEditComment = () => {
        setEditingCommentId(null);
        setEditingContent('');
    };

    const handleSaveEditComment = async (commentId) => {
        const value = editingContent.trim();

        if (!value) {
            toast.error('Nội dung bình luận không được để trống');
            return;
        }

        try {
            setSavingEdit(true);

            const res = await CommentServices.editComment(commentId, {
                content: value,
            });

            if (res.code === 200) {
                setEditingCommentId(null);
                setEditingContent('');
                // Không cần setComments ở đây vì socket SERVER_RETURN_UPDATE_COMMENT sẽ cập nhật UI
            } else {
                toast.error(res.message || 'Không thể sửa bình luận');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể sửa bình luận');
        } finally {
            setSavingEdit(false);
        }
    };
    const handleDeleteComment = async (commentId) => {
        try {
            const res = await CommentServices.deleteComment(commentId);

            if (res.code === 200) {
                setDeletedCommentInfo({
                    commentId,
                    canUndoUntil: res.data?.canUndoUntil,
                });

                setTimeout(() => {
                    setDeletedCommentInfo((prev) => {
                        if (prev?.commentId === commentId) return null;
                        return prev;
                    });
                }, 5000);
            } else {
                toast.error(res.message || 'Không thể xóa bình luận');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể xóa bình luận');
        }
    };

    const handleUndoDeleteComment = async (commentId) => {
        try {
            const res = await CommentServices.undoDeleteComment(commentId);
            if (res.code === 200) {
                setDeletedCommentInfo(null);
            } else {
                toast.error(res.message || 'Không thể hoàn tác');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể hoàn tác');
        }
    };

    // Like comment
    const handleLikeComment = async (commentId) => {
        const isLiked = likedCommentIds.has(commentId);
        // Optimistic update
        setLikedCommentIds((prev) => {
            const next = new Set(prev);
            isLiked ? next.delete(commentId) : next.add(commentId);
            return next;
        });
        setCommentLikeCounts((prev) => ({
            ...prev,
            [commentId]: Math.max((prev[commentId] ?? 0) + (isLiked ? -1 : 1), 0),
        }));
        try {
            await CommentServices.toggleLikeComment(commentId);
        } catch {
            // Rollback nếu lỗi
            setLikedCommentIds((prev) => {
                const next = new Set(prev);
                isLiked ? next.add(commentId) : next.delete(commentId);
                return next;
            });
            setCommentLikeCounts((prev) => ({
                ...prev,
                [commentId]: Math.max((prev[commentId] ?? 0) + (isLiked ? 1 : -1), 0),
            }));
        }
    };

    // Load replies
    const handleToggleReplies = async (comment) => {
        const commentId = comment._id;
        if (expandedReplies.has(commentId)) {
            setExpandedReplies((prev) => { const n = new Set(prev); n.delete(commentId); return n; });
            return;
        }
        // Nếu đã có replies trong state thì chỉ cần expand
        if (comment.replies?.length > 0) {
            setExpandedReplies((prev) => new Set([...prev, commentId]));
            return;
        }
        try {
            setLoadingReplies((prev) => new Set([...prev, commentId]));
            const res = await CommentServices.getRepliesByComment(commentId, { limit: 20 });
            if (res.code === 200) {
                const replies = res.data || [];
                setComments((prev) => prev.map((c) =>
                    String(c._id) === String(commentId)
                        ? { ...c, replies }
                        : c
                ));
                // Thêm liked state cho replies
                setLikedCommentIds((prev) => {
                    const next = new Set(prev);
                    replies.filter((r) => r.isLiked).forEach((r) => next.add(r._id.toString()));
                    return next;
                });
                setCommentLikeCounts((prev) => {
                    const next = { ...prev };
                    replies.forEach((r) => { next[r._id.toString()] = r.likesCount ?? 0; });
                    return next;
                });
                setExpandedReplies((prev) => new Set([...prev, commentId]));
            }
        } catch {
            toast.error('Không thể tải phản hồi');
        } finally {
            setLoadingReplies((prev) => { const n = new Set(prev); n.delete(commentId); return n; });
        }
    };

    // Save post
    const handleSavePost = async () => {
        if (savingPost) return;
        try {
            setSavingPost(true);
            await PostServices.toggleLikePost(postId); // tạm dùng, thay bằng savePost API khi có
            setIsSaved((prev) => !prev);
            toast(isSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết');
        } catch {
            toast.error('Không thể lưu bài viết');
        } finally {
            setSavingPost(false);
        }
    };
    const handleSocketPendingDeleteComment = ({ postId: socketPostId, commentId, parentComment, canUndoUntil }) => {
        if (String(socketPostId) !== String(postId)) return;

        setComments((prev) => {
            // Nếu xóa reply
            if (parentComment) {
                return prev.map((item) => {
                    if (String(item._id) !== String(parentComment)) return item;

                    return {
                        ...item,
                        repliesCount: Math.max((item.repliesCount || 0) - 1, 0),
                        replies: (item.replies || []).filter((reply) => String(reply._id) !== String(commentId)),
                    };
                });
            }

            // Nếu xóa comment cha
            return prev.filter((item) => String(item._id) !== String(commentId));
        });

        setCommentMeta((prev) => ({
            ...prev,
            total: Math.max((prev.total || 0) - 1, 0),
        }));
    };

    const handleSocketUndoDeleteComment = ({ postId: socketPostId, comment }) => {
        if (!comment) return;
        if (String(socketPostId) !== String(postId)) return;

        setComments((prev) => {
            const existed = prev.some((item) => String(item._id) === String(comment._id));

            if (existed) return prev;

            // Nếu undo reply
            if (comment.parentComment) {
                return prev.map((item) => {
                    if (String(item._id) !== String(comment.parentComment)) return item;

                    const replies = item.replies || [];
                    const replyExisted = replies.some((reply) => String(reply._id) === String(comment._id));

                    if (replyExisted) return item;

                    return {
                        ...item,
                        repliesCount: (item.repliesCount || 0) + 1,
                        replies: [...replies, comment],
                    };
                });
            }

            // Nếu undo comment cha
            return [
                {
                    ...comment,
                    replies: comment.replies || [],
                },
                ...prev,
            ];
        });

        setCommentMeta((prev) => ({
            ...prev,
            total: (prev.total || 0) + 1,
        }));
    };

    if (!open) return null;
    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-3"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose?.();
                }
            }}
        >
            <div className="relative grid h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl md:grid-cols-[minmax(0,1fr)_430px]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    aria-label="Đóng"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* LEFT: full media */}
                <div className="hidden min-w-0 bg-black md:block">
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
                                        <div className="flex h-full min-h-[92vh] w-full items-center justify-center bg-black">
                                            {mediaType === 'video' ? (
                                                <video src={mediaUrl} controls className="h-full w-full object-cover" />
                                            ) : (
                                                <img
                                                    src={mediaUrl}
                                                    alt={`post-media-${index}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                        </div>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center px-8 text-center text-white">
                            <p className="max-w-xl text-xl font-semibold leading-9">
                                {caption || 'Bài viết không có ảnh'}
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Instagram-like info/comment panel */}
                <div className="z-10 flex min-w-0 flex-col bg-white text-gray-900">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                                <Avatar className="h-10 w-10 border-2 border-white">
                                    <AvatarImage src={authorAvatar} />
                                    <AvatarFallback>{authorName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate text-sm font-bold">{authorUsername}</p>
                                    <span className="text-xs text-blue-500">●</span>
                                    <button className="text-sm font-semibold text-blue-600">Theo dõi</button>
                                </div>

                                <p className="truncate text-xs text-gray-500">StudyConnect</p>
                            </div>
                        </div>

                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </div>
                    {/* Comments */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <div className="space-y-5">
                            {/* Caption as first item */}
                            <div className="flex items-start gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={authorAvatar} />
                                    <AvatarFallback>{authorName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm leading-6">
                                        <span className="mr-1.5 font-bold">{authorUsername}</span>
                                        <span>{caption || 'Không có nội dung'}</span>
                                    </p>

                                    <div className="mt-1 flex items-center gap-4 text-xs font-semibold text-gray-500">
                                        <span>
                                            {createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {loadingComments ? (
                                <div className="flex min-h-[220px] items-center justify-center text-sm text-gray-500">
                                    Đang tải bình luận...
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                                    <MessageCircle className="mb-3 h-12 w-12 text-gray-300" />
                                    <h3 className="text-sm font-bold">Chưa có bình luận nào</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Hãy là người đầu tiên bình luận bài viết này.
                                    </p>
                                </div>
                            ) : (
                                comments.map((comment) => {
                                    const commentAuthorName =
                                        comment?.user?.fullName || comment?.user?.name || 'Người dùng';
                                    const commentUsername = comment?.user?.username || commentAuthorName;

                                    const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId;
                                    const commentUserId =
                                        comment?.user?._id || comment?.user?.id || comment?.user?.userId;

                                    const isMyComment = String(commentUserId) === String(currentUserId);

                                    return (
                                        <div
                                            key={comment._id || comment.id}
                                            className="group/comment flex items-start gap-3"
                                        >
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={comment?.user?.avatar} />
                                                <AvatarFallback>{commentAuthorName?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>

                                            <div className="min-w-0 flex-1">
                                                {editingCommentId === comment._id ? (
                                                    <div className="mt-1">
                                                        <textarea
                                                            value={editingContent}
                                                            onChange={(e) => setEditingContent(e.target.value)}
                                                            autoFocus
                                                            rows={2}
                                                            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Escape') {
                                                                    handleCancelEditComment();
                                                                }

                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    handleSaveEditComment(comment._id);
                                                                }
                                                            }}
                                                        />

                                                        <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveEditComment(comment._id)}
                                                                disabled={savingEdit || !editingContent.trim()}
                                                                className="text-blue-600 disabled:text-blue-300"
                                                            >
                                                                {savingEdit ? 'Đang lưu...' : 'Lưu'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEditComment}
                                                                className="text-gray-500 hover:text-gray-800"
                                                            >
                                                                Hủy
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm leading-6">
                                                        <span className="mr-1.5 font-bold">{commentUsername}</span>
                                                        <span>{comment?.content}</span>

                                                        {comment?.isEdited && (
                                                            <span className="ml-1 text-xs text-gray-400">
                                                                (đã chỉnh sửa)
                                                            </span>
                                                        )}
                                                    </p>
                                                )}

                                                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                                                    <span>
                                                        {comment?.createdAt
                                                            ? new Date(comment.createdAt).toLocaleString('vi-VN')
                                                            : 'Vừa xong'}
                                                    </span>

                                                    {(comment?.likesCount || 0) > 0 && (
                                                        <span>{comment.likesCount} lượt thích</span>
                                                    )}

                                                    {(comment?.repliesCount || 0) > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleReplies(comment)}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {loadingReplies.has(comment._id)
                                                                ? 'Đang tải...'
                                                                : expandedReplies.has(comment._id)
                                                                    ? 'Ẩn phản hồi'
                                                                    : `Xem ${comment.repliesCount} phản hồi`}
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setReplyingComment(comment);
                                                            setTimeout(() => inputRef.current?.focus(), 50);
                                                        }}
                                                    >
                                                        Trả lời
                                                    </button>

                                                    {isMyComment && editingCommentId !== comment._id && (
                                                        <div className="relative opacity-0 transition group-hover/comment:opacity-100">
                                                            <button
                                                                type="button"
                                                                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenCommentMenuId((prev) =>
                                                                        prev === comment._id ? null : comment._id,
                                                                    );
                                                                }}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </button>

                                                            {openCommentMenuId === comment._id && (
                                                                <div className="absolute left-0 top-7 z-50 w-32 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOpenCommentMenuId(null);
                                                                            handleStartEditComment(comment);
                                                                        }}
                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                        Sửa
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOpenCommentMenuId(null);
                                                                            handleDeleteComment(comment._id);
                                                                        }}
                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                        Xóa
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* REPLIES */}
                                                {expandedReplies.has(comment._id) && comment?.replies?.length > 0 && (
                                                    <div className="mt-3 space-y-3 border-l border-gray-200 pl-4">
                                                        {comment.replies.map((reply) => {
                                                            const replyAuthorName =
                                                                reply?.user?.fullName || 'Người dùng';
                                                            const replyUsername =
                                                                reply?.user?.username || replyAuthorName;
                                                            const replyId = reply._id?.toString();

                                                            return (
                                                                <div key={reply._id} className="flex items-start gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarImage src={reply?.user?.avatar} />
                                                                        <AvatarFallback>
                                                                            {replyAuthorName.charAt(0)}
                                                                        </AvatarFallback>
                                                                    </Avatar>

                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm leading-6">
                                                                            <span className="mr-1.5 font-bold">
                                                                                {replyUsername}
                                                                            </span>

                                                                            {reply?.replyToUser?.username && (
                                                                                <span className="mr-1 text-blue-600">
                                                                                    @{reply.replyToUser.username}
                                                                                </span>
                                                                            )}

                                                                            <span>{reply?.content}</span>

                                                                            {reply?.isEdited && (
                                                                                <span className="ml-1 text-xs text-gray-400">
                                                                                    (đã chỉnh sửa)
                                                                                </span>
                                                                            )}
                                                                        </p>

                                                                        <div className="mt-1 flex items-center gap-4 text-xs font-semibold text-gray-500">
                                                                            <span>
                                                                                {reply?.createdAt
                                                                                    ? new Date(
                                                                                          reply.createdAt,
                                                                                      ).toLocaleString('vi-VN')
                                                                                    : 'Vừa xong'}
                                                                            </span>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setReplyingComment(reply);
                                                                                    setTimeout(
                                                                                        () => inputRef.current?.focus(),
                                                                                        50,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                Trả lời
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Nút like reply */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleLikeComment(replyId)}
                                                                        className={`flex flex-col items-center gap-0.5 pt-1 transition ${likedCommentIds.has(replyId) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                                                        aria-label="Thích phản hồi"
                                                                    >
                                                                        <Heart className={`h-4 w-4 ${likedCommentIds.has(replyId) ? 'fill-current' : ''}`} />
                                                                        {(commentLikeCounts[replyId] ?? reply?.likesCount ?? 0) > 0 && (
                                                                            <span className="text-[10px] font-semibold leading-none">
                                                                                {commentLikeCounts[replyId] ?? reply.likesCount}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleLikeComment(comment._id)}
                                                className={`flex flex-col items-center gap-0.5 pt-1 transition ${likedCommentIds.has(comment._id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                                aria-label="Thích bình luận"
                                            >
                                                <Heart className={`h-4 w-4 ${likedCommentIds.has(comment._id) ? 'fill-current' : ''}`} />
                                                {(commentLikeCounts[comment._id] ?? comment?.likesCount ?? 0) > 0 && (
                                                    <span className="text-[10px] font-semibold leading-none">
                                                        {commentLikeCounts[comment._id] ?? comment.likesCount}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    {/* Footer action + input */}
                    <div className="border-t border-gray-200">
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-4">
                                <button className="transition hover:text-red-500">
                                    <Heart className="h-6 w-6" />
                                </button>
                                <button className="transition hover:text-blue-600">
                                    <MessageCircle className="h-6 w-6" />
                                </button>
                                <button className="transition hover:text-blue-600">
                                    <SendHorizontal className="h-6 w-6" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleSavePost}
                                disabled={savingPost}
                                className={`transition disabled:opacity-50 ${isSaved ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                                aria-label="Lưu bài viết"
                            >
                                <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        {deletedCommentInfo && (
                            <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
                                <span>Bình luận đã được xóa</span>

                                <button
                                    type="button"
                                    onClick={() => handleUndoDeleteComment(deletedCommentInfo.commentId)}
                                    className="font-bold text-blue-300 hover:text-blue-200"
                                >
                                    Hoàn tác
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 px-4 pb-4">
                            {replyingComment && (
                                <div className="mx-4 mb-2 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-2 text-sm text-blue-700">
                                    <span>
                                        Đang trả lời @
                                        {replyingComment?.user?.username || replyingComment?.user?.fullName}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setReplyingComment(null)}
                                        className="font-semibold hover:underline"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            )}
                            <input
                                ref={inputRef}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSubmit();
                                    }
                                }}
                                placeholder="Thêm bình luận..."
                                className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                            />

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!commentText.trim() || submittingComment}
                                className="text-sm font-bold text-blue-600 transition disabled:text-blue-300"
                            >
                                {submittingComment ? 'Đang đăng...' : 'Đăng'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
