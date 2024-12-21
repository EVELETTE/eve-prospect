import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeSwitch = ({ theme, onThemeChange }) => {
    const options = [
        { value: 'light', icon: Sun, label: 'Clair' },
        { value: 'system', icon: Monitor, label: 'Auto' },
        { value: 'dark', icon: Moon, label: 'Sombre' }
    ];

    return (
        <div className="px-3 py-4 border-t border-gray-700 dark:border-gray-800 mt-auto">
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Thème
                    </span>
                </div>

                <div className="flex gap-2 justify-between">
                    {options.map(({ value, icon: Icon, label }) => (
                        <button
                            key={value}
                            onClick={() => onThemeChange(value)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg flex-1
                                transition-all duration-200 
                                ${theme === value
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                        >
                            <Icon className={`w-5 h-5 mb-1 ${theme === value ? 'scale-110' : 'scale-100'}`} />
                            <span className="text-xs font-medium">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThemeSwitch;