import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

export type UserRole = 'super_admin' | 'super_wholesaler' | 'wholesaler' | 'retailer' | null;

// Extended User type to include role locally if needed, or just use the context role
interface User extends FirebaseUser {
    role?: UserRole;
}

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    token: string | null; // Added token to interface
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    const tokenResult = await getIdTokenResult(user);
                    const role = (tokenResult.claims.role as UserRole) || null;

                    setToken(token);
                    setUser(user);
                    setRole(role);

                    // Sync to local storage for persistence helper
                    localStorage.setItem('token', token);
                } catch (error) {
                    console.error("Failed to get user details", error);
                    setToken(null);
                    setUser(null);
                    setRole(null);
                }
            } else {
                setToken(null);
                setUser(null);
                setRole(null);
                localStorage.removeItem('token');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        setRole(userData.role);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, role, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
