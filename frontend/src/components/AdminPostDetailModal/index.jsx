import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Heart,
    MessageSquare,
    EyeOff,
    Trash2,
    Calendar,
    Hash,
    Loader2,
    CornerDownRight,
    Image as ImageIconSimple,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAdminTheme } from '../../layout/Admin/index.jsx';
import {
    getAdminPostComments,
    getAdminPostLikes,
    updatePostStatus,
    softDeleteAdminPost,
    updateCommentStatus,
    deleteAdminComment,
} from '../../services/adminServices';
import ConfirmModal from '../ConfirmModal';

function AdminPostDetailModal({ post, onClose, onUpdatePost }) {
    const themeCtx = useAdminTheme();
    const isDark = themeCtx ? themeCtx.isDark : true;

    // Tabs: 'none' | 'likes' | 'comments'
    const [activeTab, setActiveTab] = useState('none');
    const [modalImageIdx, setModalImageIdx] = useState(0);

    // Likes state
    const [likes, setLikes] = useState([]);
    const [likesPage, setLikesPage] = useState(1);
    const [likesHasMore, setLikesHasMore] = useState(false);
    const [loadingLikes, setLoadingLikes] = useState(false);

    // Comments state
    const [comments, setComments] = useState([]);
    const [commentsPage, setCommentsPage] = useState(1);
    const [commentsHasMore, setCommentsHasMore] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState({});

    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [postData, setPostData] = useState(post);

    useEffect(() => {
        setPostData(post);
        setActiveTab('none');
        setLikes([]);
        setLikesPage(1);
        setLikesHasMore(false);
        setComments([]);
        setCommentsPage(1);
        setCommentsHasMore(false);
        setExpandedReplies({});
        setModalImageIdx(0);
    }, [post?._id]);


    if (!postData) return null;

    const postAuthor = postData.user_id || postData.author;
    const postImages = postData.images && postData.images.length > 0 ? postData.images : postData.media || [];
    const hasTextContent =
        (postData.title && postData.title.trim()) ||
        (postData.content && postData.content.trim()) ||
        (postData.caption && postData.caption.trim());

    // Fetch Likes
    const fetchLikes = async (page = 1, append = false) => {
        try {
            setLoadingLikes(true);
            const res = await getAdminPostLikes(postData._id, { page, limit: 10 });
            if (res?.code === 200) {
                const fetchedLikes = res.data.likes || [];
                const hasMore = res.data.pagination?.hasMore || false;
                setLikes((prev) => (append ? [...prev, ...fetchedLikes] : fetchedLikes));
                setLikesHasMore(hasMore);
                setLikesPage(page);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải danh sách lượt thích');
        } finally {
            setLoadingLikes(false);
        }
    };

    // Fetch Comments
    const fetchComments = async (page = 1, append = false) => {
        try {
            setLoadingComments(true);
            const res = await getAdminPostComments(postData._id, { page, limit: 10 });
            if (res?.code === 200) {
                const fetchedComments = res.data.comments || [];
                const hasMore = res.data.pagination?.hasMore || false;
                setComments((prev) => (append ? [...prev, ...fetchedComments] : fetchedComments));
                setCommentsHasMore(hasMore);
                setCommentsPage(page);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải danh sách bình luận');
        } finally {
            setLoadingComments(false);
        }
    };

    const handleTabChange = (tab) => {
        if (activeTab === tab) {
            setActiveTab('none');
            return;
        }
        setActiveTab(tab);
        if (tab === 'likes' && likes.length === 0) fetchLikes(1);
        if (tab === 'comments' && comments.length === 0) fetchComments(1);
    };

    const toggleExpandReplies = (commentId) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    };

    // Quick toggle post status
    const handleTogglePostStatus = () => {
        const isHiding = postData.status !== 'hidden';
        const newStatus = isHiding ? 'hidden' : 'active';

        setConfirmModal({
            isOpen: true,
            title: isHiding ? 'Ẩn bài viết' : 'Hiện bài viết',
            message: isHiding ? 'Ẩn bài viết này khỏi Feed?' : 'Hiện lại bài viết này trên Feed?',
            confirmText: isHiding ? 'Ẩn bài viết' : 'Hiện lại',
            type: isHiding ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    setConfirmModal({ isOpen: false });
                    const res = await updatePostStatus(postData._id, newStatus);
                    if (res?.code === 200) {
                        toast.success(res.message);
                        setPostData((prev) => ({ ...prev, status: newStatus }));
                        if (onUpdatePost) onUpdatePost({ ...postData, status: newStatus });
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Cập nhật thất bại');
                }
            },
        });
    };

    // Soft delete post
    const handleDeletePost = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Xóa vĩnh viễn bài viết',
            message: 'Xóa vĩnh viễn bài viết này khỏi hệ thống? Thao tác này không thể hoàn tác.',
            confirmText: 'Xóa bài viết',
            type: 'danger',
            onConfirm: async () => {
                try {
                    setConfirmModal({ isOpen: false });
                    const res = await softDeleteAdminPost(postData._id);
                    if (res?.code === 200) {
                        toast.success('Đã xóa bài viết thành công');
                        if (onUpdatePost) onUpdatePost(null);
                        onClose();
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Xóa thất bại');
                }
            },
        });
    };

    // Quick toggle comment status directly inside modal
    const handleToggleCommentStatus = (comment) => {
        const isHiding = comment.status !== 'hidden';
        const newStatus = isHiding ? 'hidden' : 'active';

        setConfirmModal({
            isOpen: true,
            title: isHiding ? 'Ẩn bình luận' : 'Hiện bình luận',
            message: isHiding ? 'Ẩn bình luận này khỏi bài viết?' : 'Hiện lại bình luận này?',
            confirmText: isHiding ? 'Ẩn ngay' : 'Hiện lại',
            type: isHiding ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    setConfirmModal({ isOpen: false });
                    const res = await updateCommentStatus(comment._id, newStatus);
                    if (res?.code === 200) {
                        toast.success(res.message);
                        // Update in root comments or replies
                        setComments((prev) =>
                            prev.map((c) => {
                                if (c._id === comment._id) return { ...c, status: newStatus };
                                if (c.replies) {
                                    return {
                                        ...c,
                                        replies: c.replies.map((r) => (r._id === comment._id ? { ...r, status: newStatus } : r)),
                                    };
                                }
                                return c;
                            })
                        );
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Thao tác thất bại');
                }
            },
        });
    };

    // Delete comment inside modal
    const handleDeleteComment = (comment) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xóa bình luận vi phạm',
            message: 'Xóa bình luận này? Thao tác này không thể hoàn tác.',
            confirmText: 'Xóa bình luận',
            type: 'danger',
            onConfirm: async () => {
                try {
                    setConfirmModal({ isOpen: false });
                    const res = await deleteAdminComment(comment._id);
                    if (res?.code === 200) {
                        toast.success('Đã xóa bình luận vi phạm');
                        setComments((prev) =>
                            prev
                                .filter((c) => c._id !== comment._id)
                                .map((c) => ({
                                    ...c,
                                    replies: c.replies ? c.replies.filter((r) => r._id !== comment._id) : [],
                                }))
                        );
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Xóa bình luận thất bại');
                }
            },
        });
    };

    // Format relative time helper
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const now = new Date();
        const past = new Date(dateStr);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút`;
        if (diffHours < 24) return `${diffHours} giờ`;
        if (diffDays < 7) return `${diffDays} ngày`;
        return past.toLocaleDateString('vi-VN');
    };

    return createPortal(
        <div
            onClick={onClose}
            className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border p-6 shadow-2xl space-y-5 ${
                    isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'
                }`}
            >
                {/* Header: Author Info */}
                <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <img
                            src={postAuthor?.avatar || 'https://via.placeholder.com/150'}
                            alt="Avatar"
                            className="h-11 w-11 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg"
                        />
                        <div>
                            <h4 className="font-bold text-sm">{postAuthor?.fullName || 'Tác giả'}</h4>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                @{postAuthor?.username || 'user'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {postData.status === 'hidden' && (
                            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-500 border border-amber-500/30">
                                Đã ẩn
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Title */}
                {postData.title && <h3 className="text-base font-bold text-indigo-500">{postData.title}</h3>}

                {/* Content */}
                {postData.content && postData.content.trim() ? (
                    <div className={`text-xs leading-relaxed font-medium whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                        {postData.content}
                    </div>
                ) : !hasTextContent && postImages.length > 0 ? (
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                        <ImageIconSimple className="h-4 w-4" />
                        Bài viết chỉ bao gồm hình ảnh ({postImages.length} ảnh)
                    </div>
                ) : null}

                {/* Hashtags */}
                {postData.hashtags && postData.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {postData.hashtags.map((tag, i) => (
                            <span key={i} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                                <Hash className="h-3 w-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Gallery */}
                {postImages.length > 0 && (
                    <div className="space-y-3">
                        <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/40">
                            <img
                                src={postImages[modalImageIdx]?.url || postImages[modalImageIdx]}
                                alt="Post Image"
                                className="w-full max-h-80 object-contain mx-auto"
                            />
                        </div>
                        {postImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {postImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setModalImageIdx(idx)}
                                        className={`shrink-0 h-14 w-14 rounded-xl overflow-hidden border-2 transition ${
                                            modalImageIdx === idx ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img?.url || img} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Interaction Tabs Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleTabChange('likes')}
                        className={`rounded-2xl border p-3 text-center transition ${
                            activeTab === 'likes'
                                ? 'border-rose-500/50 bg-rose-500/15 shadow-lg shadow-rose-500/10'
                                : isDark
                                ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-1 text-rose-500 font-extrabold text-lg">
                            <Heart className="h-4 w-4 fill-rose-500/20" /> {postData.likesCount || 0}
                        </div>
                        <div className="text-[11px] font-medium text-gray-400 mt-0.5">
                            {activeTab === 'likes' ? '▲ Ẩn lượt thích' : '▼ Xem ai đã thả tim'}
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('comments')}
                        className={`rounded-2xl border p-3 text-center transition ${
                            activeTab === 'comments'
                                ? 'border-blue-500/50 bg-blue-500/15 shadow-lg shadow-blue-500/10'
                                : isDark
                                ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-1 text-blue-500 font-extrabold text-lg">
                            <MessageSquare className="h-4 w-4" /> {postData.commentsCount || 0}
                        </div>
                        <div className="text-[11px] font-medium text-gray-400 mt-0.5">
                            {activeTab === 'comments' ? '▲ Ẩn bình luận' : '▼ Xem tất cả bình luận'}
                        </div>
                    </button>
                </div>

                {/* ================= SUB TAB: LIKES LIST ================= */}
                {activeTab === 'likes' && (
                    <div className={`rounded-2xl border p-4 space-y-3 animate-fade-in ${isDark ? 'border-rose-500/20 bg-rose-500/[0.03]' : 'border-rose-100 bg-rose-50/50'}`}>
                        <h4 className="font-extrabold text-xs text-rose-500 flex items-center gap-1.5">
                            <Heart className="h-4 w-4" /> Danh sách người đã Thả tim ({likes.length} / {postData.likesCount || 0})
                        </h4>

                        {loadingLikes && likes.length === 0 ? (
                            <div className="py-6 text-center text-xs text-gray-400">
                                <Loader2 className="mx-auto h-5 w-5 animate-spin text-rose-500 mb-1" />
                                Đang tải danh sách thả tim...
                            </div>
                        ) : likes.length === 0 ? (
                            <div className="py-4 text-center text-xs text-gray-400">Chưa có ai thả tim bài viết này.</div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                                {likes.map((item) => (
                                    <div key={item._id} className={`flex items-center justify-between rounded-xl p-2.5 border ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-white'}`}>
                                        <div className="flex items-center gap-2.5">
                                            <img
                                                src={item.user?.avatar || 'https://via.placeholder.com/150'}
                                                alt=""
                                                className="h-8 w-8 rounded-xl object-cover"
                                            />
                                            <div>
                                                <h5 className="font-bold text-xs">{item.user?.fullName || 'Người dùng'}</h5>
                                                <p className="text-[10px] text-gray-400">@{item.user?.username || 'user'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                ))}

                                {likesHasMore && (
                                    <button
                                        type="button"
                                        disabled={loadingLikes}
                                        onClick={() => fetchLikes(likesPage + 1, true)}
                                        className="w-full py-2 text-center text-xs font-bold text-rose-500 hover:underline flex items-center justify-center gap-1"
                                    >
                                        {loadingLikes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Tải thêm lượt thích...'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ================= SUB TAB: THREADED COMMENTS LIST (USER BUBBLE STYLE) ================= */}
                {activeTab === 'comments' && (
                    <div className={`rounded-2xl border p-4 space-y-4 animate-fade-in ${isDark ? 'border-blue-500/20 bg-blue-500/[0.03]' : 'border-blue-100 bg-blue-50/50'}`}>
                        <h4 className="font-extrabold text-xs text-blue-500 flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" /> Bình luận ({comments.length} / {postData.commentsCount || 0})
                        </h4>

                        {loadingComments && comments.length === 0 ? (
                            <div className="py-6 text-center text-xs text-gray-400">
                                <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-500 mb-1" />
                                Đang tải danh sách bình luận...
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="py-4 text-center text-xs text-gray-400">Bài viết chưa có bình luận nào.</div>
                        ) : (
                            <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar pr-1">
                                {comments.map((root) => {
                                    const isRootHidden = root.status === 'hidden';
                                    const repliesList = root.replies || [];
                                    const hasReplies = repliesList.length > 0 || (root.repliesCount > 0);
                                    const isExpanded = expandedReplies[root._id];

                                    return (
                                        <div key={root._id} className="space-y-2">
                                            {/* Root Comment Row */}
                                            <div className="flex items-start gap-2.5 group">
                                                <img
                                                    src={root.user?.avatar || 'https://via.placeholder.com/150'}
                                                    alt=""
                                                    className="h-8 w-8 rounded-full object-cover shrink-0 mt-1 ring-1 ring-black/10"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    {/* Chat Bubble */}
                                                    <div className={`relative inline-block max-w-full rounded-2xl px-4 py-2.5 text-xs shadow-sm border ${
                                                        isDark ? 'bg-white/10 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                                                    }`}>
                                                        <div className="flex items-center justify-between gap-3 mb-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-extrabold text-xs">{root.user?.fullName || 'Người dùng'}</span>
                                                                <span className="text-[10px] text-gray-400 font-normal">@{root.user?.username}</span>
                                                                {isRootHidden && (
                                                                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-500 border border-amber-500/30">
                                                                        Đã ẩn
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="whitespace-pre-wrap font-medium leading-relaxed">{root.content}</p>

                                                        {root.likesCount > 0 && (
                                                            <div className="absolute -right-2 -bottom-2 flex items-center gap-0.5 rounded-full bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-rose-500 border border-rose-500/30 shadow">
                                                                <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                                                                <span>{root.likesCount}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Below Bubble Meta & Expand Action */}
                                                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 pl-2 font-semibold">
                                                        <span>{formatTime(root.createdAt)}</span>

                                                        {/* Admin quick actions */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCommentStatus(root)}
                                                            className={`transition ${isRootHidden ? 'text-amber-500 font-bold' : 'hover:text-amber-400'}`}
                                                        >
                                                            {isRootHidden ? 'Hiện' : 'Ẩn'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteComment(root)}
                                                            className="hover:text-rose-500 transition"
                                                        >
                                                            Xóa
                                                        </button>

                                                        {/* Collapsible replies trigger */}
                                                        {hasReplies && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpandReplies(root._id)}
                                                                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold ml-1"
                                                            >
                                                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                                <span>{isExpanded ? 'Ẩn phản hồi' : `${repliesList.length || root.repliesCount} phản hồi`}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Child Replies Thread (Indented) */}
                                            {isExpanded && repliesList.length > 0 && (
                                                <div className="pl-9 space-y-2 border-l-2 border-indigo-500/20 ml-4 pt-1">
                                                    {repliesList.map((reply) => {
                                                        const isReplyHidden = reply.status === 'hidden';

                                                        return (
                                                            <div key={reply._id} className="flex items-start gap-2.5">
                                                                <img
                                                                    src={reply.user?.avatar || 'https://via.placeholder.com/150'}
                                                                    alt=""
                                                                    className="h-7 w-7 rounded-full object-cover shrink-0 mt-1 ring-1 ring-black/10"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    {/* Child Chat Bubble */}
                                                                    <div className={`relative inline-block max-w-full rounded-2xl px-3.5 py-2 text-xs shadow-sm border ${
                                                                        isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-200/70 border-slate-300/60 text-slate-900'
                                                                    }`}>
                                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                                            <span className="font-extrabold text-[11px]">{reply.user?.fullName || 'Người dùng'}</span>
                                                                            {reply.replyToUser && (
                                                                                <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5">
                                                                                    <CornerDownRight className="h-2.5 w-2.5" />@{reply.replyToUser.username}
                                                                                </span>
                                                                            )}
                                                                            {isReplyHidden && (
                                                                                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-500 border border-amber-500/30">
                                                                                    Đã ẩn
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="whitespace-pre-wrap font-medium">{reply.content}</p>

                                                                        {reply.likesCount > 0 && (
                                                                            <div className="absolute -right-2 -bottom-2 flex items-center gap-0.5 rounded-full bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-rose-500 border border-rose-500/30 shadow">
                                                                                <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                                                                                <span>{reply.likesCount}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Child Meta & Actions */}
                                                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5 pl-2 font-semibold">
                                                                        <span>{formatTime(reply.createdAt)}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleCommentStatus(reply)}
                                                                            className={`transition ${isReplyHidden ? 'text-amber-500 font-bold' : 'hover:text-amber-400'}`}
                                                                        >
                                                                            {isReplyHidden ? 'Hiện' : 'Ẩn'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteComment(reply)}
                                                                            className="hover:text-rose-500 transition"
                                                                        >
                                                                            Xóa
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {commentsHasMore && (
                                    <button
                                        type="button"
                                        disabled={loadingComments}
                                        onClick={() => fetchComments(commentsPage + 1, true)}
                                        className="w-full py-2 text-center text-xs font-bold text-blue-500 hover:underline flex items-center justify-center gap-1"
                                    >
                                        {loadingComments ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Tải thêm bình luận...'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Post Meta */}
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Đăng vào: {postData.createdAt ? new Date(postData.createdAt).toLocaleString('vi-VN') : 'Không rõ'}</span>
                </div>

                {/* Footer Actions */}
                <div className={`flex flex-wrap items-center justify-end gap-2 border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <button
                        type="button"
                        onClick={handleTogglePostStatus}
                        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                            postData.status === 'hidden'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                        }`}
                    >
                        <EyeOff className="h-4 w-4" />
                        {postData.status === 'hidden' ? 'Hiện bài viết' : 'Ẩn bài viết'}
                    </button>

                    <button
                        type="button"
                        onClick={handleDeletePost}
                        className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/20"
                    >
                        <Trash2 className="h-4 w-4" /> Xóa bài viết
                    </button>
                </div>
            </div>

            {/* CONFIRM MODAL */}
            <ConfirmModal {...confirmModal} onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
        </div>,
        document.body
    );
}

export default AdminPostDetailModal;
