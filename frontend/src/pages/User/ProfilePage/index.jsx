import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import EditProfileModal from './EditProfileModal';
import ArchivePage from './ArchivePage';
import PostDetailModal from '../../Dashboard/PostDetailModal';
import * as ProfileServices from '../../../services/ProfileServices';

export default function ProfilePage() {
    const { userId } = useParams();

    const [activeView, setActiveView] = useState('profile');

    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [postLoading, setPostLoading] = useState(false);
    const [error, setError] = useState('');

    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        bio: '',
        isPrivate: false,
        avatar: '',
        avatarFile: null,
    });

    const [activeTab, setActiveTab] = useState('posts');
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostDetailOpen, setIsPostDetailOpen] = useState(false);

    const [recentFriends] = useState([
        {
            _id: '1',
            fullName: 'Nguyễn Văn A',
            username: 'nguyenvana',
            avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=friend1',
        },
        {
            _id: '2',
            fullName: 'Trần Thị B',
            username: 'tranthib',
            avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=friend2',
        },
        {
            _id: '3',
            fullName: 'Lê Văn C',
            username: 'levanc',
            avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=friend3',
        },
        {
            _id: '4',
            fullName: 'Phạm Thị D',
            username: 'phamthid',
            avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=friend4',
        },
        {
            _id: '5',
            fullName: 'Hoàng Minh E',
            username: 'hoangminhe',
            avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=friend5',
        },
    ]);

    const user = profileData?.user;
    const stats = profileData?.stats;
    const relation = profileData?.relation;

    const currentProfileUserId = user?._id;

    useEffect(() => {
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        if (currentProfileUserId) {
            loadPostGrid({ reset: true, targetUserId: currentProfileUserId });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProfileUserId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError('');

            const res = userId
                ? await ProfileServices.getProfileByUserId(userId)
                : await ProfileServices.getMyProfile();

            setProfileData(res.data);
        } catch (error) {
            console.log('Load profile error:', error);
            setError(error?.response?.data?.message || 'Không thể tải trang cá nhân');
        } finally {
            setLoading(false);
        }
    };

    const loadPostGrid = async ({ reset = false, targetUserId = currentProfileUserId } = {}) => {
        if (!targetUserId) return;

        try {
            setPostLoading(true);

            const res = await ProfileServices.getUserPostGrid({
                userId: targetUserId,
                limit: 30,
                cursor: reset ? null : nextCursor,
            });

            const newPosts = res?.data || [];

            setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
            setNextCursor(res?.nextCursor || null);
            setHasMore(Boolean(res?.hasMore));
        } catch (error) {
            console.log('Load profile post grid error:', error);
        } finally {
            setPostLoading(false);
        }
    };

    const openArchivePage = () => {
        setActiveView('archive');
    };

    const backToProfile = () => {
        setActiveView('profile');
    };
    const openPostDetail = (post) => {
        setSelectedPost(post);
        setIsPostDetailOpen(true);
    };

    const closePostDetail = () => {
        setSelectedPost(null);
        setIsPostDetailOpen(false);
    };
    const openEditModal = () => {
        if (!user) return;

        setFormData({
            fullName: user.fullName || '',
            username: user.username || '',
            bio: user.bio || '',
            isPrivate: Boolean(user.isPrivate),
            avatar: user.avatar || '',
            avatarFile: null,
        });

        setIsEditOpen(true);
    };

    const closeEditModal = () => {
        setIsEditOpen(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (name === 'avatar' && files?.[0]) {
            const file = files[0];

            setFormData((prev) => ({
                ...prev,
                avatarFile: file,
                avatar: URL.createObjectURL(file),
            }));

            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = async () => {
        try {
            const data = new FormData();

            data.append('fullName', formData.fullName);
            data.append('username', formData.username);
            data.append('bio', formData.bio);
            data.append('isPrivate', formData.isPrivate);

            if (formData.avatarFile) {
                data.append('avatar', formData.avatarFile);
            }

            const res = await ProfileServices.updateProfile(data);

            setProfileData((prev) => ({
                ...prev,
                user: res.data,
                stats: {
                    postsCount: res.data.postsCount || prev?.stats?.postsCount || 0,
                    followersCount: res.data.followersCount || prev?.stats?.followersCount || 0,
                    followingCount: res.data.followingCount || prev?.stats?.followingCount || 0,
                },
            }));

            setIsEditOpen(false);
        } catch (error) {
            console.log('Update profile error:', error);
            alert(error?.response?.data?.message || 'Cập nhật profile thất bại');
        }
    };

    const getImageUrl = (post) => {
        return post?.firstMedia?.url || post?.firstMedia || null;
    };
    const limitWords = (text = '', maxWords = 18) => {
        const words = text.trim().split(/\s+/);

        if (!text.trim()) return '';

        if (words.length <= maxWords) {
            return text;
        }

        return words.slice(0, maxWords).join(' ') + '...';
    };
    if (activeView === 'archive') {
        return <ArchivePage onBack={backToProfile} />;
    }

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center text-gray-500 dark:text-gray-300">
                Đang tải trang cá nhân...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-5 text-center text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
                    {error}
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <>
            <div className="min-h-screen bg-surface-soft text-gray-900 dark:bg-surface-darker dark:text-white">
                <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8">
                    <div className="overflow-hidden rounded-4xl border border-blue-100 bg-white shadow-brand-soft dark:border-white/10 dark:bg-surface-cardDark">
                        <div className="h-32 bg-brand-gradient md:h-44" />

                        <div className="px-5 pb-6 md:px-8 md:pb-8">
                            <div className="-mt-16 flex flex-col gap-6 md:-mt-20 md:flex-row md:items-end md:justify-between">
                                <div className="flex flex-col gap-5 md:flex-row md:items-end">
                                    <div className="relative w-fit">
                                        <div className="rounded-full bg-white p-1 shadow-brand dark:bg-surface-cardDark">
                                            <img
                                                src={user.avatar}
                                                alt={user.fullName}
                                                className="h-32 w-32 rounded-full border-4 border-white object-cover dark:border-surface-cardDark md:h-40 md:w-40"
                                            />
                                        </div>

                                        <span className="absolute bottom-3 right-3 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 dark:border-surface-cardDark" />
                                    </div>

                                    <div className="pb-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-2xl font-bold md:text-3xl">{user.fullName}</h1>

                                            {user.isVerified && (
                                                <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                                    Đã xác minh
                                                </span>
                                            )}

                                            {user.isPrivate && (
                                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                                                    Riêng tư
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                            @{user.username || 'chưa-có-username'}
                                        </p>

                                        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                                            {user.bio || 'Người dùng này chưa thêm tiểu sử.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {relation?.isMe ? (
                                        <>
                                            <button
                                                onClick={openEditModal}
                                                className="rounded-2xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:scale-[1.02]"
                                            >
                                                Chỉnh sửa trang cá nhân
                                            </button>

                                            <button
                                                onClick={openArchivePage}
                                                className="rounded-2xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-brand-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                                            >
                                                Kho lưu trữ
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="rounded-2xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:scale-[1.02]">
                                                {relation?.relationStatus === 'friend'
                                                    ? 'Bạn bè'
                                                    : relation?.relationStatus === 'pending_sent'
                                                      ? 'Đã gửi lời mời'
                                                      : relation?.relationStatus === 'pending_received'
                                                        ? 'Phản hồi lời mời'
                                                        : 'Kết bạn'}
                                            </button>

                                            <button className="rounded-2xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-brand-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                                                Nhắn tin
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-3 gap-3 rounded-3xl bg-brand-gradient-soft p-3 dark:bg-brand-gradient-dark md:max-w-xl">
                                <div className="rounded-2xl bg-white/80 px-4 py-4 text-center shadow-sm dark:bg-white/10">
                                    <div className="text-xl font-bold">{stats?.postsCount || 0}</div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-300">bài viết</div>
                                </div>

                                <div className="rounded-2xl bg-white/80 px-4 py-4 text-center shadow-sm dark:bg-white/10">
                                    <div className="text-xl font-bold">{stats?.followersCount || 0}</div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-300">
                                        người theo dõi
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-white/80 px-4 py-4 text-center shadow-sm dark:bg-white/10">
                                    <div className="text-xl font-bold">{stats?.followingCount || 0}</div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-300">
                                        đang theo dõi
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                            Bạn bè mới nhất
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Hiển thị tối đa 5 người bạn gần đây
                                        </p>
                                    </div>

                                    <button className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
                                        Xem tất cả
                                    </button>
                                </div>

                                {recentFriends.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-blue-100 bg-brand-50/60 px-5 py-6 text-center dark:border-white/10 dark:bg-white/5">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            Chưa có bạn bè để hiển thị.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                                        {recentFriends.slice(0, 5).map((friend) => (
                                            <button
                                                key={friend._id}
                                                type="button"
                                                className="group rounded-3xl border border-blue-100 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-brand-soft dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                            >
                                                <img
                                                    src={friend.avatar}
                                                    alt={friend.fullName}
                                                    className="mx-auto h-16 w-16 rounded-full object-cover ring-4 ring-brand-50 dark:ring-white/10"
                                                />

                                                <div className="mt-3 text-center">
                                                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                                                        {friend.fullName}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                                        @{friend.username}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 rounded-4xl border border-blue-100 bg-white p-3 shadow-brand-soft dark:border-white/10 dark:bg-surface-cardDark md:p-4">
                        <div className="mb-4 flex items-center justify-center gap-8 border-b border-blue-100 pb-3 text-sm font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`pb-2 transition hover:text-brand-600 ${
                                    activeTab === 'posts'
                                        ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-300'
                                        : ''
                                }`}
                            >
                                Bài viết
                            </button>

                            <button
                                onClick={() => setActiveTab('projects')}
                                className={`pb-2 transition hover:text-brand-600 ${
                                    activeTab === 'projects'
                                        ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-300'
                                        : ''
                                }`}
                            >
                                Dự án
                            </button>

                            <button
                                onClick={() => setActiveTab('tagged')}
                                className={`pb-2 transition hover:text-brand-600 ${
                                    activeTab === 'tagged'
                                        ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-300'
                                        : ''
                                }`}
                            >
                                Được gắn thẻ
                            </button>
                        </div>

                        {activeTab === 'posts' && (
                            <>
                                {posts.length === 0 && !postLoading ? (
                                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl bg-gray-50 text-center dark:bg-white/5">
                                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl dark:bg-brand-500/20">
                                            📚
                                        </div>
                                        <h3 className="text-lg font-bold">Chưa có bài viết</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Khi người dùng đăng bài, bài viết sẽ hiển thị ở đây.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                                        {posts.map((post) => {
                                            const imageUrl = getImageUrl(post);

                                            return (
                                                <div
                                                    key={post._id}
                                                    onClick={() => openPostDetail(post)}
                                                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-sm dark:bg-white/5"
                                                >
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={post.caption || 'post'}
                                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm font-medium leading-6 text-gray-500 dark:text-gray-300">
                                                            {limitWords(post.caption || 'Bài viết không có ảnh', 18)}
                                                        </div>
                                                    )}

                                                    {post.mediaCount > 1 && (
                                                        <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold text-white">
                                                            {post.mediaCount} ảnh
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />

                                                    <div className="absolute inset-0 flex items-center justify-center gap-6 opacity-0 transition group-hover:opacity-100">
                                                        <div className="text-sm font-bold text-white">
                                                            ❤ {post.likesCount || 0}
                                                        </div>
                                                        <div className="text-sm font-bold text-white">
                                                            💬 {post.commentsCount || 0}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {hasMore && (
                                    <div className="mt-6 flex justify-center">
                                        <button
                                            disabled={postLoading}
                                            onClick={() => loadPostGrid()}
                                            className="rounded-2xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                                        >
                                            {postLoading ? 'Đang tải...' : 'Xem thêm'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'projects' && (
                            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl bg-gray-50 text-center dark:bg-white/5">
                                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-2xl dark:bg-cyan-500/20">
                                    🚀
                                </div>
                                <h3 className="text-lg font-bold">Chưa có dự án</h3>
                                <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                                    Tab này sẽ hiển thị các bài viết có loại dự án khi mình lọc theo postType = project.
                                </p>
                            </div>
                        )}

                        {activeTab === 'tagged' && (
                            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl bg-gray-50 text-center dark:bg-white/5">
                                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-2xl dark:bg-violet-500/20">
                                    🏷️
                                </div>
                                <h3 className="text-lg font-bold">Chưa có bài viết được gắn thẻ</h3>
                                <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                                    Tab này sẽ dùng sau khi có API lấy bài viết đã gắn thẻ hoặc nhắc đến người dùng.
                                </p>
                            </div>
                        )}

                        {hasMore && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    disabled={postLoading}
                                    onClick={() => loadPostGrid()}
                                    className="rounded-2xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                                >
                                    {postLoading ? 'Đang tải...' : 'Xem thêm'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* <CreateStoryModal isOpen={isCreateStoryOpen} onClose={closeCreateStoryModal} onSave={handleAddHighlight} /> */}

            <EditProfileModal
                isOpen={isEditOpen}
                onClose={closeEditModal}
                formData={formData}
                onChange={handleChange}
                onSave={handleSave}
            />

            {selectedPost && (
                <PostDetailModal
                    open={isPostDetailOpen}
                    onClose={closePostDetail}
                    post={{
                        ...selectedPost,
                        content: selectedPost?.caption,
                        author:
                            typeof selectedPost?.author === 'object'
                                ? selectedPost.author
                                : {
                                      fullName: user?.fullName,
                                      username: user?.username,
                                      avatar: user?.avatar,
                                  },
                        comments: selectedPost?.comments || [],
                    }}
                    currentUser={user}
                    onSubmitComment={(content) => {
                        console.log('Submit comment:', content);
                    }}
                />
            )}
        </>
    );
}
