import { useEffect, useRef, useState } from 'react';
import { RefreshCcw, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import InfiniteScroll from 'react-infinite-scroll-component';

import StoriesBar from './StoriesBar';
import Modal from './Modal';
import Post from './Post';
import { useSelector } from 'react-redux';
import * as PostServices from '../../services/posts.services';

// Beautiful Shimmering Skeleton Loader for Dashboard Posts
function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-[28px] border border-gray-200/50 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#12141c]/90">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-11 w-11 rounded-2xl bg-slate-200 dark:bg-white/5" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-white/5 rounded-md" />
                            <div className="h-3 w-20 bg-slate-200 dark:bg-white/5 rounded-md" />
                        </div>
                    </div>
                    {/* Caption */}
                    <div className="space-y-2.5 mb-4">
                        <div className="h-4 w-full bg-slate-200 dark:bg-white/5 rounded-md" />
                        <div className="h-4 w-[92%] bg-slate-200 dark:bg-white/5 rounded-md" />
                        <div className="h-4 w-[65%] bg-slate-200 dark:bg-white/5 rounded-md" />
                    </div>
                    {/* Shimmer media box */}
                    {idx === 0 && (
                        <div className="h-48 md:h-[350px] w-full bg-slate-200 dark:bg-white/5 rounded-[20px] mb-4" />
                    )}
                    {/* Footer buttons */}
                    <div className="flex gap-4 border-t border-slate-100 dark:border-white/5 pt-3.5 mt-2">
                        <div className="h-4 w-12 bg-slate-200 dark:bg-white/5 rounded-md" />
                        <div className="h-4 w-16 bg-slate-200 dark:bg-white/5 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Dashboard({ user: propUser, theme }) {
    const reduxUser = useSelector((state) => state.user?.infoUser || {});
    const user = propUser || reduxUser;

    const [text, setText] = useState('');

    const [attachment, setAttachment] = useState('');
    const [openModal, setOpenModal] = useState(false);

    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    const firstLoadRef = useRef(false);

    const loadFeedPosts = async ({ cursor = null, mode = 'init' } = {}) => {
        try {
            if (mode === 'init') {
                setLoadingPosts(true);
            }

            if (mode === 'refresh') {
                setRefreshing(true);
            }

            const res = await PostServices.getFeedPosts({
                limit: 10,
                cursor,
            });

            if (res.code === 200) {
                const newPosts = res.data || [];

                if (mode === 'loadMore') {
                    setPosts((prev) => {
                        const existedIds = new Set(prev.map((item) => item._id || item.id));

                        const filteredPosts = newPosts.filter((item) => {
                            const id = item._id || item.id;
                            return !existedIds.has(id);
                        });

                        return [...prev, ...filteredPosts];
                    });
                } else {
                    setPosts(newPosts);
                }

                setNextCursor(res.pagination?.nextCursor || null);
                setHasMore(!!res.pagination?.hasMore);
            } else {
                toast.error(res.message || 'Không thể tải danh sách bài viết');
            }
        } catch (error) {
            console.log('Load feed error:', error);
            toast.error(error?.response?.data?.message || 'Không thể tải danh sách bài viết');
        } finally {
            if (mode === 'init') {
                // Short timeout to guarantee the transition doesn't look raw on high-speed local APIs
                setTimeout(() => {
                    setLoadingPosts(false);
                }, 500);
            } else {
                setLoadingPosts(false);
            }
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (firstLoadRef.current) return;

        firstLoadRef.current = true;
        loadFeedPosts();
    }, []);

    const handleRefreshFeed = () => {
        setNextCursor(null);
        setHasMore(false);
        loadFeedPosts({ mode: 'refresh' });
    };

    const handleLoadMore = () => {
        if (!hasMore || !nextCursor) return;

        loadFeedPosts({
            cursor: nextCursor,
            mode: 'loadMore',
        });
    };

    const handleCreatedPost = (newPost) => {
        if (!newPost) return;

        setPosts((prev) => {
            const newPostId = newPost._id || newPost.id;

            const existed = prev.some((item) => {
                const id = item._id || item.id;
                return id === newPostId;
            });

            if (existed) return prev;

            return [newPost, ...prev];
        });

        setOpenModal(false);
    };

    const handleEditPost = (updatedPost) => {
        if (!updatedPost) return;
        const updatedId = updatedPost._id || updatedPost.id;
        setPosts((prev) =>
            prev.map((item) => {
                const id = item._id || item.id;
                return id === updatedId ? { ...item, ...updatedPost } : item;
            }),
        );
    };

    const handleDeletePost = (deletedPostId) => {
        if (!deletedPostId) return;
        setPosts((prev) =>
            prev.filter((item) => {
                const id = item._id || item.id;
                return id !== deletedPostId;
            }),
        );
    };

    const createNewPost = async (formData) => {
        if (!text.trim()) {
            toast.error('Không được để trống nội dung...');
            return;
        }

        try {
            const data = formData || new FormData();

            data.append('postType', 'normal');
            data.append('category', 'other');
            data.append('caption', text);
            data.append('visibility', 'public');

            const res = await PostServices.createPost(data);

            if (res.code === 201) {
                toast.success(res.message || 'Tạo bài viết thành công');

                handleCreatedPost(res.data);

                setText('');
                setAttachment('');
            } else {
                toast.error(res.message || 'Tạo bài viết thất bại');
            }
        } catch (error) {
            console.log('Create post error:', error);
            toast.error(error?.response?.data?.message || 'Tạo bài viết thất bại');
        }
    };

    const stories = [
        {
            id: 1,
            name: '2imtist',
            avatar: 'https://i.pravatar.cc/150?img=11',
            seen: false,
        },
        {
            id: 2,
            name: 'junig_eiu',
            avatar: 'https://i.pravatar.cc/150?img=12',
            seen: true,
        },
        {
            id: 3,
            name: 'nam_dev',
            avatar: 'https://i.pravatar.cc/150?img=13',
            seen: true,
        },
    ];

    return (
        <>
            {openModal && (
                <Modal
                    setOpenModal={setOpenModal}
                    text={text}
                    setText={setText}
                    attachment={attachment}
                    setAttachment={setAttachment}
                    user={user}
                    theme={theme}
                    createNewPost={createNewPost}
                    onCreated={handleCreatedPost}
                />
            )}

            {/* Threads Unified Container - flex column fills entire height */}
            <div className="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#18181b]">
                {/* Fixed Header - never scrolls */}
                <div className="shrink-0 border-b border-gray-200/80 p-4 dark:border-white/10 sm:p-5">
                    <div className="flex items-center gap-3">
                        <img
                            src={user?.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                            alt="avatar"
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-white/10"
                        />

                        <button
                            type="button"
                            onClick={() => setOpenModal(true)}
                            className="flex-1 cursor-pointer text-left text-sm font-normal text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            {user?.fullName ? `${user.fullName} ơi, có gì mới?` : 'Có gì mới?'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenModal(true)}
                            className="rounded-full bg-black px-4 py-1.5 text-xs font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 active:scale-95"
                        >
                            Đăng
                        </button>

                        <button
                            type="button"
                            onClick={handleRefreshFeed}
                            disabled={refreshing}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-60 dark:hover:bg-white/10 dark:hover:text-gray-200"
                            title="Làm mới feed"
                        >
                            <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Feed Content */}
                <div className="min-h-0 flex-1">
                    {loadingPosts && <DashboardSkeleton />}

                    {!loadingPosts && posts.length === 0 && (
                        <div className="p-8 text-center">
                            <div className="text-base font-semibold text-gray-800 dark:text-white">Chưa có bài viết nào</div>
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Hãy tạo bài viết đầu tiên hoặc theo dõi thêm bạn bè.
                            </div>
                        </div>
                    )}

                    {!loadingPosts && posts.length > 0 && (
                        <InfiniteScroll
                            dataLength={posts.length}
                            next={handleLoadMore}
                            hasMore={hasMore}
                            loader={
                                <div className="flex items-center justify-center gap-1.5 select-none py-5 text-center text-sm font-semibold text-slate-400 animate-pulse dark:text-slate-500">
                                    <Clock size={14} className="animate-spin text-indigo-500" /> Đang tải thêm bài viết...
                                </div>
                            }
                            endMessage={
                                <div className="select-none py-6 text-center text-sm font-semibold text-slate-400">Bạn đã xem hết bài viết rồi.</div>
                            }
                            scrollableTarget="social-scroll-container"
                        >
                            {posts.map((post) => (
                                <Post
                                    key={post._id || post.id}
                                    post={post}
                                    currentUser={user}
                                    onEdit={handleEditPost}
                                    onDelete={handleDeletePost}
                                />
                            ))}
                        </InfiniteScroll>
                    )}
                </div>
            </div>
        </>
    );
}

export default Dashboard;
