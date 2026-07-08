import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

import EditProfileModal from './EditProfileModal';
import ArchivePage from './ArchivePage';
import PostDetailModal from '../../Dashboard/PostDetailModal';
import * as ProfileServices from '../../../services/ProfileServices';
import * as FriendServices from '../../../services/friend.services';

export default function ProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.user?.infoUser);

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
    const [friendList, setFriendList] = useState([]);
    const [relationStatus, setRelationStatus] = useState('none');
    const [friendLoading, setFriendLoading] = useState(false);
    const [saving, setSaving] = useState(false);

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
            loadFriendList(currentProfileUserId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProfileUserId]);

    // Sync relationStatus từ profileData
    useEffect(() => {
        if (profileData?.relation?.relationStatus) {
            setRelationStatus(profileData.relation.relationStatus);
        }
    }, [profileData]);

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

    const loadFriendList = async (targetUserId) => {
        try {
            const res = await FriendServices.getFriendList(targetUserId);
            if (res.code === 200) {
                setFriendList(res.data?.friends || []);
            }
        } catch {
            // silent fail
        }
    };

    const handleFriendAction = async () => {
        if (!user?._id || friendLoading) return;
        try {
            setFriendLoading(true);
            let res;
            if (relationStatus === 'none') {
                res = await FriendServices.sendFriendRequest(user._id);
                toast.success('Đã gửi lời mời kết bạn');
            } else if (relationStatus === 'pending_sent') {
                res = await FriendServices.cancelFriendRequest(user._id);
                toast('Đã hủy lời mời kết bạn');
            } else if (relationStatus === 'pending_received') {
                res = await FriendServices.acceptFriendRequest(user._id);
                toast.success('Đã chấp nhận lời mời kết bạn');
            } else if (relationStatus === 'friend') {
                res = await FriendServices.cancelFriendRequest(user._id);
                toast('Đã hủy kết bạn');
            }
            if (res?.data?.relationStatus) {
                setRelationStatus(res.data.relationStatus);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể thực hiện');
        } finally {
            setFriendLoading(false);
        }
    };

    const handleRefuseRequest = async () => {
        if (!user?._id || friendLoading) return;
        try {
            setFriendLoading(true);
            await FriendServices.refuseFriendRequest(user._id);
            setRelationStatus('none');
            toast('Đã từ chối lời mời');
        } catch {
            toast.error('Không thể từ chối lời mời');
        } finally {
            setFriendLoading(false);
        }
    };

    const handleOpenChat = () => {
        const roomChatId = currentUser?.friendList?.find(
            (f) => f.user_id === user?._id || f.user_id?.toString() === user?._id?.toString()
        )?.room_chat_id;
        if (roomChatId) {
            navigate(`/messenger?roomId=${roomChatId}`);
        } else {
            navigate(`/messenger`);
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
            setSaving(true);
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
            toast.success('Cập nhật profile thành công');
            setIsEditOpen(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Cập nhật profile thất bại');
        } finally {
            setSaving(false);
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
            <div className="min-h-screen text-gray-900 dark:text-white">
                <div className="mx-auto max-w-4xl px-4 pb-16 pt-4">

                    {/* Back button */}
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                        <ArrowLeft size={16} />
                        Quay lại
                    </button>

                    {/* Profile Card */}
                    <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1f1f22]">
                        {/* Cover — subtle pattern */}
                        <div className="relative h-36 md:h-44 bg-slate-50 dark:bg-white/5 overflow-hidden">
                            {/* dot pattern */}
                            <div className="absolute inset-0 opacity-40"
                                style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60 dark:to-[#1f1f22]/60" />
                        </div>

                        <div className="px-6 pb-6 md:px-8 md:pb-8">
                            {/* Avatar + Actions row */}
                            <div className="flex items-end justify-between -mt-12 md:-mt-14">
                                {/* Avatar */}
                                <div className="relative">
                                    <img
                                        src={user.avatar}
                                        alt={user.fullName}
                                        className="h-24 w-24 rounded-[20px] object-cover ring-4 ring-white shadow-lg dark:ring-[#1f1f22] md:h-28 md:w-28"
                                    />
                                    <span className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#1f1f22]" />
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 pb-1">
                                    {relation?.isMe ? (
                                        <>
                                            <button onClick={openEditModal}
                                                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-cyan-600">
                                                Chỉnh sửa hồ sơ
                                            </button>
                                            <button onClick={openArchivePage}
                                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                                                Kho lưu trữ
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={handleFriendAction} disabled={friendLoading}
                                                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-cyan-600 disabled:opacity-60">
                                                {friendLoading ? 'Đang xử lý...'
                                                    : relationStatus === 'friend' ? '✓ Bạn bè'
                                                    : relationStatus === 'pending_sent' ? 'Đã gửi lời mời'
                                                    : relationStatus === 'pending_received' ? 'Chấp nhận'
                                                    : '+ Kết bạn'}
                                            </button>
                                            {relationStatus === 'pending_received' && (
                                                <button onClick={handleRefuseRequest} disabled={friendLoading}
                                                    className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:bg-white/5">
                                                    Từ chối
                                                </button>
                                            )}
                                            <button onClick={handleOpenChat}
                                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                                                Nhắn tin
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Name + bio */}
                            <div className="mt-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-black text-gray-900 dark:text-white md:text-2xl">{user.fullName}</h1>
                                    {user.isVerified && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">✓</span>
                                    )}
                                    {user.isPrivate && (
                                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-300">🔒 Riêng tư</span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-gray-400">@{user.username || 'username'}</p>
                                {user.bio && (
                                    <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-300">{user.bio}</p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="mt-5 flex gap-6 border-t border-gray-100 pt-4 dark:border-white/10">
                                {[
                                    { label: 'Bài viết', value: stats?.postsCount || 0 },
                                    { label: 'Người theo dõi', value: stats?.followersCount || 0 },
                                    { label: 'Đang theo dõi', value: stats?.followingCount || 0 },
                                ].map((item, i) => (
                                    <div key={item.label} className={`flex flex-col items-center ${i > 0 ? 'border-l border-gray-100 pl-6 dark:border-white/10' : ''}`}>
                                        <span className="text-xl font-black text-gray-900 dark:text-white">{item.value}</span>
                                        <span className="text-xs font-medium text-gray-400">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Friends */}
                            {friendList.length > 0 && (
                                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-white/10">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                            Bạn bè <span className="text-gray-400 font-normal">· {friendList.length}</span>
                                        </span>
                                        <button className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
                                            Xem tất cả
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {friendList.slice(0, 7).map((friend) => (
                                            <button key={friend._id} type="button"
                                                onClick={() => navigate(`/profile/${friend._id}`)}
                                                className="group flex flex-col items-center gap-1 w-14">
                                                <img src={friend.avatar} alt={friend.fullName}
                                                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-transparent transition group-hover:ring-blue-400 group-hover:scale-105 shadow-sm" />
                                                <span className="w-full truncate text-center text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                                    {friend.fullName?.split(' ').pop()}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Posts Grid */}
                    <div className="mt-5 overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm dark:border-white/10 dark:bg-[#1f1f22]">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 border-b border-gray-100 px-4 dark:border-white/10">
                            {['posts', 'projects', 'tagged'].map((tab) => {
                                const labels = { posts: 'Bài viết', projects: 'Dự án', tagged: 'Được gắn thẻ' };
                                return (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-3.5 text-sm font-semibold transition border-b-2 ${
                                            activeTab === tab
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}>
                                        {labels[tab]}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-4">
                            {activeTab === 'posts' && (
                                <>
                                    {posts.length === 0 && !postLoading ? (
                                        <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                                            <div className="mb-3 text-4xl">📚</div>
                                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Chưa có bài viết</h3>
                                            <p className="mt-1 text-sm text-gray-500">Bài viết sẽ hiển thị ở đây.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                                            {posts.map((post) => {
                                                const imageUrl = getImageUrl(post);
                                                return (
                                                    <div key={post._id} onClick={() => openPostDetail(post)}
                                                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-sm dark:bg-white/5">
                                                        {imageUrl ? (
                                                            <img src={imageUrl} alt={post.caption || 'post'}
                                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs font-medium leading-5 text-gray-500 dark:text-gray-300">
                                                                {limitWords(post.caption || 'Bài viết không có ảnh', 14)}
                                                            </div>
                                                        )}
                                                        {post.mediaCount > 1 && (
                                                            <div className="absolute right-2 top-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                                {post.mediaCount}
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
                                                        <div className="absolute inset-0 flex items-center justify-center gap-5 opacity-0 transition group-hover:opacity-100">
                                                            <span className="text-sm font-bold text-white">❤ {post.likesCount || 0}</span>
                                                            <span className="text-sm font-bold text-white">💬 {post.commentsCount || 0}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {hasMore && (
                                        <div className="mt-5 flex justify-center">
                                            <button disabled={postLoading} onClick={() => loadPostGrid()}
                                                className="rounded-2xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15">
                                                {postLoading ? 'Đang tải...' : 'Xem thêm'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'projects' && (
                                <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                                    <div className="mb-3 text-4xl">🚀</div>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Chưa có dự án</h3>
                                    <p className="mt-1 text-sm text-gray-500">Các bài viết loại Dự án sẽ hiển thị ở đây.</p>
                                </div>
                            )}

                            {activeTab === 'tagged' && (
                                <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                                    <div className="mb-3 text-4xl">🏷️</div>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Chưa có bài được gắn thẻ</h3>
                                    <p className="mt-1 text-sm text-gray-500">Bài viết có nhắc đến bạn sẽ hiển thị ở đây.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditOpen}
                onClose={closeEditModal}
                formData={formData}
                onChange={handleChange}
                onSave={handleSave}
                saving={saving}
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
