import React from 'react';
import { X, Upload, List, Plus } from 'lucide-react';

export const CreateListModal = ({ show, onClose, onSubmit, newListName, setNewListName, loading }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl"
                 onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Créer une nouvelle liste
                        </h3>
                        <button onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Nom de la liste"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200
                         dark:border-gray-600 bg-white dark:bg-gray-700
                         text-gray-900 dark:text-white focus:ring-2
                         focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700
                         dark:text-gray-200 hover:bg-gray-100
                         dark:hover:bg-gray-700 rounded-lg"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={!newListName.trim() || loading}
                                className="px-4 py-2 text-sm font-medium text-white
                         bg-blue-600 hover:bg-blue-700 rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Création...' : 'Créer la liste'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export const ImportModal = ({ show, onClose, onFileLoaded, loading }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Importer des prospects
                        </h3>
                        <button onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600
                          rounded-lg p-8 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <label className="mt-4 block">
                <span className="mt-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Sélectionnez un fichier CSV
                </span>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        if (file) onFileLoaded([file]);
                                    }}
                                    className="sr-only"
                                />
                            </label>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                CSV jusqu'à 10MB
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700
                         dark:text-gray-200 hover:bg-gray-100
                         dark:hover:bg-gray-700 rounded-lg"
                                disabled={loading}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AddToListModal = ({ show, onClose, lists, onAddToList, loading }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Ajouter à une liste
                        </h3>
                        <button onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {lists.map(list => (
                            <button
                                key={list._id}
                                onClick={() => onAddToList(list._id)}
                                disabled={loading}
                                className="w-full flex items-center space-x-3 px-4 py-3
                         rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                         text-gray-700 dark:text-gray-200 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <List className="w-5 h-5 text-gray-400" />
                                <span className="flex-1 text-left">{list.name}</span>
                                <Plus className="w-4 h-4" />
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700
                       dark:text-gray-200 hover:bg-gray-100
                       dark:hover:bg-gray-700 rounded-lg"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const EditListModal = ({ show, onClose, onSubmit, editListName, setEditListName, loading }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl"
                 onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Modifier la liste
                        </h3>
                        <button onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Nom de la liste"
                                value={editListName}
                                onChange={e => setEditListName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200
                         dark:border-gray-600 bg-white dark:bg-gray-700
                         text-gray-900 dark:text-white focus:ring-2
                         focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700
                         dark:text-gray-200 hover:bg-gray-100
                         dark:hover:bg-gray-700 rounded-lg"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={!editListName.trim() || loading}
                                className="px-4 py-2 text-sm font-medium text-white
                         bg-blue-600 hover:bg-blue-700 rounded-lg
                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Modification...' : 'Modifier'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const modalComponents = {
    CreateListModal,
    ImportModal,
    AddToListModal,
    EditListModal
};

export default modalComponents;