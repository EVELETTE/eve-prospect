import React, { useState, useEffect } from 'react';
import DashboardStats from './DashboardStats';
import axios from 'axios';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const Dashboard = ({ showNotification }) => {
    const [loading, setLoading] = useState(true);
    const [prospects, setProspects] = useState([]);
    const [error, setError] = useState(null);

    // Fonction pour récupérer les prospects
    const fetchProspects = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5001/api/prospects', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                setProspects(response.data.prospects);
            }
        } catch (error) {
            console.error("Erreur chargement prospects:", error);
            setError("Erreur lors du chargement des données");
            showNotification?.('Erreur lors du chargement des données', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Effet pour charger les données au montage
    useEffect(() => {
        fetchProspects();

        // Rafraîchir les données toutes les 5 minutes
        const interval = setInterval(() => {
            fetchProspects();
        }, 300000);

        return () => clearInterval(interval);
    }, []);

    // Affichage du chargement
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-gray-600 dark:text-gray-400">
                        Chargement du tableau de bord...
                    </p>
                </div>
            </div>
        );
    }

    // Affichage de l'erreur
    if (error) {
        return (
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tableau de bord
                    </h1>

                    {/* Bouton de rafraîchissement */}
                    <button
                        onClick={() => fetchProspects()}
                        className="flex items-center px-4 py-2 space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Rafraîchir</span>
                    </button>
                </div>

                {/* Statistiques */}
                <DashboardStats
                    prospects={prospects}
                    className="animate-fade-in"
                />

                {/* Dernière mise à jour */}
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    Dernière mise à jour: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};

// Ajouter les animations nécessaires
const styles = `
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .animate-fade-in {
        animation: fade-in 0.3s ease-in-out;
    }
`;

// Ajouter les styles à la page
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Dashboard;