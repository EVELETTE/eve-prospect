import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = ({ onBack }) => {
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        avatar: ''
    });
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' }); // Ajout du type pour le style
    const [loading, setLoading] = useState(true);
    const [originalEmail, setOriginalEmail] = useState('');

    // 🔄 Fonction pour obtenir les données utilisateur
    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('❌ Aucun token trouvé');
                window.location.href = '/login';
                return;
            }

            // Utilisation de la route user au lieu de verify-token
            const response = await axios.get('http://localhost:5001/api/auth/user', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Réponse du serveur:', response.data); // Debug

            if (response.data) {
                const userData = {
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    // Gestion spéciale pour l'avatar avec vérification de l'URL
                    avatar: response.data.avatar
                };
                setUserData(userData);
                setOriginalEmail(response.data.email || '');
                console.log('✅ Données utilisateur chargées');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des données:', error);
            if (error.response?.status === 401) {
                console.log('❌ Token invalide');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    // 📧 Gestion de la mise à jour de l'email
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
            showMessage(error.response?.data?.message || '❌ Erreur lors de la mise à jour de l\'email', 'error');
            setUserData(prev => ({ ...prev, email: originalEmail }));
        }
    };

    // 🖼️ Gestion du changement de photo
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Vérification de la taille et du type du fichier
        if (file.size > 5 * 1024 * 1024) {
            showMessage('❌ L\'image ne doit pas dépasser 5MB', 'error');
            return;
        }

        if (!file.type.match('image.*')) {
            showMessage('❌ Seules les images sont autorisées', 'error');
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
                setUserData(prev => ({
                    ...prev,
                    avatar: response.data.avatar
                }));
                showMessage('✅ Photo mise à jour avec succès', 'success');
            }
        } catch (error) {
            showMessage('❌ Erreur lors de la mise à jour de la photo', 'error');
        }
    };

    // 🗑️ Gestion de la suppression de photo
    const handleDeletePhoto = async () => {
        try {
            const response = await axios.put(
                'http://localhost:5001/api/auth/delete-avatar',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setUserData(prev => ({
                    ...prev,
                    avatar: response.data.generatedAvatar
                }));
                showMessage('✅ Photo supprimée avec succès', 'success');
            }
        } catch (error) {
            showMessage('❌ Erreur lors de la suppression de la photo', 'error');
        }
    };

    // ✨ Fonction utilitaire pour afficher les messages
    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    // ↩️ Annulation de la modification de l'email
    const cancelEmailEdit = () => {
        setUserData(prev => ({
            ...prev,
            email: originalEmail
        }));
        setIsEditingEmail(false);
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

            <div className="settings-content">
                <section className="photo-section">
                    <h3>Photo de profil</h3>
                    <div className="avatar-container">
                        <img
                            src={userData.avatar}
                            alt="Avatar"
                            className="profile-avatar"
                            onError={(e) => {
                                e.target.onerror = null;
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
                                    <button
                                        onClick={handleEmailUpdate}
                                        className="save-btn"
                                    >
                                        ✅ Sauvegarder
                                    </button>
                                    <button
                                        onClick={cancelEmailEdit}
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