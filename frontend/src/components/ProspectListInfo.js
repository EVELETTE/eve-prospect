import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List } from 'lucide-react';

const ProspectListInfo = ({ prospectId }) => {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5001/api/prospects/${prospectId}/lists`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    setLists(response.data.lists);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des listes:', error);
                setError('Impossible de charger les listes');
            } finally {
                setLoading(false);
            }
        };

        if (prospectId) {
            fetchLists();
        }
    }, [prospectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-sm text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
            </div>
        );
    }

    if (!lists.length) {
        return (
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                Ce prospect n'appartient à aucune liste
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {lists.map(list => (
                <div
                    key={list._id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <List className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
            {list.name}
                        <span className="ml-2 text-xs text-gray-500">
              ({list.prospectsCount} prospect{list.prospectsCount > 1 ? 's' : ''})
            </span>
          </span>
                </div>
            ))}
        </div>
    );
};

export default ProspectListInfo;