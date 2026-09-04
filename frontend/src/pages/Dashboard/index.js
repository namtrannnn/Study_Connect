import { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCcw, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import InfiniteScroll from 'react-infinite-scroll-component';

import StoriesBar from './StoriesBar';
import StoryEditorModal from './StoryEditorModal';
import StoryViewerModal from './StoryViewerModal';
import Modal from './Modal';
import Post from './Post';
import { useSelector } from 'react-redux';
import * as PostServices from '../../services/posts.services';
import * as StoryServices from '../../services/story.services';
import { LoadingDashboard } from '../../components/Loading';

function Dashboard({ user: propUser, theme }) {
    const reduxUser = useSelector((state) => state.user?.infoUser || {});
    const user = propUser || reduxUser;

    const [text, setText] = useState('');
    const [attachment, setAttachment] = useState('');
    const [openModal, setOpenModal] = useState(false);

    // Posts state
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    // Stories state
    const [feedGroups, setFeedGroups] = useState([]);
    const [openStoryEditor, setOpenStoryEditor] = useState(false);
    const [openStoryViewer, setOpenStoryViewer] = useState(false);
    const [selectedStoryAuthorId, setSelectedStoryAuthorId] = useState(null);

    const firstLoadRef = useRef(false);

    const loadStoryFeed = useCallback(async () => {
        try {
            const res = await StoryServices.getStoryFeed();
            if (res.code === 200) {
                setFeedGroups(res.data || []);
            }
        } catch (error) {
            console.log('Load story feed error:', error);
        }
    }, []);

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
        loadStoryFeed();
    }, [loadStoryFeed]);

    const handleRefreshFeed = () => {
        setNextCursor(null);
        setHasMore(false);
        loadFeedPosts({ mode: 'refresh' });
        loadStoryFeed();
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

    const handleOpenStoryGroup = (authorId) => {
        setSelectedStoryAuthorId(authorId);
        setOpenStoryViewer(true);
    };

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

            {openStoryEditor && (
                <StoryEditorModal
                    isOpen={openStoryEditor}
                    onClose={() => setOpenStoryEditor(false)}
                    currentUser={user}
                    onSuccess={() => {
                        loadStoryFeed();
                    }}
                />
            )}

            {openStoryViewer && (
                <StoryViewerModal
                    isOpen={openStoryViewer}
                    onClose={() => {
                        setOpenStoryViewer(false);
                        loadStoryFeed();
                    }}
                    feedGroups={feedGroups}
                    initialAuthorId={selectedStoryAuthorId}
                    currentUser={user}
                    onDeleteSuccess={() => {
                        loadStoryFeed();
                    }}
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
                <div className="min-h-0 flex-1 p-3 sm:p-4 overflow-y-auto">
                    {/* Story Bar */}
                    <StoriesBar
                        user={user}
                        feedGroups={feedGroups}
                        onOpenStoryGroup={handleOpenStoryGroup}
                        onCreateStory={() => setOpenStoryEditor(true)}
                    />

                    {loadingPosts && <LoadingDashboard />}

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
            </div>
        </>
    );
}

export default Dashboard;
