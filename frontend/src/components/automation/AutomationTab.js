// src/components/automation/AutomationTab.js
import React, { useState } from 'react';
import {
    AlertCircle, Play, Pause, Plus, Clock, Calendar,
    UserPlus, MessageCircle, Trash2, X
} from 'lucide-react';
import { useSequences } from '../../hooks/useSequences';
import { useTheme } from '../../hooks/useTheme';
import './AutomationTab.css';

const SEQUENCE_TEMPLATES = [
    {
        id: 1,
        name: "Invitation + Message",
        description: "Envoi d'une invitation suivie d'un message de remerciement.",
        steps: [
            {
                type: 'connection',
                delay: 0,
                template: "Bonjour {{firstName}}, je souhaiterais vous connecter à mon réseau professionnel."
            },
            {
                type: 'message',
                delay: 2,
                template: "Merci d'avoir accepté ma demande de connexion. Je serais ravi d'échanger avec vous sur..."
            }
        ]
    },
    {
        id: 2,
        name: "Prospection complète",
        description: "Séquence complète d'approche et de suivi.",
        steps: [
            {
                type: 'connection',
                delay: 0,
                template: "Bonjour {{firstName}}, votre profil a retenu mon attention..."
            },
            {
                type: 'message',
                delay: 2,
                template: "Merci pour votre connexion ! Je travaille dans..."
            },
            {
                type: 'message',
                delay: 5,
                template: "J'aimerais vous présenter notre solution qui..."
            }
        ]
    }
];

const AutomationTab = ({ prospect }) => {
    const { isDarkMode } = useTheme();
    const [isCreatingSequence, setIsCreatingSequence] = useState(false);
    const {
        sequences,
        loading,
        error,
        createSequence,
        deleteSequence,
        startSequence,
        pauseSequence,
        resumeSequence
    } = useSequences(prospect?._id);

    const handleCreateSequence = async (template) => {
        try {
            await createSequence({
                title: template.name,
                templateId: template.id.toString(),
                steps: template.steps.map(step => ({
                    ...step,
                    template: step.template.replace('{{firstName}}', prospect?.prenom || '')
                }))
            });
            setIsCreatingSequence(false);
        } catch (err) {
            console.error('Erreur création séquence:', err);
        }
    };

    const handleDeleteSequence = async (sequenceId, event) => {
        event.stopPropagation();
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette séquence ?')) {
            try {
                await deleteSequence(sequenceId);
            } catch (err) {
                console.error('Erreur suppression séquence:', err);
            }
        }
    };

    const handleSequenceAction = async (sequenceId, action, event) => {
        event.stopPropagation();
        try {
            switch (action) {
                case 'start':
                    await startSequence(sequenceId);
                    break;
                case 'pause':
                    await pauseSequence(sequenceId);
                    break;
                case 'resume':
                    await resumeSequence(sequenceId);
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error(`Erreur lors de l'action ${action}:`, err);
        }
    };

    const renderActionIcon = (type) => {
        switch (type) {
            case 'connection':
                return <UserPlus className="step-icon" size={16} />;
            case 'message':
                return <MessageCircle className="step-icon" size={16} />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className={`automation-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <span className="loading-spinner"></span>
                    <p>Chargement des séquences...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`automation-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="sequence-header">
                <h3 className="sequence-title">Séquences d'automatisation</h3>
                <button
                    className="create-sequence-btn"
                    onClick={() => setIsCreatingSequence(true)}
                >
                    <Plus size={18} />
                    Créer une séquence
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className={`content-section ${isCreatingSequence ? 'templates-visible' : ''}`}>
                {isCreatingSequence ? (
                    <div className="templates-section">
                        <div className="templates-header">
                            <h4>Choisir un modèle</h4>
                            <button
                                className="close-btn"
                                onClick={() => setIsCreatingSequence(false)}
                                aria-label="Fermer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="templates-grid">
                            {SEQUENCE_TEMPLATES.map(template => (
                                <div
                                    key={template.id}
                                    className="template-card"
                                    onClick={() => handleCreateSequence(template)}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Sélectionner le modèle ${template.name}`}
                                >
                                    <div className="template-header">
                                        <span className="template-name">{template.name}</span>
                                        <span className="step-count">
                                            {template.steps.length} étapes
                                        </span>
                                    </div>
                                    <p className="template-description">{template.description}</p>
                                    <div className="steps-timeline">
                                        {template.steps.map((step, idx) => (
                                            <div key={idx} className="step-item">
                                                {renderActionIcon(step.type)}
                                                <span className="step-day">J+{step.delay}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : sequences.length > 0 ? (
                    <div className="sequence-list">
                        {sequences.map(sequence => (
                            <div key={sequence._id} className="sequence-card">
                                <div className="sequence-card-header">
                                    <div className="sequence-status">
                                        <span className={`status-dot ${sequence.status === 'active' ? 'active' : 'paused'}`} />
                                        <h4 className="sequence-name">{sequence.title}</h4>
                                    </div>
                                    <div className="sequence-actions">
                                        {sequence.status === 'active' ? (
                                            <button
                                                className="action-button"
                                                onClick={(e) => handleSequenceAction(sequence._id, 'pause', e)}
                                                title="Mettre en pause"
                                                aria-label="Mettre en pause la séquence"
                                            >
                                                <Pause size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                className="action-button"
                                                onClick={(e) => handleSequenceAction(sequence._id, 'start', e)}
                                                title="Démarrer"
                                                aria-label="Démarrer la séquence"
                                            >
                                                <Play size={18} />
                                            </button>
                                        )}
                                        <button
                                            className="action-button delete"
                                            onClick={(e) => handleDeleteSequence(sequence._id, e)}
                                            title="Supprimer"
                                            aria-label="Supprimer la séquence"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="sequence-body">
                                    <div className="sequence-steps">
                                        {sequence.steps.map((step, idx) => (
                                            <div
                                                key={idx}
                                                className={`sequence-step ${step.status === 'completed' ? 'completed' : ''}`}
                                            >
                                                {renderActionIcon(step.type)}
                                                <div className="step-content">{step.template}</div>
                                                {step.scheduledDate && (
                                                    <div className="step-date">
                                                        <Calendar size={14} />
                                                        <span>
                                                            {new Date(step.scheduledDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <AlertCircle className="empty-icon" />
                        <p className="empty-title">Aucune séquence d'automatisation active</p>
                        <p className="empty-description">
                            Créez une séquence pour automatiser vos interactions
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutomationTab;