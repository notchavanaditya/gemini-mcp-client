import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon,
  PuzzlePieceIcon,
  FolderIcon,
  Cog6ToothIcon,
  ServerIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useWebSocket } from '../contexts/WebSocketContext';

const navigationItems = [
  {
    name: 'Chat',
    href: '/chat',
    icon: ChatBubbleLeftRightIcon,
    description: 'AI Chat Interface'
  },
  {
    name: 'Extensions',
    href: '/extensions',
    icon: PuzzlePieceIcon,
    description: 'MCP Extension Store'
  },
  {
    name: 'Files',
    href: '/files',
    icon: FolderIcon,
    description: 'File Manager'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'Application Settings'
  }
];

export const Sidebar: React.FC = () => {
  const { connectionStatus } = useWebSocket();

  return (
    <div className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Logo/Title */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Gemini MCP</h1>
            <p className="text-xs text-gray-400">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-400">
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <div className="flex-1">
              <div>{item.name}</div>
              <div className="text-xs text-gray-400">{item.description}</div>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* MCP Servers Status */}
      <div className="p-4 border-t border-gray-700">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <ServerIcon className="w-4 h-4" />
            <span>MCP Servers</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Excel MCP</span>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">File System</span>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-700">
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
            <DocumentTextIcon className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
            <FolderIcon className="w-4 h-4" />
            <span>Open File</span>
          </button>
        </div>
      </div>
    </div>
  );
};