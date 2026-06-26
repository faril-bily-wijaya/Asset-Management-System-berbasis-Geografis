import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Map, User, Lock, Mail, UserCircle, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.username || !formData.email || !formData.password) {
            setError('Semua field wajib diisi');
            return;
        }

        if (formData.username.length < 3) {
            setError('Username minimal 3 karakter');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Password tidak cocok');
            return;
        }

        setIsSubmitting(true);
        const success = await register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name || formData.username
        });
        setIsSubmitting(false);

        if (success) {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 m-6 border border-slate-200 dark:border-slate-700/50 z-10">

                {/* Left Side: Branding / Info */}
                <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-emerald-600 to-teal-800 text-white relative overflow-hidden">
                    {/* Decorative Map Pattern inside branding */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                                <Map className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight">InfraNexia</h1>
                        </div>

                        <h2 className="text-4xl font-bold leading-tight mb-6">
                            Bergabung<br />Dengan Tim Kami
                        </h2>
                        <p className="text-emerald-100 text-lg max-w-md leading-relaxed">
                            Daftarkan akun administrator baru untuk mengelola dan memantau inventori infrastruktur jaringan di seluruh regional.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-emerald-200/80">
                        <div className="w-8 h-[2px] bg-emerald-400/50" />
                        Telkom Indonesia Secure Access
                    </div>
                </div>

                {/* Right Side: Register Form */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-800 relative">
                    <div className="max-w-md w-full mx-auto">

                        <div className="mb-10 text-center lg:text-left">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Daftar Akun Baru</h3>
                            <p className="text-slate-500 dark:text-slate-400">Buat akun untuk mengakses panel manajemen.</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="Masukkan username"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
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
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="admin@telkom.co.id"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <UserCircle className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="Nama Lengkap Anda"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Daftar Akun
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                to="/login"
                                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                            >
                                ← Kembali ke Halaman Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
