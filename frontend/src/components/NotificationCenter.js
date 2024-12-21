import React, { useState, useEffect, useRef } from 'react';
import {
    Bell,
    Check,
    Trash2,
    X,
    Loader,
    BellOff,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5001/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Erreur notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5001/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Erreur marquage lu:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5001/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Erreur marquage tout lu:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5001/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bouton de notification */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6 text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold
                                   w-5 h-5 flex items-center justify-center rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Panneau des notifications */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-lg
                               border border-gray-700 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h2 className="text-lg font-semibold text-white">Notifications</h2>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Tout marquer comme lu
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Contenu */}
                    <div className="max-h-[70vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                                <BellOff className="w-12 h-12 mb-2" />
                                <p>Aucune notification</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-700">
                                {notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`group p-4 hover:bg-gray-700/50 transition-colors
                                                  ${!notification.read ? 'bg-gray-700/30' : ''}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className={`font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                                    {notification.title}
                                                </h3>
                                                <p className="mt-1 text-sm text-gray-400">
                                                    {notification.message}
                                                </p>
                                                <time className="mt-2 text-xs text-gray-500">
                                                    {formatDate(notification.createdAt)}
                                                </time>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification._id)}
                                                        className="p-1 rounded-full hover:bg-gray-600 text-gray-400
                                                                 hover:text-green-400 transition-colors"
                                                        title="Marquer comme lu"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification._id)}
                                                    className="p-1 rounded-full hover:bg-gray-600 text-gray-400
                                                             hover:text-red-400 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {notification.link && (
                                            <a
                                                href={notification.link}
                                                className="mt-2 inline-flex items-center text-sm text-blue-400
                                                         hover:text-blue-300 transition-colors"
                                            >
                                                En savoir plus →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;