// src/components/StatCard.js
import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, value, label, onClick }) => {
    return (
        <div className="stat-card" onClick={onClick}>
            <div className="stat-card-header">
                <div className="stat-card-value">{value}</div>
            </div>
            <div className="stat-card-label">{label}</div>
        </div>
    );
};

export default StatCard;
