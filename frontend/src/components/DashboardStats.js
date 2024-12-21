import React, { useState, useMemo, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, TrendingUp, Users, MessageCircle, Award, LucideProps } from 'lucide-react';
import { Area, AreaChart } from 'recharts';

const TimeFilter = ({ activeFilter, onFilterChange }) => {
    const filters = [
        { id: '7j', label: '7 jours' },
        { id: '30j', label: '30 jours' },
        { id: '90j', label: '90 jours' },
        { id: 'all', label: 'Tout' }
    ];

    return (
        <div className="flex space-x-2">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 
                        ${activeFilter === filter.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
};

const useFilteredStats = (prospects = [], timeFilter) => {
    return useMemo(() => {
        const filterByPeriod = (data, days) => {
            if (days === Infinity) return data;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            return data.filter(p => new Date(p.createdAt) >= cutoffDate);
        };

        const filterDays = {
            '7j': 7,
            '30j': 30,
            '90j': 90,
            'all': Infinity
        };

        const days = filterDays[timeFilter] || Infinity;
        const filteredProspects = filterByPeriod(prospects, days);
        const previousProspects = filterByPeriod(prospects, days * 2).filter(p =>
            new Date(p.createdAt) < new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
        );

        const calculateRates = (data) => {
            const total = data.length;
            const counts = data.reduce((acc, p) => {
                acc[p.status] = (acc[p.status] || 0) + 1;
                return acc;
            }, {});

            const calculateRate = (status) =>
                Math.round((counts[status] || 0) / (total || 1) * 100);

            return {
                total,
                contacted: calculateRate('contacté'),
                interested: calculateRate('intéressé'),
                converted: calculateRate('converti')
            };
        };

        const currentStats = calculateRates(filteredProspects);
        const previousStats = calculateRates(previousProspects);

        const calculateTrend = (current, previous) =>
            previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);

        return {
            currentStats,
            previousStats,
            trends: {
                total: calculateTrend(currentStats.total, previousStats.total),
                contacted: calculateTrend(currentStats.contacted, previousStats.contacted),
                interested: calculateTrend(currentStats.interested, previousStats.interested),
                converted: calculateTrend(currentStats.converted, previousStats.converted)
            },
            filteredProspects
        };
    }, [prospects, timeFilter]);
};

const StatCard = ({ title, value, subtitle, color, trend }) => {
    const trendColor = trend > 0 ? 'text-green-500' : 'text-red-500';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
            <h3 className="text-sm text-gray-600 dark:text-gray-400">{title}</h3>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
            <div className="flex items-center mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                {trend && (
                    <span className={`ml-2 text-sm font-medium ${trendColor}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </motion.div>
    );
};

const MetricCard = ({ title, value, maxValue, color }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900/50 rounded-lg p-4"
    >
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
        <div className="flex justify-between items-center mt-2">
            <span className="text-gray-300">{value}</span>
            <span className={`font-bold ${color}`}>{maxValue}%</span>
        </div>
        <div className="relative w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${maxValue}%` }}
                transition={{ duration: 1 }}
                className={`absolute h-full rounded-full ${color.replace('text', 'bg')}`}
            />
        </div>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
            {payload.map((entry, index) => (
                <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
                    {entry.name}: {entry.value}
                    {typeof entry.value === 'number' && !entry.name.includes('%') ? '' : '%'}
                </p>
            ))}
        </div>
    );
};

const DashboardStats = ({ prospects = [] }) => {
    const [timeFilter, setTimeFilter] = useState('7j');
    const [activeChart, setActiveChart] = useState(null);
    const { currentStats, previousStats, trends, filteredProspects } = useFilteredStats(prospects, timeFilter);

    // Activité hebdomadaire
    const activityData = useMemo(() => {
        const baseProspects = Math.round(currentStats.total / 7);
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        return days.map(day => ({
            name: day,
            prospects: Math.max(5, baseProspects + Math.floor(Math.random() * 10 - 5)),
            messages: Math.max(3, Math.floor(baseProspects * 0.7 + Math.random() * 8 - 4)),
            connexions: Math.max(2, Math.floor(baseProspects * 0.4 + Math.random() * 6 - 3))
        }));
    }, [currentStats.total]);

    // Données de l'entonnoir
    const funnelData = useMemo(() => [
        { name: 'Prospects', value: currentStats.total },
        { name: 'Contactés', value: Math.round(currentStats.total * currentStats.contacted / 100) },
        { name: 'Intéressés', value: Math.round(currentStats.total * currentStats.interested / 100) },
        { name: 'Convertis', value: Math.round(currentStats.total * currentStats.converted / 100) }
    ], [currentStats]);

    // Sources des prospects
    const sourceData = [
        { name: 'LinkedIn', value: 65, color: '#0077B5' },
        { name: 'Recommandations', value: 20, color: '#00A0DC' },
        { name: 'Site Web', value: 15, color: '#0066FF' }
    ];

    // Nouvelles données pour les métriques de performance
    const performanceMetrics = [
        {
            title: "Efficacité des messages",
            value: "Taux de réponse",
            maxValue: Math.round(currentStats.contacted),
            color: "text-blue-500"
        },
        {
            title: "Taux d'engagement",
            value: "Interactions",
            maxValue: Math.round(currentStats.interested),
            color: "text-green-500"
        },
        {
            title: "Score de conversion",
            value: "Pipeline",
            maxValue: Math.round(currentStats.converted),
            color: "text-purple-500"
        }
    ];

    // Données de croissance mensuelle
    const growthData = useMemo(() => {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
        return months.map(month => ({
            name: month,
            prospects: Math.floor(Math.random() * 50) + 50,
            objectif: 75
        }));
    }, []);

    if (!prospects || prospects.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
            >
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Aucune donnée disponible
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    Commencez par ajouter des prospects à votre base de données.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header avec filtres */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Vue d'ensemble
                </h2>
                <TimeFilter
                    activeFilter={timeFilter}
                    onFilterChange={setTimeFilter}
                />
            </div>

            {/* Cartes de statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Users />}
                    title="Total Prospects"
                    value={currentStats.total}
                    subtitle={`vs ${previousStats.total} période précédente`}
                    color="text-blue-500"
                    trend={trends.total}
                />
                <StatCard
                    icon={<TrendingUp />}
                    title="Taux de Contact"
                    value={`${currentStats.contacted}%`}
                    subtitle={`vs ${previousStats.contacted}% période précédente`}
                    color="text-green-500"
                    trend={trends.contacted}
                />
                <StatCard
                    icon={<MessageCircle />}
                    title="Taux d'Intérêt"
                    value={`${currentStats.interested}%`}
                    subtitle={`vs ${previousStats.interested}% période précédente`}
                    color="text-yellow-500"
                    trend={trends.interested}
                />
                <StatCard
                    icon={<Award />}
                    title="Taux de Conversion"
                    value={`${currentStats.converted}%`}
                    subtitle={`vs ${previousStats.converted}% période précédente`}
                    color="text-purple-500"
                    trend={trends.converted}
                />
            </div>

            {/* Grille de graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activité Hebdomadaire */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                        Activité Hebdomadaire
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer>
                            <LineChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="prospects"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={{ fill: "#3B82F6" }}
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="messages"
                                    stroke="#60A5FA"
                                    strokeWidth={2}
                                    dot={{ fill: "#60A5FA" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="connexions"
                                    stroke="#93C5FD"
                                    strokeWidth={2}
                                    dot={{ fill: "#93C5FD" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Entonnoir de conversion */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                        Entonnoir de Conversion
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer>
                            <BarChart data={funnelData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="value"
                                    fill="#3B82F6"
                                    radius={[0, 4, 4, 0]}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Distribution des sources */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                        Sources des Prospects
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {sourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Croissance mensuelle */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                        Croissance Mensuelle
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer>
                            <AreaChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="prospects"
                                    stroke="#3B82F6"
                                    fill="#3B82F6"
                                    fillOpacity={0.3}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="objectif"
                                    stroke="#10B981"
                                    fill="#10B981"
                                    fillOpacity={0.3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Métriques de performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-6">
                    Métriques de Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {performanceMetrics.map((metric, index) => (
                        <MetricCard
                            key={index}
                            title={metric.title}
                            value={metric.value}
                            maxValue={metric.maxValue}
                            color={metric.color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;