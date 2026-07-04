import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    MoreHorizontal,
    Edit,
    Trash2,
    ExternalLink,
    Github,
    Flag,
    EyeOff,
    Link as LinkIcon,
    Pin,
    HelpCircle,
    BookOpen,
    GraduationCap,
    Handshake,
    Trophy,
    CheckCircle2,
    Users,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import * as PostServices from '../../services/posts.services';
import { joinPostCommentRoom, leavePostCommentRoom } from '../../sockets/postComment.socket';

import PostDetailModal from './PostDetailModal';
import LikesModal from './LikesModal';
import ShareModal from './ShareModal';
import Modal from './Modal';

const postTypeLabels = {
    normal: 'Bài viết',
    project: 'Dự án',
    question: 'Câu hỏi',
    knowledge: 'Kiến thức',
    learning: 'Học tập',
    collaboration: 'Tìm cộng sự',
    achievement: 'Thành tựu',
};

const categoryLabels = {
    technology: 'Công nghệ',
    finance_banking: 'Tài chính',
    marketing: 'Marketing',
    design: 'Thiết kế',
    business: 'Kinh doanh',
    language: 'Ngôn ngữ',
    education: 'Giáo dục',
    science: 'Khoa học',
    startup: 'Startup',
    art: 'Nghệ thuật',
    music: 'Âm nhạc',
    health: 'Sức khỏe',
    other: 'Khác',
};

function formatTime(value, fallback) {
    if (!value) return fallback || '';

    try {
        const date = new Date(value);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Vừa xong';
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return date.toLocaleDateString('vi-VN');
    } catch {
        return fallback || '';
    }
}

function ProjectShowcase({ project }) {
    if (!project) return null;

    const progress = Math.min(Number(project.progress) || 0, 100);

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:border-blue-500/20 dark:from-blue-950/40 dark:via-[#1f2937] dark:to-cyan-950/30">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                            Project Showcase
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                            {project.projectName || 'Dự án chưa đặt tên'}
                        </h3>

                        {project.summary && (
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{project.summary}</p>
                        )}
                    </div>

                    <div className="shrink-0 rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm dark:bg-white/10">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-300">{progress}%</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">tiến độ</div>
                    </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {project.tools?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {project.tools.map((tool, index) => (
                            <span
                                key={`${tool}-${index}`}
                                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-200 dark:ring-white/10"
                            >
                                {tool}
                            </span>
                        ))}
                    </div>
                )}

                {project.links?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {project.links.map((link, index) => {
                            const isGithub = link.type === 'github';

                            return (
                                <a
                                    key={`${link.url}-${index}`}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900"
                                >
                                    {isGithub ? <Github size={14} /> : <ExternalLink size={14} />}
                                    {link.title || link.type || 'Link'}
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
function QuestionShowcase({ question }) {
    if (!question) return null;

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:border-amber-500/20 dark:from-amber-950/30 dark:via-[#1f2937] dark:to-orange-950/20">
            <div className="p-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <HelpCircle size={14} />
                    Cần hỗ trợ
                </div>

                <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                    {question.title || 'Câu hỏi chưa có tiêu đề'}
                </h3>

                {question.detail && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {question.detail}
                    </p>
                )}

                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-200 dark:ring-white/10">
                    {question.isResolved ? (
                        <>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            Đã giải quyết
                        </>
                    ) : (
                        <>
                            <HelpCircle size={14} className="text-amber-500" />
                            Đang chờ câu trả lời
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function LearningShowcase({ learning }) {
    if (!learning) return null;

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-500/20 dark:from-emerald-950/30 dark:via-[#1f2937] dark:to-teal-950/20">
            <div className="p-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <GraduationCap size={14} />
                    Learning Progress
                </div>

                <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                    {learning.title || 'Hành trình học tập'}
                </h3>

                {learning.goal && (
                    <div className="mt-3 rounded-2xl bg-white/80 p-3 text-sm shadow-sm ring-1 ring-gray-200 dark:bg-white/10 dark:ring-white/10">
                        <div className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">
                            Mục tiêu
                        </div>
                        <div className="mt-1 text-gray-700 dark:text-gray-200">{learning.goal}</div>
                    </div>
                )}

                {learning.progressText && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {learning.progressText}
                    </p>
                )}

                {learning.resources?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {learning.resources.map((resource, index) => (
                            <a
                                key={`${resource.url}-${index}`}
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900"
                            >
                                <BookOpen size={14} />
                                {resource.title || 'Tài liệu'}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CollaborationShowcase({ collaboration }) {
    if (!collaboration) return null;

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:border-violet-500/20 dark:from-violet-950/30 dark:via-[#1f2937] dark:to-fuchsia-950/20">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                            <Handshake size={14} />
                            Tìm cộng sự
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                            {collaboration.title || 'Lời mời cộng tác'}
                        </h3>
                    </div>

                    <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            collaboration.isOpen
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'
                        }`}
                    >
                        {collaboration.isOpen ? 'Đang mở' : 'Đã đóng'}
                    </span>
                </div>

                {collaboration.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {collaboration.description}
                    </p>
                )}

                {collaboration.neededRoles?.length > 0 && (
                    <div className="mt-4">
                        <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase text-violet-600 dark:text-violet-300">
                            <Users size={14} />
                            Vai trò cần tìm
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {collaboration.neededRoles.map((role, index) => (
                                <span
                                    key={`${role}-${index}`}
                                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-200 dark:ring-white/10"
                                >
                                    {role}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function KnowledgeShowcase({ content }) {
    return (
        <div className="mt-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 dark:border-sky-500/20 dark:from-sky-950/30 dark:via-[#1f2937] dark:to-blue-950/20">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                <BookOpen size={14} />
                Knowledge Note
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Bài viết chia sẻ kiến thức, kinh nghiệm hoặc ghi chú học tập.
            </p>
        </div>
    );
}

function AchievementShowcase() {
    return (
        <div className="mt-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 dark:border-purple-500/20 dark:from-purple-950/30 dark:via-[#1f2937] dark:to-pink-950/20">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
                <Trophy size={14} />
                Achievement
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Một cột mốc mới đã được hoàn thành. Hãy lưu lại thành tựu này trong hành trình của bạn.
            </p>
        </div>
    );
}
export default function Post({ post, currentUser, onLike, onComment, onEdit, onDelete }) {
    const [isLiked, setIsLiked] = useState(!!post?.isLiked);
    const [localLikesCount, setLocalLikesCount] = useState(post?.likesCount ?? post?.likes ?? 0);
    const [openLikes, setOpenLikes] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openShare, setOpenShare] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);
    const [isPinned, setIsPinned] = useState(!!post?.isPinned);
    const [privacy, setPrivacy] = useState(post?.visibility || post?.privacy || 'public');
    const [commentsEnabled, setCommentsEnabled] = useState(post?.allowComments ?? post?.commentsEnabled ?? true);
    const postId = post?._id || post?.id;

    const authorName = post?.author?.fullName || post?.author?.name || 'Người dùng';
    const authorAvatar = post?.author?.avatar;
    const authorUsername = post?.author?.username;

    const content = post?.caption || post?.content || '';

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

    const createdTime = formatTime(post?.createdAt, post?.timestamp);

    const likeCount = localLikesCount;
    const commentCount = post?.commentsCount ?? post?.comments?.length ?? 0;
    const shareCount = post?.sharesCount ?? post?.shares ?? 0;

    const authorId = post?.author?.id || post?.author?._id || post?.author?.userId;
    const currentId = currentUser?.id || currentUser?._id || currentUser?.userId;
    const isOwner = authorId && currentId ? authorId === currentId : post?.author?.name === currentUser?.fullName;

    const postType = post?.postType || 'normal';
    const category = post?.category || 'other';

    const handleLike = async () => {
        const postId = post?._id || post?.id;

        if (!postId) {
            toast.error('Không tìm thấy ID bài viết');
            return;
        }

        const prevLiked = isLiked;
        const prevCount = localLikesCount;
        const nextLiked = !prevLiked;

        try {
            // cập nhật trước cho mượt
            setIsLiked(nextLiked);
            setLocalLikesCount((prev) => {
                if (nextLiked) return prev + 1;
                return Math.max(prev - 1, 0);
            });

            const res = await PostServices.toggleLikePost(postId);

            if (res.code === 200) {
                setIsLiked(res.data.isLiked);

                // Nếu BE có trả likesCount thì lấy chuẩn từ BE
                if (typeof res.data.likesCount === 'number') {
                    setLocalLikesCount(res.data.likesCount);
                } else {
                    // BE hiện tại chưa trả likesCount thì tự sync lại
                    setLocalLikesCount(() => {
                        if (res.data.isLiked) {
                            return prevLiked ? prevCount : prevCount + 1;
                        }

                        return prevLiked ? Math.max(prevCount - 1, 0) : prevCount;
                    });
                }

                onLike?.(res.data);
            } else {
                setIsLiked(prevLiked);
                setLocalLikesCount(prevCount);
                toast.error(res.message || 'Không thể cập nhật lượt thích');
            }
        } catch (error) {
            setIsLiked(prevLiked);
            setLocalLikesCount(prevCount);
            toast.error(error?.response?.data?.message || 'Không thể cập nhật lượt thích');
        }
    };

    const handleComment = () => {
        setOpenDetail(true);
    };

    const handleTogglePin = async () => {
        const next = !isPinned;
        try {
            setIsPinned(next);
            if (next) {
                await PostServices.pinPost(postId);
                toast('Đã ghim bài viết');
            } else {
                await PostServices.unpinPost(postId);
                toast('Đã bỏ ghim');
            }
        } catch {
            setIsPinned(!next);
            toast.error('Không thể thực hiện thao tác này');
        }
    };
    const handleToggleComments = async () => {
        const next = !commentsEnabled;
        try {
            setCommentsEnabled(next);
            const formData = new FormData();
            formData.append('allowComments', String(next));
            await PostServices.editPost(postId, formData);
            toast(next ? 'Đã bật bình luận' : 'Đã tắt bình luận');
        } catch {
            setCommentsEnabled(!next);
            toast.error('Không thể thực hiện thao tác này');
        }
    };

    const handleSetPrivacy = async (value) => {
        const prev = privacy;
        try {
            setPrivacy(value);
            const formData = new FormData();
            formData.append('visibility', value);
            await PostServices.editPost(postId, formData);
            const labels = { public: 'Công khai', friends: 'Bạn bè', private: 'Chỉ mình tôi', followers: 'Người theo dõi' };
            toast(`Đã đặt: ${labels[value] || value}`);
        } catch {
            setPrivacy(prev);
            toast.error('Không thể cập nhật quyền riêng tư');
        }
    };

    const handleDeletePost = async () => {
        try {
            setDeletingPost(true);
            const res = await PostServices.deletePost(postId);
            if (res.code === 200) {
                toast.success('Đã xóa bài viết');
                setShowDeleteConfirm(false);
                onDelete?.(postId);
            } else {
                toast.error(res.message || 'Không thể xóa bài viết');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể xóa bài viết');
        } finally {
            setDeletingPost(false);
        }
    };

    const handleSavePost = () => toast('Đã lưu bài viết');

    const handleCopyLink = async () => {
        try {
            const postId = post?._id || post?.id;
            const url = `${window.location.origin}/posts/${postId}`;
            await navigator.clipboard.writeText(url);
            toast('Đã sao chép liên kết');
        } catch {
            toast('Không thể sao chép liên kết');
        }
    };

    const handleHidePost = () => toast('Đã ẩn bài viết khỏi bảng tin');
    const handleUnfollow = () => toast('Đã tắt theo dõi người này');
    const handleReport = () => toast('Đã gửi báo cáo');

    const displayedLikeCount = likeCount;
    function renderContentWithRealMentions(text = '', mentions = []) {
        if (!text) return null;

        const mentionMap = new Map();

        mentions.forEach((user) => {
            if (user?.username) {
                mentionMap.set(`@${user.username}`, user);
            }
        });

        const parts = text.split(/(@[a-zA-Z0-9._-]+)/g);

        return parts.map((part, index) => {
            const mentionedUser = mentionMap.get(part);

            if (mentionedUser) {
                return (
                    <span
                        key={`${part}-${index}`}
                        className="cursor-pointer font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        onClick={() => {
                            // sau này điều hướng qua profile
                            // navigate(`/profile/${mentionedUser._id}`)
                        }}
                    >
                        {part}
                    </span>
                );
            }

            return <span key={`${part}-${index}`}>{part}</span>;
        });
    }

    useEffect(() => {
        if (!openDetail || !postId) return;

        joinPostCommentRoom(postId);

        return () => {
            leavePostCommentRoom(postId);
        };
    }, [openDetail, postId]);

    return (
        <article className="group relative mb-5 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-[#1f1f22]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />

            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-white shadow-md dark:ring-white/10">
                            <AvatarImage src={authorAvatar} />
                            <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="max-w-[180px] truncate text-sm font-bold text-gray-900 hover:underline dark:text-white">
                                    {authorName}
                                </span>

                                {post?.author?.isVerified && (
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                                        ✓
                                    </span>
                                )}

                                {isPinned && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                        <Pin size={11} />
                                        Ghim
                                    </span>
                                )}
                            </div>

                            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                {authorUsername && <span>@{authorUsername}</span>}
                                {authorUsername && <span>•</span>}
                                <span>{createdTime}</span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="z-[9999] w-56">
                            {isOwner ? (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => setOpenEdit(true)}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Chỉnh sửa bài viết
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={handleTogglePin}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                                    >
                                        <Pin className="h-4 w-4" />
                                        {isPinned ? 'Bỏ ghim bài viết' : 'Ghim bài viết'}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={handleCopyLink}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        Sao chép liên kết
                                    </DropdownMenuItem>

                                    <div className="my-1 h-px bg-gray-100 dark:bg-white/10" />

                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/15"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Xóa bài viết
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <>
                                    <DropdownMenuItem
                                        onClick={handleSavePost}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                                    >
                                        <Bookmark className="h-4 w-4" />
                                        Lưu bài viết
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={handleCopyLink}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        Sao chép liên kết
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={handleHidePost}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                                    >
                                        <EyeOff className="h-4 w-4" />
                                        Ẩn bài viết
                                    </DropdownMenuItem>

                                    <div className="my-1 h-px bg-gray-100 dark:bg-white/10" />

                                    <DropdownMenuItem
                                        onClick={handleReport}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/15"
                                    >
                                        <Flag className="h-4 w-4" />
                                        Báo cáo
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-gray-900">
                        {postTypeLabels[postType] || 'Bài viết'}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                        {categoryLabels[category] || 'Khác'}
                    </span>

                    {post?.sourceType && (
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                            {post.sourceType === 'hot'
                                ? 'Đang nổi bật'
                                : post.sourceType === 'interest'
                                  ? 'Phù hợp sở thích'
                                  : 'Từ kết nối của bạn'}
                        </span>
                    )}
                </div>

                {content && (
                    <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-800 dark:text-gray-100">
                        {renderContentWithRealMentions(content, post?.mentions || [])}
                    </p>
                )}

                {postType === 'project' && <ProjectShowcase project={post?.project} />}

                {postType === 'question' && <QuestionShowcase question={post?.question} />}

                {postType === 'learning' && <LearningShowcase learning={post?.learning} />}

                {postType === 'collaboration' && <CollaborationShowcase collaboration={post?.collaboration} />}

                {postType === 'knowledge' && <KnowledgeShowcase content={content} />}

                {postType === 'achievement' && <AchievementShowcase />}

                {mediaItems.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-white/5">
                        <Swiper
                            modules={[Navigation, Pagination, Keyboard]}
                            navigation={mediaItems.length > 1}
                            pagination={mediaItems.length > 1 ? { clickable: true } : false}
                            keyboard={{ enabled: true }}
                            className="w-full"
                        >
                            {mediaItems.map((media, index) => {
                                const mediaUrl = media?.url || media;
                                const mediaType = media?.type || 'image';

                                return (
                                    <SwiperSlide key={media?.public_id || mediaUrl || index}>
                                        <button
                                            type="button"
                                            onClick={() => setOpenDetail(true)}
                                            className="block w-full bg-black"
                                        >
                                            {mediaType === 'video' ? (
                                                <video
                                                    src={mediaUrl}
                                                    controls
                                                    className="max-h-[520px] w-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={mediaUrl}
                                                    alt={`Post media ${index + 1}`}
                                                    className="max-h-[520px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                                />
                                            )}
                                        </button>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-2">
                        <div
                            className={`inline-flex items-center overflow-hidden rounded-full text-sm font-semibold transition ${
                                isLiked
                                    ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={handleLike}
                                className={`inline-flex items-center gap-2 px-3 py-2 transition ${
                                    isLiked
                                        ? 'hover:bg-red-100 dark:hover:bg-red-500/20'
                                        : 'hover:bg-gray-200 dark:hover:bg-white/15'
                                }`}
                            >
                                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (displayedLikeCount > 0) {
                                        setOpenLikes(true);
                                    }
                                }}
                                disabled={displayedLikeCount <= 0}
                                className={`px-3 py-2 transition ${
                                    isLiked
                                        ? 'hover:bg-red-100 dark:hover:bg-red-500/20'
                                        : 'hover:bg-gray-200 dark:hover:bg-white/15'
                                } ${displayedLikeCount <= 0 ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                                title="Xem danh sách người thích"
                            >
                                {displayedLikeCount}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleComment}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                        >
                            <MessageCircle className="h-4 w-4" />
                            {commentCount}
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenShare(true)}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                        >
                            <Send className="h-4 w-4" />
                            {shareCount}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleSavePost}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                        aria-label="Save"
                    >
                        <Bookmark className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <PostDetailModal
                open={openDetail}
                onClose={() => setOpenDetail(false)}
                post={post}
                currentUser={currentUser}
                onSubmitComment={(text) => {
                    onComment?.(text);
                }}
            />

            <LikesModal open={openLikes} onClose={() => setOpenLikes(false)} postId={post?._id || post?.id} />
            <ShareModal
                open={openShare}
                onClose={() => setOpenShare(false)}
                post={post}
                currentUser={currentUser}
            />

            {/* Edit Modal — dùng chung Modal.jsx với mode="edit" */}
            {openEdit && (
                <Modal
                    mode="edit"
                    post={post}
                    setOpenModal={setOpenEdit}
                    user={currentUser}
                    onUpdated={(updatedPost) => {
                        if (updatedPost) {
                            setPrivacy(updatedPost.visibility || privacy);
                            setCommentsEnabled(updatedPost.allowComments ?? commentsEnabled);
                        }
                        onEdit?.(updatedPost);
                    }}
                />
            )}

            {/* Delete Confirm Dialog */}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !deletingPost) setShowDeleteConfirm(false);
                    }}
                >
                    <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17191f]">
                        <div className="p-6 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xóa bài viết?</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.
                            </p>
                        </div>
                        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deletingPost}
                                className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleDeletePost}
                                disabled={deletingPost}
                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                            >
                                {deletingPost && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                {deletingPost ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}
