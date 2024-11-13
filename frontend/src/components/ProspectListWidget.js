import React, { useState } from 'react';
import CSVReader from 'react-csv-reader';
import axios from 'axios';
import './ProspectListWidget.css';

const ProspectListWidget = ({ prospects, onProspectsUpdate }) => {
    const [selectedProspects, setSelectedProspects] = useState([]);
    const [showImportSection, setShowImportSection] = useState(false);
    const [listName, setListName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (data) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const formattedProspects = data.map(row => ({
                prenom: row[0] || 'Non disponible',
                nom: row[1] || 'Non disponible',
                email: row[2] || 'Non disponible',
                societe: row[3] || 'Non disponible',
                linkedin: row[4] || 'Non disponible'
            }));

            for (const prospect of formattedProspects) {
                await axios.post('http://localhost:5001/api/prospects/add', prospect, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            // Rafraîchir la liste des prospects
            const response = await axios.get('http://localhost:5001/api/prospects', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                onProspectsUpdate(response.data.prospects);
                setError('');
                setShowImportSection(false);
            }
        } catch (error) {
            console.error("Erreur lors de l'import des prospects:", error);
            setError("Erreur lors de l'import des prospects");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            for (const id of selectedProspects) {
                await axios.delete(`http://localhost:5001/api/prospects/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            // Rafraîchir la liste des prospects
            const response = await axios.get('http://localhost:5001/api/prospects', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                onProspectsUpdate(response.data.prospects);
                setSelectedProspects([]);
                setError('');
            }
        } catch (error) {
            console.error("Erreur lors de la suppression des prospects:", error);
            setError("Erreur lors de la suppression des prospects");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProspect = (id) => {
        setSelectedProspects(prev =>
            prev.includes(id)
                ? prev.filter(prospectId => prospectId !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="prospect-list-widget">
            <div className="prospect-actions">
                <button
                    onClick={() => setShowImportSection(!showImportSection)}
                    className="toggle-import-btn"
                    disabled={loading}
                >
                    Importer des prospects
                </button>
                <button
                    onClick={handleDeleteSelected}
                    className={`delete-btn ${selectedProspects.length > 0 ? 'enabled' : 'disabled'}`}
                    disabled={loading || selectedProspects.length === 0}
                >
                    Supprimer les prospects sélectionnés
                </button>
            </div>

            {showImportSection && (
                <div className="import-section-dropdown">
                    <CSVReader
                        onFileLoaded={handleFileUpload}
                        cssClass="csv-reader-input"
                        label="Importer une liste CSV"
                        parserOptions={{ header: false }}
                    />
                    {error && <p className="error-message">{error}</p>}
                </div>
            )}

            <div className={`prospect-content ${showImportSection ? 'dimmed' : ''}`}>
                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : (
                    <div className="prospect-table-container">
                        <table className="prospect-table">
                            <thead>
                            <tr>
                                <th>Sélectionner</th>
                                <th>Prénom</th>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Société</th>
                                <th>LinkedIn</th>
                            </tr>
                            </thead>
                            <tbody>
                            {prospects.map((prospect) => (
                                <tr key={prospect._id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedProspects.includes(prospect._id)}
                                            onChange={() => handleSelectProspect(prospect._id)}
                                        />
                                    </td>
                                    <td>{prospect.prenom}</td>
                                    <td>{prospect.nom}</td>
                                    <td>{prospect.email}</td>
                                    <td>{prospect.societe}</td>
                                    <td>{prospect.linkedin}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProspectListWidget;