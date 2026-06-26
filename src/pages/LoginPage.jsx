import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Map, Lock, User, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        setIsSubmitting(true);
        const success = await login(username, password);
        setIsSubmitting(false);

        if (success) {
            navigate('/manajemen');
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
                            Manajemen Aset<br />Berbasis Geografis
                        </h2>
                        <p className="text-emerald-100 text-lg max-w-md leading-relaxed">
                            Akses sistem manajemen untuk mengontrol, memperbarui, dan memantau status inventori infrastruktur jaringan Anda di seluruh regional.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-emerald-200/80">
                        <div className="w-8 h-[2px] bg-emerald-400/50" />
                        Telkom Indonesia Secure Access
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-800 relative">
                    <div className="max-w-md w-full mx-auto">

                        <div className="mb-10 text-center lg:text-left">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Selamat Datang Kembali</h3>
                            <p className="text-slate-500 dark:text-slate-400">Masuk untuk melanjutkan ke panel manajemen.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-900 dark:text-white transition-all outline-none"
                                            placeholder="Masukkan username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                disabled={isSubmitting || !username || !password}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Masuk ke Sistem
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-8 space-y-3 text-center">
                            <Link
                                to="/register"
                                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                Daftar Akun Baru
                            </Link>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Hanya administrator berwenang yang dapat mengakses halaman ini.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
