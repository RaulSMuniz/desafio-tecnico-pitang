import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import useSWR from 'swr';
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
    signOut: (reason?: string) => void,
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const storagedUser = localStorage.getItem('@pitang/user');

        if (storagedUser) {
            setUser(JSON.parse(storagedUser));
        } else {
            setUser(null);
        }

        setLoading(false)
    }, []);

    const { data: swrUser } = useSWR(
        (user && !loading) ? '/auth/me' : null,
        (url: string) => fetcher.get(url).then(res => res.user || res.data?.user || res),
        {
            refreshInterval: 5000,
            revalidateOnFocus: true,
            dedupingInterval: 2000,
        }
    );

    useEffect(() => {
        if (swrUser && user) {
            const hasChanged = swrUser.perfil !== user.perfil || swrUser.nome !== user.nome;

            if (hasChanged) {
                console.log("Detectada mudança de perfil/cargo. Atualizando interface...");
                setUser(swrUser);
                localStorage.setItem('@pitang/user', JSON.stringify(swrUser));
                window.location.reload();
            }
        }
    }, [swrUser, user]);



    const signIn = async (credentials: object) => {
        try {
            setLoading(true);
            const response = await fetcher.post('/auth/login', credentials);

            const { user: userData } = response.data || response;

            setUser(userData);
            localStorage.setItem('@pitang/user', JSON.stringify(userData));
        } catch (error: any) {
            console.error("Erro ao processar login no front:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async (reason?: string) => {
        try {
            await fetcher.post('/auth/logout');
        } catch (error) {
            console.error("Erro ao fazer logout no servidor:", error);
        } finally {
            localStorage.removeItem('@pitang/user');
            setUser(null);
            window.location.href = reason ? `/login?reason=${reason}` : '/login';
        }
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