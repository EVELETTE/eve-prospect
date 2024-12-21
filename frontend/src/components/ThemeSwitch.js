// src/components/ThemeToggle.js
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

// Le type de thème peut être 'light', 'dark' ou 'system'

const ThemeToggle = ({ theme, onThemeChange }) => {
    return (
        <div className="theme-switch-container">
            <div className="theme-switch-track">
                <div className="theme-options">
                    <button
                        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => onThemeChange('light')}
                        aria-label="Mode clair"
                    >
                        <Sun size={16} />
                    </button>
                    <button
                        className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                        onClick={() => onThemeChange('system')}
                        aria-label="Mode système"
                    >
                        <Monitor size={16} />
                    </button>
                    <button
                        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => onThemeChange('dark')}
                        aria-label="Mode sombre"
                    >
                        <Moon size={16} />
                    </button>
                </div>
            </div>
            <div className="theme-labels">
                <span>Clair</span>
                <span>Auto</span>
                <span>Sombre</span>
            </div>
        </div>
    );
};


export default ThemeToggle;