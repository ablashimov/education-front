import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import echo from '@/lib/echo';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export interface Notification {
    id: string;
    type: string;
    data: {
        title: string;
        message: string;
        entity_type: string;
        entity_id: number;
        link?: string;
    };
    read_at: string | null;
    created_at: string;
}

interface NotificationContextValue {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data } = await apiClient.get('/notifications');
            // Laravel pagination wrapper
            setNotifications(data.data || []);

            const countRes = await apiClient.get('/notifications/unread-count');
            setUnreadCount(countRes.data.count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();

            const channel = echo.private(`user.${user.id}`);

            // Listen for specific notification events
            const handleNotification = (data: any) => {
                toast(data.title, {
                    description: data.message,
                    action: data.link ? {
                        label: 'View',
                        onClick: () => window.location.href = data.link
                    } : undefined,
                });

                setUnreadCount(prev => prev + 1);
                // Re-fetch to get the full DB record structure (id, read_at, etc)
                fetchNotifications();
            };

            // Subscribe to all notification event types
            channel.listen('.group.available', handleNotification);
            channel.listen('.group-request.approved', handleNotification);
            channel.listen('.exam.available', handleNotification);

            return () => {
                echo.leave(`user.${user.id}`);
            };
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await apiClient.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, isLoading }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
