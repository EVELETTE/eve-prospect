import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';
import LogoDark from '../assets/logo-dark.png';

const Register = () => {
    const [formData, setFormData] = useState({
        prenom: '',
        nom: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({
        text: '',
        type: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        password: false,
        confirmPassword: false
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Réinitialiser le message d'erreur quand l'utilisateur commence à taper
        if (message.text) {
            setMessage({ text: '', type: '' });
        }
    };

    const validateForm = () => {
        if (!formData.prenom.trim() || !formData.nom.trim()) {
            setMessage({
                text: 'Veuillez remplir tous les champs',
                type: 'error'
            });
            return false;
        }

        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setMessage({
                text: 'Veuillez entrer une adresse email valide',
                type: 'error'
            });
            return false;
        }

        if (formData.password.length < 8) {
            setMessage({
                text: 'Le mot de passe doit contenir au moins 8 caractères',
                type: 'error'
            });
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage({
                text: 'Les mots de passe ne correspondent pas',
                type: 'error'
            });
            return false;
        }

        return true;
    };

    const createNotification = async (token) => {
        try {
            await axios.post(
                'http://localhost:5001/api/notifications',
                {
                    title: 'Bienvenue sur Eve-Prospect ! 🎉',
                    message: `Bonjour ${formData.prenom}, nous sommes ravis de vous accueillir ! Pour commencer, configurez vos identifiants LinkedIn dans les paramètres.`,
                    type: 'success',
                    link: '/settings'
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
        } catch (error) {
            console.error('Erreur création notification:', error);
            throw new Error('Erreur lors de la création de la notification');
        }
    };

    const sendWelcomeEmail = async (token) => {
        try {
            await axios.post(
                'http://localhost:5001/api/auth/send-welcome-email',
                {
                    email: formData.email,
                    firstName: formData.prenom,
                    lastName: formData.nom
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
        } catch (error) {
            console.error('Erreur envoi email:', error);
            throw new Error('Erreur lors de l\'envoi de l\'email de bienvenue');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            // 1. Inscription
            const response = await axios.post('http://localhost:5001/api/auth/register', {
                firstName: formData.prenom,
                lastName: formData.nom,
                email: formData.email,
                password: formData.password,
            });

            if (response.data.token) {
                const token = response.data.token;
                localStorage.setItem('token', token);

                // 2. Envoi parallèle de la notification et de l'email
                await Promise.all([
                    createNotification(token),
                    sendWelcomeEmail(token)
                ]);

                setMessage({
                    text: 'Compte créé avec succès !',
                    type: 'success'
                });

                // 3. Redirection après un court délai
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (error) {
            console.error('Erreur inscription:', error);
            setMessage({
                text: error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4 py-8">
            <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
                <div className="flex flex-col items-center">
                    <img
                        src={LogoDark}
                        alt="Eve-Prospect Logo"
                        className="w-1/2 mb-6"
                    />
                    <h2 className="text-2xl font-bold text-white">Inscription</h2>
                    <p className="text-gray-400 text-sm">Rejoignez notre communauté</p>
                </div>

                {message.text && (
                    <div className={`flex items-center justify-center p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-800 text-green-100'
                            : 'bg-red-800 text-red-100'
                    }`}>
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <span>{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                type="text"
                                name="prenom"
                                placeholder="Prénom"
                                value={formData.prenom}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                name="nom"
                                placeholder="Nom"
                                value={formData.nom}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                            required
                        />
                    </div>

                    <div className="relative">
                        <input
                            type={showPasswords.password ? "text" : "password"}
                            name="password"
                            placeholder="Mot de passe"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('password')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                        >
                            {showPasswords.password ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showPasswords.confirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Confirmer le mot de passe"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                        >
                            {showPasswords.confirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors duration-200 
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Inscription en cours...
                            </div>
                        ) : "S'inscrire"}
                    </button>
                </form>

                <p className="text-center text-gray-400">
                    Vous avez déjà un compte ?{' '}
                    <a href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                        Connectez-vous
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Register;