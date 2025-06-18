import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useSettings } from '../contexts/SettingsContext';

export const StatusBar: React.FC = () => {
  const { connectionStatus } = useWebSocket();
  const { settings } = useSettings();

  return (
    <div className="h-6 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4 text-xs text-gray-400">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span>
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            {connectionStatus.reconnectAttempts > 0 && ` (${connectionStatus.reconnectAttempts} attempts)`}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <span>Model:</span>
          <span className="text-white">{settings.defaultModel}</span>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center space-x-4">
        <span>Ready</span>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <span>MCP Servers:</span>
          <span className="text-green-400">2 active</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <span>Theme:</span>
          <span className="text-white capitalize">{settings.theme}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};