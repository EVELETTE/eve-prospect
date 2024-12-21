import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, FileText, MessageCircle, Package, Settings, HelpCircle, LogOut } from 'lucide-react';
import ThemeSwitch from './ThemeSwitch';

const NavItem = ({ icon, label, to, badge, isActive }) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(to)}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 ease-in-out
                group
                ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
            `}
        >
            <div className={`
                flex items-center justify-center
                ${isActive
                ? 'text-white'
                : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
            }
            `}>
                {icon}
            </div>

            <span className="flex-1 text-left text-sm font-medium">{label}</span>

            {badge && (
                <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${isActive
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                }
                `}>
                    {badge}
                </span>
            )}
        </button>
    );
};

const Sidebar = ({ logo, onLogout }) => {
    const location = useLocation();
    const currentPath = location.pathname.slice(1) || 'dashboard';

    // Gestion du thème
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system';
    });

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Effet pour gérer le thème système
    useEffect(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            };

            handleChange(mediaQuery);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    const navItems = [
        { icon: <Home size={20} />, label: "Dashboard", path: "dashboard" },
        { icon: <Users size={20} />, label: "Prospects", path: "prospects" },
        { icon: <FileText size={20} />, label: "Campaigns", path: "campaigns" },
        { icon: <MessageCircle size={20} />, label: "Messages", path: "messages", badge: "2" },
        { icon: <Package size={20} />, label: "Products", path: "products" },
        { icon: <Settings size={20} />, label: "Settings", path: "settings" },
        { icon: <HelpCircle size={20} />, label: "Help", path: "help" }
    ];

    return (
        <aside className="fixed top-0 left-0 flex flex-col h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Logo Section */}
            <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
                <img
                    src={logo}
                    alt="Logo"
                    className="h-8 w-auto transition-transform duration-200 hover:scale-105"
                />
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {navItems.slice(0, 5).map((item) => (
                    <NavItem
                        key={item.path}
                        icon={item.icon}
                        label={item.label}
                        to={`/${item.path}`}
                        badge={item.badge}
                        isActive={currentPath === item.path}
                    />
                ))}

                {/* Divider */}
                <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

                {navItems.slice(5).map((item) => (
                    <NavItem
                        key={item.path}
                        icon={item.icon}
                        label={item.label}
                        to={`/${item.path}`}
                        isActive={currentPath === item.path}
                    />
                ))}
            </nav>

            {/* Theme Switch */}
            <div className="mt-auto">
                <ThemeSwitch theme={theme} onThemeChange={handleThemeChange} />

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                            text-gray-600 dark:text-gray-300
                            hover:bg-red-50 dark:hover:bg-red-900/20
                            hover:text-red-600 dark:hover:text-red-400
                            transition-all duration-200 ease-in-out
                            group"
                    >
                        <LogOut size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;