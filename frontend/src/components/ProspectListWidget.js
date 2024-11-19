// ProspectListWidget.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CSVReader from 'react-csv-reader';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { Search, RefreshCw, Clock, Upload, Trash2, Plus, Edit2, List, XCircle } from 'lucide-react';
import './ProspectListWidget.css';

const API_BASE_URL = 'http://localhost:5001/api';
const ITEMS_PER_PAGE = 100;
const LOAD_LIMIT = 100;    // Nombre d'éléments chargés avant d'attendre
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
    const [hasMore, setHasMore] = useState(true);

    // ======= SECTION 2: MEMOS ET CALCULS =======
    // Ces memos DOIVENT être déclarés AVANT les fonctions qui les utilisent
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
    const fetchLists = useCallback(async () => {
        try {
            const response = await api.get('/lists');
            if (response.data.success) {
                setLists(response.data.lists);
            }
        } catch (error) {
            handleError(error, "Erreur lors du chargement des listes de prospects");
        }
    }, [handleError]);

    const fetchProspects = useCallback(async (isAutoRefresh = false) => {
        if (isAutoRefresh && !autoRefreshEnabled) return;

        try {
            if (!isAutoRefresh) setLoading(true);
            setIsRefreshing(true);

            let response;
            if (selectedList) {
                response = await api.get(`/lists/${selectedList}`);
                if (response.data.success) {
                    const prospects = response.data.list.prospects;
                    setAllProspects(prospects);
                    setDisplayedProspects(prospects); // Affichez directement tous les prospects
                    onProspectsUpdate(prospects);
                    setLastUpdateTime(Date.now());
                }
            } else {
                response = await api.get('/prospects');
                if (response.data.success) {
                    setAllProspects(response.data.prospects);
                    setDisplayedProspects(response.data.prospects); // Affichez directement tous les prospects
                    onProspectsUpdate(response.data.prospects);
                    setLastUpdateTime(Date.now());
                }
            }
        } catch (error) {
            handleError(error, "Erreur lors du chargement des prospects");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedList, handleError, onProspectsUpdate, autoRefreshEnabled]);

    // ======= SECTION 5: GESTION DU SCROLL INFINI =======
    const loadMoreProspects = useCallback(async () => {
        const startIndex = displayedProspects.length;

        if (startIndex >= filteredProspects.length) {
            setHasMore(false);
            return;
        }

        setLoadingMore(true);
        try {
            // Charge les prospects en lot de 20
            const newProspects = filteredProspects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
            setDisplayedProspects(prev => [...prev, ...newProspects]);

            // Vérifie si la limite de 100 est atteinte
            const loadedCount = startIndex + ITEMS_PER_PAGE;
            if (loadedCount % LOAD_LIMIT === 0) {
                console.log(`Chargé ${loadedCount} prospects, en attente avant de continuer...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Attente de 2 secondes
            }

            setHasMore(loadedCount < filteredProspects.length);
        } finally {
            setLoadingMore(false);
        }
    }, [displayedProspects.length, filteredProspects]);

    const handleScroll = useCallback((e) => {
        if (!hasMore || loadingMore) return;

        const element = e.target;
        if (element.scrollHeight - element.scrollTop === element.clientHeight) {
            loadMoreProspects();
        }
    }, [hasMore, loadingMore, loadMoreProspects]);

    useEffect(() => {
        if (!loading && !loadingMore) {
            // Au lieu de limiter, affichez tous les prospects filtrés
            setDisplayedProspects(filteredProspects);
            setHasMore(false); // Désactive le chargement progressif
        }
    }, [filteredProspects, loading, loadingMore]);

    // ======= SECTION 6: GESTION DES PROSPECTS =======
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
    };// ======= SECTION 7: GESTION DES LISTES =======
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
                await fetchLists();
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

    // ======= SECTION 8: EFFETS =======
    useEffect(() => {
        if (!loading && !loadingMore) {
            const filtered = filteredProspects.slice(0, ITEMS_PER_PAGE);
            setDisplayedProspects(filtered);
            setHasMore(filteredProspects.length > ITEMS_PER_PAGE);
        }
    }, [filteredProspects, loading, loadingMore]);

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
    }, [fetchProspects, selectedList]);

    // ======= SECTION 9: RENDU DU COMPOSANT =======
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
                        onClick={() => {
                            setSelectedList(null);
                            fetchProspects();
                        }}
                        className={`list-item ${!selectedList ? 'active' : ''}`}
                    >
                        <div className="list-item-content">
                            <List className="w-4 h-4" />
                            <span className="list-name">Tous les prospects</span>
                            <span className="list-count">({allProspects.length})</span>
                        </div>
                    </li>
                    {filteredLists.map(list => (
                        <li
                            key={list._id}
                            className={`list-item ${selectedList === list._id ? 'active' : ''}`}
                        >
                            <div
                                className="list-item-content"
                                onClick={() => {
                                    setSelectedList(list._id);
                                    fetchProspects();
                                }}
                            >
                                <List className="w-4 h-4" />
                                <span className="list-name">{list.name}</span>
                                <span className="list-count">
                                    ({list.prospectsCount || 0})
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

                <div
                    className={`prospect-content ${showImportModal ? 'dimmed' : ''}`}
                    onScroll={handleScroll}
                >
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
                                        <tr key={prospect._id}>
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
                            parserOptions={{header: false}}
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