import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';
import Settings from './Settings';
import LogoLight from '../assets/logo-light.png';
import LogoDark from '../assets/logo-dark.png';
import StatCard from './StatCard';
import ProspectListWidget from './ProspectListWidget';
import NotificationCenter from './NotificationCenter';
import CreateCampaignModal from './CreateCampaignModal';
import { useTheme } from '../hooks/useTheme';
import DashboardStats from './DashboardStats';

import {
    Home,
    FileText,
    Users,
    Package,
    MessageCircle,
    Settings as SettingsIcon,
    HelpCircle,
    LogOut,
    Sun,
    Moon,
    Bell,
    RefreshCw,
    Search
} from 'lucide-react';

const NavItem = ({ icon, label, active, badge }) => (
    <div className={`nav-item ${active ? 'active' : ''}`}>
        <span className="nav-icon">{icon}</span>
        <span className="nav-label">{label}</span>
        {badge && <span className="badge">{badge}</span>}
    </div>
);

const Dashboard = () => {
    const { isDarkMode, toggleTheme } = useTheme();
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
    const [prospects, setProspects] = useState([]);
    const [showProspects, setShowProspects] = useState(true);
    const [showStats, setShowStats] = useState(true);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const menuRef = useRef(null);

    // API calls
    const api = axios.create({
        baseURL: 'http://localhost:5001/api',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    const fetchCampaigns = async () => {
        try {
            const response = await api.get('/campaigns');
            if (response.data.success) {
                setCampaigns(response.data.campaigns);
            }
        } catch (error) {
            console.error("Erreur chargement campagnes:", error);
        }
    };

    const fetchUserData = async () => {
        try {
            const response = await api.get('/auth/user');
            if (response.data) {
                setUserData({
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    avatar: response.data.avatar
                });
            }
        } catch (error) {
            console.error('Erreur récupération données:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchProspects = async () => {
        try {
            const response = await api.get('/prospects');
            if (response.data.success) {
                setProspects(response.data.prospects);
            }
        } catch (error) {
            console.error("Erreur chargement prospects:", error);
        }
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

    const toggleMenu = () => setShowMenu(!showMenu);

    const handleShowSettings = () => {
        setShowSettings(true);
        setShowMenu(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        fetchUserData();
        fetchProspects();
        fetchCampaigns();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Chargement du tableau de bord...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <p>{error}</p>
                <button onClick={handleRefreshData} className="retry-button">
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className={`dashboard-layout ${isDarkMode ? 'dark' : ''}`}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo-container">
                    <img src={isDarkMode ? LogoDark : LogoLight} alt="Logo" className="logo" />
                </div>

                <nav className="nav-menu">
                    <NavItem icon={<Home size={20} />} label="Dashboard" active />
                    <NavItem icon={<Users size={20} />} label="Prospects" />
                    <NavItem icon={<FileText size={20} />} label="Campaigns" />
                    <NavItem icon={<MessageCircle size={20} />} label="Messages" badge="2" />
                    <NavItem icon={<Package size={20} />} label="Products" />
                    <NavItem icon={<SettingsIcon size={20} />} label="Settings" />
                    <NavItem icon={<HelpCircle size={20} />} label="Help" />
                </nav>

                <button className="logout-button" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {showSettings ? (
                    <Settings onBack={() => setShowSettings(false)} userData={userData} />
                ) : (
                    <>
                        {/* Header */}
                        <header className="main-header">
                            <div className="search-container">
                                <Search className="search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="search-input"
                                />
                            </div>

                            <div className="header-actions">
                                <button
                                    className="campaign-button"
                                    onClick={() => setShowCampaignModal(true)}
                                >
                                    Démarrer une campagne
                                </button>
                                <NotificationCenter />
                                <div className="user-profile" onClick={toggleMenu} ref={menuRef}>
                                    <img
                                        src={userData.avatar}
                                        alt="Avatar"
                                        className="user-avatar"
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`;
                                        }}
                                    />
                                    <div className="user-info">
                                        <span className="user-name">
                                            {userData.firstName} {userData.lastName}
                                        </span>
                                        <span className="user-role">Sales Admin</span>
                                    </div>

                                    {showMenu && (
                                        <div className="user-menu">
                                            <button className="menu-item" onClick={handleShowSettings}>
                                                <SettingsIcon size={16} />
                                                Paramètres
                                            </button>
                                            <button className="menu-item" onClick={handleRefreshData}>
                                                <RefreshCw size={16} />
                                                Rafraîchir
                                            </button>
                                            <button className="menu-item" onClick={toggleTheme}>
                                                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                                                {isDarkMode ? 'Mode clair' : 'Mode sombre'}
                                            </button>
                                            <button className="menu-item logout" onClick={handleLogout}>
                                                <LogOut size={16} />
                                                Déconnexion
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        <div className="dashboard-sections">
                            {showStats && (
                                <section className="statistics">
                                    <DashboardStats prospects={prospects} />
                                </section>
                            )}

                            {showProspects && (
                                <section className="prospects-section">
                                    <h3>👥 Gestion des Prospects</h3>
                                    <ProspectListWidget
                                        prospects={prospects}
                                        onProspectsUpdate={setProspects}
                                        onRefresh={handleRefreshData}
                                    />
                                </section>
                            )}
                        </div>

                        {showCampaignModal && (
                            <CreateCampaignModal
                                onClose={() => setShowCampaignModal(false)}
                                onSuccess={fetchCampaigns}
                            />
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
            </main>
        </div>
    );
};

export default Dashboard;