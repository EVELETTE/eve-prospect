// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import ForgotPassword from './components/ForgotPassword'; // Importer la page ForgotPassword
import ResetPassword from './components/ResetPassword';   // Importer la page ResetPassword
import PrivateRoute from './components/PrivateRoute';
import './index.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Nouvelle route */}
                <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* Nouvelle route */}

                {/* Routes protégées */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <PrivateRoute>
                            <Settings />
                        </PrivateRoute>
                    }
                />

                {/* Page par défaut */}
                <Route path="/" element={<Login />} />
            </Routes>
        </Router>
    );
}

export default App;
