// Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
    // États
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        avatar: ''
    });
    const [linkedinCredentials, setLinkedinCredentials] = useState({
        email: '',
        password: '',
        isConnected: false
    });
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingLinkedinEmail, setIsEditingLinkedinEmail] = useState(false);
    const [isEditingLinkedinPassword, setIsEditingLinkedinPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [originalEmail, setOriginalEmail] = useState('');
    const [testingConnection, setTestingConnection] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState(null);

    // Référence pour l'input file
    const fileInputRef = React.createRef();

    // Effets
    useEffect(() => {
        fetchUserData();
        fetchLinkedinCredentials();
    }, []);

    // Fonctions
    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await axios.get('http://localhost:5001/api/auth/user', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                setUserData({
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    avatar: response.data.avatar
                });
                setOriginalEmail(response.data.email || '');
            }
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLinkedinCredentials = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/auth/linkedin-credentials', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setLinkedinCredentials({
                    email: response.data.email,
                    password: '••••••••',
                    isConnected: response.data.isConnected
                });
            }
        } catch (error) {
            showMessage('Erreur lors de la récupération des identifiants LinkedIn', 'error');
        }
    };

    const handleEmailUpdate = async () => {
        try {
            const response = await axios.put(
                'http://localhost:5001/api/auth/update-email',
                { email: userData.email },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                showMessage('Email mis à jour avec succès', 'success');
                setIsEditingEmail(false);
                setOriginalEmail(userData.email);
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Erreur', 'error');
            setUserData(prev => ({ ...prev, email: originalEmail }));
        }
    };

    const updateLinkedinCredentials = async (type) => {
        try {
            const credential = linkedinCredentials[type];
            if (!credential || credential === '••••••••') {
                showMessage('Veuillez entrer une valeur valide', 'error');
                return;
            }

            const response = await axios.post(
                'http://localhost:5001/api/auth/update-linkedin-credentials',
                { [type]: credential },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                showMessage('Identifiants LinkedIn mis à jour', 'success');
                if (type === 'email') setIsEditingLinkedinEmail(false);
                if (type === 'password') setIsEditingLinkedinPassword(false);
                setLinkedinCredentials(prev => ({
                    ...prev,
                    isConnected: false
                }));
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Erreur', 'error');
        }
    };

    //  Test LinkedIn Connection

    const testLinkedinConnection = async () => {
        try {
            setTestingConnection(true);

            // Vérifier d'abord si les credentials sont présents
            if (!linkedinCredentials.email || !linkedinCredentials.password) {
                showMessage('❌ Veuillez d\'abord configurer vos identifiants LinkedIn', 'error');
                return;
            }

            const token = localStorage.getItem('token');

            // Premier appel pour vérifier/créer la session du bot
            await axios.post(
                'http://localhost:5001/api/linkedin/initialize-bot',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Deuxième appel pour tester la connexion
            const response = await axios.post(
                'http://localhost:5001/api/linkedin/test-connection',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 120000 // 2 minutes de timeout
                }
            );

            if (response.data.success) {
                setLinkedinCredentials(prev => ({
                    ...prev,
                    isConnected: true
                }));
                setLastCheckTime(new Date());
                showMessage('✅ Connexion LinkedIn réussie', 'success');

                // Actualiser les credentials après succès
                fetchLinkedinCredentials();
            } else {
                handleConnectionFailure(response.data.message);
            }

        } catch (error) {
            handleConnectionFailure(error);
        } finally {
            setTestingConnection(false);
        }
    };
    //fonction de gestion des erreurs de connexion
    const handleConnectionFailure = (error) => {
        setLinkedinCredentials(prev => ({
            ...prev,
            isConnected: false
        }));

        let errorMessage = '❌ Erreur lors du test de connexion';

        if (error?.response?.data?.message) {
            errorMessage = `❌ ${error.response.data.message}`;
        } else if (error?.message?.includes('timeout')) {
            errorMessage = '❌ Le test de connexion a pris trop de temps';
        } else if (error?.message?.includes('Network Error')) {
            errorMessage = '❌ Erreur réseau. Vérifiez votre connexion internet';
        } else if (typeof error === 'string') {
            errorMessage = `❌ ${error}`;
        }

        showMessage(errorMessage, 'error');
        console.error('Détails de l\'erreur:', error);
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showMessage('Image trop grande (max 5MB)', 'error');
            return;
        }

        if (!file.type.match('image.*')) {
            showMessage('Format non supporté', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await axios.put(
                'http://localhost:5001/api/auth/update-avatar',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setUserData(prev => ({ ...prev, avatar: response.data.avatar }));
                showMessage('Photo mise à jour', 'success');
            }
        } catch (error) {
            showMessage('Erreur lors de la mise à jour de la photo', 'error');
        }
    };

    const handleDeletePhoto = async () => {
        try {
            const response = await axios.put(
                'http://localhost:5001/api/auth/delete-avatar',
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            if (response.data.success) {
                setUserData(prev => ({ ...prev, avatar: response.data.generatedAvatar }));
                showMessage('Photo supprimée', 'success');
            }
        } catch (error) {
            showMessage('Erreur lors de la suppression de la photo', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
                Paramètres du compte
            </h1>

            {/* Section Informations personnelles avec photo intégrée */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                    Informations personnelles
                </h2>

                {/* Section photo */}
                <div className="flex items-center space-x-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <img
                        src={userData.avatar}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                        onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`;
                        }}
                    />
                    <div className="space-y-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                        >
                            Changer la photo
                        </button>
                        <button
                            onClick={handleDeletePhoto}
                            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            Supprimer la photo
                        </button>
                    </div>
                </div>
            </div>

            {/* Section Informations personnelles */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                    Informations personnelles
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Prénom
                        </label>
                        <p className="text-gray-900 dark:text-white">{userData.firstName}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nom
                        </label>
                        <p className="text-gray-900 dark:text-white">{userData.lastName}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        {isEditingEmail ? (
                            <div className="flex space-x-3">
                                <input
                                    type="email"
                                    value={userData.email}
                                    onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <button
                                    onClick={handleEmailUpdate}
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                                >
                                    Sauvegarder
                                </button>
                                <button
                                    onClick={() => {
                                        setUserData(prev => ({ ...prev, email: originalEmail }));
                                        setIsEditingEmail(false);
                                    }}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <p className="text-gray-900 dark:text-white">{userData.email}</p>
                                <button
                                    onClick={() => setIsEditingEmail(true)}
                                    className="text-primary hover:text-primary-dark transition-colors"
                                >
                                    Modifier
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section LinkedIn */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                    Paramètres LinkedIn
                </h2>
                <div className="space-y-6">
                    {/* Email LinkedIn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email LinkedIn
                        </label>
                        {isEditingLinkedinEmail ? (
                            <div className="flex space-x-3">
                                <input
                                    type="email"
                                    value={linkedinCredentials.email}
                                    onChange={(e) => setLinkedinCredentials(prev => ({
                                        ...prev,
                                        email: e.target.value
                                    }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Votre email LinkedIn"
                                />
                                <button
                                    onClick={() => updateLinkedinCredentials('email')}
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                                >
                                    Sauvegarder
                                </button>
                                <button
                                    onClick={() => setIsEditingLinkedinEmail(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <p className="text-gray-900 dark:text-white">
                                    {linkedinCredentials.email || 'Non configuré'}
                                </p>
                                <button
                                    onClick={() => setIsEditingLinkedinEmail(true)}
                                    className="text-primary hover:text-primary-dark transition-colors"
                                >
                                    Modifier
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mot de passe LinkedIn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mot de passe LinkedIn
                        </label>
                        {isEditingLinkedinPassword ? (
                            <div className="flex space-x-3">
                                <input
                                    type="password"
                                    value={linkedinCredentials.password}
                                    onChange={(e) => setLinkedinCredentials(prev => ({
                                        ...prev,
                                        password: e.target.value
                                    }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Votre mot de passe LinkedIn"
                                />
                                <button
                                    onClick={() => updateLinkedinCredentials('password')}
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                                >
                                    Sauvegarder
                                </button>
                                <button
                                    onClick={() => setIsEditingLinkedinPassword(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <p className="text-gray-900 dark:text-white">••••••••</p>
                                <button
                                    onClick={() => setIsEditingLinkedinPassword(true)}
                                    className="text-primary hover:text-primary-dark transition-colors"
                                >
                                    Modifier
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Statut de connexion LinkedIn */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Statut de la connexion:
                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    linkedinCredentials.isConnected
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                  {linkedinCredentials.isConnected ? 'Connecté' : 'Non connecté'}
                </span>
                            </div>
                            {lastCheckTime && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Dernière vérification: {new Date(lastCheckTime).toLocaleString('fr-FR')}
                </span>
                            )}
                        </div>

                        <button
                            onClick={testLinkedinConnection}
                            disabled={testingConnection || !linkedinCredentials.email || linkedinCredentials.password === '••••••••'}
                            className={`w-full px-4 py-2 rounded-lg transition-colors ${
                                testingConnection || !linkedinCredentials.email || linkedinCredentials.password === '••••••••'
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary-dark text-white'
                            }`}
                        >
                            {testingConnection ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Test en cours...
                                </div>
                            ) : 'Tester la connexion'}
                        </button>

                        {(!linkedinCredentials.email || linkedinCredentials.password === '••••••••') && (
                            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-500">
                                ⚠️ Veuillez configurer vos identifiants LinkedIn avant de tester la connexion
                            </p>
                        )}
                    </div>

                    {/* Message d'information */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            ℹ️ Ces identifiants seront utilisés uniquement pour automatiser les actions LinkedIn.
                            Vos données sont chiffrées et stockées de manière sécurisée.
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages de notification */}
            {message.text && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
                    message.type === 'success'
                        ? 'bg-green-500 text-white'
                        : message.type === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-blue-500 text-white'
                }`}>
                    <p className="flex items-center">
                        {message.type === 'success' && <span className="mr-2"></span>}
                        {message.type === 'error' && <span className="mr-2"></span>}
                        {message.text}
                    </p>
                </div>
            )}

        </div>
    );
};

export default Settings;