import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateCampaignModal.css';

const SEQUENCE_TYPES = {
    INVITATION: {
        id: 'invitation',
        title: 'Invitation simple',
        description: 'Envoi d\'une invitation de connexion',
        icon: '🔗'
    },
    INVITATION_MESSAGES: {
        id: 'invitation_messages',
        title: 'Invitation + 2 Messages',
        description: 'Invitation suivie de 2 messages automatiques',
        icon: '✉️'
    },
    MESSAGE_ONLY: {
        id: 'message_only',
        title: 'Message (relations seulement)',
        description: 'Envoi de message à vos relations existantes',
        icon: '💬'
    }
};

const CreateCampaignModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState('select_sequence');
    const [selectedSequence, setSelectedSequence] = useState(null);
    const [availableLists, setAvailableLists] = useState([]);
    const [selectedListIds, setSelectedListIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingLists, setLoadingLists] = useState(true);
    const [error, setError] = useState('');

    const [campaignData, setCampaignData] = useState({
        title: '',
        sequenceType: '',
        messageTemplate: '',
        followUpMessages: [],
        maxInvitesPerDay: 100,
        activeHours: {
            start: '09:00',
            end: '17:00'
        }
    });
    const DEFAULT_LISTS = [
        {
            _id: 'all_prospects',
            name: 'Tous les prospects',
            prospectsCount: 0 // Sera mis à jour avec le total
        }
    ];
    // Charger les listes au montage du composant
    useEffect(() => {
        const fetchLists = async () => {
            try {
                setLoadingLists(true);
                const response = await axios.get('http://localhost:5001/api/lists', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.data.success) {
                    // Calculer le nombre total de prospects pour la liste "Tous les prospects"
                    const totalProspects = response.data.lists.reduce(
                        (total, list) => total + list.prospectsCount,
                        0
                    );

                    // Mettre à jour la liste "Tous les prospects"
                    const updatedDefaultLists = DEFAULT_LISTS.map(list =>
                        list._id === 'all_prospects'
                            ? { ...list, prospectsCount: totalProspects }
                            : list
                    );

                    // Combiner les listes par défaut avec les listes personnalisées
                    setAvailableLists([
                        ...updatedDefaultLists,
                        ...response.data.lists
                    ]);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des listes:', error);
                setError('Impossible de charger les listes de prospects');
            } finally {
                setLoadingLists(false);
            }
        };

        fetchLists();

    }, []);

    const handleSequenceSelect = (sequence) => {
        setSelectedSequence(sequence);
        setCampaignData(prev => ({
            ...prev,
            sequenceType: sequence.id
        }));
        setStep('configure');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedListIds.length === 0) {
            setError('Veuillez sélectionner au moins une liste de prospects');
            return;
        }

        setLoading(true);
        try {
            const campaignPayload = {
                ...campaignData,
                prospectLists: selectedListIds
            };

            const response = await axios.post('http://localhost:5001/api/campaigns/create', campaignPayload, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                onSuccess(response.data.campaign);
                onClose();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Erreur lors de la création de la campagne');
        } finally {
            setLoading(false);
        }
    };

    const handleListSelection = (listId) => {
        setSelectedListIds(prev => {
            // Si "Tous les prospects" est sélectionné, désélectionner toutes les autres listes
            if (listId === 'all_prospects') {
                return prev.includes('all_prospects') ? [] : ['all_prospects'];
            }

            // Si une autre liste est sélectionnée, retirer "Tous les prospects"
            const newSelection = prev.filter(id => id !== 'all_prospects');

            if (prev.includes(listId)) {
                return newSelection.filter(id => id !== listId);
            } else {
                return [...newSelection, listId];
            }
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {step === 'select_sequence' ? (
                    <>
                        <div className="modal-header">
                            <h2>🚀 Sélectionner une séquence</h2>
                            <button className="close-button" onClick={onClose}>×</button>
                        </div>
                        <div className="sequence-grid">
                            {Object.values(SEQUENCE_TYPES).map((sequence) => (
                                <div
                                    key={sequence.id}
                                    className="sequence-card"
                                    onClick={() => handleSequenceSelect(sequence)}
                                >
                                    <div className="sequence-icon">{sequence.icon}</div>
                                    <h3>{sequence.title}</h3>
                                    <p>{sequence.description}</p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="modal-header">
                            <button className="back-button" onClick={() => setStep('select_sequence')}>←</button>
                            <h2>{selectedSequence.title}</h2>
                            <button className="close-button" onClick={onClose}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Titre de la campagne</label>
                                <input
                                    type="text"
                                    value={campaignData.title}
                                    onChange={(e) => setCampaignData(prev => ({
                                        ...prev,
                                        title: e.target.value
                                    }))}
                                    required
                                    placeholder="Ex: Prospection commerciaux IT"
                                />
                            </div>

                            <div className="form-group">
                                <label>Sélectionner les listes</label>
                                <div className="lists-selection">
                                    {loadingLists ? (
                                        <div className="loading-lists">
                                            Chargement des listes...
                                        </div>
                                    ) : availableLists.length === 0 ? (
                                        <div className="no-lists">
                                            Aucune liste disponible
                                        </div>
                                    ) : (
                                        availableLists.map(list => (
                                            <div key={list._id} className="list-item">
                                                <input
                                                    type="checkbox"
                                                    id={`list-${list._id}`}
                                                    checked={selectedListIds.includes(list._id)}
                                                    onChange={() => handleListSelection(list._id)}
                                                />
                                                <label htmlFor={`list-${list._id}`}>
                                                    <span className="list-name">{list.name}</span>
                                                    <span className="list-count">
                                            {list.prospectsCount} prospect{list.prospectsCount > 1 ? 's' : ''}
                                        </span>
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Message d'invitation</label>
                                <textarea
                                    value={campaignData.messageTemplate}
                                    onChange={(e) => setCampaignData(prev => ({
                                        ...prev,
                                        messageTemplate: e.target.value
                                    }))}
                                    placeholder="Bonjour {{firstName}}, je souhaite vous connecter..."
                                    required
                                />
                                <small>Variables
                                    disponibles: {'{{'}firstName{'}}'}, {'{{'}company{'}}'}, {'{{'}position{'}}'}</small>
                            </div>

                            {selectedSequence.id === 'invitation_messages' && (
                                <div className="form-group">
                                    <label>Messages de suivi</label>
                                    {[1, 2].map((index) => (
                                        <div key={index} className="follow-up-message">
                                            <label>Message {index}</label>
                                            <textarea
                                                value={campaignData.followUpMessages[index - 1] || ''}
                                                onChange={(e) => {
                                                    const newMessages = [...(campaignData.followUpMessages || [])];
                                                    newMessages[index - 1] = e.target.value;
                                                    setCampaignData(prev => ({
                                                        ...prev,
                                                        followUpMessages: newMessages
                                                    }));
                                                }}
                                                placeholder={`Message de suivi ${index}...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Invitations par jour</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={campaignData.maxInvitesPerDay}
                                        onChange={(e) => setCampaignData(prev => ({
                                            ...prev,
                                            maxInvitesPerDay: parseInt(e.target.value)
                                        }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Plage horaire</label>
                                    <div className="time-range">
                                        <input
                                            type="time"
                                            value={campaignData.activeHours.start}
                                            onChange={(e) => setCampaignData(prev => ({
                                                ...prev,
                                                activeHours: {
                                                    ...prev.activeHours,
                                                    start: e.target.value
                                                }
                                            }))}
                                        />
                                        <span>à</span>
                                        <input
                                            type="time"
                                            value={campaignData.activeHours.end}
                                            onChange={(e) => setCampaignData(prev => ({
                                                ...prev,
                                                activeHours: {
                                                    ...prev.activeHours,
                                                    end: e.target.value
                                                }
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                                    Annuler
                                </button>
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? '⏳ Création...' : '✨ Lancer la campagne'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreateCampaignModal;