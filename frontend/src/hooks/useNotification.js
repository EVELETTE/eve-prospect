// src/hooks/useNotification.js
import { useState, useCallback } from 'react';

export const useNotification = () => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(notification => notification.id !== id));
        }, 3000);
    }, []);

    return { notifications, showNotification };
};

