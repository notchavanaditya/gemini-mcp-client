import React from 'react';
import { 
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useSettings } from '../contexts/SettingsContext';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentPath: string;
}

const getPageTitle = (path: string): string => {
  switch (path) {
    case '/':
    case '/chat':
      return 'AI Chat';
    case '/extensions':
      return 'Extension Store';
    case '/files':
      return 'File Manager';
    case '/settings':
      return 'Settings';
    default:
      return 'Gemini MCP Client';
  }
};

export const Header: React.FC<HeaderProps> = ({ 
  sidebarOpen, 
  toggleSidebar, 
  currentPath 
}) => {
  const { settings } = useSettings();

  return (
    <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold text-white">
            {getPageTitle(currentPath)}
          </h1>
          {currentPath === '/chat' && (
            <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
              {settings.defaultModel}
            </span>
          )}
        </div>
      </div>

      {/* Center - Search (for some pages) */}
      {(currentPath === '/extensions' || currentPath === '/files') && (
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={currentPath === '/extensions' ? 'Search extensions...' : 'Search files...'}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center space-x-3">
        {/* API Key Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            settings.apiKey ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-400">
            {settings.apiKey ? 'API Key Set' : 'No API Key'}
          </span>
        </div>

        {/* Notifications */}
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
            2
          </span>
        </button>

        {/* User Menu */}
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
          <UserCircleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};