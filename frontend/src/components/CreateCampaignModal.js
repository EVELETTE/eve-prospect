import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Plus, Clock, ChevronRight } from 'lucide-react';
import axios from 'axios';

const SEQUENCE_TYPES = {
    INVITATION: {
        id: 'invitation',
        title: 'Invitation simple',
        description: "Envoi d'une invitation de connexion",
        icon: '🔗',
        steps: ['campaign_info', 'invitation_message', 'lists', 'settings']
    },
    INVITATION_MESSAGES: {
        id: 'invitation_messages',
        title: 'Invitation + 2 Messages',
        description: 'Invitation suivie de 2 messages automatiques',
        icon: '✉️',
        steps: ['campaign_info', 'invitation_message', 'follow_up_messages', 'lists', 'settings']
    },
    MESSAGE_ONLY: {
        id: 'message_only',
        title: 'Message (relations seulement)',
        description: 'Envoi de message à vos relations existantes',
        icon: '💬',
        steps: ['campaign_info', 'message', 'lists', 'settings']
    }
};

const CreateCampaignModal = ({ onClose, onSuccess }) => {
    const [sequenceType, setSequenceType] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [availableLists, setAvailableLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [campaignData, setCampaignData] = useState({
        title: '',
        messageTemplate: '',
        followUpMessages: [
            { content: '', delay: 2 },
            { content: '', delay: 4 }
        ],
        selectedLists: [],
        settings: {
            maxActionsPerDay: 100,
            activeHours: {
                start: '09:00',
                end: '17:00'
            }
        }
    });

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/lists', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.data.success) {
                    setAvailableLists(response.data.lists);
                }
            } catch (error) {
                setError('Impossible de charger les listes');
            }
        };

        fetchLists();
    }, []);

    const validateCurrentStep = () => {
        setError('');
        switch (currentStep) {
            case 0:
                if (!campaignData.title.trim()) {
                    setError('Le titre de la campagne est requis');
                    return false;
                }
                break;
            case 1:
                if (!campaignData.messageTemplate.trim()) {
                    setError('Le message est requis');
                    return false;
                }
                break;
            case 2:
                if (sequenceType.id === 'invitation_messages') {
                    const invalidMessages = campaignData.followUpMessages.some(msg => !msg.content.trim());
                    if (invalidMessages) {
                        setError('Tous les messages de suivi sont requis');
                        return false;
                    }
                }
                break;
            case 3:
                if (campaignData.selectedLists.length === 0) {
                    setError('Sélectionnez au moins une liste de prospects');
                    return false;
                }
                break;
            default:
                break;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateCurrentStep()) return;
        if (currentStep < getTotalSteps() - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        setError('');
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            setSequenceType(null);
        }
    };

    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        setLoading(true);
        try {
            const campaignPayload = {
                title: campaignData.title,
                sequenceType: sequenceType.id,
                messageTemplate: campaignData.messageTemplate,
                followUpMessages: sequenceType.id === 'invitation_messages' ? campaignData.followUpMessages : [],
                prospectLists: campaignData.selectedLists,
                settings: campaignData.settings
            };

            const response = await axios.post(
                'http://localhost:5001/api/campaigns/create',
                campaignPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                onSuccess?.(response.data.campaign);
                onClose();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Erreur lors de la création de la campagne');
        } finally {
            setLoading(false);
        }
    };

    const getStepContent = () => {
        if (!sequenceType) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(SEQUENCE_TYPES).map((type) => (
                        <button
                            key={type.id}
                            onClick={() => {
                                setSequenceType(type);
                                setCurrentStep(0);
                            }}
                            className="flex flex-col p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800 transition-all hover:shadow-md text-left"
                        >
                            <div className="text-2xl mb-3">{type.icon}</div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {type.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {type.description}
                            </p>
                        </button>
                    ))}
                </div>
            );
        }

        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nom de la campagne
                            </label>
                            <input
                                type="text"
                                value={campaignData.title}
                                onChange={(e) => setCampaignData(prev => ({
                                    ...prev,
                                    title: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Prospection commerciaux IT"
                            />
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message d'invitation
                            </label>
                            <textarea
                                value={campaignData.messageTemplate}
                                onChange={(e) => setCampaignData(prev => ({
                                    ...prev,
                                    messageTemplate: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                                placeholder="Bonjour {{firstName}}, je souhaite vous connecter..."
                            />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Variables disponibles: {"{{firstName}}"}, {"{{company}}"}, {"{{position}}"}
                            </p>
                        </div>
                    </div>
                );
            case 2:
                if (sequenceType.id === 'invitation_messages') {
                    return (
                        <div className="space-y-6">
                            {campaignData.followUpMessages.map((message, index) => (
                                <div key={index} className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            Message de suivi {index + 1}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" />
                                            <input
                                                type="number"
                                                value={message.delay}
                                                onChange={(e) => {
                                                    const newMessages = [...campaignData.followUpMessages];
                                                    newMessages[index].delay = parseInt(e.target.value);
                                                    setCampaignData(prev => ({
                                                        ...prev,
                                                        followUpMessages: newMessages
                                                    }));
                                                }}
                                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                min="1"
                                            />
                                            <span className="text-sm text-gray-500 dark:text-gray-400">jours</span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={message.content}
                                        onChange={(e) => {
                                            const newMessages = [...campaignData.followUpMessages];
                                            newMessages[index].content = e.target.value;
                                            setCampaignData(prev => ({
                                                ...prev,
                                                followUpMessages: newMessages
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                        placeholder={`Message de suivi ${index + 1}...`}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                }
                return null;
            case 3: // Sélection des listes
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white mb-4">
                            Sélectionner les listes
                        </h3>
                        <div className="space-y-2">
                            {availableLists.map(list => (
                                <div
                                    key={list._id}
                                    className="flex items-center gap-3 p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        id={`list-${list._id}`}
                                        checked={campaignData.selectedLists.includes(list._id)}
                                        onChange={() => {
                                            setCampaignData(prev => ({
                                                ...prev,
                                                selectedLists: prev.selectedLists.includes(list._id)
                                                    ? prev.selectedLists.filter(id => id !== list._id)
                                                    : [...prev.selectedLists, list._id]
                                            }));
                                        }}
                                        className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                                    />
                                    <div className="flex flex-col">
                            <span className="text-white text-sm font-medium">
                                {list.name}
                            </span>
                                        <span className="text-slate-400 text-sm">
                                {list.prospectsCount} prospects
                            </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 4: // Paramètres d'envoi
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Nombre maximum d'actions par jour
                            </label>
                            <input
                                type="number"
                                value={campaignData.settings.maxActionsPerDay}
                                onChange={(e) => setCampaignData(prev => ({
                                    ...prev,
                                    settings: {
                                        ...prev.settings,
                                        maxActionsPerDay: parseInt(e.target.value)
                                    }
                                }))}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="1"
                                max="100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Plage horaire d'activité
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="time"
                                    value={campaignData.settings.activeHours.start}
                                    onChange={(e) => setCampaignData(prev => ({
                                        ...prev,
                                        settings: {
                                            ...prev.settings,
                                            activeHours: {
                                                ...prev.settings.activeHours,
                                                start: e.target.value
                                            }
                                        }
                                    }))}
                                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-white">à</span>
                                <input
                                    type="time"
                                    value={campaignData.settings.activeHours.end}
                                    onChange={(e) => setCampaignData(prev => ({
                                        ...prev,
                                        settings: {
                                            ...prev.settings,
                                            activeHours: {
                                                ...prev.settings.activeHours,
                                                end: e.target.value
                                            }
                                        }
                                    }))}
                                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getStepTitle = () => {
        if (!sequenceType) return "Sélectionner un type de séquence";
        const stepMap = {
            campaign_info: "Informations de la campagne",
            invitation_message: "Message d'invitation",
            message: "Message",
            follow_up_messages: "Messages de suivi",
            lists: "Sélection des listes",
            settings: "Paramètres d'envoi"
        };
        return stepMap[sequenceType.steps[currentStep]] || "";
    };

    const getTotalSteps = () => {
        if (!sequenceType) return 1;
        return sequenceType.steps.length;
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-lg overflow-hidden shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            {(currentStep > 0 || sequenceType) && (
                                <button
                                    onClick={handleBack}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {getStepTitle()}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {sequenceType && (
                        <div className="flex items-center justify-between w-full">
                            {sequenceType.steps.map((step, index) => (
                                <div key={index} className="flex items-center flex-1">
                                    <div className={`
                                        flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm
                                        ${index < currentStep ? 'bg-blue-600 text-white' :
                                        index === currentStep ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' :
                                            'bg-gray-100 dark:bg-gray-700 text-gray-400'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    {index < sequenceType.steps.length - 1 && (
                                        <div className={`h-0.5 flex-1 mx-2 ${
                                            index < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="min-h-[300px]">
                        {getStepContent()}

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                {sequenceType && (
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            disabled={loading}
                        >
                            Retour
                        </button>

                        {currentStep === getTotalSteps() - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        Lancer la campagne
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                            >
                                Suivant
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateCampaignModal;