import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LogoDark from '../assets/logo-dark.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/api/auth/login', {
                email,
                password,
            });

            const token = response.data.token;
            localStorage.setItem('token', token);
            window.postMessage({ type: 'SET_TOKEN', token }, '*');

            setMessage('Connexion réussie !');
            setMessageType('success');
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Email ou mot de passe incorrect.');
            setMessageType('error');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl">
                <img
                    src={LogoDark}
                    alt="Eve-Prospect Logo"
                    className="w-1/2 mx-auto mb-6"
                />
                <h2 className="text-2xl font-bold text-white text-center mb-2">Connexion</h2>
                <p className="text-gray-400 text-center mb-6">
                    Restez informé de votre monde professionnel
                </p>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg text-center ${
                        messageType === 'success'
                            ? 'bg-green-800 text-green-100'
                            : 'bg-red-800 text-red-100'
                    }`}>
                        {messageType === 'success'}
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="email"
                            placeholder="Email ou téléphone"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="text-right">
                        <a href="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
                            Mot de passe oublié ?
                        </a>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors duration-200"
                    >
                        Se connecter
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-gray-400">
                        <span className="px-4 bg-gray-800">OU</span>
                    </div>
                </div>

                <button className="w-full py-3 bg-black hover:bg-gray-900 text-white font-bold rounded-lg mb-6 transition-colors duration-200">
                    Se connecter avec Apple
                </button>

                <p className="text-center text-gray-400">
                    Nouveau sur notre plateforme ?{' '}
                    <a href="/register" className="text-blue-400 hover:text-blue-300">
                        Inscrivez-vous
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;