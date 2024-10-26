import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Hook pour la redirection

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/api/auth/login', {
                email,
                password
            });

            // Stocker le token et rediriger vers le tableau de bord après connexion
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard'); // Redirige vers le tableau de bord
        } catch (error) {
            setMessage(error.response?.data?.message || 'Échec de la connexion');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Connexion</h2>
                <p>Restez informé de votre monde professionnel</p>
                {message && <p className="error-message">{message}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-field">
                        <input
                            type="email"
                            placeholder="Email ou téléphone"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-field">
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">Se connecter</button>
                </form>
                <p className="join-now">
                    Nouveau sur notre plateforme ? <a href="/register">Inscrivez-vous</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
