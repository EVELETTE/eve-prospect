// src/components/NotificationContainer.js
import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import DashboardStats from "./DashboardStats";

export const NotificationContainer = ({ notifications }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5" />;
            case 'error':
                return <XCircle className="h-5 w-5" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5" />;
            default:
                return null;
        }
    };

    const getStyles = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {notifications.map(({ id, message, type }) => (
                <div
                    key={id}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${getStyles(type)}`}
                    style={{ animation: 'slideIn 0.3s ease-out' }}
                >
                    {getIcon(type)}
                    <span className="text-sm font-medium">{message}</span>
                </div>
            ))}
        </div>
    );
};

export default NotificationContainer;