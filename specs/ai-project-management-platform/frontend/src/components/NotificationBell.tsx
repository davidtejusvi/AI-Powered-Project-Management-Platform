import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NOTIFICATIONS, MARK_READ } from '../lib/graphql';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { data, refetch } = useQuery(GET_NOTIFICATIONS, { variables: { unreadOnly: false } });
    const [markRead] = useMutation(MARK_READ, { onCompleted: () => refetch() });

    const notifications = data?.notifications ?? [];
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 card shadow-lg z-50 overflow-hidden" role="dialog" aria-label="Notifications panel">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Notifications</h3>
                        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close notifications">✕</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 text-sm">No notifications</p>
                        ) : (
                            notifications.map((n: any) => (
                                <div
                                    key={n.id}
                                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.isRead ? 'bg-brand-50' : ''}`}
                                    onClick={() => !n.isRead && markRead({ variables: { id: n.id } })}
                                >
                                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
