import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';
import BellIcon from '../assets/bell-icon.svg';
import Settings from './Settings';
import LogoLight from '../assets/logo-light.png';
import LogoDark from '../assets/logo-dark.png';
import StatCard from './StatCard';
import ProspectListWidget from './ProspectListWidget';
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

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Dashboard = () => {
    const [avatar, setAvatar] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(true);
    const [selectedStat, setSelectedStat] = useState("Réponses à un message");
    const menuRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/auth/user', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setAvatar(
                    response.data.avatar || `https://ui-avatars.com/api/?name=${response.data.firstName}+${response.data.lastName}&background=random`
                );
                setFirstName(response.data.firstName);
                setLastName(response.data.lastName);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, []);

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setShowMenu(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleShowSettings = () => {
        setShowSettings(true);
        setShowMenu(false);
    };

    const handleShowDashboard = () => {
        setShowSettings(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Exemples de données de progression pour chaque statistique
    const statData = {
        "Réponses à un message": [5, 10, 15, 20, 25, 30, 35],
        "Invitations envoyées": [150, 200, 250, 300, 350, 400, 450],
        "Messages envoyés": [50, 75, 100, 125, 150, 175, 200],
        "Connexions réalisées": [10, 20, 30, 40, 50, 60, 70]
    };

    const chartData = {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [
            {
                label: `Progression pour ${selectedStat}`,
                data: statData[selectedStat] || [],
                borderColor: '#4a90e2',
                backgroundColor: '#4a90e233',
                fill: true,
                tension: 0.3
            }
        ]
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <img src={isDarkTheme ? LogoDark : LogoLight} alt="Eve-Prospect Logo" className="dashboard-logo" />
                <div className="header-actions">
                    <button className="start-campaign-btn">Démarrer une campagne</button>
                    <div className="notification-icon">
                        <span className="notification-count">1</span>
                        <img src={BellIcon} alt="Notifications" className="bell-icon" />
                    </div>
                    <div className="user-profile" onClick={toggleMenu} ref={menuRef}>
                        <img src={avatar} alt="User Avatar" className="header-user-avatar" />
                        <span className="user-name">{firstName} {lastName}</span>
                        <span className="dropdown-icon">▼</span>
                        <div className={`dropdown-menu ${showMenu ? 'open' : ''}`}>
                            <div className="menu-divider" />
                            <button className="menu-item" onClick={handleShowSettings}>Paramètres</button>
                            <button className="menu-item">Rafraîchir l'extension</button>
                            <button className="red-button" onClick={handleLogout}>Déconnexion</button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {showSettings ? (
                    <Settings onBack={handleShowDashboard} />
                ) : (
                    <>
                        <section className="statistics">
                            <h3>Statistiques</h3>
                            <div className="stat-box">
                                <StatCard
                                    icon={BellIcon}
                                    value={0}
                                    label="Réponses à un message"
                                    color="#4a90e2"
                                    onClick={() => setSelectedStat("Réponses à un message")}
                                />
                                <StatCard
                                    icon={BellIcon}
                                    value={150}
                                    label="Invitations envoyées"
                                    color="#28a745"
                                    onClick={() => setSelectedStat("Invitations envoyées")}
                                />
                                <StatCard
                                    icon={BellIcon}
                                    value={75}
                                    label="Messages envoyés"
                                    color="#17a2b8"
                                    onClick={() => setSelectedStat("Messages envoyés")}
                                />
                                <StatCard
                                    icon={BellIcon}
                                    value={35}
                                    label="Connexions réalisées"
                                    color="#ffc107"
                                    onClick={() => setSelectedStat("Connexions réalisées")}
                                />
                            </div>

                            <div className="stat-chart">
                                <h4>{`Progression pour ${selectedStat}`}</h4>
                                <Line data={chartData}/>
                            </div>
                        </section>

                        {/* Widget pour l'import et la gestion des listes de prospects */}
                        <section className="prospect-list-widget">
                            <h3>Gestion des Prospects</h3>
                            <ProspectListWidget/>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;