import { useEffect, useState } from 'react';
import { Heart, Users, Loader2, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminInteractionAnalytics } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';

function AnalyticsAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ topLikedPosts: [], topActiveUsers: [] });

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await getAdminInteractionAnalytics();
            if (res?.code === 200) {
                setData(res.data);
            } else {
                toast.error(res?.message || 'Không thể tải phân tích');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải dữ liệu phân tích');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Top Liked Posts */}
            <div className={`rounded-3xl border p-6 backdrop-blur-xl space-y-4 ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500">
                        <Heart className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Top Bài viết nhiều Like nhất</h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Các bài đăng có lượt tương tác nổi bật nhất</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-gray-400">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-rose-500" />
                    </div>
                ) : data.topLikedPosts.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400">Chưa có bài viết nào.</div>
                ) : (
                    <div className="space-y-3">
                        {data.topLikedPosts.map((post, idx) => (
                            <div key={post._id} className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-xs font-extrabold text-rose-500">
                                        #{idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.user_id?.fullName || 'Người dùng'}</span>
                                            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{post.user_id?.username}</span>
                                        </div>
                                        <p className={`mt-1 line-clamp-2 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                            {post.content || post.title || 'Bài viết chứa hình ảnh'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-extrabold text-rose-500 border border-rose-500/20">
                                    <Heart className="h-3.5 w-3.5" /> {post.likesCount || 0}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top Active Users */}
            <div className={`rounded-3xl border p-6 backdrop-blur-xl space-y-4 ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className={`flex items-center gap-3 border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-500">
                        <Award className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Top Người dùng ảnh hưởng nhất</h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Thành viên có nhiều lượt theo dõi (Followers) nhất</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-gray-400">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : data.topActiveUsers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400">Chưa có dữ liệu người dùng.</div>
                ) : (
                    <div className="space-y-3">
                        {data.topActiveUsers.map((user, idx) => (
                            <div key={user._id} className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-xs font-extrabold text-indigo-500">
                                        #{idx + 1}
                                    </span>
                                    <img
                                        src={user.avatar || 'https://via.placeholder.com/150'}
                                        alt="Avatar"
                                        className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                    />
                                    <div className="min-w-0">
                                        <h4 className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.fullName}</h4>
                                        <p className={`truncate text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{user.username || 'user'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-500 border border-indigo-500/20">
                                    <Users className="h-3.5 w-3.5" /> {user.followers?.length || 0} followers
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnalyticsAdmin;
