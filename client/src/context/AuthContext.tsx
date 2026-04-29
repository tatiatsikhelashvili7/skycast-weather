import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, tokenStorage } from "../services/weatherApi";
interface User {
    id: number;
    email: string;
}
interface AuthValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: {
    children: ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const token = tokenStorage.get();
        if (!token) {
            setLoading(false);
            return;
        }
        api
            .get<{
            user: User;
        }>("/api/auth/me")
            .then((data) => setUser(data.user))
            .catch(() => tokenStorage.set(null))
            .finally(() => setLoading(false));
    }, []);
    async function login(email: string, password: string) {
        const data = await api.post<{
            token: string;
            user: User;
        }>("/api/auth/login", {
            email,
            password,
        });
        tokenStorage.set(data.token);
        setUser(data.user);
    }
    async function register(email: string, password: string) {
        const data = await api.post<{
            token: string;
            user: User;
        }>("/api/auth/register", {
            email,
            password,
        });
        tokenStorage.set(data.token);
        setUser(data.user);
    }
    function logout() {
        tokenStorage.set(null);
        setUser(null);
    }
    return (<AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
