import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';
import LogoDark from '../assets/logo-dark.png';

const Register = () => {
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/api/auth/register', {
                firstName: prenom,
                lastName: nom,
                email,
                password,
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                navigate('/dashboard');
            } else {
                setMessage('Inscription réussie, mais aucun token fourni.');
            }
        } catch (error) {
            setMessage('Échec de l’inscription. Vérifiez vos informations.');
            console.error('Erreur lors de l’inscription:', error);
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <img src={LogoDark} alt="Eve-Prospect Logo" className="register-logo" />
                <h2>Inscription</h2>
                <p>Rejoignez-nous</p>
                {message && <p className="error-message">{message}</p>}
                <form onSubmit={handleRegister}>
                    <div className="input-field">
                        <input
                            type="text"
                            placeholder="Prénom"
                            value={prenom}
                            onChange={(e) => setPrenom(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-field">
                        <input
                            type="text"
                            placeholder="Nom"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-field">
                        <input
                            type="email"
                            placeholder="Email"
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
                    <button type="submit" className="register-btn">S'inscrire</button>
                </form>
                <p className="login-link">
                    Vous avez déjà un compte ? <a href="/login">Connectez-vous</a>
                </p>
            </div>
        </div>
    );
};

export default Register;
