import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import InfiniteScroll from 'react-infinite-scroll-component';
import {
    UserCheck,
    UserPlus,
    MessageSquare,
    Lock,
    Edit3,
    Calendar,
    Clock,
    X,
    Check,
    CheckCircle2,
    FileText,
    Video,
    Bookmark,
    Heart,
    Grid3x3,
    Film,
    ArrowLeft,
    Archive,
    Plus,
    Sparkles,
} from 'lucide-react';

import EditProfileModal from './EditProfileModal';
import StoryArchiveModal from './StoryArchiveModal';
import CreateHighlightModal from './CreateHighlightModal';
import StoryHighlightModal from './StoryHighlightModal';
import Post from '../../Dashboard/Post';
import UnfollowConfirmModal from '../../../components/UnfollowConfirmModal';
import { LoadingProfile } from '../../../components/Loading';
import * as ProfileServices from '../../../services/ProfileServices';
import * as FriendServices from '../../../services/friend.services';
import * as PostServices from '../../../services/posts.services';
import { getUserHighlights } from '../../../services/story.services';
import httpRequest from '../../../config/axios';

/* ────────────────────────── Main Component ────────────────────────── */
export default function ProfilePage() {
    const { userId, username } = useParams();
    const profileIdentifier = username || userId;
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.user?.infoUser);

    const [profileData, setProfileData] = useState(null);

    // Posts & Tabs States
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'videos' | 'saved' | 'liked'
    const [posts, setPosts] = useState([]);

    // Saved posts state
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedCursor, setSavedCursor] = useState(null);
    const [hasMoreSaved, setHasMoreSaved] = useState(false);

    // Liked posts state
    const [likedPosts, setLikedPosts] = useState([]);
    const [likedCursor, setLikedCursor] = useState(null);
    const [hasMoreLiked, setHasMoreLiked] = useState(false);

    const [nextCursor, setNextCursor] = useState(null);
    const [hasMorePosts, setHasMorePosts] = useState(false);

    const [loading, setLoading] = useState(true);
    const [postLoading, setPostLoading] = useState(false);
    const [savedLoading, setSavedLoading] = useState(false);
    const [likedLoading, setLikedLoading] = useState(false);

    // Modals & Action States
    const [error, setError] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [friendLoading, setFriendLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showUnfollowModal, setShowUnfollowModal] = useState(false);
    const [relationStatus, setRelationStatus] = useState('none');

    // Story Highlights & Archive States
    const [highlights, setHighlights] = useState([]);
    const [loadingHighlights, setLoadingHighlights] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showCreateHighlightModal, setShowCreateHighlightModal] = useState(false);
    const [selectedArchiveStories, setSelectedArchiveStories] = useState([]);
    const [activeHighlight, setActiveHighlight] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        isPrivate: false,
        avatar: '',
        avatarFile: null,
    });

    const user = profileData?.user;
    const stats = profileData?.stats;
    const relation = profileData?.relation;
    const currentProfileUserId = user?._id;
    const isOwnProfile =
        !profileIdentifier ||
        (currentUser &&
            (currentUser._id === currentProfileUserId ||
                currentUser.username === profileIdentifier ||
                currentUser.id === currentProfileUserId));

    /* ── Load Profile ── */
    useEffect(() => {
        loadProfile();
    }, [profileIdentifier]); // eslint-disable-line

    useEffect(() => {
        if (currentProfileUserId) {
            loadUserPosts({ reset: true, targetUserId: currentProfileUserId });
            if (isOwnProfile) {
                // Reset state trước khi load lại
                setSavedPosts([]);
                setSavedCursor(null);
                setHasMoreSaved(false);
                setLikedPosts([]);
                setLikedCursor(null);
                setHasMoreLiked(false);
                loadSavedPosts({ reset: true });
                loadLikedPosts({ reset: true });
            }
            loadHighlights();
        }
    }, [currentProfileUserId]); // eslint-disable-line

    const loadHighlights = async () => {
        if (!currentProfileUserId) return;
        try {
            setLoadingHighlights(true);
            const res = await getUserHighlights(currentProfileUserId);
            if (res?.code === 200) {
                setHighlights(res.data || []);
            }
        } catch (err) {
            console.error('Lỗi khi tải tin nổi bật:', err);
        } finally {
            setLoadingHighlights(false);
        }
    };

    const handleCreateHighlightFromArchive = (selectedStories) => {
        setSelectedArchiveStories(selectedStories);
        setShowArchiveModal(false);
        setShowCreateHighlightModal(true);
    };

    const handleHighlightCreated = (newHighlight) => {
        setHighlights((prev) => [newHighlight, ...prev]);
        setShowCreateHighlightModal(false);
    };

    const handleHighlightDeleted = (deletedId) => {
        setHighlights((prev) => prev.filter((h) => h._id !== deletedId));
        setActiveHighlight(null);
    };

    useEffect(() => {
        if (relation?.relationStatus) {
            setRelationStatus(relation.relationStatus);
        }
    }, [relation]);

    const loadProfile = async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            setError('');
            const res = profileIdentifier
                ? await ProfileServices.getProfileByUserId(profileIdentifier)
                : await ProfileServices.getMyProfile();
            setProfileData(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || 'Không thể tải trang cá nhân');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Load Posts with Pagination
    const loadUserPosts = async ({ reset = false, targetUserId = currentProfileUserId } = {}) => {
        if (!targetUserId) return;
        try {
            setPostLoading(true);
            const cursor = reset ? null : nextCursor;
            const res = await ProfileServices.getUserPostFeed({
                userId: targetUserId,
                limit: 10,
                cursor,
            });

            const newPosts = res?.data || [];
            setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
            setNextCursor(res?.nextCursor || null);
            setHasMorePosts(Boolean(res?.hasMore));
        } catch (err) {
            console.log('Load profile posts error:', err);
        } finally {
            setPostLoading(false);
        }
    };

    // Load Saved Posts with pagination
    const loadSavedPosts = async ({ reset = false } = {}) => {
        try {
            setSavedLoading(true);
            const cursor = reset ? null : savedCursor;
            const res = await PostServices.getAllSavedPosts({ cursor, limit: 10 });
            if (res?.success) {
                const newPosts = (res.data?.posts || []).filter(Boolean);
                setSavedPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
                setSavedCursor(res.nextCursor || null);
                setHasMoreSaved(Boolean(res.hasMore));
            }
        } catch (err) {
            console.log('Load saved posts error:', err);
        } finally {
            setSavedLoading(false);
        }
    };

    // Load Liked Posts with pagination
    const loadLikedPosts = async ({ reset = false } = {}) => {
        try {
            setLikedLoading(true);
            const cursor = reset ? null : likedCursor;
            const res = await PostServices.getLikedPosts({ cursor, limit: 10 });
            if (res?.success) {
                const newPosts = (res.data?.posts || []).filter(Boolean);
                setLikedPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
                setLikedCursor(res.nextCursor || null);
                setHasMoreLiked(Boolean(res.hasMore));
            }
        } catch (err) {
            console.log('Load liked posts error:', err);
        } finally {
            setLikedLoading(false);
        }
    };

    // Filter Video Posts
    const videoPosts = useMemo(() => {
        return posts.filter((postItem) => {
            if (!postItem?.media || !Array.isArray(postItem.media)) return false;
            return postItem.media.some((m) => m?.type === 'video' || (typeof m === 'string' && m.includes('.mp4')));
        });
    }, [posts]);

    /* ── Follow Action Handlers ── */
    const handleFollowClick = () => {
        if (
            relationStatus === 'following' ||
            relationStatus === 'mutual' ||
            relationStatus === 'friend'
        ) {
            setShowUnfollowModal(true);
            return;
        }
        executeFollowAction();
    };

    const executeFollowAction = async () => {
        if (!user?._id || friendLoading) return;
        try {
            setFriendLoading(true);
            let res;
            if (relationStatus === 'none' || relationStatus === 'follower') {
                res = await FriendServices.sendFriendRequest(user._id);
                toast.success(res?.message || 'Đã theo dõi');
            } else if (relationStatus === 'pending_sent') {
                res = await FriendServices.cancelFriendRequest(user._id);
                toast.info('Đã hủy yêu cầu theo dõi');
            } else if (relationStatus === 'pending_received') {
                res = await FriendServices.acceptFriendRequest(user._id);
                toast.success('Đã chấp nhận yêu cầu theo dõi');
            } else if (
                relationStatus === 'following' ||
                relationStatus === 'mutual' ||
                relationStatus === 'friend'
            ) {
                res = await FriendServices.cancelFriendRequest(user._id);
                toast.info('Đã bỏ theo dõi');
            }
            if (res?.data?.relationStatus) setRelationStatus(res.data.relationStatus);
            setShowUnfollowModal(false);
            await loadProfile({ silent: true });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi thao tác theo dõi');
        } finally {
            setFriendLoading(false);
        }
    };

    const handleRefuseRequest = async () => {
        if (!user?._id || friendLoading) return;
        try {
            setFriendLoading(true);
            await FriendServices.refuseFriendRequest(user._id);
            toast.info('Đã từ chối yêu cầu theo dõi');
            setRelationStatus('none');
            await loadProfile();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể thực hiện');
        } finally {
            setFriendLoading(false);
        }
    };

    /* ── Other Actions ── */
    const handleMessageUser = async () => {
        if (!user?._id) return;
        try {
            const res = await httpRequest.post(`/room-chat/create-private/${user._id}`);
            if (res.data?.code === 200 && res.data?.data?._id) {
                navigate(`/messages/${res.data.data._id}`);
            } else {
                navigate('/messages');
            }
        } catch {
            navigate('/messages');
        }
    };

    const handleOpenEdit = () => {
        if (!user) return;
        setFormData({
            fullName: user.fullName || '',
            username: user.username || '',
            isPrivate: !!user.isPrivate,
            avatar: user.avatar || '',
            avatarFile: null,
        });
        setIsEditOpen(true);
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const payload = new FormData();
            payload.append('fullName', formData.fullName);
            payload.append('username', formData.username);
            payload.append('isPrivate', String(formData.isPrivate));
            if (formData.avatarFile) payload.append('avatar', formData.avatarFile);

            const res = await ProfileServices.updateProfile(payload);
            if (res?.code === 200 || res?.status === 200) {
                toast.success('Cập nhật hồ sơ thành công 🎉');
                setIsEditOpen(false);
                await loadProfile();
            } else {
                toast.error(res?.message || 'Cập nhật thất bại');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi cập nhật hồ sơ');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePost = (deletedPostId) => {
        setPosts((prev) => prev.filter((p) => (p._id || p.id) !== deletedPostId));
        setSavedPosts((prev) => prev.filter((p) => (p._id || p.id) !== deletedPostId));
        setLikedPosts((prev) => prev.filter((p) => (p._id || p.id) !== deletedPostId));
    };

    const handleGoFollowers = () => {
        navigate('/ban-be', { state: { tab: 'followers' } });
    };

    const handleGoFollowing = () => {
        navigate('/ban-be', { state: { tab: 'following' } });
    };

    /* ── Render States ── */
    if (loading) return <LoadingProfile />;

    if (error || !user) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-500 dark:bg-red-500/10">
                    <X className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Không tìm thấy người dùng
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    {error || 'Người dùng này không tồn tại hoặc đã bị xóa.'}
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/trang-chu')}
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    Quay về Trang chủ
                </button>
            </div>
        );
    }

    const canViewContent =
        isOwnProfile ||
        !user.isPrivate ||
        relation?.canViewPosts ||
        relationStatus === 'following' ||
        relationStatus === 'mutual';

    const joinedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
              month: 'long',
              year: 'numeric',
          })
        : null;

    /* ────────────────────────────── JSX ────────────────────────────── */
    return (
        <div className="py-6">
            <div className="mx-auto w-full max-w-[680px] space-y-4">
                {/* Back Button Header (Threads style for other profiles) */}
                {!isOwnProfile && (
                    <div className="flex items-center gap-3 px-1 pb-1">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-200/70 dark:text-gray-200 dark:hover:bg-white/10"
                            aria-label="Quay lại"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            @{user.username || user.fullName}
                        </h2>
                    </div>
                )}

                {/* ─── Profile Header Card (Threads style: Avatar LEFT, Info RIGHT) ─── */}
                <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#18181b] sm:p-6">
                    {/* Header Row: Avatar on LEFT, Name/Username on RIGHT */}
                    <div className="flex items-start gap-4 sm:gap-5">
                        {/* Avatar on LEFT */}
                        <div className="relative shrink-0">
                            <img
                                src={
                                    user.avatar ||
                                    'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'
                                }
                                alt={user.fullName}
                                className="h-24 w-24 rounded-full border-2 border-gray-100 object-cover shadow-sm dark:border-white/10 sm:h-28 sm:w-28"
                            />
                            {user.isVerified && (
                                <CheckCircle2 className="absolute bottom-1 right-1 h-6 w-6 text-blue-500 fill-white dark:fill-[#18181b]" />
                            )}
                        </div>

                        {/* Name & Username on RIGHT */}
                        <div className="min-w-0 flex-1 pt-1">
                            <h1 className="text-xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-2xl">
                                {user.fullName}
                            </h1>
                            <p className="mt-0.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                @{user.username || 'username'}
                            </p>

                            {/* Meta items */}
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                                {user.isPrivate && (
                                    <span className="inline-flex items-center gap-1 font-medium text-amber-500">
                                        <Lock className="h-3 w-3" />
                                        Riêng tư
                                    </span>
                                )}
                                {joinedDate && (
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Tham gia {joinedDate}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Row (Clickable Followers & Following) */}
                    <div className="mt-5 flex items-center gap-6 border-t border-gray-100 pt-4 text-[15px] dark:border-white/10">
                        <button
                            type="button"
                            onClick={handleGoFollowers}
                            className="group flex items-center gap-1.5 transition hover:opacity-80"
                        >
                            <span className="font-extrabold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                {stats?.followersCount ?? user.followersCount ?? 0}
                            </span>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                người theo dõi
                            </span>
                        </button>

                        <span className="text-gray-300 dark:text-white/10">·</span>

                        <button
                            type="button"
                            onClick={handleGoFollowing}
                            className="group flex items-center gap-1.5 transition hover:opacity-80"
                        >
                            <span className="font-extrabold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                {stats?.followingCount ?? user.followingCount ?? 0}
                            </span>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                đang theo dõi
                            </span>
                        </button>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="mt-4 flex gap-2">
                        {isOwnProfile ? (
                            <div className="flex w-full gap-2">
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200/90 bg-gray-50 text-sm font-bold text-gray-900 transition hover:bg-gray-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Chỉnh sửa hồ sơ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowArchiveModal(true)}
                                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200/90 bg-gray-50 px-4 text-sm font-bold text-gray-900 transition hover:bg-gray-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                                    title="Kho lưu trữ Story"
                                >
                                    <Archive className="h-4 w-4 text-indigo-500" />
                                    <span className="hidden sm:inline">Kho lưu trữ</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                {relationStatus === 'pending_received' ? (
                                    <>
                                        <button
                                            type="button"
                                            disabled={friendLoading}
                                            onClick={handleFollowClick}
                                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                        >
                                            <Check className="h-4 w-4" />
                                            Chấp nhận
                                        </button>
                                        <button
                                            type="button"
                                            disabled={friendLoading}
                                            onClick={handleRefuseRequest}
                                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:border-white/15 dark:text-gray-200"
                                        >
                                            <X className="h-4 w-4" />
                                            Từ chối
                                        </button>
                                    </>
                                ) : relationStatus === 'pending_sent' ? (
                                    <button
                                        type="button"
                                        disabled={friendLoading}
                                        onClick={handleFollowClick}
                                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-300"
                                    >
                                        <Clock className="h-4 w-4" />
                                        Đã gửi yêu cầu
                                    </button>
                                ) : relationStatus === 'following' ||
                                  relationStatus === 'mutual' ||
                                  relationStatus === 'friend' ? (
                                    <button
                                        type="button"
                                        disabled={friendLoading}
                                        onClick={handleFollowClick}
                                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:border-white/15 dark:text-gray-200"
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        Đang theo dõi
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={friendLoading}
                                        onClick={handleFollowClick}
                                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Theo dõi
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleMessageUser}
                                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200/90 bg-gray-50 text-sm font-bold text-gray-900 transition hover:bg-gray-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Nhắn tin
                                </button>
                            </>
                        )}
                    </div>

                    {/* ─── Story Highlights Horizontal Bar ─── */}
                    {(highlights.length > 0 || isOwnProfile) && (
                        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-white/10">
                            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                                {/* Create New Highlight button (for own profile) */}
                                {isOwnProfile && (
                                    <button
                                        type="button"
                                        onClick={() => setShowArchiveModal(true)}
                                        className="group flex flex-col items-center gap-1.5 shrink-0"
                                    >
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition group-hover:border-indigo-500 group-hover:bg-indigo-50/50 dark:border-white/20 dark:bg-white/5 dark:group-hover:border-indigo-400">
                                            <Plus className="h-6 w-6 text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" />
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                                            Mới
                                        </span>
                                    </button>
                                )}

                                {/* List of Highlights */}
                                {highlights.map((item) => (
                                    <button
                                        key={item._id}
                                        type="button"
                                        onClick={() => setActiveHighlight(item)}
                                        className="group flex flex-col items-center gap-1.5 shrink-0"
                                    >
                                        <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 transition group-hover:scale-105">
                                            <img
                                                src={item.coverImage || item.stories?.[0]?.mediaUrl || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                                                alt={item.title}
                                                className="h-15 w-15 rounded-full border-2 border-white object-cover dark:border-[#18181b]"
                                            />
                                        </div>
                                        <span className="max-w-[70px] truncate text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                                            {item.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs Bar */}
                    <div className="-mb-5 mt-5 flex border-t border-gray-200/80 dark:border-white/10 sm:-mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('posts')}
                            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3.5 text-sm font-bold transition ${
                                activeTab === 'posts'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <FileText className="h-4 w-4" />
                            Bài viết
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('videos')}
                            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3.5 text-sm font-bold transition ${
                                activeTab === 'videos'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <Video className="h-4 w-4" />
                            Video
                        </button>

                        {isOwnProfile && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('saved')}
                                className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3.5 text-sm font-bold transition ${
                                    activeTab === 'saved'
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                <Bookmark className="h-4 w-4" />
                                Đã lưu
                            </button>
                        )}
                        {isOwnProfile && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('liked')}
                                className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3.5 text-sm font-bold transition ${
                                    activeTab === 'liked'
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                <Heart className="h-4 w-4" />
                                Đã thích
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Tab Content Section with InfiniteScroll ─── */}
                {!canViewContent ? (
                    <div className="rounded-[28px] border border-gray-200/80 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-[#18181b]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                            <Lock className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            Tài khoản này là riêng tư
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Theo dõi tài khoản này để xem bài viết của họ.
                        </p>
                    </div>
                ) : activeTab === 'posts' ? (
                    postLoading && posts.length === 0 ? (
                        <div className="rounded-[28px] border border-gray-200/80 bg-white p-12 text-center text-sm font-medium text-gray-400 dark:border-white/10 dark:bg-[#18181b]">
                            Đang tải bài viết...
                        </div>
                    ) : posts.length === 0 ? (
                        <EmptyState
                            icon={<Grid3x3 className="h-7 w-7" />}
                            title="Chưa có bài viết nào"
                            description={
                                isOwnProfile
                                    ? 'Hãy chia sẻ suy nghĩ hoặc bài học đầu tiên của bạn!'
                                    : 'Người dùng này chưa đăng bài viết nào.'
                            }
                        />
                    ) : (
                        <InfiniteScroll
                            dataLength={posts.length}
                            next={() => loadUserPosts({ reset: false })}
                            hasMore={hasMorePosts}
                            loader={
                                <div className="py-4 text-center text-xs font-semibold text-gray-400">
                                    Đang tải thêm bài viết...
                                </div>
                            }
                            scrollableTarget="profile-scroll-container"
                        >
                            <div className="space-y-4">
                                {posts.map((postItem) => (
                                    <Post
                                        key={postItem._id || postItem.id}
                                        post={postItem}
                                        currentUser={currentUser}
                                        onDelete={handleDeletePost}
                                    />
                                ))}
                            </div>
                        </InfiniteScroll>
                    )
                ) : activeTab === 'videos' ? (
                    videoPosts.length === 0 ? (
                        <EmptyState
                            icon={<Film className="h-7 w-7" />}
                            title="Chưa có video nào"
                            description="Tất cả các bài viết chứa nội dung video sẽ xuất hiện tại tab này."
                        />
                    ) : (
                        <div className="space-y-4">
                            {videoPosts.map((postItem) => (
                                <Post
                                    key={postItem._id || postItem.id}
                                    post={postItem}
                                    currentUser={currentUser}
                                    onDelete={handleDeletePost}
                                />
                            ))}
                        </div>
                    )
                ) : activeTab === 'saved' ? (
                    /* Saved Tab */
                    savedLoading && savedPosts.length === 0 ? (
                        <div className="rounded-[28px] border border-gray-200/80 bg-white p-12 text-center text-sm font-medium text-gray-400 dark:border-white/10 dark:bg-[#18181b]">
                            Đang tải bài viết đã lưu...
                        </div>
                    ) : savedPosts.length === 0 ? (
                        <EmptyState
                            icon={<Bookmark className="h-7 w-7" />}
                            title="Chưa lưu bài viết nào"
                            description="Những bài viết bạn lưu lại để xem sau sẽ hiển thị ở đây."
                        />
                    ) : (
                        <InfiniteScroll
                            dataLength={savedPosts.length}
                            next={() => loadSavedPosts({ reset: false })}
                            hasMore={hasMoreSaved}
                            loader={
                                <div className="py-4 text-center text-xs font-semibold text-gray-400">
                                    Đang tải thêm...
                                </div>
                            }
                            scrollableTarget="social-scroll-container"
                        >
                            <div className="space-y-4">
                                {savedPosts.map((postItem) => (
                                    <Post
                                        key={postItem._id || postItem.id}
                                        post={postItem}
                                        currentUser={currentUser}
                                        onDelete={handleDeletePost}
                                    />
                                ))}
                            </div>
                        </InfiniteScroll>
                    )
                ) : (
                    /* Liked Tab */
                    likedLoading && likedPosts.length === 0 ? (
                        <div className="rounded-[28px] border border-gray-200/80 bg-white p-12 text-center text-sm font-medium text-gray-400 dark:border-white/10 dark:bg-[#18181b]">
                            Đang tải bài viết đã thích...
                        </div>
                    ) : likedPosts.length === 0 ? (
                        <EmptyState
                            icon={<Heart className="h-7 w-7" />}
                            title="Chưa thích bài viết nào"
                            description="Những bài viết bạn đã thích sẽ hiển thị ở đây."
                        />
                    ) : (
                        <InfiniteScroll
                            dataLength={likedPosts.length}
                            next={() => loadLikedPosts({ reset: false })}
                            hasMore={hasMoreLiked}
                            loader={
                                <div className="py-4 text-center text-xs font-semibold text-gray-400">
                                    Đang tải thêm...
                                </div>
                            }
                            scrollableTarget="social-scroll-container"
                        >
                            <div className="space-y-4">
                                {likedPosts.map((postItem) => (
                                    <Post
                                        key={postItem._id || postItem.id}
                                        post={postItem}
                                        currentUser={currentUser}
                                        onDelete={handleDeletePost}
                                    />
                                ))}
                            </div>
                        </InfiniteScroll>
                    )
                )}
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                formData={formData}
                onChange={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
                onSave={handleSaveProfile}
                saving={saving}
            />

            {/* Unfollow Confirmation Modal */}
            <UnfollowConfirmModal
                open={showUnfollowModal}
                user={user}
                onClose={() => setShowUnfollowModal(false)}
                onConfirm={executeFollowAction}
                loading={friendLoading}
            />

            {/* Story Archive Modal */}
            <StoryArchiveModal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                onCreateHighlight={handleCreateHighlightFromArchive}
            />

            {/* Create Highlight Modal */}
            <CreateHighlightModal
                isOpen={showCreateHighlightModal}
                onClose={() => setShowCreateHighlightModal(false)}
                selectedStories={selectedArchiveStories}
                onCreated={handleHighlightCreated}
            />

            {/* Story Highlight Viewer Modal */}
            <StoryHighlightModal
                isOpen={!!activeHighlight}
                onClose={() => setActiveHighlight(null)}
                highlight={activeHighlight}
                currentUser={currentUser}
                onHighlightDeleted={handleHighlightDeleted}
            />
        </div>
    );
}

function EmptyState({ icon, title, description }) {
    return (
        <div className="rounded-[28px] border border-gray-200/80 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-[#18181b]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-white/10 dark:text-blue-300">
                {icon}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    );
}
