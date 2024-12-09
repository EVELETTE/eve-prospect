import React, { useState, useCallback, useEffect } from 'react';
import {
    X, Mail, Building, MapPin, Calendar, Clock, UserCheck,
    List, ExternalLink, BellRing, PlayCircle, PauseCircle
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import './ProspectDetailModal.css';
import AutomationTab from './automation/AutomationTab';

const ProspectDetailModal = ({ prospect, onClose, isOpen, lists = [], onUpdateStatus }) => {
    const { isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState('info');
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [tooltipContent, setTooltipContent] = useState('');
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [automationData, setAutomationData] = useState({
        sequences: [],
        loading: false,
        error: null
    });

    const handleTooltipShow = useCallback((content, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipContent(content);
        setTooltipPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top - 10
        });
        setIsTooltipVisible(true);
    }, []);

    const handleTooltipHide = useCallback(() => {
        setIsTooltipVisible(false);
    }, []);

    const formatDate = useCallback((date) => {
        if (!date) return 'Non disponible';
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setIsTooltipVisible(false);
            setTooltipContent('');
            return;
        }

        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        return () => {
            const scrollBack = parseInt(document.body.style.top || '0', 10) * -1;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollBack);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const prospectLists = lists.filter(list =>
        list.prospects?.some(p => p._id === prospect._id)
    );

    const renderInfoItem = (icon, label, value, withTooltip = true) => (
        <div className="info-item">
            {icon}
            <div className="info-item-content">
                <label>{label}</label>
                <div
                    className={withTooltip ? "tooltip-trigger" : ""}
                    onMouseEnter={withTooltip ? (e) => handleTooltipShow(value, e) : undefined}
                    onMouseLeave={withTooltip ? handleTooltipHide : undefined}
                >
                    <p className="info-value text-ellipsis">{value}</p>
                </div>
            </div>
        </div>
    );

    const handleCreateSequence = async (sequenceData) => {
        try {
            setAutomationData(prev => ({ ...prev, loading: true }));
            setAutomationData(prev => ({
                ...prev,
                loading: false,
                sequences: [...prev.sequences, sequenceData]
            }));
        } catch (error) {
            setAutomationData(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
        }
    };

    return (
        <div className={`prospect-modal-overlay ${isDarkMode ? 'dark' : ''}`} onClick={onClose}>
            <div className="prospect-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="prospect-header-info">
                        <div className="avatar-container">
                            <img
                                src={`https://ui-avatars.com/api/?name=${prospect.prenom}+${prospect.nom}&background=random`}
                                alt={`${prospect.prenom} ${prospect.nom}`}
                                className="prospect-avatar-large"
                            />
                            <div className="status-indicator" data-status={prospect.status || 'nouveau'} />
                        </div>
                        <div className="prospect-details">
                            <h2 className="prospect-name">{prospect.prenom} {prospect.nom}</h2>
                            <p className="prospect-title">{prospect.position || 'Non disponible'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-button" aria-label="Fermer">
                        <X />
                    </button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        Informations
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'automation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('automation')}
                    >
                        Automatisation
                    </button>
                </div>

                <div className="modal-content">
                    {activeTab === 'info' ? (
                        <div className="info-tab">
                            <div className="info-section">
                                <h3>Informations de contact</h3>
                                <div className="info-grid">
                                    {renderInfoItem(
                                        <Mail className="icon" />,
                                        "Email",
                                        prospect.email || 'Non disponible'
                                    )}
                                    {renderInfoItem(
                                        <Building className="icon" />,
                                        "Société",
                                        prospect.societe || 'Non disponible'
                                    )}
                                    {renderInfoItem(
                                        <MapPin className="icon" />,
                                        "Localisation",
                                        prospect.location || 'Non disponible'
                                    )}
                                    {renderInfoItem(
                                        <UserCheck className="icon" />,
                                        "Statut",
                                        prospect.status || 'Nouveau',
                                        false
                                    )}
                                </div>
                            </div>

                            {prospectLists.length > 0 && (
                                <div className="info-section">
                                    <h3>Listes</h3>
                                    <div className="lists-grid">
                                        {prospectLists.map(list => (
                                            <div key={list._id} className="list-badge">
                                                <List className="icon-small" />
                                                <span>{list.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="info-section">
                                <h3>Activité</h3>
                                <div className="info-grid">
                                    {renderInfoItem(
                                        <Calendar className="icon" />,
                                        "Ajouté le",
                                        formatDate(prospect.createdAt),
                                        false
                                    )}
                                    {renderInfoItem(
                                        <Clock className="icon" />,
                                        "Dernier contact",
                                        prospect.lastContactedAt ?
                                            formatDate(prospect.lastContactedAt) :
                                            'Aucun contact',
                                        false
                                    )}
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>Profil LinkedIn</h3>
                                <div className="linkedin-preview">
                                    <a
                                        href={prospect.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="linkedin-link"
                                    >
                                        <ExternalLink className="icon-small" />
                                        Voir le profil complet
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <AutomationTab
                            prospect={prospect}
                            sequences={automationData.sequences}
                            loading={automationData.loading}
                            error={automationData.error}
                            onCreateSequence={handleCreateSequence}
                        />
                    )}
                </div>

                {isTooltipVisible && tooltipContent && (
                    <div
                        className={`tooltip ${isDarkMode ? 'dark' : ''}`}
                        style={{
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y}px`
                        }}
                    >
                        {tooltipContent}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProspectDetailModal;