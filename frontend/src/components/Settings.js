// src/components/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = ({ onBack }) => {
    const [avatar, setAvatar] = useState('');
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/auth/user', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setAvatar(response.data.avatar || `https://avatars.dicebear.com/api/initials/${response.data.firstName}-${response.data.lastName}.svg`);
                setPrenom(response.data.firstName);
                setNom(response.data.lastName);
                setEmail(response.data.email);
            } catch (error) {
                console.error("Erreur lors de la récupération des données utilisateur:", error);
            }
        };

        fetchUserData();
    }, []);

    const handleUpdateProfile = async () => {
        try {
            await axios.put(
                'http://localhost:5001/api/auth/update-profile',
                { firstName: prenom, lastName: nom },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setMessage('Profil mis à jour avec succès');
        } catch (error) {
            setMessage('Échec de la mise à jour du profil');
            console.error("Erreur lors de la mise à jour du profil:", error);
        }
    };

    const handleDeleteAvatar = async () => {
        try {
            // Supprime l'avatar côté serveur
            const response = await axios.put(
                'http://localhost:5001/api/auth/delete-avatar',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            // Met à jour l'avatar avec une image générée
            setAvatar(response.data.generatedAvatar);
            setMessage('Avatar supprimé et remplacé par une image générée');
        } catch (error) {
            setMessage('Erreur lors de la suppression de l\'avatar');
            console.error("Erreur lors de la suppression de l'avatar:", error);
        }
    };

    return (
        <div className="settings-container">
            <button onClick={onBack} className="back-btn">Retour</button>
            <div className="profile-content">
                <h3>Profil public</h3>
                <div className="profile-section">
                    <img src={avatar} alt="Avatar utilisateur" className="setting-user-avatar" />
                    <div className="avatar-buttons">
                        <label className="change-avatar-btn">
                            Changer de photo
                            <input type="file" onChange={(e) => setAvatar(e.target.files[0])} hidden />
                        </label>
                        <button className="delete-avatar-btn" onClick={handleDeleteAvatar}>Supprimer la photo</button>
                    </div>
                </div>

                <div className="user-details">
                    <div>
                        <label>Prénom</label>
                        <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                    </div>
                    <div>
                        <label>Nom</label>
                        <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} />
                    </div>
                    <div>
                        <label>Email</label>
                        <input type="text" value={email} readOnly />
                    </div>
                </div>
                <button onClick={handleUpdateProfile} className="update-btn">Mettre à jour le profil</button>
                {message && <p className="confirmation-message">{message}</p>}
            </div>
        </div>
    );
};

export default Settings;
