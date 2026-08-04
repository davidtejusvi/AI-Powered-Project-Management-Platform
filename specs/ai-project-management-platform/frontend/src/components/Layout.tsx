import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { LOGOUT } from '../lib/graphql';
import { useAuthStore } from '../store/auth.store';
import NotificationBell from './NotificationBell';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const [logout] = useMutation(LOGOUT);

    const handleLogout = async () => {
        try { await logout(); } catch { /* ignore */ }
        clearAuth();
        navigate('/login');
    };

    const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
                        <span>🚀</span> AI PM
                    </Link>
                    <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        Dashboard
                    </Link>
                    {isAdmin && (
                        <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            Admin
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-medium">
                            {user?.displayName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="text-sm text-gray-700 hidden sm:block">{user?.displayName}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        aria-label="Sign out"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {title && <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>}
                {children}
            </main>
        </div>
    );
}
