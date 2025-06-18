import React from 'react';
import { 
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { ChatSession } from '../types';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onClearChat,
  onExportChat
}) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getSessionPreview = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage) return 'No messages yet';
    
    const preview = lastMessage.content.slice(0, 60);
    return preview.length < lastMessage.content.length ? preview + '...' : preview;
  };

  return (
    <div className="h-full bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Chat Sessions</h2>
          <button
            onClick={onNewSession}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="New Chat"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onClearChat}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear Current Chat"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Clear</span>
          </button>
          <button
            onClick={onExportChat}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Export Chat"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No chat sessions yet</p>
            <p className="text-xs mt-1">Start a new conversation</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate mb-1">
                      {session.title}
                    </div>
                    <div className={`text-xs truncate ${
                      currentSessionId === session.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {getSessionPreview(session)}
                    </div>
                    <div className={`text-xs mt-1 ${
                      currentSessionId === session.id ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {formatDate(session.updatedAt)} • {session.messages.length} messages
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle session options menu
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                      currentSessionId === session.id
                        ? 'text-blue-200 hover:text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <EllipsisVerticalIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Model indicator */}
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-xs rounded ${
                  currentSessionId === session.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {session.model.replace('gemini-', '')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};