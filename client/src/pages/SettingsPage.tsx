import React, { useState } from 'react';
import { 
  KeyIcon,
  CpuChipIcon,
  PaintBrushIcon,
  BellIcon,
  FolderIcon,
  ServerIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useSettings } from '../contexts/SettingsContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { connectionStatus } = useWebSocket();
  const [activeTab, setActiveTab] = useState('general');
  const [testingApiKey, setTestingApiKey] = useState(false);

  const tabs = [
    { id: 'general', name: 'General', icon: CpuChipIcon },
    { id: 'api', name: 'API Keys', icon: KeyIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'files', name: 'File System', icon: FolderIcon },
    { id: 'mcp', name: 'MCP Servers', icon: ServerIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  const testApiKey = async () => {
    if (!settings.apiKey) {
      toast.error('Please enter an API key first');
      return;
    }

    setTestingApiKey(true);
    try {
      const response = await fetch('/api/gemini/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: settings.apiKey })
      });

      const result = await response.json();
      
      if (result.valid) {
        toast.success(`API key is valid! Found ${result.modelsCount} models.`);
      } else {
        toast.error('Invalid API key');
      }
    } catch (error) {
      toast.error('Failed to validate API key');
    } finally {
      setTestingApiKey(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">General Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Model
            </label>
            <select
              value={settings.defaultModel}
              onChange={(e) => updateSettings({ defaultModel: e.target.value })}
              className="input-primary w-full"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-pro">Gemini Pro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Chat History
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={settings.maxChatHistory}
              onChange={(e) => updateSettings({ maxChatHistory: parseInt(e.target.value) })}
              className="input-primary w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of messages to keep in chat history
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoSave"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoSave" className="text-sm text-gray-300">
              Auto-save chat sessions
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">API Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gemini API Key
            </label>
            <div className="flex space-x-2">
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
                placeholder="Enter your Gemini API key"
                className="input-primary flex-1"
              />
              <button
                onClick={testApiKey}
                disabled={testingApiKey || !settings.apiKey}
                className="btn-secondary disabled:opacity-50"
              >
                {testingApiKey ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner" />
                    <span>Testing...</span>
                  </div>
                ) : (
                  'Test'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Appearance</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as 'dark' | 'light' | 'auto' })}
              className="input-primary w-full"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Font Size: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="20"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Notifications</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="notifications"
              checked={settings.notifications}
              onChange={(e) => updateSettings({ notifications: e.target.checked })}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="notifications" className="text-sm text-gray-300">
              Enable notifications
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">File System</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Allowed Directories
            </label>
            <textarea
              value={settings.allowedDirectories.join('\n')}
              onChange={(e) => updateSettings({ 
                allowedDirectories: e.target.value.split('\n').filter(Boolean) 
              })}
              placeholder="/workspace&#10;/tmp&#10;/home/user"
              rows={4}
              className="input-primary w-full resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              One directory path per line. These directories will be accessible through the file manager.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="fileWatching"
              checked={settings.fileWatchingEnabled}
              onChange={(e) => updateSettings({ fileWatchingEnabled: e.target.checked })}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="fileWatching" className="text-sm text-gray-300">
              Enable file watching
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMCPSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">MCP Server Configuration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoStartServers"
              checked={settings.mcpSettings.autoStartServers}
              onChange={(e) => updateSettings({ 
                mcpSettings: { ...settings.mcpSettings, autoStartServers: e.target.checked }
              })}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoStartServers" className="text-sm text-gray-300">
              Auto-start MCP servers on application launch
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Concurrent Servers
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.mcpSettings.maxConcurrentServers}
              onChange={(e) => updateSettings({ 
                mcpSettings: { 
                  ...settings.mcpSettings, 
                  maxConcurrentServers: parseInt(e.target.value) 
                }
              })}
              className="input-primary w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Server Timeout (ms)
            </label>
            <input
              type="number"
              min="5000"
              max="120000"
              step="1000"
              value={settings.mcpSettings.serverTimeout}
              onChange={(e) => updateSettings({ 
                mcpSettings: { 
                  ...settings.mcpSettings, 
                  serverTimeout: parseInt(e.target.value) 
                }
              })}
              className="input-primary w-full"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableLogging"
              checked={settings.mcpSettings.enableLogging}
              onChange={(e) => updateSettings({ 
                mcpSettings: { ...settings.mcpSettings, enableLogging: e.target.checked }
              })}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="enableLogging" className="text-sm text-gray-300">
              Enable MCP server logging
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Log Level
            </label>
            <select
              value={settings.mcpSettings.logLevel}
              onChange={(e) => updateSettings({ 
                mcpSettings: { 
                  ...settings.mcpSettings, 
                  logLevel: e.target.value as 'debug' | 'info' | 'warn' | 'error'
                }
              })}
              className="input-primary w-full"
              disabled={!settings.mcpSettings.enableLogging}
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Security & Privacy</h3>
        
        <div className="space-y-4">
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
            <h4 className="text-yellow-300 font-medium mb-2">Data Storage</h4>
            <p className="text-yellow-200 text-sm">
              All settings and chat data are stored locally in your browser. 
              No data is sent to external servers except for API calls to Gemini.
            </p>
          </div>

          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">API Key Security</h4>
            <p className="text-blue-200 text-sm">
              Your API key is stored locally and only sent directly to Google's Gemini API. 
              It is never transmitted to any other servers.
            </p>
          </div>

          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <h4 className="text-red-300 font-medium mb-2">Reset All Data</h4>
            <p className="text-red-200 text-sm mb-3">
              This will clear all settings, chat history, and cached data. This action cannot be undone.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                  resetSettings();
                  localStorage.clear();
                  toast.success('All data has been reset');
                }
              }}
              className="btn-danger"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'api':
        return renderApiSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'files':
        return renderFileSettings();
      case 'mcp':
        return renderMCPSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="h-full flex">
      {/* Settings Navigation */}
      <div className="w-64 border-r border-gray-700 bg-gray-800">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
        </div>
        
        <nav className="p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Connection Status */}
      <div className="fixed bottom-4 right-4">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
          connectionStatus.connected 
            ? 'bg-green-900 text-green-300 border border-green-700'
            : 'bg-red-900 text-red-300 border border-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span>
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};