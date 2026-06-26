import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Mail, UserCircle, ArrowRight, Loader2, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ProfilePage() {
    const { user, login } = useAuth(); // we might need to re-fetch or re-login to update context, or just refresh
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.full_name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.new_password && formData.new_password !== formData.confirm_password) {
            toast.error('Konfirmasi password baru tidak cocok');
            return;
        }

        if (formData.new_password && formData.new_password.length < 6) {
            toast.error('Password baru minimal 6 karakter');
            return;
        }

        setIsSubmitting(true);
        try {
            const updateData = {
                full_name: formData.full_name,
                email: formData.email
            };

            if (formData.new_password) {
                updateData.current_password = formData.current_password;
                updateData.new_password = formData.new_password;
            }

            const response = await authAPI.updateProfile(updateData);
            toast.success('Profil berhasil diperbarui!');
            
            // Clear password fields after success
            setFormData(prev => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));

            // Force refresh user data by refreshing page or calling me()
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden relative p-4 sm:p-6 md:p-8">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/50 z-10 overflow-hidden relative">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm font-medium mb-3"
                        >
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Peta
                        </button>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
                                <UserCircle className="w-6 h-6" />
                            </div>
                            Profil Saya
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className={`w-2.5 h-2.5 rounded-full ${user?.role === 'admin' ? 'bg-violet-500' : 'bg-blue-500'}`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                            Role: {user?.role || 'User'}
                        </span>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Data Diri */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-400" /> Informasi Dasar
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                                    <input
                                        type="text"
                                        value={user?.username || ''}
                                        disabled
                                        className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">Username tidak dapat diubah</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-slate-900 dark:text-white transition-all outline-none"
                                        placeholder="Nama lengkap Anda"
                                    />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="email@perusahaan.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-200 dark:border-slate-700" />

                        {/* Keamanan */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-slate-400" /> Keamanan
                                </h3>
                                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md font-medium">Opsional</span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Kosongkan jika tidak ingin mengganti password.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password Saat Ini</label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        value={formData.current_password}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-slate-900 dark:text-white transition-all outline-none"
                                        placeholder="Masukkan password lama"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password Baru</label>
                                        <input
                                            type="password"
                                            name="new_password"
                                            value={formData.new_password}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="Minimal 6 karakter"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="Ketik ulang password"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-lg shadow-violet-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
