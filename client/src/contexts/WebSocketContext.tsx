import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketMessage, ConnectionStatus } from '../types';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  sendMessage: (type: string, payload: any, id?: string) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  addMessageHandler: (type: string, handler: (payload: any, id?: string) => void) => void;
  removeMessageHandler: (type: string, handler: (payload: any, id?: string) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, Set<(payload: any, id?: string) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptions = useRef<Set<string>>(new Set());

  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host 
      : 'localhost:3001';
    return `${protocol}//${host}`;
  };

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus(prev => ({
          ...prev,
          connected: true,
          lastConnected: new Date(),
          reconnectAttempts: 0
        }));

        // Re-subscribe to channels
        subscriptions.current.forEach(channel => {
          sendMessage('subscribe', { channel });
        });

        toast.success('Connected to server');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus(prev => ({
          ...prev,
          connected: false
        }));

        if (!event.wasClean) {
          toast.error('Connection lost. Attempting to reconnect...');
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('WebSocket connection error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionStatus(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));

    const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (connectionStatus.reconnectAttempts < 10) {
        connect();
      } else {
        toast.error('Failed to reconnect after multiple attempts');
      }
    }, delay);
  }, [connect, connectionStatus.reconnectAttempts]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    const { type, payload, id } = message;

    // Handle connection-specific messages
    if (type === 'connection:established') {
      setConnectionStatus(prev => ({
        ...prev,
        connectionId: payload.connectionId
      }));
      return;
    }

    // Handle error messages
    if (type === 'error') {
      toast.error(payload.error || 'Server error');
      return;
    }

    // Call registered handlers
    const handlers = messageHandlers.current.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload, id);
        } catch (error) {
          console.error(`Error in message handler for type ${type}:`, error);
        }
      });
    }
  }, []);

  const sendMessage = useCallback((type: string, payload: any, id?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date().toISOString()
      };

      if (id) {
        message.id = id;
      }

      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', { type, payload });
      toast.error('Not connected to server');
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    subscriptions.current.add(channel);
    sendMessage('subscribe', { channel });
  }, [sendMessage]);

  const unsubscribe = useCallback((channel: string) => {
    subscriptions.current.delete(channel);
    sendMessage('unsubscribe', { channel });
  }, [sendMessage]);

  const addMessageHandler = useCallback((type: string, handler: (payload: any, id?: string) => void) => {
    if (!messageHandlers.current.has(type)) {
      messageHandlers.current.set(type, new Set());
    }
    messageHandlers.current.get(type)!.add(handler);
  }, []);

  const removeMessageHandler = useCallback((type: string, handler: (payload: any, id?: string) => void) => {
    const handlers = messageHandlers.current.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        messageHandlers.current.delete(type);
      }
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Ping/pong to keep connection alive
  useEffect(() => {
    if (!connectionStatus.connected) return;

    const pingInterval = setInterval(() => {
      sendMessage('ping', {});
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [connectionStatus.connected, sendMessage]);

  const contextValue: WebSocketContextType = {
    connectionStatus,
    sendMessage,
    subscribe,
    unsubscribe,
    addMessageHandler,
    removeMessageHandler
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};