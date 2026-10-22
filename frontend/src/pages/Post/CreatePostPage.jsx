import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

import { createPost } from '../../services/posts.services';
import PostTypeSelector from './components/PostTypeSelector';
import ProjectFields from './components/ProjectFields';
import ImagePicker from './components/ImagePicker';
import { buildPostFormData } from './utils/buildPostFormData';

const categories = [
    {
        value: 'technology',
        label: 'Công nghệ',
    },
    {
        value: 'finance_banking',
        label: 'Tài chính - Ngân hàng',
    },
    {
        value: 'marketing',
        label: 'Marketing',
    },
    {
        value: 'design',
        label: 'Thiết kế',
    },
    {
        value: 'business',
        label: 'Kinh doanh',
    },
    {
        value: 'language',
        label: 'Ngôn ngữ',
    },
    {
        value: 'education',
        label: 'Giáo dục',
    },
    {
        value: 'science',
        label: 'Khoa học',
    },
    {
        value: 'startup',
        label: 'Startup',
    },
    {
        value: 'art',
        label: 'Nghệ thuật',
    },
    {
        value: 'music',
        label: 'Âm nhạc',
    },
    {
        value: 'health',
        label: 'Sức khỏe',
    },
    {
        value: 'other',
        label: 'Khác',
    },
];

function CreatePostPage() {
    const navigate = useNavigate();

    const [postType, setPostType] = useState('normal');
    const [category, setCategory] = useState('other');
    const [caption, setCaption] = useState('');
    const [location, setLocation] = useState('');
    const [visibility, setVisibility] = useState('public');

    const [allowComments, setAllowComments] = useState(true);
    const [hideLikeCount, setHideLikeCount] = useState(false);
    const [hideShare, setHideShare] = useState(false);

    const [images, setImages] = useState([]);

    const [projectFields, setProjectFields] = useState({
        projectName: '',
        summary: '',
        toolsText: '',
        progress: 0,
        status: 'in_progress',
        githubUrl: '',
        demoUrl: '',
    });

    const [loading, setLoading] = useState(false);

    const buildProjectPayload = () => {
        const tools = projectFields.toolsText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        const links = [];

        if (projectFields.githubUrl.trim()) {
            links.push({
                title: 'GitHub',
                url: projectFields.githubUrl.trim(),
                type: 'github',
            });
        }

        if (projectFields.demoUrl.trim()) {
            links.push({
                title: 'Demo',
                url: projectFields.demoUrl.trim(),
                type: 'demo',
            });
        }

        return {
            projectName: projectFields.projectName.trim(),
            summary: projectFields.summary.trim(),
            tools,
            progress: Number(projectFields.progress) || 0,
            status: projectFields.status,
            links,
        };
    };

    const validateBeforeSubmit = () => {
        if (postType === 'normal' && !caption.trim() && images.length === 0) {
            toast.error('Bài viết thường cần có nội dung hoặc ảnh');
            return false;
        }

        if (postType === 'project' && !projectFields.projectName.trim()) {
            toast.error('Tên dự án là bắt buộc');
            return false;
        }

        if (images.length > 10) {
            toast.error('Một bài viết chỉ được tối đa 10 ảnh');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateBeforeSubmit()) return;

        try {
            setLoading(true);

            const project = postType === 'project' ? buildProjectPayload() : undefined;

            const formData = buildPostFormData({
                postType,
                category,
                caption,
                location,
                visibility,
                allowComments,
                hideLikeCount,
                hideShare,
                images,
                project,
            });

            const res = await createPost(formData);

            if (res.code === 201) {
                toast.success(res.message || 'Tạo bài viết thành công');

                setCaption('');
                setLocation('');
                setImages([]);
                setPostType('normal');
                setCategory('other');

                navigate('/');
            } else {
                toast.error(res.message || 'Tạo bài viết thất bại');
            }
        } catch (error) {
            console.log('Create post error:', error);
            toast.error(error?.response?.data?.message || 'Tạo bài viết thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-3 sm:py-6 px-3 sm:px-4 pb-24 sm:pb-6">
            <div className="max-w-2xl mx-auto">
                {/* Mobile Back Button */}
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-200/70 active:scale-90 dark:text-gray-200 dark:hover:bg-white/10"
                        aria-label="Quay lại"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        Tạo bài viết
                    </h1>
                </div>

                <div className="rounded-2xl sm:rounded-[28px] border border-gray-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#18181b]">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Chia sẻ bài viết, dự án hoặc kiến thức của bạn.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-4 sm:px-5 py-4 sm:py-5 space-y-4">
                        <PostTypeSelector value={postType} onChange={setPostType} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Danh mục</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition"
                            >
                                {categories.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nội dung</label>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Bạn muốn chia sẻ điều gì?"
                                rows={5}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                        </div>

                        {postType === 'project' && <ProjectFields value={projectFields} onChange={setProjectFields} />}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vị trí</label>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Ví dụ: TP. Hồ Chí Minh"
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                        </div>

                        <ImagePicker images={images} onChange={setImages} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quyền riêng tư</label>

                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition"
                            >
                                <option value="public">Công khai</option>
                                <option value="followers">Người theo dõi</option>
                                <option value="friends">Bạn bè</option>
                                <option value="private">Chỉ mình tôi</option>
                            </select>
                        </div>

                        <div className="space-y-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] p-3 sm:p-4">
                            <label className="flex items-center justify-between gap-3 cursor-pointer">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cho phép bình luận</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={allowComments}
                                        onChange={(e) => setAllowComments(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-[22px] bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow peer-checked:translate-x-[18px] transition-transform" />
                                </div>
                            </label>

                            <label className="flex items-center justify-between gap-3 cursor-pointer">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ẩn số lượt thích</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={hideLikeCount}
                                        onChange={(e) => setHideLikeCount(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-[22px] bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow peer-checked:translate-x-[18px] transition-transform" />
                                </div>
                            </label>

                            <label className="flex items-center justify-between gap-3 cursor-pointer">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ẩn chia sẻ</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={hideShare}
                                        onChange={(e) => setHideShare(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-[22px] bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow peer-checked:translate-x-[18px] transition-transform" />
                                </div>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 text-sm font-bold shadow-sm transition active:scale-[0.98] disabled:opacity-60"
                        >
                            {loading ? 'Đang đăng bài...' : 'Đăng bài'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreatePostPage;
