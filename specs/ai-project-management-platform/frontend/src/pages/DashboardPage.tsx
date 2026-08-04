import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_WORKSPACES, CREATE_WORKSPACE } from '../lib/graphql';
import Layout from '../components/Layout';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { data, loading, refetch } = useQuery(GET_WORKSPACES);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [error, setError] = useState('');

    const [createWorkspace, { loading: creating }] = useMutation(CREATE_WORKSPACE, {
        onCompleted: () => {
            setShowCreate(false);
            setForm({ name: '', description: '' });
            refetch();
        },
        onError: (err) => setError(err.message),
    });

    const workspaces = data?.workspaces ?? [];

    return (
        <Layout title="Workspaces">
            <div className="flex items-center justify-between mb-6">
                <p className="text-gray-500 text-sm">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</p>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    + New Workspace
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" aria-label="Loading" />
                </div>
            ) : workspaces.length === 0 ? (
                <div className="card p-16 text-center">
                    <div className="text-5xl mb-4">📋</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No workspaces yet</h2>
                    <p className="text-gray-500 mb-6">Create your first workspace to get started</p>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>
                        Create Workspace
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workspaces.map((ws: any) => (
                        <button
                            key={ws.id}
                            onClick={() => navigate(`/workspace/${ws.id}`)}
                            className="card p-6 text-left hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
                                    {ws.name[0].toUpperCase()}
                                </div>
                                {ws.settings?.aiGenerationEnabled && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI</span>
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{ws.name}</h3>
                            {ws.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ws.description}</p>}
                            <p className="text-xs text-gray-400 mt-3">
                                {ws.members?.length ?? 0} member{ws.members?.length !== 1 ? 's' : ''} ·{' '}
                                {new Date(ws.createdAt).toLocaleDateString()}
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Create workspace">
                    <div className="card p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">New Workspace</h2>
                        <form onSubmit={(e) => { e.preventDefault(); setError(''); createWorkspace({ variables: { input: form } }); }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        className="input"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="My Project"
                                        required
                                        minLength={2}
                                        aria-label="Workspace name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
                                    <textarea
                                        className="input"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="What's this workspace for?"
                                        rows={3}
                                        aria-label="Workspace description"
                                    />
                                </div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
