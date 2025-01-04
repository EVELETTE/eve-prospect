import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
    AlertCircle,
    Play,
    Pause,
    Plus,
    Clock,
    Calendar,
    UserPlus,
    MessageCircle,
    Trash2,
    X,
    ChevronRight
} from 'lucide-react';

const SEQUENCE_TEMPLATES = [
    {
        id: 'template_1',
        name: "Invitation + Message",
        description: "Envoi d'une invitation suivie d'un message de remerciement.",
        steps: [
            {
                id: 'step_1_1',
                type: 'connection',
                delay: 0,
                template: "Bonjour {{firstName}}, je souhaiterais vous connecter à mon réseau professionnel.",
                status: 'pending'
            },
            {
                id: 'step_1_2',
                type: 'message',
                delay: 2,
                template: "Merci d'avoir accepté ma demande de connexion. Je serais ravi d'échanger avec vous sur...",
                status: 'pending'
            }
        ]
    },
    {
        id: 'template_2',
        name: "Prospection complète",
        description: "Séquence complète d'approche et de suivi.",
        steps: [
            {
                id: 'step_2_1',
                type: 'connection',
                delay: 0,
                template: "Bonjour {{firstName}}, votre profil a retenu mon attention...",
                status: 'pending'
            },
            {
                id: 'step_2_2',
                type: 'message',
                delay: 2,
                template: "Merci pour votre connexion ! Je travaille dans...",
                status: 'pending'
            },
            {
                id: 'step_2_3',
                type: 'message',
                delay: 5,
                template: "J'aimerais vous présenter notre solution qui...",
                status: 'pending'
            }
        ]
    }
];

const ActionIcon = ({ type, className = "w-4 h-4" }) => {
    switch (type) {
        case 'connection':
            return <UserPlus className={className} />;
        case 'message':
            return <MessageCircle className={className} />;
        default:
            return null;
    }
};

const SequenceStep = React.memo(({ step }) => {
    const { type, template, status, scheduledDate, completedDate, error } = step;

    const getStatusStyle = () => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
            case 'failed':
                return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
            case 'scheduled':
                return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
            <div className="flex items-center gap-3">
                <ActionIcon type={type} />
                <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {template}
                    </p>
                    {scheduledDate && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Planifié le: {new Date(scheduledDate).toLocaleDateString()}</span>
                        </div>
                    )}
                    {completedDate && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Exécuté le: {new Date(completedDate).toLocaleDateString()}
                        </div>
                    )}
                    {error && (
                        <div className="mt-1 text-xs text-red-500">
                            Erreur: {error}
                        </div>
                    )}
                </div>
                <div className={`px-2 py-1 rounded text-xs ${getStatusStyle()}`}>
                    {status || 'En attente'}
                </div>
            </div>
        </div>
    );
});

const AutomationTab = ({ prospect, onClose }) => {
    const [isCreatingSequence, setIsCreatingSequence] = useState(false);
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Charger les séquences au montage
    useEffect(() => {
        const fetchSequences = async () => {
            if (!prospect?._id) return;

            try {
                setLoading(true);
                const response = await axios.get(
                    'http://localhost:5001/api/sequences',
                    {
                        params: { prospectId: prospect._id },
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }
                );

                if (response.data.success) {
                    setSequences(response.data.sequences);
                }
            } catch (error) {
                console.error('Erreur chargement séquences:', error);
                setError('Erreur lors du chargement des séquences');
            } finally {
                setLoading(false);
            }
        };

        fetchSequences();
    }, [prospect?._id]);

    const handleCreateSequence = useCallback(async (template) => {
        try {
            setLoading(true);
            const sequenceData = {
                title: template.name,           // Assurez-vous que ce champ est bien envoyé
                templateId: template.id,
                prospectId: prospect._id,
                status: 'draft',
                steps: template.steps.map(step => ({
                    type: step.type,
                    template: step.template.replace('{{firstName}}', prospect?.prenom || ''),
                    delay: step.delay,
                    status: 'pending',
                    scheduledDate: new Date(Date.now() + step.delay * 24 * 60 * 60 * 1000)
                }))
            };

            console.log('Données envoyées:', sequenceData); // Pour debug

            const response = await axios.post(
                'http://localhost:5001/api/sequences',
                sequenceData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setSequences(prev => [...prev, response.data.sequence]);
                setIsCreatingSequence(false);
            }
        } catch (error) {
            console.error('Erreur création séquence:', error.response?.data || error);
            setError(error.response?.data?.message || 'Erreur lors de la création de la séquence');
        } finally {
            setLoading(false);
        }
    }, [prospect]);

    const handleStartSequence = async (sequenceId) => {
        try {
            console.log('Démarrage séquence:', sequenceId); // Debug
            const response = await axios.put(
                `http://localhost:5001/api/sequences/${sequenceId}/start`,
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            if (response.data.success) {
                setSequences(prev => prev.map(seq =>
                    seq._id === sequenceId ? { ...seq, status: 'active' } : seq
                ));
                setError(null);
            }
        } catch (error) {
            console.error('Erreur démarrage séquence:', error);
            setError('Erreur lors du démarrage de la séquence');
        }
    };

    const handlePauseSequence = async (sequenceId) => {
        try {
            setLoading(true);
            const response = await axios.put(
                `http://localhost:5001/api/sequences/${sequenceId}/pause`,
                {
                    executionLogs: [{
                        action: 'pause',
                        status: 'success',
                        message: 'Séquence mise en pause'
                    }]
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            if (response.data.success) {
                setSequences(prev => prev.map(seq =>
                    seq._id === sequenceId
                        ? { ...seq, status: 'paused' }
                        : seq
                ));
                setError(null);
            }
        } catch (error) {
            console.error('Erreur pause séquence:', error);
            setError('Erreur lors de la mise en pause de la séquence');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSequence = async (sequenceId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette séquence ?')) return;

        try {
            const response = await axios.delete(
                `http://localhost:5001/api/sequences/${sequenceId}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            if (response.data.success) {
                setSequences(prev => prev.filter(seq => seq._id !== sequenceId));
            }
        } catch (error) {
            console.error('Erreur suppression séquence:', error);
            setError('Erreur lors de la suppression de la séquence');
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Séquences d'automatisation
                </h3>
                <button
                    onClick={() => setIsCreatingSequence(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500
                             text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Créer une séquence
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200
                              flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Content */}
            {isCreatingSequence ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                            Choisir un modèle
                        </h4>
                        <button
                            onClick={() => setIsCreatingSequence(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                     rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SEQUENCE_TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                onClick={() => handleCreateSequence(template)}
                                className="block text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700
                                         hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800
                                         transition-all duration-200"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h5 className="font-medium text-gray-900 dark:text-white">
                                            {template.name}
                                        </h5>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {template.description}
                                        </p>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {template.steps.length} étapes
                                    </span>
                                </div>

                                <div className="mt-4 flex gap-6">
                                    {template.steps.map(step => (
                                        <div key={step.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <ActionIcon type={step.type} />
                                            <span>J+{step.delay}</span>
                                        </div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : sequences.length > 0 ? (
                <div className="space-y-4">
                    {sequences.map(sequence => (
                        <div
                            key={sequence.id}
                            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700
                                     bg-white dark:bg-gray-800"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        sequence.status === 'active'
                                            ? 'bg-green-500'
                                            : 'bg-gray-400 dark:bg-gray-500'
                                    }`}/>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        {sequence.title}
                                    </h4>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        key={`control-${sequence._id}`} // Ajout d'une clé unique
                                        onClick={(e) => {
                                            e.stopPropagation(); // Empêcher la propagation de l'événement
                                            sequence.status === 'active'
                                                ? handlePauseSequence(sequence._id)
                                                : handleStartSequence(sequence._id)
                                        }}
                                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700
                   dark:text-gray-400 dark:hover:text-gray-200
                   hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        {sequence.status === 'active' ? (
                                            <Pause className="w-4 h-4"/>
                                        ) : (
                                            <Play className="w-4 h-4"/>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        key={`delete-${sequence._id}`} // Ajout d'une clé unique
                                        onClick={(e) => {
                                            e.stopPropagation(); // Empêcher la propagation de l'événement
                                            handleDeleteSequence(sequence._id)
                                        }}
                                        className="p-2 rounded-lg text-red-500 hover:text-red-700
                   hover:bg-red-50 dark:hover:bg-red-900/50"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {sequence.steps.map((step, index) => (
                                    <SequenceStep
                                        key={`${sequence._id}-step-${index}`} // Clé unique composée
                                        step={step}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"/>
                    <p className="mt-4 font-medium text-gray-900 dark:text-white">
                        Aucune séquence d'automatisation active
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Créez une séquence pour automatiser vos interactions
                    </p>
                </div>
            )}
        </div>
    );
};

export default AutomationTab;