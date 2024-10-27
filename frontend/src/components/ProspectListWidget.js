// src/components/ProspectListWidget.js
import React, { useState } from 'react';
import Papa from 'papaparse';
import './ProspectListWidget.css';

const ProspectListWidget = () => {
    const [prospects, setProspects] = useState([]);

    // Fonction de gestion du fichier importé
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data;
                    setProspects(data); // Enregistrer les données des prospects
                },
                error: (error) => {
                    console.error("Erreur lors de l'analyse du fichier CSV :", error);
                }
            });
        }
    };

    return (
        <div className="prospect-list-widget">
            <h3>Liste des Prospects</h3>

            {/* Bouton d'importation */}
            <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="csvUpload"
            />
            <label htmlFor="csvUpload" className="import-button">
                Importer une liste CSV
            </label>

            {/* Affichage de la liste des prospects */}
            <div className="prospect-list">
                {prospects.length > 0 ? (
                    <table>
                        <thead>
                        <tr>
                            {Object.keys(prospects[0]).map((key) => (
                                <th key={key}>{key}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {prospects.map((prospect, index) => (
                            <tr key={index}>
                                {Object.values(prospect).map((value, idx) => (
                                    <td key={idx}>{value}</td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Aucun prospect importé.</p>
                )}
            </div>
        </div>
    );
};

export default ProspectListWidget;
