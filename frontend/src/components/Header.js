import React, { useState } from 'react';
import { Search } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import CreateCampaignModal from './CreateCampaignModal';

const Header = ({ user, showNotification }) => {
    const [showCampaignModal, setShowCampaignModal] = useState(false);

    return (
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Search Bar */}
                <div className="relative w-96">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700
                                 text-gray-900 dark:text-gray-100 rounded-lg
                                 border border-gray-200 dark:border-gray-600
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                {/* Header Actions */}
                <div className="flex items-center space-x-6">
                    {/* Campaign Button */}
                    <button
                        onClick={() => setShowCampaignModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg
                                 hover:bg-blue-700 transition-colors
                                 shadow-sm"
                    >
                        Démarrer une campagne
                    </button>

                    {/* Notifications */}
                    <NotificationCenter />

                    {/* User Profile */}
                    <div className="flex items-center space-x-3">
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`}
                            alt="Avatar"
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`;
                            }}
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {user?.firstName} {user?.lastName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Sales Admin
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <CreateCampaignModal
                    onClose={() => setShowCampaignModal(false)}
                    onSuccess={() => {
                        setShowCampaignModal(false);
                        showNotification('Campagne créée avec succès', 'success');
                    }}
                    showNotification={showNotification}
                />
            )}
        </header>
    );
};

export default Header;