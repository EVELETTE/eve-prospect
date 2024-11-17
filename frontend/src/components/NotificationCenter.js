import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, Check, Trash2 } from 'lucide-react';
import './NotificationCenter.css';

const NotificationCenter = ({ theme }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // Fonction pour récupérer les notifications
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
            console.error('Erreur lors de la récupération des notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Effet pour fermer le menu lors d'un clic à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Récupérer les notifications au chargement
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    // Marquer une notification comme lue
    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5001/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Erreur lors du marquage de la notification:', error);
        }
    };

    // Marquer toutes les notifications comme lues
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5001/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Erreur lors du marquage des notifications:', error);
        }
    };

    // Supprimer une notification
    const deleteNotification = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5001/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Erreur lors de la suppression de la notification:', error);
        }
    };

    // Formater la date pour l'affichage
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
        <div className={`notifications-wrapper ${theme}`} ref={dropdownRef}>
            <button
                className={`notification-button ${theme}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell className="notification-icon" />
                {unreadCount > 0 && (
                    <div className="notification-badge">
                        {unreadCount}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className={`notifications-container ${theme}`}>
                    <div className="notifications-header">
                        <div className="notifications-title">Notifications</div>
                        {unreadCount > 0 && (
                            <button
                                className="mark-all-read"
                                onClick={markAllAsRead}
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="notifications-empty">
                            Chargement...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="notifications-empty">
                            Aucune notification
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {notifications.map(notification => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${!notification.read ? 'unread' : ''} ${theme}`}
                                >
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.title}
                                        </div>
                                        <div className="notification-message">
                                            {notification.message}
                                        </div>
                                        <div className="notification-time">
                                            {formatDate(notification.createdAt)}
                                        </div>
                                    </div>
                                    <div className="notification-actions">
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification._id);
                                                }}
                                                className="notification-action-btn"
                                                title="Marquer comme lu"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification._id);
                                            }}
                                            className="notification-action-btn"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
