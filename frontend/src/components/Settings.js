import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        avatar: ''
    });
    const [linkedinCredentials, setLinkedinCredentials] = useState({
        email: '',
        password: '',
        isConnected: false
    });
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingLinkedinEmail, setIsEditingLinkedinEmail] = useState(false);
    const [isEditingLinkedinPassword, setIsEditingLinkedinPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [originalEmail, setOriginalEmail] = useState('');

    useEffect(() => {
        fetchUserData();
        fetchLinkedinCredentials();
    }, []);

    // 🔄 Fonction pour obtenir les données utilisateur
    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('❌ Aucun token trouvé');
                window.location.href = '/login';
                return;
            }

            const response = await axios.get('http://localhost:5001/api/auth/user', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                setUserData({
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    avatar: response.data.avatar
                });
                setOriginalEmail(response.data.email || '');
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    // 🔄 Fonction pour obtenir les credentials LinkedIn
    const fetchLinkedinCredentials = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/auth/linkedin-credentials', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setLinkedinCredentials({
                    email: response.data.email,
                    password: '••••••••',
                    isConnected: response.data.isConnected
                });
            }
        } catch (error) {
            console.error('❌ Erreur credentials LinkedIn:', error);
        }
    };

    // 📧 Update email
    const handleEmailUpdate = async () => {
        try {
            const response = await axios.put(
                'http://localhost:5001/api/auth/update-email',
                { email: userData.email },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                showMessage('✅ Email mis à jour avec succès', 'success');
                setIsEditingEmail(false);
                setOriginalEmail(userData.email);
            }
        } catch (error) {
            showMessage(error.response?.data?.message || '❌ Erreur', 'error');
            setUserData(prev => ({ ...prev, email: originalEmail }));
        }
    };

    // 🔗 Update LinkedIn Credentials
    const updateLinkedinCredentials = async (type) => {
        try {
            const response = await axios.post(
                'http://localhost:5001/api/auth/update-linkedin-credentials',
                { [type]: linkedinCredentials[type] },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                showMessage('✅ Paramètres LinkedIn mis à jour', 'success');
                if (type === 'email') setIsEditingLinkedinEmail(false);
                if (type === 'password') setIsEditingLinkedinPassword(false);
            }
        } catch (error) {
            showMessage('❌ Erreur mise à jour LinkedIn', 'error');
        }
    };

    // 🔄 Test LinkedIn Connection
    const testLinkedinConnection = async () => {
        try {
            setLoading(true);
            const response = await axios.post(
                'http://localhost:5001/api/auth/test-linkedin-connection',
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            if (response.data.success) {
                setLinkedinCredentials(prev => ({ ...prev, isConnected: true }));
                showMessage('✅ Connexion LinkedIn réussie', 'success');
            } else {
                showMessage('❌ Échec connexion LinkedIn', 'error');
            }
        } catch (error) {
            showMessage('❌ Erreur test connexion', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 🖼️ Photo handling
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showMessage('❌ Image trop grande (max 5MB)', 'error');
            return;
        }

        if (!file.type.match('image.*')) {
            showMessage('❌ Format non supporté', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await axios.put(
                'http://localhost:5001/api/auth/update-avatar',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setUserData(prev => ({ ...prev, avatar: response.data.avatar }));
                showMessage('✅ Photo mise à jour', 'success');
            }
        } catch (error) {
            showMessage('❌ Erreur mise à jour photo', 'error');
        }
    };

    const handleDeletePhoto = async () => {
        try {
            const response = await axios.put(
                'http://localhost:5001/api/auth/delete-avatar',
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            if (response.data.success) {
                setUserData(prev => ({ ...prev, avatar: response.data.generatedAvatar }));
                showMessage('✅ Photo supprimée', 'success');
            }
        } catch (error) {
            showMessage('❌ Erreur suppression photo', 'error');
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    if (loading) {
        return <div className="loading">🔄 Chargement...</div>;
    }

    return (
        <div className="settings-main">
            <button onClick={onBack} className="back-button">
                ← Retour
            </button>

            <h2>⚙️ Paramètres du compte</h2>

            <div className="settings-tabs">
                <button
                    className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    👤 Profil
                </button>
                <button
                    className={`tab-button ${activeTab === 'linkedin' ? 'active' : ''}`}
                    onClick={() => setActiveTab('linkedin')}
                >
                    🔗 LinkedIn
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'profile' && (
                    <>
                        <section className="photo-section">
                            <h3>Photo de profil</h3>
                            <div className="avatar-container">
                                <img
                                    src={userData.avatar}
                                    alt="Avatar"
                                    className="profile-avatar"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`;
                                    }}
                                />
                                <div className="avatar-buttons">
                                    <label className="photo-button primary">
                                        Changer de photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <button
                                        className="photo-button secondary"
                                        onClick={handleDeletePhoto}
                                    >
                                        Supprimer la photo
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="info-section">
                            <h3>Informations personnelles</h3>
                            <div className="info-field">
                                <label>Prénom</label>
                                <div className="info-value">{userData.firstName}</div>
                            </div>
                            <div className="info-field">
                                <label>Nom</label>
                                <div className="info-value">{userData.lastName}</div>
                            </div>
                            <div className="info-field">
                                <label>Email</label>
                                {isEditingEmail ? (
                                    <div className="email-edit">
                                        <input
                                            type="email"
                                            value={userData.email}
                                            onChange={(e) => setUserData(prev => ({
                                                ...prev,
                                                email: e.target.value
                                            }))}
                                            className="email-input"
                                        />
                                        <div className="email-buttons">
                                            <button onClick={handleEmailUpdate} className="save-btn">
                                                ✅ Sauvegarder
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setUserData(prev => ({ ...prev, email: originalEmail }));
                                                    setIsEditingEmail(false);
                                                }}
                                                className="cancel-btn"
                                            >
                                                ❌ Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="info-value-with-button">
                                        <div className="info-value">{userData.email}</div>
                                        <button
                                            onClick={() => setIsEditingEmail(true)}
                                            className="modify-button"
                                        >
                                            Modifier
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}

                {activeTab === 'linkedin' && (
                    <section className="linkedin-section">
                        <h3>Paramètres LinkedIn</h3>
                        <div className="info-field">
                            <label>Email LinkedIn</label>
                            {isEditingLinkedinEmail ? (
                                <div className="email-edit">
                                    <input
                                        type="email"
                                        value={linkedinCredentials.email}
                                        onChange={(e) => setLinkedinCredentials(prev => ({
                                            ...prev,
                                            email: e.target.value
                                        }))}
                                        className="email-input"
                                        placeholder="Votre email LinkedIn"
                                    />
                                    <div className="email-buttons">
                                        <button
                                            onClick={() => updateLinkedinCredentials('email')}
                                            className="save-btn"
                                        >
                                            ✅ Sauvegarder
                                        </button>
                                        <button
                                            onClick={() => setIsEditingLinkedinEmail(false)}
                                            className="cancel-btn"
                                        >
                                            ❌ Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-value-with-button">
                                    <div className="info-value">
                                        {linkedinCredentials.email || 'Non configuré'}
                                    </div>
                                    <button
                                        onClick={() => setIsEditingLinkedinEmail(true)}
                                        className="modify-button"
                                    >
                                        Modifier
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="info-field">
                            <label>Mot de passe LinkedIn</label>
                            {isEditingLinkedinPassword ? (
                                <div className="password-edit">
                                    <input
                                        type="password"
                                        value={linkedinCredentials.password}
                                        onChange={(e) => setLinkedinCredentials(prev => ({
                                            ...prev,
                                            password: e.target.value
                                        }))}
                                        className="password-input"
                                        placeholder="Votre mot de passe LinkedIn"
                                    />
                                    <div className="password-buttons">
                                        <button
                                            onClick={() => updateLinkedinCredentials('password')}
                                            className="save-btn"
                                        >
                                            ✅ Sauvegarder
                                        </button>
                                        <button
                                            onClick={() => setIsEditingLinkedinPassword(false)}
                                            className="cancel-btn"
                                        >
                                            ❌ Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-value-with-button">
                                    <div className="info-value">••••••••</div>
                                    <button
                                        onClick={() => setIsEditingLinkedinPassword(true)}
                                        className="modify-button"
                                    >
                                        Modifier
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="connection-status">
                            <p>
                                Statut de la connexion:
                                <span className={`status-badge ${linkedinCredentials.isConnected ? 'connected' : 'disconnected'}`}>
                                    {linkedinCredentials.isConnected ? '🟢 Connecté' : '🔴 Non connecté'}
                                </span>
                            </p>
                            <button
                                onClick={testLinkedinConnection}
                                className="test-connection-btn"
                                disabled={loading}
                            >
                                {loading ? '🔄 Test en cours...' : '🔄 Tester la connexion'}
                            </button>
                        </div>

                        <div className="info-notification">
                            <p className="info-text">
                                ℹ️ Ces identifiants seront utilisés uniquement pour automatiser les actions LinkedIn.
                                Vos données sont chiffrées et stockées de manière sécurisée.
                            </p>
                        </div>
                    </section>
                )}

                {message.text && (
                    <div className={`message-banner ${message.type}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
