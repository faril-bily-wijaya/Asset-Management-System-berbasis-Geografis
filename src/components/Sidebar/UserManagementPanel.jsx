import React, { useState, useEffect } from 'react';
import { Users, Trash2, Shield, UserCheck, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagementPanel({ isOpen, onClose }) {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.getAll();
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Gagal memuat daftar user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await usersAPI.updateRole(userId, newRole);
            toast.success('Role berhasil diupdate');
            fetchUsers();
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error(error.response?.data?.message || 'Gagal update role');
        }
    };

    const handleDelete = async (userId) => {
        setDeletingId(userId);
        try {
            await usersAPI.delete(userId);
            toast.success('User berhasil dihapus');
            setShowDeleteConfirm(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error(error.response?.data?.message || 'Gagal hapus user');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-500" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Daftar User
                    </h3>
                </div>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            )}

            {/* Empty State */}
            {!loading && users.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Users className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">Belum ada user</p>
                </div>
            )}

            {/* Users Table */}
            {!loading && users.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Nama
                                </th>
                                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Username
                                </th>
                                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Dibuat
                                </th>
                                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                                                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-white text-sm">
                                                {user.full_name || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="text-slate-600 dark:text-slate-300 text-sm">
                                            {user.username}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="text-slate-600 dark:text-slate-300 text-sm">
                                            {user.email}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={user.id === currentUser?.id}
                                            className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${user.id === currentUser?.id
                                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                    : user.role === 'admin'
                                                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}
                                        >
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                                            {formatDate(user.created_at)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        {user.id !== currentUser?.id && (
                                            <button
                                                onClick={() => setShowDeleteConfirm(user)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legend */}
            {!loading && users.length > 0 && (
                <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-violet-500" />
                        <span>Admin - Akses penuh</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span>Staff - Mode baca saja</span>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md m-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Hapus User</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Apakah Anda yakin ingin menghapus user "{showDeleteConfirm.username}"?
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm.id)}
                                disabled={deletingId === showDeleteConfirm.id}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {deletingId === showDeleteConfirm.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
