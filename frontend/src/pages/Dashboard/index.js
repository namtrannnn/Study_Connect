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
        <div className="pb-6">
            <StoriesBar
                user={user}
                stories={stories}
                onOpenStory={(story) => console.log('Open story:', story)}
                onCreateStory={() => console.log('Create story')}
            />

            <div className="mb-4 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#1f1f22]/90 transition hover:shadow duration-300">
                <div className="flex items-center gap-3">
                    <img
                        src={user?.avatar || 'https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png'}
                        alt="avatar"
                        className="h-11 w-11 rounded-[14px] object-cover ring-2 ring-indigo-500/10 shadow-sm dark:ring-white/5"
                    />

                    <button
                        type="button"
                        onClick={() => setOpenModal(true)}
                        className="flex-1 rounded-[16px] bg-slate-50 px-4 py-3.5 text-left text-sm font-semibold text-gray-500 transition hover:bg-slate-100 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                        {user?.fullName ? `${user.fullName} ơi, bạn đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
                    </button>

                    <button
                        type="button"
                        onClick={handleRefreshFeed}
                        disabled={refreshing}
                        className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-60 dark:bg-blue-500/15 dark:text-blue-300 active:scale-95"
                        title="Làm mới feed"
                    >
                        <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

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

            {loadingPosts && <DashboardSkeleton />}

            {!loadingPosts && posts.length === 0 && (
                <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 text-center shadow-sm dark:border-white/10 dark:bg-[#1f1f22]">
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
                        <div className="py-5 text-center text-sm font-semibold text-slate-400 dark:text-slate-500 animate-pulse flex items-center justify-center gap-1.5 select-none">
                            <Clock size={14} className="animate-spin text-indigo-500" /> Đang tải thêm bài viết...
                        </div>
                    }
                    endMessage={
                        <div className="py-6 text-center text-sm font-semibold text-slate-400 select-none">Bạn đã xem hết bài viết rồi.</div>
                    }
                    scrollableTarget="dashboard-scroll-container"
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
    );
}

export default Dashboard;
