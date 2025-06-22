import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWebSocketErrorMessage } from '@/lib/utils';

interface Message {
  id: string | number;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: number;
  sessionId?: string;
  quickActions?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

interface WebSocketHookReturn {
  messages: Message[];
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (message: string) => void;
  clearMessages: () => void;
  connectionError: string | null;
  reconnect: () => void;
}

export const useWebSocket = (userId?: string): WebSocketHookReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const stableUserIdRef = useRef<string | null>(null);
  const initialConnectionAttempted = useRef(false);
  
  const { user } = useAuth();
  
  // Generate stable user ID only once
  const effectiveUserId = useMemo(() => {
    if (userId) return userId;
    if (user?.id) return user.id;
    
    // Generate stable guest ID only once
    if (!stableUserIdRef.current) {
      stableUserIdRef.current = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return stableUserIdRef.current;
  }, [userId, user?.id]);
    const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    const wsUrl = `${process.env.NEXT_PUBLIC_AI_WEBSOCKET_URL || 'ws://localhost:8000'}/ws/chat/${effectiveUserId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ Connected to LegalLink AI ChatBot');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          const message: Message = {
            id: data.message_id || Date.now(),
            type: data.type || 'assistant',
            content: data.content || data.message || '',
            timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
            sessionId: data.session_id,
            quickActions: data.quick_actions
          };
          
          setMessages(prev => [...prev, message]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Set appropriate error message based on close reason
        if (event.code !== 1000) {
          const errorMessage = getWebSocketErrorMessage({ code: event.code, reason: event.reason });
          setConnectionError(errorMessage);
        }
        
        // Attempt to reconnect if not a normal closure and not exceeding max attempts
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            setConnectionError(`Reconnecting... (Attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after multiple attempts. Please refresh the page.');
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        const errorMessage = getWebSocketErrorMessage(error);
        setConnectionError(errorMessage);
        setIsConnecting(false);
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to establish connection. Please check if the AI service is running.');
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [effectiveUserId, isConnecting]);  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      setConnectionError('Cannot send message: WebSocket is not connected. Please wait for connection to be established.');
      
      // Add an error message to the chat
      const errorMessage: Message = {
        id: Date.now(),
        type: 'error',
        content: 'Connection lost. Your message could not be sent. Please wait for reconnection or refresh the page.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    
    // Clear any previous connection errors when successfully sending
    if (connectionError) {
      setConnectionError(null);
    }
    
    // Add user message to messages immediately
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send message to WebSocket
    const messageData = {
      message: message,
      type: 'user',
      timestamp: new Date().toISOString()
    };
    
    wsRef.current.send(JSON.stringify(messageData));
  }, [connectionError]);
    const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  const reconnect = useCallback(() => {
    // Reset connection attempts and force reconnect
    reconnectAttempts.current = 0;
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual reconnection');
    }
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect]);
    // Connect on mount and when userId changes, with initial delay
  useEffect(() => {
    // Prevent multiple connection attempts
    if (initialConnectionAttempted.current) {
      return;
    }
    
    initialConnectionAttempted.current = true;
    
    // Add 5-second delay for initial connection to prevent overwhelming server
    const initialConnectionTimer = setTimeout(() => {
      connect();
    }, 5000);
    
    return () => {
      clearTimeout(initialConnectionTimer);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, []); // Empty dependency array to run only once
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
    return {
    messages,
    isConnected,
    isConnecting,
    sendMessage,
    clearMessages,
    connectionError,
    reconnect
  };
};
