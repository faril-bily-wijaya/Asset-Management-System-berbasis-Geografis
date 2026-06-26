import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await authAPI.me();
                    setUser(response.data.user);
                } catch (error) {
                    console.error("Token expired or invalid", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authAPI.login({ username, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);

            toast.success(`Selamat datang kembali, ${user.full_name || user.username}!`);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login gagal. Periksa username dan password.');
            return false;
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            toast.success('Akun berhasil dibuat! Silakan login.');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registrasi gagal. Username atau email mungkin sudah digunakan.');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Anda telah berhasil keluar.');
    };

    // Check if user has admin role
    const isAdmin = user?.role === 'admin';

    // Check if user can edit (only admin can edit)
    const canEdit = isAdmin;

    // Check if user can export/download (only admin)
    const canExport = isAdmin;

    const value = {
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user,
        loading,
        isAdmin,
        canEdit,
        canExport
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
