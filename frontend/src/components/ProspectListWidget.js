// ProspectListWidget.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CSVReader from 'react-csv-reader';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { Search, RefreshCw, Clock, Upload, Trash2, Plus, Edit2, List, XCircle } from 'lucide-react';
import './ProspectListWidget.css';
import ProspectDetailModal from './ProspectDetailModal';

const API_BASE_URL = 'http://localhost:5001/api';
const REFRESH_INTERVAL = 10000; // 10 secondes

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const ProspectListWidget = ({ prospects: initialProspects, onProspectsUpdate }) => {
    // ======= SECTION 1: ÉTATS =======
    const [selectedProspects, setSelectedProspects] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showCreateListModal, setShowCreateListModal] = useState(false);
    const [showEditListModal, setShowEditListModal] = useState(false);
    const [showAddToListModal, setShowAddToListModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [displayedProspects, setDisplayedProspects] = useState([]);
    const [allProspects, setAllProspects] = useState(initialProspects || []);
    const [lists, setLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [currentList, setCurrentList] = useState(null);
    const [newListName, setNewListName] = useState('');
    const [editListName, setEditListName] = useState('');
    const [listSearchTerm, setListSearchTerm] = useState('');
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [listProspects, setListProspects] = useState({});
    const [selectedProspectDetails, setSelectedProspectDetails] = useState(null);
    const [showProspectModal, setShowProspectModal] = useState(false);



    // ======= SECTION 2: MEMOS ET CALCULS =======
    const filteredLists = useMemo(() =>
            lists.filter(list =>
                list.name.toLowerCase().includes(listSearchTerm.toLowerCase())
            ),
        [lists, listSearchTerm]);

    const filteredProspects = useMemo(() => {
        if (!searchTerm) return allProspects;

        const searchTermLower = searchTerm.toLowerCase();
        return allProspects.filter(prospect => {
            const searchFields = [
                prospect.nom,
                prospect.prenom,
                prospect.email,
                prospect.societe
            ].map(field => String(field || '').toLowerCase());

            return searchFields.some(field => field.includes(searchTermLower));
        });
    }, [allProspects, searchTerm]);

    // ======= SECTION 3: FONCTIONS UTILITAIRES =======

    const handleProspectClick = (prospect) => {
        setSelectedProspectDetails(prospect);
        setShowProspectModal(true);
    };

    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearchTerm(value);
        }, 300),
        []
    );

    const handleError = useCallback((error, message) => {
        console.error(message, error);
        setError(error.response?.data?.message || message);
        setTimeout(() => setError(''), 3000);
    }, []);

    const handleSelectProspect = useCallback((id) => {
        setSelectedProspects(prev =>
            prev.includes(id)
                ? prev.filter(prospectId => prospectId !== id)
                : [...prev, id]
        );
    }, []);

    // ======= SECTION 4: FONCTIONS API =======
    const fetchListProspects = async (listId) => {
        try {
            setLoading(true);
            const response = await api.get(`/lists/${listId}`);
            if (response.data.success && response.data.list) {
                const prospects = response.data.list.prospects || [];
                setListProspects(prev => ({
                    ...prev,
                    [listId]: prospects
                }));
                if (selectedList === listId) {
                    setAllProspects(prospects);
                    setDisplayedProspects(prospects);
                }
            }
        } catch (error) {
            handleError(error, "Erreur lors du chargement de la liste");
        } finally {
            setLoading(false);
        }
    };

    const fetchLists = useCallback(async () => {
        try {
            const response = await api.get('/lists');
            if (response.data.success) {
                const listsData = response.data.lists || [];
                setLists(listsData);

                // Charger les prospects de chaque liste
                await Promise.all(
                    listsData.map(list => fetchListProspects(list._id))
                );
            }
        } catch (error) {
            handleError(error, "Erreur lors du chargement des listes");
        }
    }, [handleError]);

    const fetchProspects = useCallback(async (isAutoRefresh = false) => {
        if (isAutoRefresh && !autoRefreshEnabled) return;

        try {
            if (!isAutoRefresh) setLoading(true);
            setIsRefreshing(true);

            let response;
            if (selectedList) {
                const cachedProspects = listProspects[selectedList];
                if (cachedProspects) {
                    setAllProspects(cachedProspects);
                    setDisplayedProspects(cachedProspects);
                    setLastUpdateTime(Date.now());
                } else {
                    await fetchListProspects(selectedList);
                }
            } else {
                response = await api.get('/prospects');
                if (response.data.success) {
                    const prospects = response.data.prospects || [];
                    setAllProspects(prospects);
                    setDisplayedProspects(prospects);
                    setLastUpdateTime(Date.now());
                }
            }
        } catch (error) {
            handleError(error, "Erreur lors du chargement des prospects");
            setAllProspects([]);
            setDisplayedProspects([]);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedList, autoRefreshEnabled, listProspects, handleError]);

    const handleListChange = async (listId) => {
        setSelectedList(listId);
        setLoading(true);
        try {
            if (listId === null) {
                const response = await api.get('/prospects');
                if (response.data.success) {
                    const prospects = response.data.prospects || [];
                    setAllProspects(prospects);
                    setDisplayedProspects(prospects);
                }
            } else if (listProspects[listId]) {
                setAllProspects(listProspects[listId]);
                setDisplayedProspects(listProspects[listId]);
            } else {
                await fetchListProspects(listId);
            }
        } catch (error) {
            handleError(error, "Erreur lors du changement de liste");
            setAllProspects([]);
            setDisplayedProspects([]);
        } finally {
            setLoading(false);
        }
    };// ======= SECTION 5: GESTION DES PROSPECTS =======
    const handleFileUpload = async (data) => {
        try {
            setLoading(true);
            const formattedProspects = data.map(row => ({
                prenom: row[0] || 'Non disponible',
                nom: row[1] || 'Non disponible',
                email: row[2] || 'Non disponible',
                societe: row[3] || 'Non disponible',
                linkedin: row[4] || 'Non disponible'
            }));

            await Promise.all(
                formattedProspects.map(prospect =>
                    api.post('/prospects/add', prospect)
                )
            );

            await fetchProspects();
            setShowImportModal(false);
        } catch (error) {
            handleError(error, "Erreur lors de l'import des prospects");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer les prospects sélectionnés ?')) {
            return;
        }

        try {
            setLoading(true);
            await Promise.all(
                selectedProspects.map(id =>
                    api.delete(`/prospects/${id}`)
                )
            );

            await fetchProspects();
            setSelectedProspects([]);
        } catch (error) {
            handleError(error, "Erreur lors de la suppression des prospects");
        } finally {
            setLoading(false);
        }
    };

    // ======= SECTION 6: GESTION DES LISTES =======
    const createNewList = async (e) => {
        e.preventDefault();
        if (newListName.trim() === '') return;

        try {
            setLoading(true);
            const response = await api.post('/lists', { name: newListName });
            if (response.data.success) {
                setLists(prev => [...prev, response.data.list]);
                setNewListName('');
                setShowCreateListModal(false);
                setError('');
            }
        } catch (error) {
            handleError(error, "Erreur lors de la création de la liste");
        } finally {
            setLoading(false);
        }
    };

    const handleEditList = async (e) => {
        e.preventDefault();
        if (!editListName.trim() || !currentList) return;

        try {
            setLoading(true);
            const response = await api.put(`/lists/${currentList._id}`, {
                name: editListName
            });

            if (response.data.success) {
                setLists(prev => prev.map(list =>
                    list._id === currentList._id
                        ? { ...list, name: editListName }
                        : list
                ));
                setShowEditListModal(false);
                setEditListName('');
                setCurrentList(null);
            }
        } catch (error) {
            handleError(error, "Erreur lors de la modification de la liste");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteList = async (listId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) return;

        try {
            setLoading(true);
            const response = await api.delete(`/lists/${listId}`);

            if (response.data.success) {
                setLists(prev => prev.filter(list => list._id !== listId));
                if (selectedList === listId) {
                    setSelectedList(null);
                    await fetchProspects();
                }
                // Supprimer les prospects en cache pour cette liste
                setListProspects(prev => {
                    const newState = { ...prev };
                    delete newState[listId];
                    return newState;
                });
            }
        } catch (error) {
            handleError(error, "Erreur lors de la suppression de la liste");
        } finally {
            setLoading(false);
        }
    };

    const handleAddProspectsToList = async (listId) => {
        try {
            setLoading(true);
            const response = await api.post(`/lists/${listId}/prospects`, {
                prospectIds: selectedProspects
            });

            if (response.data.success) {
                // Mettre à jour le cache de la liste
                await fetchListProspects(listId);
                setShowAddToListModal(false);
                setSelectedProspects([]);
                if (selectedList === listId) {
                    await fetchProspects();
                }
            }
        } catch (error) {
            handleError(error, "Erreur lors de l'ajout des prospects à la liste");
        } finally {
            setLoading(false);
        }
    };

    // ======= SECTION 7: EFFETS =======
    useEffect(() => {
        if (!loading) {
            setDisplayedProspects(filteredProspects);
        }
    }, [filteredProspects, loading]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchProspects(true);
        }, REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [fetchProspects]);

    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    useEffect(() => {
        fetchProspects();
    }, [fetchProspects]);

    // ======= SECTION 8: RENDU DU COMPOSANT =======
    return (
        <div className="prospect-list-widget">
            <div className="list-header">
                <div className="refresh-controls">
                    <div className="last-update">
                        <Clock className="w-4 h-4" />
                        Dernière mise à jour: {new Date(lastUpdateTime).toLocaleTimeString()}
                    </div>
                    <button
                        className={`refresh-toggle ${autoRefreshEnabled ? 'enabled' : ''}`}
                        onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {autoRefreshEnabled ? 'Désactiver' : 'Activer'} l'actualisation auto
                    </button>
                    <button
                        className="manual-refresh"
                        onClick={() => fetchProspects()}
                        disabled={loading || isRefreshing}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualiser maintenant
                    </button>
                </div>
            </div>
            <div className="list-sidebar">
                <h3>Listes de Prospects</h3>
                <input
                    type="text"
                    placeholder="Rechercher une liste..."
                    value={listSearchTerm}
                    onChange={(e) => setListSearchTerm(e.target.value)}
                    className="list-search-input"
                />
                <ul className="list-names">
                    <li
                        onClick={() => handleListChange(null)}
                        className={`list-item ${!selectedList ? 'active' : ''}`}
                    >
                        <div className="list-item-content">
                            <List className="w-4 h-4" />
                            <span className="list-name">Tous les prospects</span>
                            <span className="list-count">({displayedProspects.length})</span>
                        </div>
                    </li>
                    {filteredLists.map(list => (
                        <li
                            key={list._id}
                            className={`list-item ${selectedList === list._id ? 'active' : ''}`}
                        >
                            <div
                                className="list-item-content"
                                onClick={() => handleListChange(list._id)}
                            >
                                <List className="w-4 h-4" />
                                <span className="list-name">{list.name}</span>
                                <span className="list-count">
                                    ({listProspects[list._id]?.length || 0})
                                </span>
                            </div>
                            <div className="list-actions">
                                <button
                                    className="icon-button edit"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentList(list);
                                        setEditListName(list.name);
                                        setShowEditListModal(true);
                                    }}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    className="icon-button delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteList(list._id);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => setShowCreateListModal(true)}
                    className="btn add-list-btn"
                >
                    <Plus className="w-4 h-4" />
                    Créer une liste
                </button>
            </div>

            <div className="main-content">
                <div className="prospect-actions">
                    <button onClick={() => setShowImportModal(true)} className="btn import-btn">
                        <Upload className="w-4 h-4" />
                        Importer des prospects
                    </button>
                    <button
                        onClick={handleDeleteSelected}
                        className={`btn delete-btn ${selectedProspects.length > 0 ? 'enabled' : 'disabled'}`}
                        disabled={loading || selectedProspects.length === 0}
                    >
                        <Trash2 className="w-4 h-4" />
                        Supprimer les prospects sélectionnés
                    </button>
                    {selectedProspects.length > 0 && (
                        <button
                            onClick={() => setShowAddToListModal(true)}
                            className="btn add-to-list-btn"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter à une liste
                        </button>
                    )}
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Rechercher un prospect..."
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className={`prospect-content ${showImportModal ? 'dimmed' : ''}`}>
                    {loading && !isRefreshing ? (
                        <div className="loading">Chargement...</div>
                    ) : (
                        <div className="prospect-table-container">
                            <table className="prospect-table">
                                <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={displayedProspects.length > 0 &&
                                                displayedProspects.every(prospect =>
                                                    selectedProspects.includes(prospect._id)
                                                )}
                                            onChange={() => {
                                                const allIds = displayedProspects.map(p => p._id);
                                                const allSelected = allIds.every(id =>
                                                    selectedProspects.includes(id)
                                                );
                                                setSelectedProspects(allSelected ? [] : allIds);
                                            }}
                                        />
                                    </th>
                                    <th>Photo</th>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Société</th>
                                    <th>LinkedIn</th>
                                </tr>
                                </thead>
                                <tbody>
                                {displayedProspects.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="no-results">
                                            Aucun prospect trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    displayedProspects.map((prospect) => (
                                        <tr key={prospect._id} className="prospect-row" onClick={() => handleProspectClick(prospect)}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProspects.includes(prospect._id)}
                                                    onChange={() => handleSelectProspect(prospect._id)}
                                                />
                                            </td>
                                            <td>
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${prospect.prenom}+${prospect.nom}&background=random`}
                                                    alt={`${prospect.prenom} ${prospect.nom}`}
                                                    className="prospect-avatar"
                                                />
                                            </td>
                                            <td>{prospect.prenom} {prospect.nom}</td>
                                            <td>{prospect.email || 'Non disponible'}</td>
                                            <td>{prospect.societe || 'Non disponible'}</td>
                                            <td>
                                                <a
                                                    href={prospect.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="linkedin-btn"
                                                >
                                                    Profil
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showImportModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Importer des prospects</h3>
                        <CSVReader
                            onFileLoaded={handleFileUpload}
                            cssClass="csv-reader-input"
                            label="Importer une liste CSV"
                            parserOptions={{ header: false }}
                        />
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="btn cancel-btn"
                                disabled={loading}
                            >
                                Fermer
                            </button>
                        </div>
                        {error && <p className="error-message">{error}</p>}
                    </div>
                </div>
            )}

            {showCreateListModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Créer une nouvelle liste</h3>
                        <form onSubmit={createNewList}>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    placeholder="Nom de la liste"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    className="new-list-input"
                                    autoFocus
                                />
                                {error && <p className="error-message">{error}</p>}
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="submit"
                                    className="btn save-btn"
                                    disabled={!newListName.trim() || loading}
                                >
                                    {loading ? 'Création...' : 'Créer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateListModal(false);
                                        setNewListName('');
                                        setError('');
                                    }}
                                    className="btn cancel-btn"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ajoutez cela juste avant la dernière balise fermante du composant */}
            {showProspectModal && selectedProspectDetails && (
                <ProspectDetailModal
                    prospect={selectedProspectDetails}
                    isOpen={showProspectModal}
                    onClose={() => setShowProspectModal(false)}
                />
            )}

            {showEditListModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Modifier la liste</h3>
                        <form onSubmit={handleEditList}>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    placeholder="Nom de la liste"
                                    value={editListName}
                                    onChange={(e) => setEditListName(e.target.value)}
                                    className="edit-list-input"
                                    autoFocus
                                />
                                {error && <p className="error-message">{error}</p>}
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="submit"
                                    className="btn save-btn"
                                    disabled={!editListName.trim() || loading}
                                >
                                    {loading ? 'Modification...' : 'Modifier'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditListModal(false);
                                        setEditListName('');
                                        setCurrentList(null);
                                        setError('');
                                    }}
                                    className="btn cancel-btn"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddToListModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Ajouter à une liste</h3>
                        <div className="modal-body">
                            <div className="lists-selection">
                                {filteredLists.map(list => (
                                    <button
                                        key={list._id}
                                        onClick={() => handleAddProspectsToList(list._id)}
                                        className="list-selection-btn"
                                        disabled={loading}
                                    >
                                        {list.name}
                                    </button>
                                ))}
                            </div>
                            {error && <p className="error-message">{error}</p>}
                        </div>
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowAddToListModal(false)}
                                className="btn cancel-btn"
                                disabled={loading}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProspectListWidget;