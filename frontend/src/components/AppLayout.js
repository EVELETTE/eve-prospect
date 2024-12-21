import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { NotificationContainer } from '../components/NotificationContainer';
import Sidebar from './Sidebar';
import Header from './Header';
import CampaignsList from './CampaignsList';
import Dashboard from './Dashboard';
import Products from './Products';
import ProspectListWidget from './ProspectListWidget';
import Settings from './Settings';
import Messages from './Messages';
import LogoDark from '../assets/logo-dark.png';
import axios from 'axios';

const AppLayout = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { notifications, showNotification } = useNotification();

    // Initialisation et vérification de l'authentification
    useEffect(() => {
        const initializeApp = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await axios.get('/api/auth/user');
                setUserData(response.data);
                setIsInitialized(true);
            } catch (error) {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    showNotification('Session expirée, veuillez vous reconnecter', 'warning');
                } else {
                    showNotification('Erreur de connexion au serveur', 'error');
                }
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, [navigate, showNotification]);

    // Gestion de la déconnexion
    const handleLogout = () => {
        try {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            showNotification('Déconnexion réussie', 'success');
            navigate('/login');
        } catch (error) {
            showNotification('Erreur lors de la déconnexion', 'error');
        }
    };

    // Gestion globale des erreurs API
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            config => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            error => Promise.reject(error)
        );

        const responseInterceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    showNotification('Session expirée, veuillez vous reconnecter', 'warning');
                } else if (error.response?.status === 403) {
                    showNotification('Accès non autorisé', 'error');
                } else if (error.response?.status === 404) {
                    showNotification('Ressource non trouvée', 'error');
                } else if (error.response?.status >= 500) {
                    showNotification('Erreur serveur, veuillez réessayer plus tard', 'error');
                } else {
                    showNotification(
                        error.response?.data?.message || 'Une erreur est survenue',
                        'error'
                    );
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [navigate, showNotification]);

    if (!isInitialized || isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <Sidebar
                logo={LogoDark}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col pl-64 min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <Header
                    user={userData}
                    showNotification={showNotification}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    <div className={`w-full h-full transition-opacity duration-150 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                        <Routes>
                            <Route path="/" element={<Dashboard showNotification={showNotification} />} />
                            <Route path="/dashboard" element={<Dashboard showNotification={showNotification} />} />
                            <Route path="/prospects" element={<ProspectListWidget prospects={[]} onProspectsUpdate={() => {}} onRefresh={() => {}} />} />
                            <Route path="/campaigns" element={<CampaignsList showNotification={showNotification} />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/help" element={
                                <div className="p-6 bg-gray-50 dark:bg-gray-900">
                                    <h2 className="text-2xl font-bold mb-4 dark:text-white">Aide</h2>
                                    <p className="text-gray-600 dark:text-gray-300">Fonctionnalité en cours de développement</p>
                                </div>
                            } />
                        </Routes>
                    </div>
                </main>
            </div>

            <NotificationContainer notifications={notifications} />
        </div>
    );
};

export default AppLayout;