import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5001/api/auth/forgot-password', { email });
            setMessage('Un email de réinitialisation a été envoyé.');
            setMessageType('success');

            // Countdown for redirection
            let count = 3;
            const timer = setInterval(() => {
                count -= 1;
                setCountdown(count);
                if (count === 0) {
                    clearInterval(timer);
                    navigate('/login');
                }
            }, 1000);

        } catch (err) {
            setMessage('Erreur lors de la demande de réinitialisation.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-900 items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="space-y-2 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <h2 className="text-2xl font-bold text-white">
                        Mot de passe oublié
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Entrez votre email pour recevoir un lien de réinitialisation
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg flex items-center justify-center space-x-2 ${
                        messageType === 'success'
                            ? 'bg-green-800 text-green-100'
                            : 'bg-red-800 text-red-100'
                    } animate-fade-in`}>
                        <span>{messageType === 'success' ? '✅' : '❌'}</span>
                        <span>{message}</span>
                        {messageType === 'success' && (
                            <span className="text-sm">
                                (Redirection dans {countdown}s)
                            </span>
                        )}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            placeholder="Votre adresse email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400
                                     border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                                     transition-all outline-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold 
                                     rounded-lg transition-colors duration-200 flex items-center justify-center
                                     ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                'Envoyer le lien'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold
                                     rounded-lg transition-colors duration-200"
                        >
                            Annuler
                        </button>
                    </div>
                </form>

                {/* Security Notice */}
                <div className="text-center text-sm text-gray-400">
                    <p>
                        Pour des raisons de sécurité, le lien de réinitialisation expire après 1 heure.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;