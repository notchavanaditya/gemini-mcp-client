import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/outline';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { ChatSidebar } from '../components/ChatSidebar';
import { ToolPanel } from '../components/ToolPanel';
import { useSettings } from '../contexts/SettingsContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Message, ChatSession } from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export const ChatPage: React.FC = () => {
  const { settings } = useSettings();
  const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up WebSocket message handlers
  useEffect(() => {
    const handleChatResponse = (payload: any, id?: string) => {
      const { response, messageId } = payload;
      
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }
      ]);
      
      setIsLoading(false);
    };

    const handleChatError = (payload: any) => {
      toast.error(payload.error || 'Failed to get response');
      setIsLoading(false);
    };

    const handleChatProcessing = (payload: any) => {
      // Could show typing indicator here
    };

    addMessageHandler('chat:response', handleChatResponse);
    addMessageHandler('chat:error', handleChatError);
    addMessageHandler('chat:processing', handleChatProcessing);

    return () => {
      removeMessageHandler('chat:response', handleChatResponse);
      removeMessageHandler('chat:error', handleChatError);
      removeMessageHandler('chat:processing', handleChatProcessing);
    };
  }, [addMessageHandler, removeMessageHandler]);

  // Load chat sessions from localStorage
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('chat-sessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        setChatSessions(sessions);
        
        if (sessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(sessions[0].id);
          setMessages(sessions[0].messages);
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  }, [currentSessionId]);

  // Save chat sessions to localStorage
  useEffect(() => {
    if (chatSessions.length > 0) {
      try {
        localStorage.setItem('chat-sessions', JSON.stringify(chatSessions));
      } catch (error) {
        console.error('Error saving chat sessions:', error);
      }
    }
  }, [chatSessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: settings.defaultModel,
      settings: {
        model: settings.defaultModel,
        temperature: 0.7,
        maxTokens: 2048
      }
    };

    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const switchSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const updateCurrentSession = (updates: Partial<ChatSession>) => {
    if (!currentSessionId) return;

    setChatSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, ...updates, updatedAt: new Date() }
        : session
    ));
  };

  const sendChatMessage = async () => {
    if (!currentInput.trim() || isLoading) return;
    
    if (!settings.apiKey) {
      toast.error('Please set your Gemini API key in settings');
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentInput('');
    setIsLoading(true);

    // Update current session
    if (currentSessionId) {
      updateCurrentSession({ 
        messages: newMessages,
        title: newMessages.length === 1 ? currentInput.slice(0, 50) + '...' : undefined
      });
    } else {
      // Create new session if none exists
      createNewSession();
    }

    try {
      // Send via WebSocket for real-time response
      sendMessage('chat:message', {
        message: currentInput.trim(),
        context: messages.slice(-10), // Send last 10 messages for context
        model: settings.defaultModel
      }, userMessage.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsLoading(false);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    toast.info('Generation stopped');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (currentSessionId) {
      updateCurrentSession({ messages: [] });
    }
  };

  const exportChat = () => {
    const chatData = {
      session: chatSessions.find(s => s.id === currentSessionId),
      messages,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Chat exported successfully');
  };

  return (
    <div className="flex h-full">
      {/* Chat Sessions Sidebar */}
      <div className="w-64 border-r border-gray-700">
        <ChatSidebar
          sessions={chatSessions}
          currentSessionId={currentSessionId}
          onSessionSelect={switchSession}
          onNewSession={createNewSession}
          onClearChat={clearChat}
          onExportChat={exportChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">G</span>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Welcome to Gemini MCP Client
                </h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  Start a conversation with AI, manage files, or explore MCP extensions. 
                  Your AI assistant with powerful integrations.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setCurrentInput("Help me analyze an Excel file")}
                    className="block w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="font-medium">📊 Analyze Excel Data</div>
                    <div className="text-sm text-gray-400">Work with spreadsheets and data</div>
                  </button>
                  <button
                    onClick={() => setCurrentInput("Show me available MCP tools")}
                    className="block w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="font-medium">🔧 Explore MCP Tools</div>
                    <div className="text-sm text-gray-400">Discover available integrations</div>
                  </button>
                  <button
                    onClick={() => setCurrentInput("Help me organize my files")}
                    className="block w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="font-medium">📁 File Management</div>
                    <div className="text-sm text-gray-400">Organize and manage your files</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="spinner" />
                  <span>AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <ChatInput
                value={currentInput}
                onChange={setCurrentInput}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                placeholder="Type your message... (Shift+Enter for new line)"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowToolPanel(!showToolPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showToolPanel 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle Tool Panel"
              >
                🔧
              </button>
              {isLoading ? (
                <button
                  onClick={stopGeneration}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  title="Stop Generation"
                >
                  <StopIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={sendChatMessage}
                  disabled={!currentInput.trim() || !settings.apiKey}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  title="Send Message"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {!settings.apiKey && (
            <div className="mt-2 text-sm text-yellow-400">
              ⚠️ Please set your Gemini API key in settings to start chatting
            </div>
          )}
        </div>
      </div>

      {/* Tool Panel */}
      {showToolPanel && (
        <div className="w-80 border-l border-gray-700">
          <ToolPanel onToolSelect={(tool, args) => {
            // Handle tool selection
            console.log('Tool selected:', tool, args);
          }} />
        </div>
      )}
    </div>
  );
};