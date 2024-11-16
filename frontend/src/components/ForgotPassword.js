import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Pour redirection
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Hook pour redirection

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/api/auth/forgot-password', { email });
            setMessage('Un email de réinitialisation a été envoyé.');
            setError('');

            // Redirection après succès
            setTimeout(() => {
                navigate('/login'); // Redirige vers la page login après 3 secondes
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la demande de réinitialisation.');
            setMessage('');
        }
    };

    const handleCancel = () => {
        navigate('/login'); // Redirige immédiatement vers la page de connexion
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-box">
                <h2>Mot de passe oublié</h2>
                <p>Entrez votre email pour recevoir un lien de réinitialisation.</p>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-field">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">Envoyer</button>
                </form>
                <button onClick={handleCancel} className="cancel-btn">
                    Annuler
                </button>
                {message && (
                    <p className="redirect-message">
                        Vous serez redirigé vers la page de connexion sous peu...
                    </p>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
