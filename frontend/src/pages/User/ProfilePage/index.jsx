import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
    ArrowLeft, MapPin, Link as LinkIcon, Users, Flame, Clock, Award, 
    Github, Linkedin, ExternalLink, Globe, BookOpen, FileText, Briefcase, 
    Sparkles, Shield, UserCheck, UserPlus, MessageSquare, Plus, Trash2, Calendar, Edit2
} from 'lucide-react';

import EditProfileModal from './EditProfileModal';
import ArchivePage from './ArchivePage';
import PostDetailModal from '../../Dashboard/PostDetailModal';
import * as ProfileServices from '../../../services/ProfileServices';
import * as FriendServices from '../../../services/friend.services';

const categoryMap = {
    technology: { label: 'Công nghệ', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400' },
    finance_banking: { label: 'Tài chính - Ngân hàng', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400' },
    marketing: { label: 'Marketing', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20 dark:bg-pink-500/20 dark:text-pink-400' },
    design: { label: 'Thiết kế', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400' },
    business: { label: 'Kinh doanh', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400' },
    language: { label: 'Ngoại ngữ', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400' },
    education: { label: 'Giáo dục', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400' },
    science: { label: 'Khoa học', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400' },
    startup: { label: 'Khởi nghiệp', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400' },
    art: { label: 'Nghệ thuật', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400' },
    music: { label: 'Âm nhạc', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:bg-violet-500/20 dark:text-violet-400' },
    health: { label: 'Sức khỏe', color: 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400' },
    other: { label: 'Khác', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400' }
};

const getSocialIcon = (type) => {
    switch (type) {
        case 'github': return <Github size={15} />;
        case 'linkedin': return <Linkedin size={15} />;
        case 'behance': return <Briefcase size={15} className="text-blue-400" />;
        case 'figma': return <Sparkles size={15} className="text-purple-400" />;
        case 'facebook': return <span className="text-blue-500 font-bold text-sm">f</span>;
        case 'website': return <Globe size={15} />;
        default: return <LinkIcon size={15} />;
    }
};

// Ultra-premium matching shimmer loader (preventing color jumps)
function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50/60 dark:bg-[#08090c] animate-pulse">
            {/* MATCHING COLOR COVER BANNER SKELETON */}
            <div className="h-60 md:h-[320px] w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 relative opacity-85 overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            </div>
            
            <div className="mx-auto max-w-7xl px-6 pb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between -mt-20 md:-mt-24 mb-4 gap-4">
                    <div className="h-32 w-32 md:h-44 md:w-44 rounded-[32px] bg-slate-200 dark:bg-white/10 ring-8 ring-slate-50 dark:ring-[#08090c]" />
                    <div className="flex gap-2">
                        <div className="h-11 w-32 bg-slate-200 dark:bg-white/10 rounded-2xl" />
                        <div className="h-11 w-32 bg-slate-200 dark:bg-white/10 rounded-2xl" />
                    </div>
                </div>
                <div className="space-y-3 mt-8">
                    <div className="h-9 w-80 bg-slate-200 dark:bg-white/10 rounded-xl" />
                    <div className="h-5 w-48 bg-slate-200 dark:bg-white/10 rounded-xl" />
                    <div className="h-5 w-full max-w-2xl bg-slate-200 dark:bg-white/10 rounded-xl mt-4" />
                </div>
            </div>
            
            <div className="mx-auto max-w-7xl px-6 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="h-44 bg-slate-200 dark:bg-white/5 rounded-[28px]" />
                        <div className="h-56 bg-slate-200 dark:bg-white/5 rounded-[28px]" />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-[500px] bg-slate-200 dark:bg-white/5 rounded-[28px]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        headline: '',
        fieldOfStudy: 'other',
        skills: '',
        interests: [],
        portfolioLinks: []
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

    useEffect(() => { loadProfile(); }, [userId]); // eslint-disable-line
    
    useEffect(() => {
        if (currentProfileUserId) {
            loadPostGrid({ reset: true, targetUserId: currentProfileUserId });
            loadFriendList(currentProfileUserId);
        }
    }, [currentProfileUserId]); // eslint-disable-line
    
    useEffect(() => {
        if (profileData?.relation?.relationStatus) setRelationStatus(profileData.relation.relationStatus);
    }, [profileData]);

    const loadProfile = async () => {
        try {
            setLoading(true); setError('');
            const res = userId ? await ProfileServices.getProfileByUserId(userId) : await ProfileServices.getMyProfile();
            setProfileData(res.data);
        } catch (err) { setError(err?.response?.data?.message || 'Không thể tải trang cá nhân'); }
        finally { 
            // Hold loading slightly to let shimmer transition settle smoothly
            setTimeout(() => {
                setLoading(false);
            }, 600);
        }
    };

    const loadPostGrid = async ({ reset = false, targetUserId = currentProfileUserId } = {}) => {
        if (!targetUserId) return;
        try {
            setPostLoading(true);
            const res = await ProfileServices.getUserPostGrid({ userId: targetUserId, limit: 30, cursor: reset ? null : nextCursor });
            setPosts((prev) => (reset ? res?.data || [] : [...prev, ...(res?.data || [])]));
            setNextCursor(res?.nextCursor || null);
            setHasMore(Boolean(res?.hasMore));
        } catch (err) { console.log(err); } finally { setPostLoading(false); }
    };

    const loadFriendList = async (id) => {
        try {
            const res = await FriendServices.getFriendList(id);
            if (res.code === 200) setFriendList(res.data?.friends || []);
        } catch { /* silent */ }
    };

    const handleFriendAction = async () => {
        if (!user?._id || friendLoading) return;
        try {
            setFriendLoading(true);
            let res;
            if (relationStatus === 'none') { res = await FriendServices.sendFriendRequest(user._id); toast.success('Đã gửi lời mời kết bạn'); }
            else if (relationStatus === 'pending_sent') { res = await FriendServices.cancelFriendRequest(user._id); toast('Đã hủy lời mời'); }
            else if (relationStatus === 'pending_received') { res = await FriendServices.acceptFriendRequest(user._id); toast.success('Đã chấp nhận lời mời'); }
            else if (relationStatus === 'friend') { res = await FriendServices.cancelFriendRequest(user._id); toast('Đã hủy kết bạn'); }
            if (res?.data?.relationStatus) setRelationStatus(res.data.relationStatus);
        } catch (err) { toast.error(err?.response?.data?.message || 'Không thể thực hiện'); }
        finally { setFriendLoading(false); }
    };

    const handleRefuseRequest = async () => {
        if (!user?._id || friendLoading) return;
        try {
            setFriendLoading(true);
            await FriendServices.refuseFriendRequest(user._id);
            setRelationStatus('none'); toast('Đã từ chối');
        } catch { toast.error('Không thể từ chối'); } finally { setFriendLoading(false); }
    };

    const handleOpenChat = () => {
        const roomChatId = currentUser?.friendList?.find(
            (f) => f.user_id === user?._id || f.user_id?.toString() === user?._id?.toString()
        )?.room_chat_id;
        navigate(roomChatId ? `/messenger?roomId=${roomChatId}` : '/messenger');
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
            headline: user.headline || '',
            fieldOfStudy: user.fieldOfStudy || 'other',
            skills: user.skills ? user.skills.join(', ') : '',
            interests: user.interests || [],
            portfolioLinks: user.portfolioLinks || []
        });
        setIsEditOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (name === 'avatar' && files?.[0]) {
            setFormData((prev) => ({ ...prev, avatarFile: files[0], avatar: URL.createObjectURL(files[0]) }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleLinksChange = (newLinks) => {
        setFormData(prev => ({ ...prev, portfolioLinks: newLinks }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const data = new FormData();
            ['fullName', 'username', 'bio', 'isPrivate', 'headline', 'fieldOfStudy'].forEach((k) => {
                data.append(k, formData[k]);
            });
            
            const skillsArray = formData.skills
                ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            data.append('skills', JSON.stringify(skillsArray));
            data.append('interests', JSON.stringify(formData.interests));
            data.append('portfolioLinks', JSON.stringify(formData.portfolioLinks));

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
                    followingCount: res.data.followingCount || prev?.stats?.followingCount || 0 
                } 
            }));
            
            toast.success('Cập nhật thành công');
            setIsEditOpen(false);
        } catch (err) { 
            toast.error(err?.response?.data?.message || 'Cập nhật thất bại'); 
        } finally { 
            setSaving(false); 
        }
    };

    const getImageUrl = (post) => post?.firstMedia?.url || post?.firstMedia || null;
    
    const limitWords = (text = '', max = 22) => {
        if (!text.trim()) return '';
        const w = text.trim().split(/\s+/);
        return w.length <= max ? text : w.slice(0, max).join(' ') + '...';
    };

    const getFilteredPosts = () => {
        if (activeTab === 'posts') {
            return posts.filter(p => !p.postType || ['normal', 'question', 'knowledge', 'learning', 'collaboration', 'achievement'].includes(p.postType));
        }
        if (activeTab === 'projects') {
            return posts.filter(p => p.postType === 'project');
        }
        if (activeTab === 'study_notes') {
            return posts.filter(p => p.postType === 'study_note');
        }
        return posts;
    };

    if (activeView === 'archive') return <ArchivePage onBack={() => setActiveView('profile')} />;
    if (loading) return <ProfileSkeleton />;
    if (error) return <div className="flex min-h-[70vh] items-center justify-center px-4"><div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-5 text-red-600 font-semibold shadow-sm">{error}</div></div>;
    if (!user) return null;

    const currentField = categoryMap[user.fieldOfStudy || 'other'];
    const filteredPosts = getFilteredPosts();
    const isMyProfile = relation?.isMe;

    return (
        <>
            <div className="min-h-screen bg-slate-50/40 pb-16 dark:bg-[#08090c] text-gray-900 dark:text-white transition-colors duration-300">
                
                {/* ── TOP HERO HEADER SECTION ── */}
                <div className="relative w-full bg-white dark:bg-[#0f111a] border-b border-gray-100 dark:border-white/5 shadow-sm">
                    {/* TALLER COVER BANNER (chiều dài/cao hơn): h-60 md:h-[320px] */}
                    <div className="h-60 md:h-[320px] w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-violet-500/35 via-transparent to-transparent opacity-70" />
                        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                        
                        {/* Go Back button */}
                        <div className="absolute left-6 top-6 z-10">
                            <button onClick={() => navigate(-1)}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95 shadow-lg border border-white/10">
                                <ArrowLeft size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Profile Summary Header Info */}
                    <div className="mx-auto max-w-7xl px-6 pb-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between -mt-20 md:-mt-24 mb-4 gap-4">
                            {/* Avatar */}
                            <div className="relative inline-block shrink-0 z-10">
                                <img src={user.avatar} alt={user.fullName}
                                    className="h-36 w-36 md:h-44 md:w-44 rounded-[32px] object-cover ring-8 ring-white shadow-2xl dark:ring-[#0f111a]" />
                                <span className={`absolute bottom-4 right-4 h-5 w-5 rounded-full border-4 border-white dark:border-[#0f111a] ${user.statusOnline === 'online' ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-gray-400'}`} />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0 z-10">
                                {isMyProfile ? (
                                    <>
                                        <button onClick={openEditModal}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/45 hover:bg-indigo-700 transition active:scale-95">
                                            Chỉnh sửa hồ sơ
                                        </button>
                                        <button onClick={() => setActiveView('archive')}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-white/5 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition active:scale-95">
                                            <Calendar size={15} /> Kho lưu trữ
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handleFriendAction} disabled={friendLoading}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-60">
                                            {relationStatus === 'friend' ? <UserCheck size={16} /> : <UserPlus size={16} />}
                                            {friendLoading ? 'Đang xử lý...' : relationStatus === 'friend' ? 'Bạn bè' : relationStatus === 'pending_sent' ? 'Đã gửi yêu cầu' : relationStatus === 'pending_received' ? 'Đồng ý kết bạn' : 'Kết bạn'}
                                        </button>
                                        
                                        {relationStatus === 'pending_received' && (
                                            <button onClick={handleRefuseRequest} disabled={friendLoading}
                                                className="rounded-2xl border border-red-200 bg-white px-6 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 transition dark:border-red-500/10 dark:bg-red-500/10 active:scale-95">
                                                Từ chối
                                            </button>
                                        )}
                                        
                                        <button onClick={handleOpenChat}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-white/5 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition active:scale-95">
                                            <MessageSquare size={16} /> Nhắn tin
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Name and headline */}
                        <div className="mt-6 md:pl-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{user.fullName}</h1>
                                {user.isVerified && (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-md shadow-blue-500/15" title="Tài khoản đã xác minh">✓</span>
                                )}
                                {currentField && (
                                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${currentField.color}`}>
                                        📚 {currentField.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">@{user.username}</p>
                            
                            {user.headline && (
                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-3.5 flex items-center gap-2">
                                    <Sparkles size={18} className="text-indigo-500 dark:text-indigo-400" /> {user.headline}
                                </p>
                            )}

                            {/* Core network stats */}
                            <div className="flex items-center gap-6 mt-5 text-sm text-slate-500 dark:text-slate-400 font-semibold">
                                <div>
                                    <span className="font-black text-slate-900 dark:text-white text-base mr-1">{stats?.postsCount || 0}</span> bài viết
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div>
                                    <span className="font-black text-slate-900 dark:text-white text-base mr-1">{stats?.followersCount || 0}</span> người theo dõi
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div>
                                    <span className="font-black text-slate-900 dark:text-white text-base mr-1">{stats?.followingCount || 0}</span> đang theo dõi
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2-COLUMN LAYOUT CONTENT AREA ── */}
                <div className="mx-auto max-w-7xl px-6 mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* ── LEFT COLUMN: METADATA & SIDEBARS ── */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Bio details card */}
                            <div className="rounded-[28px] bg-white border border-gray-100 dark:border-white/5 dark:bg-[#0f111a] p-6 shadow-sm">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Giới thiệu</h3>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line font-medium">
                                    {user.bio || 'Chưa cập nhật tiểu sử giới thiệu.'}
                                </p>
                            </div>

                            {/* Skills & Learning fields */}
                            <div className="rounded-[28px] bg-white border border-gray-100 dark:border-white/5 dark:bg-[#0f111a] p-6 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center justify-between">
                                        <span>Kỹ năng</span>
                                        {isMyProfile && !user.skills?.length && (
                                            <button onClick={openEditModal} className="text-xs text-indigo-500 font-bold flex items-center gap-0.5"><Edit2 size={12}/> Thêm</button>
                                        )}
                                    </h3>
                                    {user.skills && user.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {user.skills.map((skill, index) => (
                                                <span key={index} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 cursor-default transition">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-medium italic">Chưa cập nhật kỹ năng chuyên môn.</p>
                                    )}
                                </div>

                                <div className="border-t border-slate-100 dark:border-white/5 pt-5">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center justify-between">
                                        <span>Lĩnh vực quan tâm</span>
                                        {isMyProfile && !user.interests?.length && (
                                            <button onClick={openEditModal} className="text-xs text-indigo-500 font-bold flex items-center gap-0.5"><Edit2 size={12}/> Thêm</button>
                                        )}
                                    </h3>
                                    {user.interests && user.interests.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {user.interests.map((interest, index) => {
                                                const tag = categoryMap[interest] || categoryMap.other;
                                                return (
                                                    <span key={index} className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${tag.color}`}>
                                                        {tag.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-medium italic">Chưa chọn lĩnh vực học tập quan tâm.</p>
                                    )}
                                </div>
                            </div>

                            {/* Portfolio & Social links */}
                            <div className="rounded-[28px] bg-white border border-gray-100 dark:border-white/5 dark:bg-[#0f111a] p-6 shadow-sm">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center justify-between">
                                    <span>Liên kết & Portfolio</span>
                                    {isMyProfile && (
                                        <button onClick={openEditModal} className="text-xs text-indigo-500 font-bold flex items-center gap-0.5"><Edit2 size={12}/> Cài đặt</button>
                                    )}
                                </h3>
                                {user.portfolioLinks && user.portfolioLinks.length > 0 ? (
                                    <div className="space-y-3">
                                        {user.portfolioLinks.map((link, index) => (
                                            <a key={index} href={link.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition group text-sm font-bold">
                                                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                                    {getSocialIcon(link.type)}
                                                    <span>{link.title || 'Liên kết'}</span>
                                                </div>
                                                <ExternalLink size={14} className="text-slate-400 opacity-65 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 font-medium italic">Chưa kết nối liên kết ngoài.</p>
                                )}
                            </div>

                            {/* Friends Panel */}
                            {friendList.length > 0 && (
                                <div className="rounded-[28px] bg-white border border-gray-100 dark:border-white/5 dark:bg-[#0f111a] p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Bạn bè</h3>
                                        <span className="text-xs font-extrabold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-xl">{friendList.length}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {friendList.slice(0, 8).map((friend) => (
                                            <button key={friend._id} type="button" title={friend.fullName}
                                                onClick={() => navigate(`/profile/${friend._id}`)}
                                                className="flex flex-col items-center group shrink-0">
                                                <img src={friend.avatar} alt={friend.fullName}
                                                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-transparent transition group-hover:ring-indigo-500/80 group-hover:scale-105 shadow-sm" />
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate w-full text-center mt-2 group-hover:text-indigo-500">{friend.fullName.split(' ').pop()}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT COLUMN: PORTFOLIO MAIN WORKSPACES ── */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Interactive Feed / Portfolio Work List */}
                            <div className="overflow-hidden rounded-[28px] border border-gray-100 dark:border-white/5 bg-white shadow-sm dark:bg-[#0f111a]">
                                
                                {/* Custom Tabs Navigator */}
                                <div className="flex items-center border-b border-slate-100 px-6 dark:border-white/5 gap-2 scrollbar-none overflow-x-auto">
                                    {[
                                        { id: 'posts', label: 'Bảng tin học tập', icon: <FileText size={15} /> }, 
                                        { id: 'projects', label: 'Dự án nghiên cứu', icon: <Briefcase size={15} /> }, 
                                        { id: 'study_notes', label: 'Tài liệu & Ghi chú', icon: <BookOpen size={15} /> }
                                    ].map((tab) => (
                                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-4 text-sm font-extrabold border-b-3 transition ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}>
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Panels Content */}
                                <div className="p-6">
                                    {filteredPosts.length === 0 && !postLoading ? (
                                        <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                                            <div className="text-slate-300 dark:text-slate-700 mb-4">
                                                <BookOpen size={56} className="stroke-[1.2]" />
                                            </div>
                                            <p className="font-black text-slate-800 dark:text-slate-300 text-lg">Hộp thư mục trống</p>
                                            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 max-w-sm">Các nội dung cập nhật hoạt động học sẽ xuất hiện tại danh mục này.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                            {filteredPosts.map((post) => {
                                                const imageUrl = getImageUrl(post);
                                                return (
                                                    <div 
                                                        key={post._id} 
                                                        onClick={() => { setSelectedPost(post); setIsPostDetailOpen(true); }}
                                                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-[24px] bg-slate-50/50 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300"
                                                    >
                                                        {imageUrl ? (
                                                            <img src={imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                                        ) : (
                                                            /* High-end Styled Text Card with gradient border glow */
                                                            <div className="flex h-full w-full flex-col justify-between p-5 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#151722] dark:via-[#13151f] dark:to-[#10121b] relative">
                                                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-xl opacity-60" />
                                                                <div className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300 break-words line-clamp-6">
                                                                    {limitWords(post.caption || '')}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-400/90 flex items-center gap-1.5 mt-3 select-none">
                                                                    <Calendar size={11} className="text-slate-400" /> 
                                                                    {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Category Indicators */}
                                                        {post.postType && post.postType !== 'normal' && (
                                                            <div className="absolute left-3.5 top-3.5 rounded-xl bg-black/60 px-2.5 py-1 text-[8px] font-black uppercase text-white tracking-widest backdrop-blur-md border border-white/10 select-none">
                                                                {post.postType === 'study_note' ? 'ghi chú' : post.postType === 'project' ? 'dự án' : post.postType}
                                                            </div>
                                                        )}
                                                        {post.mediaCount > 1 && (
                                                            <div className="absolute right-3.5 top-3.5 rounded-xl bg-black/60 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur-md border border-white/10 select-none">
                                                                +{post.mediaCount - 1}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Hover overlay stats */}
                                                        <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/50" />
                                                        <div className="absolute inset-0 flex items-center justify-center gap-5 opacity-0 transition duration-300 group-hover:opacity-100">
                                                            <span className="text-sm font-black text-white drop-shadow-md">❤ {post.likesCount || 0}</span>
                                                            <span className="text-sm font-black text-white drop-shadow-md">💬 {post.commentsCount || 0}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Load more */}
                                    {hasMore && (
                                        <div className="mt-8 flex justify-center">
                                            <button disabled={postLoading} onClick={() => loadPostGrid()}
                                                className="rounded-2xl border border-slate-200 bg-white px-7 py-3 text-sm font-extrabold text-indigo-600 hover:bg-slate-50 transition disabled:opacity-60 dark:border-white/5 dark:bg-white/5 dark:text-indigo-400 dark:hover:bg-white/10 shadow-sm active:scale-95">
                                                {postLoading ? 'Đang tải...' : 'Tải thêm bài viết'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Profile edit Modal */}
            <EditProfileModal 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                formData={formData} 
                onChange={handleChange} 
                onLinksChange={handleLinksChange}
                onSave={handleSave} 
                saving={saving} 
            />

            {/* Post details Modal */}
            {selectedPost && (
                <PostDetailModal
                    open={isPostDetailOpen}
                    onClose={() => { setSelectedPost(null); setIsPostDetailOpen(false); }}
                    post={{ 
                        ...selectedPost, 
                        content: selectedPost?.caption, 
                        author: typeof selectedPost?.author === 'object' ? selectedPost.author : { fullName: user?.fullName, username: user?.username, avatar: user?.avatar }, 
                        comments: selectedPost?.comments || [] 
                    }}
                    currentUser={user}
                    onSubmitComment={() => {}}
                />
            )}
        </>
    );
}
