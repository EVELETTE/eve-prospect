import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';
import Settings from './Settings'
import LogoLight from '../assets/logo-light.png';
import LogoDark from '../assets/logo-dark.png';
import StatCard from './StatCard';
import ProspectListWidget from './ProspectListWidget';
import NotificationCenter from './NotificationCenter';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LineController,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Dashboard = () => {
    // États
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        avatar: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(true);
    const [selectedStat, setSelectedStat] = useState("Prospects ajoutés");
    const [prospects, setProspects] = useState([]);
    const [showProspects, setShowProspects] = useState(true);
    const [showStats, setShowStats] = useState(true);
    const menuRef = useRef(null);

    // Chargement initial des données
    useEffect(() => {
        fetchUserData();
        fetchProspects();
    }, []);

    // Gestion du clic en dehors du menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Récupération des données utilisateur
    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('❌ Aucun token trouvé');
                window.location.href = '/login';
                return;
            }

            const response = await axios.get('http://localhost:5001/api/auth/user', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data) {
                const userData = {
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    avatar: response.data.avatar
                };
                setUserData(userData);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des données:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    // Récupération des prospects
    const fetchProspects = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/prospects', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setProspects(response.data.prospects);
            }
        } catch (error) {
            console.error("❌ Erreur chargement prospects:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const toggleMenu = () => setShowMenu(!showMenu);
    const handleShowSettings = () => {
        setShowSettings(true);
        setShowMenu(false);
    };
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };
    const handleRefreshData = async () => {
        setLoading(true);
        await Promise.all([fetchUserData(), fetchProspects()]);
        setLoading(false);
    };

    // Configuration du graphique
    const chartData = {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [{
            label: selectedStat,
            data: prospects.length ? Array(7).fill(prospects.length) : Array(7).fill(0),
            borderColor: '#0077B5',
            backgroundColor: 'rgba(0, 119, 181, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    if (loading) return <div className="loading">🔄 Chargement...</div>;
    if (error) return <div className="error">❌ {error}</div>;

    return (
        <div className={`dashboard-container ${isDarkTheme ? 'dark' : ''}`}>
            <header className="dashboard-header">
                <img src={isDarkTheme ? LogoDark : LogoLight} alt="Logo" className="dashboard-logo" />
                <div className="header-actions">
                    <button className="start-campaign-btn">
                        Démarrer une campagne
                    </button>
                    {/* Remplacement de l'ancien composant de notification par le nouveau NotificationCenter */}
                    <NotificationCenter />
                    <div className="user-profile" onClick={toggleMenu} ref={menuRef}>
                        <img
                            src={userData.avatar}
                            alt="Avatar"
                            className="header-user-avatar"
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`;
                            }}
                        />
                        <span className="user-name">
                            {userData.firstName} {userData.lastName}
                        </span>
                        <span className="dropdown-icon">▼</span>
                        {showMenu && (
                            <div className="dropdown-menu">
                                <button className="menu-item" onClick={handleShowSettings}>
                                    ⚙️ Paramètres
                                </button>
                                <button className="menu-item" onClick={handleRefreshData}>
                                    🔄 Rafraîchir
                                </button>
                                <button
                                    className="menu-item theme-toggle"
                                    onClick={() => setIsDarkTheme(!isDarkTheme)}
                                >
                                    {isDarkTheme ? '☀️ Mode clair' : '🌙 Mode sombre'}
                                </button>
                                <button className="menu-item logout" onClick={handleLogout}>
                                    🚪 Déconnexion
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {showSettings ? (
                    <Settings onBack={() => setShowSettings(false)} userData={userData} />
                ) : (
                    <>
                        {showProspects && (
                            <section className="prospects-section" key="prospects">
                                <h3>👥 Gestion des Prospects</h3>
                                <ProspectListWidget
                                    prospects={prospects}
                                    onProspectsUpdate={setProspects}
                                    onRefresh={handleRefreshData}
                                />
                            </section>
                        )}

                        {showStats && (
                            <section className="statistics" key="stats">
                                <h3>📊 Statistiques</h3>
                                <div className="stat-box">
                                    <StatCard
                                        icon="👥"
                                        value={prospects.length}
                                        label="Prospects ajoutés"
                                        color="#0077B5"
                                    />
                                    <StatCard
                                        icon="📨"
                                        value={Math.round(prospects.length * 1.5)}
                                        label="Invitations envoyées"
                                        color="#00A0DC"
                                    />
                                    <StatCard
                                        icon="✉️"
                                        value={Math.round(prospects.length * 0.8)}
                                        label="Messages envoyés"
                                        color="#0066FF"
                                    />
                                    <StatCard
                                        icon="🤝"
                                        value={Math.round(prospects.length * 0.6)}
                                        label="Connexions réalisées"
                                        color="#0A66C2"
                                    />
                                </div>

                                <div className="stat-chart">
                                    <Line data={chartData} />
                                </div>
                            </section>
                        )}

                        <div className="sections-control">
                            <div className="control-buttons">
                                <button
                                    className={`section-toggle ${showProspects ? 'active' : ''}`}
                                    onClick={() => setShowProspects(!showProspects)}
                                >
                                    {showProspects ? '➖' : '➕'} Prospects
                                </button>
                                <button
                                    className={`section-toggle ${showStats ? 'active' : ''}`}
                                    onClick={() => setShowStats(!showStats)}
                                >
                                    {showStats ? '➖' : '➕'} Statistiques
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;