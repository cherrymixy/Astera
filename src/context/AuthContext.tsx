import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { fetchAPI, setToken, clearToken } from '../api/client';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }

        fetchAPI<{ success: boolean; data: User }>('/api/auth/me')
            .then(res => setUser(res.data))
            .catch(() => clearToken())
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const res = await fetchAPI<{ success: boolean; data: { token: string; user: User } }>(
            '/api/auth/login',
            { method: 'POST', body: JSON.stringify({ email, password }) }
        );
        setToken(res.data.token);
        setUser(res.data.user);
    };

    const register = async (email: string, password: string, name: string) => {
        const res = await fetchAPI<{ success: boolean; data: { token: string; user: User } }>(
            '/api/auth/register',
            { method: 'POST', body: JSON.stringify({ email, password, name }) }
        );
        setToken(res.data.token);
        setUser(res.data.user);
    };

    const logout = () => {
        clearToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
