import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    X, Mail, Building, MapPin, Calendar, Clock, UserCheck,
    List, ExternalLink, BellRing, PlayCircle, Plus, RefreshCw,
    ChevronRight, MessageCircle
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import AutomationTab from './automation/AutomationTab';
import ProspectListInfo from './ProspectListInfo';


const StatusBadge = ({ status }) => {
    const statusColors = {
        nouveau: 'bg-green-500',
        contacté: 'bg-blue-500',
        intéressé: 'bg-yellow-500',
        converti: 'bg-purple-500',
        refusé: 'bg-red-500'
    };

    return (
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${statusColors[status || 'nouveau']}`} />
    );
};


const Tooltip = ({ content, visible, x, y }) => {
    if (!visible || !content) return null;

    return (
        <div 
            className="fixed z-tooltip px-2 py-1 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg transition-opacity duration-200"
            style={{
                left: `${x}px`,
                top: `${y - 8}px`,
                transform: 'translate(-50%, -100%)',
            }}
        >
            {content}
            <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 -translate-x-1/2" />
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value, withTooltip = true }) => {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const contentRef = useRef(null);

    const handleMouseEnter = useCallback((e) => {
        if (!withTooltip) return;
        const rect = contentRef.current.getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top
        });
        setTooltipVisible(true);
    }, [withTooltip]);

    return (
        <>
            <div
                ref={contentRef}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setTooltipVisible(false)}
            >
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {value || 'Non disponible'}
                        </p>
                    </div>
                </div>
            </div>
            
            <Tooltip 
                content={value} 
                visible={tooltipVisible} 
                x={tooltipPosition.x} 
                y={tooltipPosition.y} 
            />
        </>
    );
};

const Timeline = ({ prospect }) => {
    const events = [
        {
            type: 'creation',
            date: prospect.createdAt,
            icon: <Plus className="w-4 h-4" />,
            title: 'Création du prospect',
            description: `Ajout de ${prospect.prenom} ${prospect.nom} à la base de données`
        },
        ...(prospect.lastContactedAt ? [{
            type: 'contact',
            date: prospect.lastContactedAt,
            icon: <MessageCircle className="w-4 h-4" />,
            title: 'Dernier contact',
            description: 'Message envoyé au prospect'
        }] : []),
        ...(prospect.status !== 'nouveau' ? [{
            type: 'status',
            date: prospect.updatedAt,
            icon: <RefreshCw className="w-4 h-4" />,
            title: 'Changement de statut',
            description: `Statut mis à jour : ${prospect.status}`
        }] : [])
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const getEventColor = (type) => {
        switch (type) {
            case 'creation': return 'bg-green-500';
            case 'contact': return 'bg-blue-500';
            case 'status': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="absolute top-0 right-0 h-full w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Historique des actions
                </h3>
            </div>
            <div className="overflow-y-auto h-[calc(100%-3.5rem)] p-4">
                <div className="relative ml-3">
                    <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                    {events.map((event, idx) => (
                        <div key={idx} className="relative mb-8 ml-6">
                            <div className={`absolute -left-9 ${getEventColor(event.type)}
w-7 h-7 rounded-full flex items-center justify-center
ring-4 ring-white dark:ring-gray-900`}
                            >
                                {event.icon}
                            </div>
                            <div className="pl-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {event.title}
                                </div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(event.date).toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                                    {event.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProspectDetailModal = ({ prospect, onClose, isOpen, lists = [], onUpdateStatus }) => {
    const {isDarkMode} = useTheme();
    const [activeTab, setActiveTab] = useState('info');
    const [automationData, setAutomationData] = useState({
        sequences: [],
        loading: false,
        error: null
    });

    // Gestionnaires d'événements de séquence
    const handleStartSequence = useCallback(async (sequenceId) => {
        try {
            setAutomationData(prev => ({...prev, loading: true}));

            await axios.put(
                `http://localhost:5001/api/sequences/${sequenceId}/start`,
                {},
                {
                    headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
                }
            );

            setAutomationData(prev => ({
                ...prev,
                loading: false,
                sequences: prev.sequences.map(seq =>
                    seq.id === sequenceId ? {...seq, status: 'active'} : seq
                )
            }));
        } catch (error) {
            console.error('Erreur démarrage séquence:', error);
            setAutomationData(prev => ({
                ...prev,
                loading: false,
                error: 'Erreur lors du démarrage de la séquence'
            }));
        }
    }, []);

    const handlePauseSequence = useCallback(async (sequenceId) => {
        try {
            setAutomationData(prev => ({...prev, loading: true}));

            await axios.put(
                `http://localhost:5001/api/sequences/${sequenceId}/pause`,
                {},
                {
                    headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
                }
            );

            setAutomationData(prev => ({
                ...prev,
                loading: false,
                sequences: prev.sequences.map(seq =>
                    seq.id === sequenceId ? {...seq, status: 'paused'} : seq
                )
            }));
        } catch (error) {
            console.error('Erreur pause séquence:', error);
            setAutomationData(prev => ({
                ...prev,
                loading: false,
                error: 'Erreur lors de la mise en pause de la séquence'
            }));
        }
    }, []);

    const handleDeleteSequence = useCallback(async (sequenceId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette séquence ?')) return;

        try {
            setAutomationData(prev => ({...prev, loading: true}));

            await axios.delete(
                `http://localhost:5001/api/sequences/${sequenceId}`,
                {
                    headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
                }
            );

            setAutomationData(prev => ({
                ...prev,
                loading: false,
                sequences: prev.sequences.filter(seq => seq.id !== sequenceId)
            }));
        } catch (error) {
            console.error('Erreur suppression séquence:', error);
            setAutomationData(prev => ({
                ...prev,
                loading: false,
                error: 'Erreur lors de la suppression de la séquence'
            }));
        }
    }, []);

    // Charger les séquences au montage
    useEffect(() => {
        const fetchSequences = async () => {
            if (!prospect?._id) return;

            try {
                setAutomationData(prev => ({...prev, loading: true}));
                const response = await axios.get(
                    `http://localhost:5001/api/sequences?prospectId=${prospect._id}`,
                    {
                        headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
                    }
                );

                setAutomationData({
                    sequences: response.data.sequences || [],
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Erreur chargement séquences:', error);
                setAutomationData({
                    sequences: [],
                    loading: false,
                    error: 'Erreur lors du chargement des séquences'
                });
            }
        };

        if (isOpen) {
            fetchSequences();
        }
    }, [prospect?._id, isOpen]);

    // Effet pour gérer le scroll du body
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>

            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div
                    className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-4">
                            <div className="relative">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${prospect.prenom}+${prospect.nom}&background=random`}
                                    alt={`${prospect.prenom} ${prospect.nom}`}
                                    className="w-16 h-16 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                />
                                <StatusBadge status={prospect.status}/>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {prospect.prenom} {prospect.nom}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {prospect.position || 'Position non renseignée'}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <div className="flex mt-6 border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`relative px-6 py-3 text-sm font-medium transition-colors duration-200
                                    ${activeTab === 'info'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'}`}
                            >
                                Informations
                                {activeTab === 'info' && (
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"/>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('automation')}
                                className={`relative px-6 py-3 text-sm font-medium transition-colors duration-200
                                    ${activeTab === 'automation'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'}`}
                            >
                                Automatisation
                                {activeTab === 'automation' && (
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"/>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative flex">
                        <div className="flex-1 p-6 pr-72 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {activeTab === 'info' ? (
                                <div className="space-y-6">
                                    {/* Contact Info */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Informations de contact
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InfoItem
                                                icon={Mail}
                                                label="Email"
                                                value={prospect.email}
                                            />
                                            <InfoItem
                                                icon={Building}
                                                label="Société"
                                                value={prospect.societe}
                                            />
                                            <InfoItem
                                                icon={MapPin}
                                                label="Localisation"
                                                value={prospect.location}
                                            />
                                            <InfoItem
                                                icon={UserCheck}
                                                label="Statut"
                                                value={prospect.status || 'Nouveau'}
                                                withTooltip={false}
                                            />
                                        </div>
                                    </div>
                                    {/* Lists */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Listes d'appartenance
                                        </h3>
                                        <ProspectListInfo prospectId={prospect._id}/>
                                    </div>
                                    {/* LinkedIn Profile */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Profil LinkedIn
                                        </h3>
                                        <a
                                            href={prospect.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-600 dark:text-blue-400
                                                     hover:text-blue-700 dark:hover:text-blue-300"
                                        >
                                            <ExternalLink className="w-4 h-4"/>
                                            <span>Voir le profil complet</span>
                                            <ChevronRight className="w-4 h-4"/>
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <AutomationTab
                                    prospect={prospect}
                                    sequences={automationData.sequences}
                                    loading={automationData.loading}
                                    error={automationData.error}
                                    onCreateSequence={(sequenceData) => {
                                        setAutomationData(prev => ({
                                            ...prev,
                                            sequences: [...prev.sequences, sequenceData]
                                        }));
                                    }}
                                    onStartSequence={handleStartSequence}
                                    onPauseSequence={handlePauseSequence}
                                    onDeleteSequence={handleDeleteSequence}
                                />
                            )}
                        </div>

                        {/* Timeline toujours visible */}
                        <Timeline prospect={prospect}/>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default ProspectDetailModal;