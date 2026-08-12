import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {

    Search,
    Shield,
    ShieldCheck,
    Lock,
    Unlock,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    UserX,
    Eye,
    X,
    Mail,
    Calendar,
    FileText,
    Users as UsersIcon,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminUsers, updateUserStatus, updateUserRole, softDeleteAdminUser } from '../../../services/adminServices';
import { useAdminTheme } from '../../../layout/Admin/index.jsx';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmModal from '../../../components/ConfirmModal';
import AdminPagination from '../../../components/AdminPagination';

function UsersAdmin() {
    const { isDark } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    // Apply existing useDebounce hook
    const debouncedKeyword = useDebounce(keyword.trim(), 400);

    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAdminUsers({
                keyword: debouncedKeyword,
                status: statusFilter,
                role: roleFilter,
                page,
                limit: 10,
            });

            if (res?.code === 200) {
                setUsers(res.data.users || []);
                setPagination(res.data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
            } else {
                toast.error(res?.message || 'Không thể tải danh sách người dùng');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi tải dữ liệu người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
    }, [debouncedKeyword, statusFilter, roleFilter]);

    const handleToggleStatus = (user) => {
        const isBlocking = user.status !== 'blocked';
        const newStatus = isBlocking ? 'blocked' : 'active';

        setConfirmModal({
            isOpen: true,
            title: isBlocking ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
            message: isBlocking
                ? `Bạn có chắc chắn muốn KHÓA tài khoản "${user.fullName}" (@${user.username})? Người dùng này sẽ không thể đăng nhập.`
                : `MỞ KHÓA tài khoản "${user.fullName}" (@${user.username})?`,
            confirmText: isBlocking ? 'Khóa ngay' : 'Mở khóa',
            type: isBlocking ? 'danger' : 'info',
            onConfirm: async () => {
                try {
                    setActionLoadingId(user._id);
                    setConfirmModal({ isOpen: false });
                    const res = await updateUserStatus(user._id, newStatus);
                    if (res?.code === 200) {
                        toast.success(res.message);
                        setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u)));
                        if (selectedUserDetail?._id === user._id) {
                            setSelectedUserDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
                        }
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Thao tác thất bại');
                } finally {
                    setActionLoadingId('');
                }
            },
        });
    };

    const handleToggleRole = (user) => {
        const isPromoting = user.role !== 'admin';
        const newRole = isPromoting ? 'admin' : 'user';

        setConfirmModal({
            isOpen: true,
            title: isPromoting ? 'Cấp quyền Admin' : 'Hạ quyền xuống Member',
            message: isPromoting
                ? `Cấp quyền ADMIN cho tài khoản "${user.fullName}" (@${user.username})? người này sẽ có full quyền quản trị.`
                : `Hạ quyền xuống MEMBER cho tài khoản "${user.fullName}"?`,
            confirmText: isPromoting ? 'Cấp quyền Admin' : 'Hạ quyền',
            type: 'warning',
            onConfirm: async () => {
                try {
                    setActionLoadingId(user._id);
                    setConfirmModal({ isOpen: false });
                    const res = await updateUserRole(user._id, newRole);
                    if (res?.code === 200) {
                        toast.success(res.message);
                        setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)));
                        if (selectedUserDetail?._id === user._id) {
                            setSelectedUserDetail((prev) => (prev ? { ...prev, role: newRole } : null));
                        }
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Thao tác thất bại');
                } finally {
                    setActionLoadingId('');
                }
            },
        });
    };

    const handleDeleteUser = (user) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xóa mềm tài khoản',
            message: `Xóa mềm tài khoản "${user.fullName}" (@${user.username}) khỏi hệ thống?`,
            confirmText: 'Xóa mềm',
            type: 'danger',
            onConfirm: async () => {
                try {
                    setActionLoadingId(user._id);
                    setConfirmModal({ isOpen: false });
                    const res = await softDeleteAdminUser(user._id);
                    if (res?.code === 200) {
                        toast.success(res.message);
                        setUsers((prev) => prev.filter((u) => u._id !== user._id));
                        if (selectedUserDetail?._id === user._id) {
                            setSelectedUserDetail(null);
                        }
                    }
                } catch (err) {
                    toast.error(err?.response?.data?.message || 'Không thể xóa tài khoản');
                } finally {
                    setActionLoadingId('');
                }
            },
        });
    };


    return (
        <div className="space-y-6">
            {/* Header Toolbar */}
            <div
                className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 backdrop-blur-xl ${
                    isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white shadow-sm'
                }`}
            >
                {/* Search Bar with useDebounce */}
                <div className="relative min-w-[280px] flex-1 max-w-md">
                    <Search className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm kiếm theo tên, username, email..."
                        className={`h-11 w-full rounded-2xl border pl-11 pr-4 text-xs font-medium outline-none transition ${
                            isDark
                                ? 'border-white/10 bg-white/5 text-white focus:border-indigo-500 placeholder:text-gray-500'
                                : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500 placeholder:text-slate-400'
                        }`}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                        {[
                            { id: 'all', label: 'Tất cả trạng thái' },
                            { id: 'active', label: 'Hoạt động' },
                            { id: 'blocked', label: 'Bị khóa' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setStatusFilter(item.id)}
                                className={`rounded-xl px-3 py-1.5 font-semibold transition ${
                                    statusFilter === item.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className={`flex items-center gap-1 rounded-2xl border p-1 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                        {[
                            { id: 'all', label: 'Tất cả vai trò' },
                            { id: 'user', label: 'User' },
                            { id: 'admin', label: 'Admin' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setRoleFilter(item.id)}
                                className={`rounded-xl px-3 py-1.5 font-semibold transition ${
                                    roleFilter === item.id
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Users Data Table */}
            <div className={`overflow-hidden rounded-3xl border backdrop-blur-xl shadow-2xl ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white'}`}>
                <div className="no-scrollbar overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className={`border-b uppercase tracking-wider font-bold ${isDark ? 'border-white/10 bg-white/[0.03] text-gray-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                            <tr>
                                <th className="px-6 py-4">Người dùng</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Followers</th>
                                <th className="px-6 py-4">Bài viết</th>
                                <th className="px-6 py-4">Vai trò</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4">Ngày tham gia</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                                        <p className="mt-2 font-medium">Đang tải danh sách người dùng...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400">
                                        Không tìm thấy người dùng nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const isBlocked = u.status === 'blocked';
                                    const isAdmin = u.role === 'admin';
                                    const isProcessing = actionLoadingId === u._id;

                                    return (
                                        <tr
                                            key={u._id}
                                            onClick={() => setSelectedUserDetail(u)}
                                            className={`cursor-pointer transition ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={u.avatar || 'https://via.placeholder.com/150'}
                                                        alt="Avatar"
                                                        className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                                                    />
                                                    <div className="min-w-0">
                                                        <h4 className={`truncate font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.fullName}</h4>
                                                        <p className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{u.username || 'user'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className={`px-6 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{u.email}</td>

                                            <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.followers?.length || 0}</span> followers
                                            </td>

                                            <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.postCount || 0}</span> bài
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                        isAdmin
                                                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                                            : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                                                    }`}
                                                >
                                                    <Shield className="h-3 w-3" />
                                                    {isAdmin ? 'Admin' : 'Member'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                        isBlocked
                                                            ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                                                            : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                                    }`}
                                                >
                                                    {isBlocked ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                                    {isBlocked ? 'Đã bị khóa' : 'Hoạt động'}
                                                </span>
                                            </td>

                                            <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {isProcessing ? (
                                                    <Loader2 className="ml-auto h-5 w-5 animate-spin text-indigo-500" />
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedUserDetail(u);
                                                            }}
                                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition hover:bg-indigo-500/20"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleRole(u);
                                                            }}
                                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition hover:bg-amber-500/20"
                                                            title={isAdmin ? 'Hạ quyền xuống User' : 'Nâng quyền Admin'}
                                                        >
                                                            <ShieldCheck className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleStatus(u);
                                                            }}
                                                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                                                isBlocked
                                                                    ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                                    : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                                                            }`}
                                                            title={isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản (Ban)'}
                                                        >
                                                            {isBlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteUser(u);
                                                            }}
                                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition hover:bg-red-500/20"
                                                            title="Xóa mềm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <AdminPagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={(p) => fetchUsers(p)}
                />
            </div>

            {/* USER DETAIL MODAL */}
            {selectedUserDetail && createPortal(
                <div
                    onClick={() => setSelectedUserDetail(null)}
                    className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-lg overflow-hidden rounded-3xl border p-6 shadow-2xl space-y-6 ${isDark ? 'border-white/10 bg-[#0f172a] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                    >

                        {/* Header & Close */}
                        <div className="flex items-center justify-between border-b pb-4 border-white/10">
                            <div className="flex items-center gap-2 font-bold text-sm text-indigo-500">
                                <Shield className="h-4 w-4" /> Chi tiết Người dùng
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedUserDetail(null)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* User Profile Overview Card */}
                        <div className="flex items-center gap-4">
                            <img
                                src={selectedUserDetail.avatar || 'https://via.placeholder.com/150'}
                                alt="Avatar"
                                className="h-16 w-16 shrink-0 rounded-3xl object-cover ring-2 ring-indigo-500/50 shadow-lg"
                            />
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-extrabold truncate">{selectedUserDetail.fullName}</h3>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>@{selectedUserDetail.username || 'user'}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                            selectedUserDetail.role === 'admin'
                                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                                : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                                        }`}
                                    >
                                        <Shield className="h-3 w-3" />
                                        {selectedUserDetail.role === 'admin' ? 'Administrator' : 'Member'}
                                    </span>

                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                            selectedUserDetail.status === 'blocked'
                                                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                                                : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                        }`}
                                    >
                                        {selectedUserDetail.status === 'blocked' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                        {selectedUserDetail.status === 'blocked' ? 'Đã bị khóa' : 'Hoạt động'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className={`rounded-2xl border p-3 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="text-lg font-extrabold text-indigo-500">{selectedUserDetail.postCount || 0}</div>
                                <div className={`text-[11px] font-medium flex items-center justify-center gap-1 mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                    <FileText className="h-3 w-3" /> Bài viết
                                </div>
                            </div>
                            <div className={`rounded-2xl border p-3 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="text-lg font-extrabold text-indigo-500">{selectedUserDetail.followers?.length || 0}</div>
                                <div className={`text-[11px] font-medium flex items-center justify-center gap-1 mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                    <UsersIcon className="h-3 w-3" /> Followers
                                </div>
                            </div>
                            <div className={`rounded-2xl border p-3 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="text-lg font-extrabold text-indigo-500">{selectedUserDetail.following?.length || 0}</div>
                                <div className={`text-[11px] font-medium flex items-center justify-center gap-1 mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                    <UsersIcon className="h-3 w-3" /> Following
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className={`rounded-2xl border p-4 space-y-2 text-xs ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                            <div className="flex items-center gap-2">
                                <Mail className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                                <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Email:</span>
                                <span className="font-bold text-indigo-400">{selectedUserDetail.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                                <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Ngày tham gia:</span>
                                <span>{new Date(selectedUserDetail.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                        </div>

                        {/* Quick Actions Footer */}
                        <div className={`flex flex-wrap items-center justify-end gap-2 border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <button
                                type="button"
                                onClick={() => handleToggleRole(selectedUserDetail)}
                                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-500 transition hover:bg-amber-500/20"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                {selectedUserDetail.role === 'admin' ? 'Hạ xuống User' : 'Nâng Admin'}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleToggleStatus(selectedUserDetail)}
                                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                                    selectedUserDetail.status === 'blocked'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                                }`}
                            >
                                {selectedUserDetail.status === 'blocked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                {selectedUserDetail.status === 'blocked' ? 'Mở khóa' : 'Khóa tài khoản'}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDeleteUser(selectedUserDetail)}
                                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/20"
                            >
                                <Trash2 className="h-4 w-4" /> Xóa mềm
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}


            {/* CONFIRMATION MODAL */}
            <ConfirmModal {...confirmModal} onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
        </div>
    );
}


export default UsersAdmin;
