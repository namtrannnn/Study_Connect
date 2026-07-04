import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    ImagePlus,
    Sparkles,
    FolderKanban,
    HelpCircle,
    BookOpen,
    GraduationCap,
    Handshake,
    Trophy,
    Globe2,
    Users,
    Lock,
    Github,
    ExternalLink,
    Loader2,
    Trash2,
    Settings2,
    MessageCircleOff,
    EyeOff,
    Share2,
    MapPin,
    AtSign,
    UserCheck,
    Pencil,
} from 'lucide-react';
import { toast } from 'react-toastify';

import * as PostServices from '../../services/posts.services';
import * as UserServices from '../../services/user.services';
const POST_TYPES = [
    {
        value: 'normal',
        label: 'Bài viết',
        desc: 'Chia sẻ nhanh',
        icon: Sparkles,
    },
    {
        value: 'project',
        label: 'Dự án',
        desc: 'Showcase sản phẩm',
        icon: FolderKanban,
    },
    {
        value: 'question',
        label: 'Câu hỏi',
        desc: 'Cần hỗ trợ',
        icon: HelpCircle,
    },
    {
        value: 'knowledge',
        label: 'Kiến thức',
        desc: 'Chia sẻ bài học',
        icon: BookOpen,
    },
    {
        value: 'learning',
        label: 'Học tập',
        desc: 'Tiến trình học',
        icon: GraduationCap,
    },
    {
        value: 'collaboration',
        label: 'Cộng tác',
        desc: 'Tìm đồng đội',
        icon: Handshake,
    },
    {
        value: 'achievement',
        label: 'Thành tựu',
        desc: 'Khoe thành quả',
        icon: Trophy,
    },
];

const CATEGORIES = [
    { value: 'technology', label: 'Công nghệ' },
    { value: 'finance_banking', label: 'Tài chính' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'design', label: 'Thiết kế' },
    { value: 'business', label: 'Kinh doanh' },
    { value: 'language', label: 'Ngôn ngữ' },
    { value: 'education', label: 'Giáo dục' },
    { value: 'science', label: 'Khoa học' },
    { value: 'startup', label: 'Startup' },
    { value: 'art', label: 'Nghệ thuật' },
    { value: 'music', label: 'Âm nhạc' },
    { value: 'health', label: 'Sức khỏe' },
    { value: 'other', label: 'Khác' },
];

const VISIBILITIES = [
    {
        value: 'public',
        label: 'Công khai',
        icon: Globe2,
    },
    {
        value: 'followers',
        label: 'Người theo dõi',
        icon: Users,
    },
    {
        value: 'friends',
        label: 'Bạn bè',
        icon: Users,
    },
    {
        value: 'private',
        label: 'Chỉ mình tôi',
        icon: Lock,
    },
    {
        value: 'custom',
        label: 'Tùy chỉnh',
        icon: UserCheck,
    },
];

function Modal({ setOpenModal, user, onCreated, mode = 'create', post, onUpdated }) {
    const isEdit = mode === 'edit';

    const [postType, setPostType] = useState('normal');
    const [category, setCategory] = useState('other');
    const [caption, setCaption] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState('');
    // Ảnh cũ đã có trên server (chỉ dùng ở mode edit)
    const [existingMedia, setExistingMedia] = useState([]);
    const [selectedMentions, setSelectedMentions] = useState([]);
    const [mentionKeyword, setMentionKeyword] = useState('');
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [allowedUsersText, setAllowedUsersText] = useState('');

    const [allowComments, setAllowComments] = useState(true);
    const [hideLikeCount, setHideLikeCount] = useState(false);
    const [hideShare, setHideShare] = useState(false);

    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const [project, setProject] = useState({
        projectName: '',
        summary: '',
        toolsText: '',
        progress: 0,
        status: 'in_progress',
        githubUrl: '',
        demoUrl: '',
    });
    const [question, setQuestion] = useState({
        title: '',
        detail: '',
    });

    const [learning, setLearning] = useState({
        title: '',
        goal: '',
        progressText: '',
        resourceTitle: '',
        resourceUrl: '',
    });

    const [collaboration, setCollaboration] = useState({
        title: '',
        neededRolesText: '',
        description: '',
        isOpen: true,
    });

    // Điền dữ liệu cũ khi ở mode edit
    useEffect(() => {
        if (!isEdit || !post) return;

        setPostType(post.postType || 'normal');
        setCategory(post.category || 'other');
        setCaption(post.caption || post.content || '');
        setVisibility(post.visibility || post.privacy || 'public');
        setLocation(post.location || '');
        setAllowComments(post.allowComments ?? true);
        setHideLikeCount(post.hideLikeCount ?? false);
        setHideShare(post.hideShare ?? false);
        setImages([]);
        // Load ảnh cũ đã có trên server
        setExistingMedia(Array.isArray(post.media) ? post.media : []);

        if (post.project) {
            const githubLink = post.project.links?.find((l) => l.type === 'github');
            const demoLink = post.project.links?.find((l) => l.type === 'demo');
            setProject({
                projectName: post.project.projectName || '',
                summary: post.project.summary || '',
                toolsText: (post.project.tools || []).join(', '),
                progress: post.project.progress ?? 0,
                status: post.project.status || 'in_progress',
                githubUrl: githubLink?.url || '',
                demoUrl: demoLink?.url || '',
            });
        }
        if (post.question) {
            setQuestion({ title: post.question.title || '', detail: post.question.detail || '' });
        }
        if (post.learning) {
            const res = post.learning.resources?.[0];
            setLearning({
                title: post.learning.title || '',
                goal: post.learning.goal || '',
                progressText: post.learning.progressText || '',
                resourceTitle: res?.title || '',
                resourceUrl: res?.url || '',
            });
        }
        if (post.collaboration) {
            setCollaboration({
                title: post.collaboration.title || '',
                neededRolesText: (post.collaboration.neededRoles || []).join(', '),
                description: post.collaboration.description || '',
                isOpen: post.collaboration.isOpen ?? true,
            });
        }
    }, [isEdit, post]);
    const selectedPostType = POST_TYPES.find((item) => item.value === postType);
    const SelectedPostIcon = selectedPostType?.icon || Sparkles;
    const selectedVisibility = VISIBILITIES.find((item) => item.value === visibility);
    const SelectedVisibilityIcon = selectedVisibility?.icon || Globe2;

    useEffect(() => {
        if (!showMentionSuggestions) {
            setMentionSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await UserServices.searchUsers({
                    keyword: mentionKeyword,
                    scope: 'mention',
                    limit: 10,
                });

                setMentionSuggestions(res?.data || []);
            } catch (error) {
                console.log('Search mention error:', error);
                setMentionSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [mentionKeyword, showMentionSuggestions]);

    const handleClose = () => {
        if (loading) return;
        setOpenModal(false);
    };
    const handleSelectMention = (selectedUser) => {
        const username = selectedUser.username || '';
        const userId = selectedUser._id || selectedUser.id;

        if (!userId || !username) return;

        setCaption((prev) => {
            const words = prev.split(/\s/);
            words[words.length - 1] = `@${username}`;
            return `${words.join(' ')} `;
        });

        setSelectedMentions((prev) => {
            const existed = prev.some((item) => {
                const id = item._id || item.id;
                return id === userId;
            });

            if (existed) return prev;

            return [...prev, selectedUser];
        });

        setMentionKeyword('');
        setMentionSuggestions([]);
        setShowMentionSuggestions(false);
    };
    const handleCaptionChange = (value) => {
        setCaption(value);

        const words = value.split(/\s/);
        const lastWord = words[words.length - 1];

        // Gõ @ hoặc @n đều mở mention dropdown
        if (lastWord.startsWith('@')) {
            const keyword = lastWord.slice(1);

            setMentionKeyword(keyword);
            setShowMentionSuggestions(true);
            return;
        }

        setMentionKeyword('');
        setShowMentionSuggestions(false);
        setMentionSuggestions([]);
    };
    const handleProjectChange = (field, value) => {
        setProject((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleQuestionChange = (field, value) => {
        setQuestion((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleLearningChange = (field, value) => {
        setLearning((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleCollaborationChange = (field, value) => {
        setCollaboration((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleSelectImages = (e) => {
        const files = Array.from(e.target.files || []);

        if (files.length + images.length > 10) {
            toast.error('Một bài viết chỉ được tối đa 10 ảnh');
            return;
        }

        setImages((prev) => [...prev, ...files]);
        e.target.value = '';
    };

    const handleRemoveImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const buildProjectPayload = () => {
        const tools = project.toolsText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        const links = [];

        if (project.githubUrl.trim()) {
            links.push({
                title: 'GitHub',
                url: project.githubUrl.trim(),
                type: 'github',
            });
        }

        if (project.demoUrl.trim()) {
            links.push({
                title: 'Demo',
                url: project.demoUrl.trim(),
                type: 'demo',
            });
        }

        return {
            projectName: project.projectName.trim(),
            summary: project.summary.trim(),
            tools,
            progress: Number(project.progress) || 0,
            status: project.status,
            links,
        };
    };
    const buildQuestionPayload = () => {
        return {
            title: question.title.trim(),
            detail: question.detail.trim(),
            isResolved: false,
        };
    };

    const buildLearningPayload = () => {
        const resources = [];

        if (learning.resourceUrl.trim()) {
            resources.push({
                title: learning.resourceTitle.trim() || 'Tài liệu học tập',
                url: learning.resourceUrl.trim(),
                type: 'document',
            });
        }

        return {
            title: learning.title.trim(),
            goal: learning.goal.trim(),
            progressText: learning.progressText.trim(),
            resources,
        };
    };

    const buildCollaborationPayload = () => {
        const neededRoles = collaboration.neededRolesText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        return {
            title: collaboration.title.trim(),
            neededRoles,
            description: collaboration.description.trim(),
            isOpen: collaboration.isOpen,
        };
    };
    const parseIdList = (text) => {
        return text
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    };
    const validateForm = () => {
        if (postType === 'normal' && !caption.trim() && images.length === 0) {
            toast.error('Bài viết thường cần có nội dung hoặc ảnh');
            return false;
        }

        if (postType === 'project' && !project.projectName.trim()) {
            toast.error('Tên dự án là bắt buộc');
            return false;
        }

        if (postType === 'question' && !question.title.trim()) {
            toast.error('Tiêu đề câu hỏi là bắt buộc');
            return false;
        }

        if (postType === 'learning' && !learning.title.trim()) {
            toast.error('Tiêu đề học tập là bắt buộc');
            return false;
        }

        if (postType === 'collaboration' && !collaboration.title.trim()) {
            toast.error('Tiêu đề tìm cộng sự là bắt buộc');
            return false;
        }

        if (['knowledge', 'achievement'].includes(postType) && !caption.trim() && images.length === 0) {
            toast.error('Vui lòng nhập nội dung hoặc thêm ảnh');
            return false;
        }

        return true;
    };
    const renderCaptionHighlight = (text = '') => {
        if (!text) return null;

        const parts = text.split(/(@[a-zA-Z0-9._-]+)/g);

        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                return (
                    <span key={index} className="font-semibold text-blue-600 dark:text-blue-400">
                        {part}
                    </span>
                );
            }

            return <span key={index}>{part}</span>;
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const formData = new FormData();

            formData.append('postType', postType);
            formData.append('category', category);
            formData.append('caption', caption);
            formData.append('location', location);
            formData.append('visibility', visibility);

            formData.append('allowComments', String(allowComments));
            formData.append('hideLikeCount', String(hideLikeCount));
            formData.append('hideShare', String(hideShare));

            if (!isEdit) {
                const mentions = selectedMentions
                    .filter((item) => {
                        const username = item.username || '';
                        return username && caption.includes(`@${username}`);
                    })
                    .map((item) => item._id || item.id)
                    .filter(Boolean);

                const allowedUsers = visibility === 'custom' ? parseIdList(allowedUsersText) : [];
                formData.append('mentions', JSON.stringify(mentions));
                formData.append('allowedUsers', JSON.stringify(allowedUsers));
            }

            if (postType === 'project') {
                formData.append('project', JSON.stringify(buildProjectPayload()));
            }
            if (postType === 'question') {
                formData.append('question', JSON.stringify(buildQuestionPayload()));
            }
            if (postType === 'learning') {
                formData.append('learning', JSON.stringify(buildLearningPayload()));
            }
            if (postType === 'collaboration') {
                formData.append('collaboration', JSON.stringify(buildCollaborationPayload()));
            }

            images.forEach((image) => {
                formData.append('images', image);
            });

            if (isEdit) {
                // Chỉnh sửa bài viết
                const postId = post?._id || post?.id;
                const res = await PostServices.editPost(postId, formData);

                if (res.code === 200) {
                    toast.success(res.message || 'Cập nhật bài viết thành công');
                    onUpdated?.(res.data);
                    setOpenModal(false);
                } else {
                    toast.error(res.message || 'Không thể cập nhật bài viết');
                }
            } else {
                // Tạo bài viết mới
                const res = await PostServices.createPost(formData);

                if (res.code === 201) {
                    toast.success(res.message || 'Tạo bài viết thành công');
                    onCreated?.(res.data);

                    // Reset form
                    setCaption('');
                    setImages([]);
                    setPostType('normal');
                    setCategory('other');
                    setVisibility('public');
                    setLocation('');
                    setShowMentionSuggestions(false);
                    setSelectedMentions([]);
                    setAllowedUsersText('');
                    setAllowComments(true);
                    setHideLikeCount(false);
                    setHideShare(false);
                    setShowAdvancedOptions(false);
                    setOpenModal(false);
                } else {
                    toast.error(res.message || 'Tạo bài viết thất bại');
                }
            }
        } catch (error) {
            console.log('Submit post error:', error);
            toast.error(error?.response?.data?.message || (isEdit ? 'Không thể cập nhật bài viết' : 'Tạo bài viết thất bại'));
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-3 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17191f]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />
                <div className="flex max-h-[92vh] flex-col">
                    <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#17191f]/90">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                                        {isEdit ? <Pencil size={20} /> : <SelectedPostIcon size={20} />}
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {isEdit ? 'Cập nhật nội dung, loại bài hoặc cài đặt hiển thị' : 'Chia sẻ ý tưởng, dự án hoặc câu hỏi của bạn'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="custom-modal-scroll overflow-y-auto px-5 py-5">
                        <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-white/10 dark:from-white/5 dark:to-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <img
                                    src={user?.avatar || 'https://i.pravatar.cc/150?img=3'}
                                    alt="avatar"
                                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white shadow-md dark:ring-white/10"
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-semibold text-gray-900 dark:text-white">
                                        {user?.fullName || user?.username || 'Người dùng'}
                                    </div>

                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-200 dark:ring-white/10">
                                            <SelectedVisibilityIcon size={13} />
                                            {selectedVisibility?.label || 'Công khai'}
                                        </div>

                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20">
                                            <SelectedPostIcon size={13} />
                                            {selectedPostType?.label || 'Bài viết'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative mt-4">
                                <div className="relative min-h-[180px]">
                                    {/* Lớp hiển thị text màu xanh cho @mention */}
                                    <div className="pointer-events-none absolute inset-0 min-h-[180px] whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-[16px] leading-7 text-gray-900 dark:border-white/10 dark:bg-[#20232b] dark:text-white">
                                        {caption ? (
                                            renderCaptionHighlight(caption)
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">
                                                {`${user?.fullName || 'Bạn'} ơi, hôm nay bạn muốn chia sẻ điều gì? Gõ @ để nhắc tên`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Textarea thật để nhập, nhưng chữ transparent */}
                                    <textarea
                                        value={caption}
                                        onChange={(e) => handleCaptionChange(e.target.value)}
                                        rows={5}
                                        className="relative z-10 min-h-[180px] w-full resize-none rounded-2xl border border-gray-200 bg-transparent px-4 py-4 text-[16px] leading-7 text-transparent caret-gray-900 outline-none transition placeholder:text-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:caret-white"
                                    />
                                </div>

                                {showMentionSuggestions && mentionSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-[99999] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#20232b]">
                                        {mentionSuggestions.map((item) => (
                                            <button
                                                key={item._id || item.id}
                                                type="button"
                                                onClick={() => handleSelectMention(item)}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/10"
                                            >
                                                <img
                                                    src={item.avatar || 'https://i.pravatar.cc/150?img=3'}
                                                    alt="avatar"
                                                    className="h-9 w-9 rounded-full object-cover"
                                                />

                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                        {item.fullName || item.username || 'Người dùng'}
                                                    </div>
                                                    <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                                        @{item.username || item.email}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedMentions.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedMentions.map((item) => {
                                            const id = item._id || item.id;

                                            return (
                                                <span
                                                    key={id}
                                                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                                                >
                                                    @{item.username || item.fullName}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedMentions((prev) =>
                                                                prev.filter((user) => (user._id || user.id) !== id),
                                                            )
                                                        }
                                                        className="text-blue-500 hover:text-red-500"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chọn kiểu bài viết</h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {selectedPostType?.desc}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {POST_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    const active = postType === type.value;

                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setPostType(type.value)}
                                            className={`rounded-2xl border p-3 text-left transition ${
                                                active
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-300'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            <Icon size={20} />
                                            <div className="mt-2 text-sm font-semibold">{type.label}</div>
                                            <div className="mt-0.5 text-[11px] opacity-70">{type.desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">
                                    Danh mục
                                </label>

                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                >
                                    {CATEGORIES.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">
                                    Quyền riêng tư
                                </label>

                                <select
                                    value={visibility}
                                    onChange={(e) => setVisibility(e.target.value)}
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                >
                                    {VISIBILITIES.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
                            <button
                                type="button"
                                onClick={() => setShowAdvancedOptions((prev) => !prev)}
                                className="flex w-full items-center justify-between px-4 py-4 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                                        <Settings2 size={18} />
                                    </div>

                                    <div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                            Tùy chọn nâng cao
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Vị trí, nhắc tên, quyền xem, bình luận và hiển thị tương tác
                                        </div>
                                    </div>
                                </div>

                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                                    {showAdvancedOptions ? 'Ẩn' : 'Mở'}
                                </span>
                            </button>

                            {showAdvancedOptions && (
                                <div className="space-y-4 border-t border-gray-100 px-4 py-4 dark:border-white/10">
                                    <div className="relative">
                                        <MapPin
                                            size={17}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                        <input
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Vị trí, ví dụ: TP. Hồ Chí Minh"
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                        />
                                    </div>

                                    {/* <div className="relative">
                                        <AtSign
                                            size={17}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                        <input
                                            value={mentionsText}
                                            onChange={(e) => setMentionsText(e.target.value)}
                                            placeholder="Mentions userId, cách nhau bằng dấu phẩy"
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                        />
                                    </div> */}

                                    {visibility === 'custom' && (
                                        <div className="relative">
                                            <UserCheck
                                                size={17}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                value={allowedUsersText}
                                                onChange={(e) => setAllowedUsersText(e.target.value)}
                                                placeholder="UserId được xem bài, cách nhau bằng dấu phẩy"
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-[#20232b]">
                                            <input
                                                type="checkbox"
                                                checked={allowComments}
                                                onChange={(e) => setAllowComments(e.target.checked)}
                                            />
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                    <MessageCircleOff size={15} />
                                                    Bình luận
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {allowComments ? 'Đang bật' : 'Đang tắt'}
                                                </div>
                                            </div>
                                        </label>

                                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-[#20232b]">
                                            <input
                                                type="checkbox"
                                                checked={hideLikeCount}
                                                onChange={(e) => setHideLikeCount(e.target.checked)}
                                            />
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                    <EyeOff size={15} />
                                                    Ẩn lượt thích
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {hideLikeCount ? 'Sẽ ẩn' : 'Đang hiện'}
                                                </div>
                                            </div>
                                        </label>

                                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-[#20232b]">
                                            <input
                                                type="checkbox"
                                                checked={hideShare}
                                                onChange={(e) => setHideShare(e.target.checked)}
                                            />
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                    <Share2 size={15} />
                                                    Ẩn chia sẻ
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {hideShare ? 'Sẽ ẩn' : 'Đang hiện'}
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        {postType === 'project' && (
                            <div className="mt-5 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 dark:border-blue-500/20 dark:from-blue-950/40 dark:via-white/5 dark:to-cyan-950/20">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Thông tin dự án</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Hiển thị như một project showcase trong feed
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-white px-3 py-2 text-center text-xs font-bold text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-300">
                                        {project.progress || 0}%
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        value={project.projectName}
                                        onChange={(e) => handleProjectChange('projectName', e.target.value)}
                                        placeholder="Tên dự án, ví dụ: StudyConnect"
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <textarea
                                        value={project.summary}
                                        onChange={(e) => handleProjectChange('summary', e.target.value)}
                                        placeholder="Mô tả ngắn về dự án"
                                        rows={3}
                                        className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <input
                                        value={project.toolsText}
                                        onChange={(e) => handleProjectChange('toolsText', e.target.value)}
                                        placeholder="Công nghệ: React, Node.js, MongoDB"
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={project.progress}
                                            onChange={(e) => handleProjectChange('progress', e.target.value)}
                                            placeholder="Tiến độ"
                                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                        />

                                        <select
                                            value={project.status}
                                            onChange={(e) => handleProjectChange('status', e.target.value)}
                                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                        >
                                            <option value="idea">Ý tưởng</option>
                                            <option value="in_progress">Đang làm</option>
                                            <option value="completed">Hoàn thành</option>
                                            <option value="paused">Tạm dừng</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="relative">
                                            <Github
                                                size={17}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                value={project.githubUrl}
                                                onChange={(e) => handleProjectChange('githubUrl', e.target.value)}
                                                placeholder="Link GitHub"
                                                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                            />
                                        </div>

                                        <div className="relative">
                                            <ExternalLink
                                                size={17}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                value={project.demoUrl}
                                                onChange={(e) => handleProjectChange('demoUrl', e.target.value)}
                                                placeholder="Link demo"
                                                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {postType === 'question' && (
                            <div className="mt-5 overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 dark:border-amber-500/20 dark:from-amber-950/30 dark:via-white/5 dark:to-orange-950/20">
                                <div className="mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Thông tin câu hỏi</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Đặt câu hỏi rõ ràng để mọi người dễ hỗ trợ hơn
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        value={question.title}
                                        onChange={(e) => handleQuestionChange('title', e.target.value)}
                                        placeholder="Tiêu đề câu hỏi, ví dụ: Lỗi JWT 401 khi tạo post?"
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <textarea
                                        value={question.detail}
                                        onChange={(e) => handleQuestionChange('detail', e.target.value)}
                                        placeholder="Mô tả chi tiết vấn đề, bạn đã thử gì, lỗi xảy ra ở đâu..."
                                        rows={4}
                                        className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                        {postType === 'learning' && (
                            <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 dark:border-emerald-500/20 dark:from-emerald-950/30 dark:via-white/5 dark:to-teal-950/20">
                                <div className="mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Tiến trình học tập</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Chia sẻ mục tiêu, tiến độ hoặc tài liệu bạn đang học
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        value={learning.title}
                                        onChange={(e) => handleLearningChange('title', e.target.value)}
                                        placeholder="Tiêu đề, ví dụ: Học React Query trong 7 ngày"
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <input
                                        value={learning.goal}
                                        onChange={(e) => handleLearningChange('goal', e.target.value)}
                                        placeholder="Mục tiêu học tập"
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <textarea
                                        value={learning.progressText}
                                        onChange={(e) => handleLearningChange('progressText', e.target.value)}
                                        placeholder="Bạn đã học được gì? Đang gặp khó khăn ở đâu?"
                                        rows={4}
                                        className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <input
                                            value={learning.resourceTitle}
                                            onChange={(e) => handleLearningChange('resourceTitle', e.target.value)}
                                            placeholder="Tên tài liệu"
                                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                        />

                                        <input
                                            value={learning.resourceUrl}
                                            onChange={(e) => handleLearningChange('resourceUrl', e.target.value)}
                                            placeholder="Link tài liệu"
                                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {postType === 'collaboration' && (
                            <div className="mt-5 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 dark:border-violet-500/20 dark:from-violet-950/30 dark:via-white/5 dark:to-fuchsia-950/20">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Tìm cộng sự</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Tạo lời mời tham gia dự án, nhóm học tập hoặc sản phẩm
                                        </p>
                                    </div>

                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={collaboration.isOpen}
                                            onChange={(e) => handleCollaborationChange('isOpen', e.target.checked)}
                                        />
                                        Đang mở
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        value={collaboration.title}
                                        onChange={(e) => handleCollaborationChange('title', e.target.value)}
                                        placeholder="Tiêu đề, ví dụ: Tìm frontend React cho StudyConnect"
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <input
                                        value={collaboration.neededRolesText}
                                        onChange={(e) => handleCollaborationChange('neededRolesText', e.target.value)}
                                        placeholder="Vai trò cần tìm: Frontend, Backend, Designer"
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />

                                    <textarea
                                        value={collaboration.description}
                                        onChange={(e) => handleCollaborationChange('description', e.target.value)}
                                        placeholder="Mô tả dự án, yêu cầu, thời gian, cách tham gia..."
                                        rows={4}
                                        className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#20232b] dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="mt-5 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                                <ImagePlus size={20} />
                                Thêm ảnh vào bài viết
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleSelectImages}
                                    className="hidden"
                                />
                            </label>

                            {/* Ảnh cũ (chỉ hiện ở mode edit) */}
                            {isEdit && existingMedia.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {existingMedia.map((media, index) => (
                                        <div
                                            key={media.public_id || media.url || index}
                                            className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/10"
                                        >
                                            <img
                                                src={media.url || media}
                                                alt={`existing-${index}`}
                                                className="h-32 w-full object-cover transition group-hover:scale-105"
                                            />
                                            <div className="absolute bottom-1 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                                                Ảnh hiện tại
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setExistingMedia((prev) => prev.filter((_, i) => i !== index))}
                                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Ảnh mới upload */}
                            {images.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {images.map((image, index) => (
                                        <div
                                            key={`${image.name}-${index}`}
                                            className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/10"
                                        >
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt="preview"
                                                className="h-32 w-full object-cover transition group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition hover:bg-red-600"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 -mx-5 mt-5 border-t border-gray-100 bg-white/90 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#17191f]/90">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading && <Loader2 size={18} className="animate-spin" />}
                                {loading ? (isEdit ? 'Đang lưu...' : 'Đang đăng bài...') : (isEdit ? 'Lưu thay đổi' : 'Đăng bài')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default Modal;
