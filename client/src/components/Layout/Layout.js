import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '../../contexts/AppContext';

const Layout = ({ children, isDarkMode, setIsDarkMode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { state } = useApp();

  const isWelcomePage = location.pathname === '/';

  if (isWelcomePage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-900">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-white dark:bg-dark-800">
          {children}
        </main>
        
        {/* Status Bar */}
        <div className="h-6 bg-gray-100 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 flex items-center justify-between px-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span className={`flex items-center space-x-1 ${
              state.isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                state.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span>{state.isConnected ? 'Connected' : 'Disconnected'}</span>
            </span>
            
            {state.installedExtensions.length > 0 && (
              <span>
                {state.installedExtensions.filter(ext => ext.enabled).length} extensions active
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {state.selectedFile && (
              <span>
                {state.selectedFile.name}
              </span>
            )}
            
            <span>
              Gemini MCP Client v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;