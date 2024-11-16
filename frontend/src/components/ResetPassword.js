import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { token } = useParams(); // Récupérer le token de l'URL
    const navigate = useNavigate(); // Pour redirection

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Vérification si les mots de passe correspondent
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            setMessage('');
            return;
        }

        try {
            // Requête pour réinitialiser le mot de passe avec le token
            const response = await axios.post(`http://localhost:5001/api/auth/reset-password/${token}`, {
                password,
            });

            setMessage('Mot de passe réinitialisé avec succès !');
            setError('');

            // Redirection après 3 secondes
            setTimeout(() => {
                navigate('/login'); // Redirection vers la page de connexion
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
            setMessage('');
        }
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-box">
                <h2>Réinitialiser le mot de passe</h2>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-field">
                        <input
                            type="password"
                            placeholder="Nouveau mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-field">
                        <input
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">Réinitialiser</button>
                </form>
                {message && (
                    <p className="redirect-message">
                        Vous serez redirigé vers la page de connexion sous peu...
                    </p>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
