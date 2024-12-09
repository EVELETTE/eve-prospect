import React, { useMemo } from 'react';
import './DashboardStats.css';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const DashboardStats = ({ prospects }) => {
    // Calcul des stats
    const stats = useMemo(() => {
        const total = prospects.length;
        const statusCounts = prospects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {});

        const contactedRate = Math.round((statusCounts['contacté'] || 0) / total * 100) || 0;
        const interestedRate = Math.round((statusCounts['intéressé'] || 0) / total * 100) || 0;
        const convertedRate = Math.round((statusCounts['converti'] || 0) / total * 100) || 0;

        return { total, contactedRate, interestedRate, convertedRate };
    }, [prospects]);

    // Données des graphiques
    const getActivityData = () => {
        const baseProspects = Math.round(stats.total / 7);
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        return days.map(day => ({
            name: day,
            prospects: Math.max(5, baseProspects + Math.floor(Math.random() * 10 - 5)),
            messages: Math.max(3, Math.floor(baseProspects * 0.7 + Math.random() * 8 - 4)),
            connexions: Math.max(2, Math.floor(baseProspects * 0.4 + Math.random() * 6 - 3))
        }));
    };

    const getFunnelData = () => [
        { name: 'Prospects', value: stats.total },
        { name: 'Contactés', value: Math.round(stats.total * stats.contactedRate / 100) },
        { name: 'Intéressés', value: Math.round(stats.total * stats.interestedRate / 100) },
        { name: 'Convertis', value: Math.round(stats.total * stats.convertedRate / 100) }
    ];

    const getSourceData = () => [
        { name: 'LinkedIn', value: 65, color: '#0077B5' },
        { name: 'Recommandations', value: 20, color: '#00A0DC' },
        { name: 'Site Web', value: 15, color: '#0066FF' }
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="tooltip-value" style={{ color: entry.color || entry.fill }}>
                            {entry.name}: {entry.value}
                            {typeof entry.value === 'number' && !entry.name.includes('%') ? '' : '%'}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="stats-dashboard">
            {/* Stats Row - Nouvelle disposition horizontale */}
            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-title">Total Prospects</div>
                    <div className="stat-value text-primary">{stats.total}</div>
                    <div className="stat-subtitle">Base totale</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title">Taux de Contact</div>
                    <div className="stat-value text-green">{stats.contactedRate}%</div>
                    <div className="stat-subtitle">Prospects contactés</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title">Taux d'Intérêt</div>
                    <div className="stat-value text-yellow">{stats.interestedRate}%</div>
                    <div className="stat-subtitle">Prospects intéressés</div>
                </div>
                <div className="stat-item">
                    <div className="stat-title">Taux de Conversion</div>
                    <div className="stat-value text-purple">{stats.convertedRate}%</div>
                    <div className="stat-subtitle">Prospects convertis</div>
                </div>
            </div>

            {/* Graphiques */}
            <div className="charts-grid">
                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Activité Hebdomadaire</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getActivityData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" />
                            <YAxis stroke="var(--text-secondary)" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="prospects"
                                stroke="var(--primary-blue)"
                                strokeWidth={2}
                                dot={{ fill: "var(--primary-blue)" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="messages"
                                stroke="var(--secondary-blue)"
                                strokeWidth={2}
                                dot={{ fill: "var(--secondary-blue)" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="connexions"
                                stroke="var(--tertiary-blue)"
                                strokeWidth={2}
                                dot={{ fill: "var(--tertiary-blue)" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Entonnoir de Prospection</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={getFunnelData()}
                            layout="vertical"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                            <XAxis type="number" stroke="var(--text-secondary)" />
                            <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="value"
                                fill="var(--primary-blue)"
                                radius={[0, 4, 4, 0]}
                                barSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Sources des Prospects</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={getSourceData()}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {getSourceData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Métriques de Performance</h3>
                    </div>
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <h4 className="metric-header">Efficacité des messages</h4>
                            <div className="metric-value-container">
                                <span className="metric-name">Taux de réponse</span>
                                <span className="metric-value">42%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill blue" style={{ width: '42%' }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <h4 className="metric-header">Vitesse de traitement</h4>
                            <div className="metric-value-container">
                                <span className="metric-name">Temps moyen de réponse</span>
                                <span className="metric-value">2.4j</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill green" style={{ width: '75%' }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <h4 className="metric-header">Qualité des prospects</h4>
                            <div className="metric-value-container">
                                <span className="metric-name">Score moyen</span>
                                <span className="metric-value">8.5/10</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill yellow" style={{ width: '85%' }}></div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <h4 className="metric-header">Taux de conversion</h4>
                            <div className="metric-value-container">
                                <span className="metric-name">Objectif mensuel</span>
                                <span className="metric-value">{stats.convertedRate}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill purple" style={{ width: `${stats.convertedRate}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;