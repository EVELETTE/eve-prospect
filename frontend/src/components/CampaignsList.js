import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Settings, Trash2, BarChart2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import CreateCampaignModal from './CreateCampaignModal';

const CampaignsList = ({ showNotification }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [error, setError] = useState(null);
    const [refreshInterval, setRefreshInterval] = useState(null);

    // URL de base pour les requêtes API
    const API_BASE_URL = 'http://localhost:5001/api/campaigns';

    // Configuration Axios avec token
    const getAxiosConfig = useCallback(() => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }), []);

    // Récupération des campagnes
    const fetchCampaigns = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await axios.get(API_BASE_URL, getAxiosConfig());
            console.log('Campaigns data:', response.data);
            setCampaigns(response.data.campaigns || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setError('Erreur lors du chargement des campagnes');
            if (!silent) {
                showNotification?.('Erreur lors du chargement des campagnes', 'error');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [showNotification, getAxiosConfig]);

    // Rafraîchissement automatique
    useEffect(() => {
        fetchCampaigns();
        const interval = setInterval(() => {
            fetchCampaigns(true);
        }, 30000); // Rafraîchir toutes les 30 secondes
        setRefreshInterval(interval);

        return () => {
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, [fetchCampaigns]);

    // Actions sur les campagnes
    const handleCampaignAction = async (campaignId, action) => {
        try {
            setLoading(true);
            const response = await axios.put(
                `${API_BASE_URL}/${campaignId}/${action}`,
                {},
                getAxiosConfig()
            );

            if (response.data.success) {
                showNotification?.(
                    `Campagne ${action === 'start' ? 'démarrée' : 'mise en pause'} avec succès`,
                    'success'
                );
                await fetchCampaigns();
            }
        } catch (error) {
            console.error(`Error ${action} campaign:`, error);
            showNotification?.(`Erreur lors de l'action ${action}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteCampaign = async (campaignId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await axios.delete(
                `${API_BASE_URL}/${campaignId}`,
                getAxiosConfig()
            );

            if (response.data.success) {
                showNotification?.('Campagne supprimée avec succès', 'success');
                await fetchCampaigns();
            }
        } catch (error) {
            console.error('Error deleting campaign:', error);
            showNotification?.('Erreur lors de la suppression', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fonctions utilitaires
    const getStatusColor = useMemo(() => (status) => {
        const colors = {
            draft: 'bg-gray-500',
            running: 'bg-green-500',
            paused: 'bg-yellow-500',
            completed: 'bg-blue-500',
            failed: 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
    }, []);

    const formatDate = useCallback((date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    // États d'erreur et de chargement
    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            </div>
        );
    }

    // Rendu principal
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Campagnes</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                        Gérez vos campagnes d'automatisation LinkedIn
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchCampaigns()}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        disabled={loading}
                    >
                        <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Nouvelle campagne
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="text-gray-500 dark:text-gray-400">
                        <BarChart2 className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Aucune campagne</h3>
                        <p>Créez votre première campagne pour commencer à prospecter</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Campagne
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Prospects
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Dernière mise à jour
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {campaigns.map((campaign) => (
                                <tr
                                    key={campaign._id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {campaign.title}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {campaign.description}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)} text-white`}>
                        {campaign.status}
                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {campaign.prospects?.length || 0} prospects
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {campaign.results?.successful?.length || 0} connectés
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {formatDate(campaign.updatedAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-3">
                                            {campaign.status === 'running' ? (
                                                <button
                                                    onClick={() => handleCampaignAction(campaign._id, 'pause')}
                                                    className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                                                >
                                                    <Pause className="h-5 w-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCampaignAction(campaign._id, 'start')}
                                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                >
                                                    <Play className="h-5 w-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedCampaign(campaign)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                <Settings className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteCampaign(campaign._id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreateCampaignModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchCampaigns();
                        showNotification?.('Campagne créée avec succès', 'success');
                    }}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};

export default CampaignsList;