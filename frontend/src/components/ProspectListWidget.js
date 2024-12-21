// ProspectListWidget.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { Search, Upload, Trash2, Plus, Edit2, List, XCircle } from 'lucide-react';
import ProspectDetailModal from './ProspectDetailModal';
import { CreateListModal, ImportModal, AddToListModal, EditListModal } from './ModalComponents';

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
                linkedin: row[4] || 'Non disponible',
                source: row[5] || 'IMPORT'
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
        <div className="flex h-screen bg-gray-50 dark:bg-[#1a1f2e]">
            {/* Sidebar */}
            <div className="w-72 min-w-72 bg-white dark:bg-[#1a1f2e] border-r border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-4">
                    Listes de Prospects
                </h3>

                {/* Recherche de liste */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Rechercher une liste..."
                        value={listSearchTerm}
                        onChange={(e) => setListSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#262b3a] text-gray-900 dark:text-gray-200
                       placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-2
                       border border-gray-200 dark:border-gray-600
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>

                {/* Liste des prospects */}
                <div className="space-y-1">
                    <button
                        onClick={() => handleListChange(null)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                            !selectedList
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#262b3a]'
                        }`}
                    >
                        <div className="flex items-center space-x-3">
                            <List className="w-4 h-4" />
                            <span>Tous les prospects</span>
                        </div>
                        <span className="text-sm opacity-75">({displayedProspects.length})</span>
                    </button>

                    {/* Listes personnalisées */}
                    {filteredLists.map(list => (
                        <div
                            key={list._id}
                            className={`group flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                selectedList === list._id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#262b3a]'
                            }`}
                        >
                            <div
                                className="flex-1 flex items-center space-x-3 cursor-pointer"
                                onClick={() => handleListChange(list._id)}
                            >
                                <List className="w-4 h-4" />
                                <span>{list.name}</span>
                                <span className="text-sm opacity-75">
                  ({listProspects[list._id]?.length || 0})
                </span>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentList(list);
                                        setEditListName(list.name);
                                        setShowEditListModal(true);
                                    }}
                                    className="p-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteList(list._id);
                                    }}
                                    className="p-1 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bouton création de liste */}
                <button
                    onClick={() => setShowCreateListModal(true)}
                    className="w-full mt-4 flex items-center justify-center px-4 py-2
                     bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une liste
                </button>
            </div>

            {/* Contenu principal */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Barre d'actions */}
                <div className="p-4 bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white
                         rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Importer des prospects
                            </button>

                            {selectedProspects.length > 0 && (
                                <>
                                    <button
                                        onClick={handleDeleteSelected}
                                        className="flex items-center px-4 py-2 bg-red-600 text-white
                             rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer ({selectedProspects.length})
                                    </button>

                                    <button
                                        onClick={() => setShowAddToListModal(true)}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white
                             rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Ajouter à une liste
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Barre de recherche */}
                        <div className="relative w-96">
                            <input
                                type="text"
                                placeholder="Rechercher un prospect..."
                                onChange={(e) => debouncedSearch(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#262b3a] text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400 rounded-lg pl-10 pr-4 py-2
                         border border-gray-200 dark:border-gray-600
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600
                           dark:hover:text-gray-300"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table des prospects */}
                <div className="flex-1 overflow-hidden bg-white dark:bg-[#1a1f2e]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        </div>
                    ) : (
                        <div className="h-full overflow-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-gray-50 dark:bg-[#1a1f2e]
                                border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={displayedProspects.length > 0 &&
                                                displayedProspects.every(prospect => selectedProspects.includes(prospect._id))}
                                            onChange={() => {
                                                const allIds = displayedProspects.map(p => p._id);
                                                const allSelected = allIds.every(id => selectedProspects.includes(id));
                                                setSelectedProspects(allSelected ? [] : allIds);
                                            }}
                                            className="rounded border-gray-300 dark:border-gray-500
                                text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="w-16 px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                                        Photo
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                                        Nom
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                                        Société
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                                        LinkedIn
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {displayedProspects.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            Aucun prospect trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    displayedProspects.map((prospect) => (
                                        <tr
                                            key={prospect._id}
                                            onClick={() => handleProspectClick(prospect)}
                                            className="hover:bg-gray-50 dark:hover:bg-[#262b3a] cursor-pointer transition-colors"
                                        >
                                            <td className="w-10 px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProspects.includes(prospect._id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectProspect(prospect._id);
                                                    }}
                                                    className="rounded border-gray-300 dark:border-gray-500
                                    text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="w-16 px-4 py-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center
                                      text-white font-medium uppercase">
                                                    {prospect.prenom[0]}{prospect.nom[0]}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-gray-200">
                                                {prospect.prenom} {prospect.nom}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                {prospect.email || 'Non disponible'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-gray-200">
                                                {prospect.societe || 'Non disponible'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(prospect.linkedin, '_blank');
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg
                                     hover:bg-blue-700 transition-colors"
                                                >
                                                    Profil
                                                </button>
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
                <ImportModal
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onFileLoaded={handleFileUpload}
                    loading={loading}
                />
            )}

            {showCreateListModal && (
                <CreateListModal
                    show={showCreateListModal}
                    onClose={() => setShowCreateListModal(false)}
                    onSubmit={createNewList}
                    newListName={newListName}
                    setNewListName={setNewListName}
                    loading={loading}
                />
            )}

            {showEditListModal && (
                <EditListModal
                    show={showEditListModal}
                    onClose={() => {
                        setShowEditListModal(false);
                        setEditListName('');
                        setCurrentList(null);
                    }}
                    onSubmit={handleEditList}
                    editListName={editListName}
                    setEditListName={setEditListName}
                    loading={loading}
                />
            )}

            {showAddToListModal && (
                <AddToListModal
                    show={showAddToListModal}
                    onClose={() => setShowAddToListModal(false)}
                    lists={filteredLists}
                    onAddToList={handleAddProspectsToList}
                    loading={loading}
                />
            )}
            {showProspectModal && selectedProspectDetails && (
                <ProspectDetailModal
                    prospect={selectedProspectDetails}
                    isOpen={showProspectModal}
                    onClose={() => setShowProspectModal(false)}
                />
            )}
        </div>
    );
};

export default ProspectListWidget;