import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const AppContext = createContext();

const initialState = {
  user: null,
  apiKey: localStorage.getItem('gemini_api_key') || '',
  isConnected: false,
  socket: null,
  extensions: [],
  installedExtensions: [],
  chatHistory: [],
  currentChat: null,
  fileTree: null,
  selectedFile: null,
  isLoading: false,
  error: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_API_KEY':
      localStorage.setItem('gemini_api_key', action.payload);
      return { ...state, apiKey: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    
    case 'SET_EXTENSIONS':
      return { ...state, extensions: action.payload };
    
    case 'SET_INSTALLED_EXTENSIONS':
      return { ...state, installedExtensions: action.payload };
    
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload],
      };
    
    case 'UPDATE_CHAT_MESSAGE':
      return {
        ...state,
        chatHistory: state.chatHistory.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
        ),
      };
    
    case 'SET_CHAT_HISTORY':
      return { ...state, chatHistory: action.payload };
    
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
    
    case 'SET_FILE_TREE':
      return { ...state, fileTree: action.payload };
    
    case 'SET_SELECTED_FILE':
      return { ...state, selectedFile: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    
    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_SOCKET', payload: socket });
      toast.success('Connected to server');
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
      toast.error('Disconnected from server');
    });

    socket.on('chat_response', (data) => {
      dispatch({ type: 'UPDATE_CHAT_MESSAGE', payload: data });
    });

    socket.on('file_changed', (data) => {
      toast.info(`File changed: ${data.path}`);
      // Refresh file tree or update specific file
    });

    socket.on('error', (error) => {
      toast.error(error.message || 'An error occurred');
      dispatch({ type: 'SET_ERROR', payload: error.message });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const actions = {
    setApiKey: (key) => dispatch({ type: 'SET_API_KEY', payload: key }),
    
    setExtensions: (extensions) => dispatch({ type: 'SET_EXTENSIONS', payload: extensions }),
    
    setInstalledExtensions: (extensions) => dispatch({ type: 'SET_INSTALLED_EXTENSIONS', payload: extensions }),
    
    addChatMessage: (message) => {
      const messageWithId = { ...message, id: Date.now().toString() };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: messageWithId });
      return messageWithId;
    },
    
    updateChatMessage: (id, updates) => dispatch({ type: 'UPDATE_CHAT_MESSAGE', payload: { id, ...updates } }),
    
    setChatHistory: (history) => dispatch({ type: 'SET_CHAT_HISTORY', payload: history }),
    
    setCurrentChat: (chat) => dispatch({ type: 'SET_CURRENT_CHAT', payload: chat }),
    
    setFileTree: (tree) => dispatch({ type: 'SET_FILE_TREE', payload: tree }),
    
    setSelectedFile: (file) => dispatch({ type: 'SET_SELECTED_FILE', payload: file }),
    
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    
    sendMessage: (message) => {
      if (state.socket && state.isConnected) {
        state.socket.emit('chat', {
          type: 'chat',
          message,
          id: Date.now().toString(),
        });
      }
    },
    
    watchFile: (path) => {
      if (state.socket && state.isConnected) {
        state.socket.emit('file_watch', {
          type: 'file_watch',
          path,
        });
      }
    },
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}