// src/components/ProtectedPage.js
import React from 'react';

const ProtectedPage = () => {
    return (
        <div>
            <h2>Page protégée</h2>
            <p>Seuls les utilisateurs connectés peuvent voir cette page.</p>
        </div>
    );
};

export default ProtectedPage;
