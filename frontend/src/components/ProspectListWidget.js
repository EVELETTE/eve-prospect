import React, { useState, useEffect } from 'react';
import CSVReader from 'react-csv-reader';
import axios from 'axios';
import './ProspectListWidget.css';

const ProspectListWidget = () => {
    const [prospects, setProspects] = useState([]);
    const [listName, setListName] = useState('');
    const [error, setError] = useState('');
    const [isImportMode, setIsImportMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Charger les prospects depuis le backend
    const fetchProspects = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/prospects', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setProspects(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des prospects:', error);
        }
    };

    useEffect(() => {
        fetchProspects();
    }, []);

    const handleFileUpload = (data) => {
        const cleanedData = data.map((prospect) => ({
            nom: prospect[0],
            prenom: prospect[1],
            email: prospect[2],
            societe: prospect[3],
            linkedin: prospect[4]
        }));
        setProspects(cleanedData);
    };

    const handleSaveList = async () => {
        if (!listName) {
            setError('Nom de la liste est obligatoire.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5001/api/prospects/add', {
                listName,
                prospects
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setError('');
            alert(response.data.message);
            setListName('');
            setProspects([]);
            fetchProspects();
            setIsImportMode(false);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la liste:', error);
            setError('Erreur lors de l\'enregistrement de la liste.');
        }
    };

    const filteredProspects = prospects.filter((prospect) =>
        prospect.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.societe.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="prospect-list-widget">
            <button onClick={() => setIsImportMode(!isImportMode)} className="import-btn">
                {isImportMode ? 'Annuler' : 'Importer des prospects'}
            </button>

            {isImportMode && (
                <div className="import-section">
                    <input
                        type="text"
                        placeholder="Nom de la liste (obligatoire)"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        className="input-list-name"
                    />
                    <CSVReader
                        onFileLoaded={handleFileUpload}
                        cssClass="csv-reader-input"
                        label="Importer une liste CSV"
                        inputId="csv-upload"
                        inputStyle={{ color: 'blue' }}
                    />
                    <button onClick={handleSaveList} className="save-list-btn">Enregistrer la liste</button>
                    {error && <p className="error-message">{error}</p>}
                </div>
            )}

            {/* Barre de recherche */}
            <input
                type="text"
                placeholder="Rechercher un prospect..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar"
            />

            <div className="prospect-table-container">
                <h4>Liste des Prospects</h4>
                {filteredProspects.length > 0 ? (
                    <table className="prospect-table">
                        <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Email</th>
                            <th>Société</th>
                            <th>LinkedIn</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredProspects.map((prospect, index) => (
                            <tr key={index}>
                                <td>{prospect.nom}</td>
                                <td>{prospect.prenom}</td>
                                <td>{prospect.email}</td>
                                <td>{prospect.societe}</td>
                                <td>{prospect.linkedin}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-prospects-message">Aucun prospect correspondant à la recherche.</p>
                )}
            </div>
        </div>
    );
};

export default ProspectListWidget;