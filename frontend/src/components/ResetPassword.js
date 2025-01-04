import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Check, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        password: false,
        confirm: false
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        checkPasswordStrength(formData.password);
    }, [formData.password]);

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^A-Za-z0-9]/)) strength++;
        setPasswordStrength(strength);
    };

    const getStrengthColor = () => {
        switch (passwordStrength) {
            case 0: return 'bg-red-600';
            case 1: return 'bg-orange-500';
            case 2: return 'bg-yellow-500';
            case 3: return 'bg-blue-500';
            case 4: return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setMessage('Les mots de passe ne correspondent pas');
            setMessageType('error');
            setLoading(false);
            return;
        }

        try {
            await axios.post(`http://localhost:5001/api/auth/reset-password/${token}`, {
                password: formData.password,
            });

            setMessage('Mot de passe réinitialisé avec succès !');
            setMessageType('success');

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
            setMessage(err.response?.data?.message || 'Erreur lors de la réinitialisation');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <Lock className="mx-auto h-12 w-12 text-blue-500" />
                    <h2 className="text-2xl font-bold text-white">
                        Réinitialiser le mot de passe
                    </h2>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                        messageType === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
                    }`}>
                        {messageType === 'success' ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            <AlertCircle className="h-5 w-5" />
                        )}
                        <span>{message}</span>
                        {messageType === 'success' && (
                            <span className="text-sm ml-2">
                                (Redirection dans {countdown}s)
                            </span>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400">Nouveau mot de passe</label>
                            <div className="relative mt-1">
                                <input
                                    type={showPasswords.password ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        password: e.target.value
                                    })}
                                    required
                                    className="w-full p-3 pr-10 rounded-lg bg-gray-700 text-white
                                             placeholder-gray-400 border border-gray-600
                                             focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                    onClick={() => togglePasswordVisibility('password')}
                                >
                                    {showPasswords.password ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <div className="mt-2">
                                <div className="h-1 w-full bg-gray-700 rounded">
                                    <div
                                        className={`h-1 rounded transition-all ${getStrengthColor()}`}
                                        style={{ width: `${passwordStrength * 25}%` }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-400">
                                    Force du mot de passe: {
                                    passwordStrength === 0 ? 'Très faible' :
                                        passwordStrength === 1 ? 'Faible' :
                                            passwordStrength === 2 ? 'Moyen' :
                                                passwordStrength === 3 ? 'Fort' : 'Très fort'
                                }
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400">Confirmer le mot de passe</label>
                            <div className="relative mt-1">
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        confirmPassword: e.target.value
                                    })}
                                    required
                                    className="w-full p-3 pr-10 rounded-lg bg-gray-700 text-white
                                             placeholder-gray-400 border border-gray-600
                                             focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                >
                                    {showPasswords.confirm ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 bg-blue-600 hover:bg-blue-500 text-white 
                                 font-semibold rounded-lg transition-colors duration-200 
                                 flex items-center justify-center space-x-2
                                 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin h-5 w-5" />
                                <span>Réinitialisation...</span>
                            </>
                        ) : (
                            'Réinitialiser le mot de passe'
                        )}
                    </button>
                </form>

                <div className="text-sm text-gray-400 text-center">
                    <p>Le lien de réinitialisation expire après 1 heure.</p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;