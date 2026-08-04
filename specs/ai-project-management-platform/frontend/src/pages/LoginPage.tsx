import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { LOGIN } from '../lib/graphql';
import { useAuthStore } from '../store/auth.store';

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const [login, { loading }] = useMutation(LOGIN, {
        onCompleted: (data) => {
            const { accessToken, refreshToken, user } = data.login;
            setAuth(accessToken, refreshToken, user);
            navigate('/');
        },
        onError: (err) => setError(err.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        login({ variables: form });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100">
            <div className="card p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-2">🚀</div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Project Manager</h1>
                    <p className="text-gray-500 mt-1">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="you@example.com"
                            required
                            aria-label="Email address"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="••••••••"
                            required
                            aria-label="Password"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    No account?{' '}
                    <Link to="/register" className="text-brand-500 hover:underline font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
