import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import fetcher from '../api/fetcher';

interface User {
    id: string;
    nome: string;
    email: string;
    perfil: string;
}

export interface AuthContextData {
    user: User | null;
    signed: boolean,
    loading: boolean,
    signIn: (credentials: object) => Promise<void>
    signOut: () => void,
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const getCookieToken = useCallback((): string | null => {
        return document.cookie
            .split(';')
            .find((c) => c.trim().startsWith('@pitang/accessToken='))
            ?.split('=')[1] || null;
    }, [])

    useEffect(() => {
        const storagedUser = localStorage.getItem('@pitang/user');
        const token = getCookieToken();

        if (storagedUser && token) {
            setUser(JSON.parse(storagedUser));
        } else {
            localStorage.removeItem('@pitang/user');
            setUser(null);
        }

        setLoading(false)
    }, [getCookieToken]);

    const signIn = async (credentials: object) => {
        try {
            setLoading(true);
            const response = await fetcher.post('/auth/login', credentials);

            const { user: userData, token } = response.data || response;

            if (!token) throw new Error("Token não recebido");

            setUser(userData);
            localStorage.setItem('@pitang/user', JSON.stringify(userData));

            const expires = dayjs().add(1, 'hour').toDate().toUTCString();
            document.cookie = `@pitang/accessToken=${token}; path=/; expires=${expires}; SameSite=Lax`;
        } catch (error: any) {
            console.error("Erro ao processar login no front:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = () => {
        document.cookie = "@pitang/accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem('@pitang/user');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{
            signed: !!user,
            user,
            loading,
            signIn,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;