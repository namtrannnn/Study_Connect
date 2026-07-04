import { useEffect, useRef, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import InfiniteScroll from 'react-infinite-scroll-component';

import StoriesBar from './StoriesBar';
import Modal from './Modal';
import Post from './Post';
import { useSelector } from 'react-redux';
import * as PostServices from '../../services/posts.services';

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
            setLoadingPosts(false);
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

            <div className="mb-4 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#1f1f22]/90">
                <div className="flex items-center gap-3">
                    <img
                        src={user?.avatar || 'https://i.pravatar.cc/150?img=3'}
                        alt="avatar"
                        className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white shadow-sm dark:ring-white/10"
                    />

                    <button
                        type="button"
                        onClick={() => setOpenModal(true)}
                        className="flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-500 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
                    >
                        {user?.fullName ? `${user.fullName} ơi, bạn đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
                    </button>

                    <button
                        type="button"
                        onClick={handleRefreshFeed}
                        disabled={refreshing}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-60 dark:bg-blue-500/15 dark:text-blue-300"
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

            {loadingPosts && (
                <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 text-center text-gray-500 shadow-sm dark:border-white/10 dark:bg-[#1f1f22] dark:text-gray-300">
                    Đang tải bài viết...
                </div>
            )}

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
                        <div className="py-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                            Đang tải thêm bài viết...
                        </div>
                    }
                    endMessage={
                        <div className="py-5 text-center text-sm text-gray-400">Bạn đã xem hết bài viết rồi.</div>
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
