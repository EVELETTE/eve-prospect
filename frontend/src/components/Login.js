import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import LogoLight from '../assets/logo-light.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/api/auth/login', {
                email,
                password
            });

            const token = response.data.token;

            // Stocker le token dans localStorage
            localStorage.setItem('token', token);

            // Envoyer le token au plugin via postMessage
            window.postMessage({ type: 'SET_TOKEN', token }, '*');

            // Rediriger vers le tableau de bord
            navigate('/dashboard');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Échec de la connexion');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <img src={LogoLight} alt="Eve-Prospect Logo" className="login-logo" />
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
                    <p className="forgot-password">
                        <a href="/forgot-password">Mot de passe oublié ?</a>
                    </p>
                    <button type="submit" className="login-btn">Se connecter</button>
                </form>
                <div className="or-section">
                    <span>OU</span>
                </div>
                <button className="apple-login-btn">Se connecter avec Apple</button>
                <p className="join-now">
                    Nouveau sur notre plateforme ? <a href="/register">Inscrivez-vous</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
