import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, AlertCircle, Home } from 'lucide-react';
import { toast } from 'react-toastify';
import config from '../../config';
import * as PostServices from '../../services/posts.services';
import Post from '../Dashboard/Post';

export default function PostDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.user?.infoUser);

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        PostServices.getPostDetail(id)
            .then((res) => {
                if (!isMounted) return;
                if (res?.code === 200 && res?.data) {
                    setPost(res.data);
                } else {
                    setError(res?.message || 'Không thể tải bài viết');
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('Fetch post detail error:', err);
                setError(err?.response?.data?.message || 'Bài viết không tồn tại hoặc đã bị ẩn/xóa');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(config.routes.dashboard);
        }
    };

    const handleEditPost = (updatedPost) => {
        if (!updatedPost) return;
        setPost((prev) => (prev ? { ...prev, ...updatedPost } : updatedPost));
    };

    const handleDeletePost = () => {
        toast.success('Đã xóa bài viết thành công');
        navigate(config.routes.dashboard);
    };

    return (
        <div className="min-h-screen pb-16">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/85 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-[#12151b]/85">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                        title="Quay lại"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 dark:text-white">Bài viết</h1>
                        {post?.author?.fullName && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                của {post.author.fullName}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate(config.routes.dashboard)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                    title="Về bảng tin"
                >
                    <Home size={18} />
                </button>
            </div>

            {/* Content Area */}
            <div className="p-3 sm:p-4">
                {loading && (
                    <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-white/10" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3.5 w-1/3 rounded-full bg-slate-200 dark:bg-white/10" />
                                <div className="h-2.5 w-1/4 rounded-full bg-slate-100 dark:bg-white/5" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="h-3.5 w-full rounded-full bg-slate-200 dark:bg-white/10" />
                            <div className="h-3.5 w-4/5 rounded-full bg-slate-200 dark:bg-white/10" />
                        </div>
                        <div className="h-48 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-500 dark:bg-red-500/10">
                            <AlertCircle size={28} />
                        </div>
                        <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                            Không thể tải bài viết
                        </h2>
                        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate(config.routes.dashboard)}
                            className="mt-5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-white transition hover:bg-primary/90 active:scale-95"
                        >
                            Quay về Trang chủ
                        </button>
                    </div>
                )}

                {!loading && !error && post && (
                    <Post
                        post={post}
                        currentUser={currentUser}
                        onEdit={handleEditPost}
                        onDelete={handleDeletePost}
                    />
                )}
            </div>
        </div>
    );
}
