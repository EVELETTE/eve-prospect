import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = ({ onBack }) => {
    const [avatar, setAvatar] = useState('');
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
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

    const handleEmailEdit = () => {
        setIsEditingEmail(true);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await axios.put('http://localhost:5001/api/auth/update-avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setAvatar(response.data.avatar); // Met à jour l'avatar avec la nouvelle URL
            setMessage('Avatar mis à jour avec succès');
        } catch (error) {
            setMessage('Échec de la mise à jour de l\'avatar');
            console.error("Erreur lors de la mise à jour de l'avatar:", error);
        }
    };

    const handleDeleteAvatar = async () => {
        try {
            await axios.put(
                'http://localhost:5001/api/auth/delete-avatar',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setAvatar(`https://avatars.dicebear.com/api/initials/${prenom}-${nom}.svg`); // Remet un avatar par défaut
            setMessage('Avatar supprimé avec succès');
        } catch (error) {
            setMessage('Échec de la suppression de l\'avatar');
            console.error("Erreur lors de la suppression de l'avatar:", error);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await axios.put(
                'http://localhost:5001/api/auth/update-profile',
                { firstName: prenom, lastName: nom, email },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setMessage('Profil mis à jour avec succès');
            setIsEditingEmail(false); // Arrête l'édition de l'email après la mise à jour
        } catch (error) {
            setMessage('Échec de la mise à jour du profil');
            console.error("Erreur lors de la mise à jour du profil:", error);
        }
    };

    return (
        <div className="settings-container">
            <button onClick={onBack} className="back-btn">Retour</button>
            <div className="profile-content">
                <h3>Profil public</h3>
                <div className="profile-section">
                    <img src={avatar} alt="Avatar utilisateur" className="user-avatar" />
                    <div className="avatar-buttons">
                        <label className="change-avatar-btn">
                            Changer de photo
                            <input type="file" onChange={handleAvatarChange} hidden />
                        </label>
                        <button className="delete-avatar-btn" onClick={handleDeleteAvatar}>Supprimer la photo</button>
                    </div>
                </div>

                <div className="user-details">
                    <div>
                        <label>Prénom</label>
                        <p>{prenom}</p>
                    </div>
                    <div>
                        <label>Nom</label>
                        <p>{nom}</p>
                    </div>
                    <div>
                        <label>Email</label>
                        {isEditingEmail ? (
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        ) : (
                            <p>{email}</p>
                        )}
                        {!isEditingEmail && (
                            <button onClick={handleEmailEdit} className="edit-email-btn">Modifier l'email</button>
                        )}
                    </div>
                </div>
                <button onClick={handleUpdateProfile} className="update-btn">Mettre à jour le profil</button>
                {message && <p className="confirmation-message">{message}</p>}
            </div>
        </div>
    );
};

export default Settings;
