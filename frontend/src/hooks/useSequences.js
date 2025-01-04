// hooks/useSequences.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api/automation',
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

export const useSequences = (prospectId) => {
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSequences = useCallback(async () => {
        try {
            const response = await api.get('/sequences', {
                params: { prospectId }
            });
            setSequences(response.data.sequences);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des séquences');
        } finally {
            setLoading(false);
        }
    }, [prospectId]);

    const createSequence = async (sequenceData) => {
        try {
            const response = await api.post('/sequences', {
                ...sequenceData,
                prospectId
            });
            await fetchSequences();
            return response.data.sequence;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Erreur lors de la création de la séquence');
        }
    };

    const updateSequence = async (sequenceId, updates) => {
        try {
            const response = await api.put(`/sequences/${sequenceId}`, updates);
            await fetchSequences();
            return response.data.sequence;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Erreur lors de la mise à jour de la séquence');
        }
    };

    const deleteSequence = async (sequenceId) => {
        try {
            await api.delete(`/sequences/${sequenceId}`);
            setSequences(prev => prev.filter(seq => seq._id !== sequenceId));
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Erreur lors de la suppression de la séquence');
        }
    };

    const controlSequence = async (sequenceId, action) => {
        try {
            const response = await api.post(`/sequences/${sequenceId}/${action}`);
            await fetchSequences();
            return response.data.sequence;
        } catch (err) {
            throw new Error(err.response?.data?.message || `Erreur lors de l'action ${action}`);
        }
    };

    useEffect(() => {
        fetchSequences();
    }, [fetchSequences]);

    return {
        sequences,
        loading,
        error,
        createSequence,
        updateSequence,
        deleteSequence,
        startSequence: (id) => controlSequence(id, 'start'),
        pauseSequence: (id) => controlSequence(id, 'pause'),
        resumeSequence: (id) => controlSequence(id, 'resume'),
        refreshSequences: fetchSequences
    };
};