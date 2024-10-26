// src/components/Dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';
import BellIcon from '../assets/bell-icon.svg';
import Settings from './Settings';

const Dashboard = () => {
    const [avatar, setAvatar] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const menuRef = useRef(null); // Référence pour le menu

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/auth/user', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setAvatar(response.data.avatar || `https://avatars.dicebear.com/api/initials/${response.data.firstName}-${response.data.lastName}.svg`);
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
            setShowMenu(false); // Ferme le menu si clic à l'extérieur
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

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-actions">
                    <button className="start-campaign-btn">Démarrer une campagne</button>
                    <div className="notification-icon">
                        <span className="notification-count">1</span>
                        <img src={BellIcon} alt="Notifications" className="bell-icon" />
                    </div>
                    <div className="user-profile" onClick={toggleMenu} ref={menuRef}>
                        <img src={avatar} alt="User Avatar" className="user-avatar" />
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
                    <div>
                        <section className="campaign-overview">
                            <h3>Your Campaigns</h3>
                            <p>Manage your LinkedIn campaigns easily.</p>
                            <button className="dashboard-btn">Create a New Campaign</button>
                        </section>

                        <section className="statistics">
                            <h3>Statistics</h3>
                            <div className="stat-box">
                                <div>
                                    <h4>Invitations Sent</h4>
                                    <p>150</p>
                                </div>
                                <div>
                                    <h4>Messages Sent</h4>
                                    <p>75</p>
                                </div>
                                <div>
                                    <h4>Connections Made</h4>
                                    <p>35</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
