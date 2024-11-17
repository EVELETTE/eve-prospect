import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Pour redirection
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' ou 'error'
    const navigate = useNavigate(); // Hook pour redirection

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/api/auth/forgot-password', { email });
            setMessage('Un email de réinitialisation a été envoyé.');
            setMessageType('success');

            // Redirection après succès
            setTimeout(() => {
                navigate('/login'); // Redirige vers la page login après 3 secondes
            }, 3000);
        } catch (err) {
            setMessage('Erreur lors de la demande de réinitialisation.');
            setMessageType('error');
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
                {message && (
                    <div className={`message ${messageType}`}>
                        <span className="icon">{messageType === 'success' ? '✅' : '❌'}</span>
                        {message}
                    </div>
                )}
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
            </div>
        </div>
    );
};

export default ForgotPassword;
