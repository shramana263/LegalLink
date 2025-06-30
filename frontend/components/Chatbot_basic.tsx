/**
 * AI Legal Assistant React Component
 * ================================
 * 
 * A complete React component for interacting with the AI Legal Assistant API.
 * Features a modern chat interface with support for legal queries.
 * 
 * Features:
 * - Real-time chat interface with TypeScript support
 * - Framer Motion animations
 * - Loading states and error handling
 * - Legal terms highlighting
 * - Case law analysis toggle
 * - Responsive design
 * - Copy to clipboard functionality
 * 
 * Usage:
 * import LegalAssistant from './LegalAssistant';
 * <LegalAssistant />
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Copy, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Scale,
  BookOpen,
  Gavel,
  MessageCircle,
  Sun,
  Moon,
  ArrowRight,
  Users,
  Shield,
  Search,
  Zap,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG } from '@/lib/constants';
import { Message, SystemStatus, ApiResponse, LegalAssistantProps } from '@/types/legal-assistant';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const LegalAssistant: React.FC<LegalAssistantProps> = ({ 
  apiUrl = API_CONFIG.FASTAPI_HOST_ADDRESS 
}) => {
  // State management with proper TypeScript types
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSystemReady, setIsSystemReady] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showChatOverlay, setShowChatOverlay] = useState<boolean>(false);
  const [includeCaseLaw, setIncludeCaseLaw] = useState<boolean>(false);
  const [includeTerms, setIncludeTerms] = useState<boolean>(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  
  // Refs with proper typing
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dark mode and scroll effects
  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Check system health on component mount
  useEffect(() => {
    // Load saved messages from localStorage
    const savedMessages = localStorage.getItem('legallink-chat-messages');
    const savedInitialized = localStorage.getItem('legallink-chat-initialized');
    const savedChatOverlay = localStorage.getItem('legallink-chat-overlay');
    
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        setIsInitialized(savedInitialized === 'true');
        setShowChatOverlay(savedChatOverlay === 'true');
        console.log('📁 Loaded saved messages:', {
          messageCount: parsedMessages.length,
          isInitialized: savedInitialized === 'true',
          showChatOverlay: savedChatOverlay === 'true'
        });
      } catch (error) {
        console.error('Failed to load saved messages:', error);
      }
    }

    // Only check health if not already initialized with existing messages
    const shouldCheckHealth = !savedMessages || savedMessages.length === 0;
    if (shouldCheckHealth) {
      console.log('🔍 Initial health check needed');
      checkSystemHealth();
    } else {
      console.log('✅ Skipping health check - existing messages found');
      setIsSystemReady(true); // Assume system is ready if we have existing messages
    }
    
    // Set up periodic health check only if needed
    let healthInterval: NodeJS.Timeout | null = null;
    if (shouldCheckHealth) {
      healthInterval = setInterval(() => {
        if (isSystemReady && isInitialized) {
          if (healthInterval) clearInterval(healthInterval);
          return;
        }
        checkSystemHealth();
      }, 10000);
    }
    
    return () => {
      if (healthInterval) clearInterval(healthInterval);
    };
  }, []);
  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('legallink-chat-messages', JSON.stringify(messages));
      localStorage.setItem('legallink-chat-initialized', 'true');
      // Show chat overlay if there are user messages (not just assistant messages)
      const hasUserMessages = messages.some(msg => msg.type === 'user');
      setShowChatOverlay(hasUserMessages);
      localStorage.setItem('legallink-chat-overlay', hasUserMessages.toString());
      
      // Debug log
      console.log('Messages updated:', {
        messageCount: messages.length,
        hasUserMessages,
        showChatOverlay: hasUserMessages
      });
    }
  }, [messages]);

  // Debug effect to track system status changes
  useEffect(() => {
    console.log('System status changed:', {
      isSystemReady,
      isInitialized,
      messageCount: messages.length,
      showChatOverlay
    });
  }, [isSystemReady, isInitialized, messages.length, showChatOverlay]);  // Check if the API server is ready
  const checkSystemHealth = async (): Promise<void> => {
    try {
      console.log('🔍 Checking system health...');
      const response = await fetch(`${apiUrl}/health`);
      const data: SystemStatus = await response.json();
      console.log('📊 Health check response:', data);
      
      setSystemStatus(data);
      const wasReady = isSystemReady;
      setIsSystemReady(data.assistant_initialized);
      
      console.log('🔧 Health check state:', {
        wasReady,
        nowReady: data.assistant_initialized,
        isInitialized,
        messageCount: messages.length,
        hasExistingMessages: messages.length > 0
      });
      
      // Only add welcome message on first initialization
      // Don't override existing messages or re-initialize
      if (data.assistant_initialized && !wasReady && !isInitialized && messages.length === 0) {
        console.log('🎉 Adding welcome message - first time initialization');
        const welcomeMessage = {
          id: Date.now(),
          type: 'assistant' as const,
          content: '👋 Hello! I\'m your AI Legal Assistant. I can help you understand Indian laws in simple terms. What legal question can I help you with today?',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages([welcomeMessage]);
        setIsInitialized(true);
      } else if (data.assistant_initialized) {
        console.log('✅ System ready - preserving existing state');
        // Don't add welcome message if we already have messages or are already initialized
        if (!isInitialized && messages.length === 0) {
          setIsInitialized(true);
        }
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setIsSystemReady(false);
    }
  };
  // Send message to the API
  const sendMessage = async (): Promise<void> => {
    if (!inputText.trim() || isLoading || !isSystemReady) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date().toLocaleTimeString()
    };

    const currentInput = inputText; // Store current input
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      console.log('📤 Sending message to API:', {
        question: currentInput,
        include_case_law: includeCaseLaw,
        include_terms: includeTerms
      });

      const response = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentInput,
          include_case_law: includeCaseLaw,
          include_terms: includeTerms
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      console.log('📥 API Response received:', {
        success: data.success,
        responseLength: data.response?.length || 0,
        sourcesCount: data.sources?.length || 0,
        legalTermsCount: data.legal_terms ? Object.keys(data.legal_terms).length : 0,
        confidence: data.confidence,
        hasError: !!data.error
      });

      if (data.success && data.response) {
        const assistantMessage: Message = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response,
          sources: data.sources || [],
          legal_terms: data.legal_terms || {},
          case_law: data.case_law || null,
          confidence: data.confidence || undefined,
          timestamp: new Date().toLocaleTimeString()
        };
        
        console.log('✅ Adding assistant message to chat:', {
          id: assistantMessage.id,
          contentLength: assistantMessage.content.length,
          sourcesCount: assistantMessage.sources?.length || 0,
          legalTermsCount: Object.keys(assistantMessage.legal_terms || {}).length
        });
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        console.error('❌ API returned error or empty response:', data.error || 'No response content');
        throw new Error(data.error || 'No response received from AI assistant');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'error',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string, messageId: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };  // Clear chat history
  const clearChat = (): void => {
    console.log('🗑️ Clearing chat history');
    const newMessages = [{
      id: Date.now(),
      type: 'assistant' as const,
      content: '👋 Chat cleared! How can I help you with legal questions?',
      timestamp: new Date().toLocaleTimeString()
    }];
    setMessages(newMessages);
    setIsInitialized(true); // Mark as initialized to prevent welcome message override
    setShowChatOverlay(false); // Hide chat overlay
    
    // Clear localStorage
    localStorage.removeItem('legallink-chat-messages');
    localStorage.setItem('legallink-chat-initialized', 'true');
    localStorage.setItem('legallink-chat-overlay', 'false');
    
    console.log('✅ Chat cleared and localStorage updated');  };

  // Add this function near your other utility functions
  const formatCaseLawContent = (caseData: any): string => {
    if (!caseData) return '';
    
    try {
      if (typeof caseData === 'string') return caseData;
      
      // Convert object to properly formatted markdown
      let markdownContent = '';
      
      // Handle case name/title with proper heading
      if (caseData.title || caseData.name) {
        markdownContent += `## ${caseData.title || caseData.name}\n\n`;
      }
      
      // Process each property with proper indentation after bold text
      Object.entries(caseData).forEach(([key, value]) => {
        // Skip title/name as we've already handled it
        if (key === 'title' || key === 'name') return;
        
        const formattedKey = key.replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Add bold property name followed by proper newline and indentation
        markdownContent += `**${formattedKey}**:\n`;
        
        // Format the value with proper indentation
        const valueStr = String(value).trim();
        const indentedValue = valueStr
          .split('\n')
          .map(line => `  ${line}`)  // Add 2 spaces indentation
          .join('\n');
        
        markdownContent += `${indentedValue}\n\n`;
      });
      
      return markdownContent;
    } catch (error) {
      console.error('Error formatting case law:', error);
      return JSON.stringify(caseData, null, 2);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'}`}>
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                <Scale className="text-white dark:text-slate-900 h-6 w-6" />
              </div>
              <div>
                <span className="font-bold text-xl text-slate-900 dark:text-white">LegalLink</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">Professional Legal Services</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5 text-slate-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
              </button>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Chatbot Section */}
      <div className="h-screen pt-20 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-200 dark:bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-slate-300 dark:bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce"></div>
          <div className="absolute bottom-1/4 right-1/3 w-60 h-60 bg-slate-100 dark:bg-slate-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        </div>
        
        {/* Welcome Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 h-full">
          <div className="max-w-3xl w-full flex flex-col gap-8">
            {/* Welcome Message - Modern Card Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_rgba(0,0,0,0.3)] p-8 text-center border-2 border-slate-200 dark:border-slate-700 hover:shadow-[0_0_35px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.1)] transition-all duration-500"
          >
            {/* Decorative elements */}
            <div className="absolute -top-3 -left-3 w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full blur-xl"></div>
            
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-full mx-auto mb-4 flex items-center justify-center p-1">
                <div className="bg-white dark:bg-slate-800 rounded-full w-full h-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: isSystemReady ? 0 : 360 }}
                    transition={{ duration: 2, repeat: isSystemReady ? 0 : Infinity, ease: "linear" }}
                  >
                    <Scale className="w-10 h-10 text-slate-900 dark:text-white" />
                  </motion.div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Hi, I'm LegalLink.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                How can I assist you today?
              </p>
              
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isSystemReady ? "bg-green-500" : "bg-yellow-500"
                )} />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {isSystemReady ? 'Ready to help with your legal queries' : 'Initializing AI system...'}
                </span>
              </div>
            </div>            {/* System Status */}
            {!isSystemReady && systemStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-400 animate-spin" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Setting up AI Legal Assistant...</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Status: {systemStatus.status}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Documents: {systemStatus.documents_loaded || 'Loading...'}</p>
              </motion.div>
            )}

            {/* Modern Input Area */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700 rounded-full blur-md opacity-30"></div>
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isSystemReady ? 
                  "Tell me your legal query... (e.g., 'What are my consumer rights?')" : 
                  "Please wait while the system initializes..."
                }
                disabled={!isSystemReady || isLoading}
                rows={1}
                className="w-full p-5 pr-16 rounded-full border border-slate-200 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 shadow-md relative z-10 font-medium text-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!inputText.trim() || !isSystemReady || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 hover:shadow-lg transition-all z-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </div>
            
            <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
              Powered by LegalLINK AI • Secure & confidential
            </div>
          </motion.div>          {/* Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center space-x-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-slate-700"
          >
            <motion.label 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600"
            >
              <input
                type="checkbox"
                checked={includeTerms}
                onChange={(e) => setIncludeTerms(e.target.checked)}
                className="rounded border-slate-400 text-slate-600 focus:ring-slate-500 dark:border-slate-500 dark:text-slate-400 dark:focus:ring-slate-400"
              />
              <BookOpen className="w-4 h-4" />
              <span>Legal Terms Analysis</span>
            </motion.label>
            
            <motion.label 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600"
            >
              <input
                type="checkbox"
                checked={includeCaseLaw}
                onChange={(e) => setIncludeCaseLaw(e.target.checked)}
                className="rounded border-slate-400 text-slate-600 focus:ring-slate-500 dark:border-slate-500 dark:text-slate-400 dark:focus:ring-slate-400"
              />
              <Gavel className="w-4 h-4" />
              <span>Case Law Analysis</span>
            </motion.label>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat</span>
            </motion.button>          </motion.div>        </div>
      </div>

      {/* Landing Page Section */}
      <div className="bg-white dark:bg-slate-950">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>Trusted by 10,000+ Legal Professionals</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Professional Legal Services
                <span className="block text-slate-600 dark:text-slate-300">Made Simple</span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                Connect with verified advocates, get AI-powered legal assistance, and access justice through our comprehensive legal platform designed for modern India.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/consultation">
                  <Button size="lg" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-3 text-lg">
                    Start Legal Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/advocate-signup">
                  <Button size="lg" variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-8 py-3 text-lg">
                    Join as Advocate
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">50,000+</div>
                  <div className="text-slate-600 dark:text-slate-400">Cases Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">2,500+</div>
                  <div className="text-slate-600 dark:text-slate-400">Verified Advocates</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">98%</div>
                  <div className="text-slate-600 dark:text-slate-400">Client Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Why Choose LegalLink?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Our platform combines advanced technology with legal expertise to provide comprehensive legal services.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="p-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">AI Legal Assistant</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Get instant answers to your legal queries with our advanced AI system trained on Indian law and legal precedents.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="p-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Verified Advocates</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Connect with Bar Council verified advocates specializing in your specific legal needs and practice areas.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="p-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Smart Matching</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Our algorithm matches you with advocates based on location, specialization, and case type for optimal results.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="p-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Secure Communication</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Communicate with advocates through our secure messaging system with end-to-end encryption and privacy protection.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="p-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Trust & Safety</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Advanced fraud detection and verification systems ensure a safe and trusted platform for all users.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="p-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Legal Resources</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Access comprehensive legal resources, case studies, and real-time updates on legal developments in India.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Get legal assistance in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Describe Your Case</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Share your legal query or case details through our secure platform and get instant AI-powered guidance.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Get Matched</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Our smart algorithm connects you with the most suitable verified advocates based on your specific needs.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Resolve Your Case</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Work directly with your matched advocate through our secure platform to resolve your legal matter efficiently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto text-center">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex justify-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
              </div>
              <blockquote className="text-2xl font-medium text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                "LegalLink has revolutionized how I connect with clients and manage my practice. The platform's efficiency and professionalism have significantly enhanced my legal services."
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <Gavel className="text-slate-600 dark:text-slate-400 h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-white">Adv. Rajesh Kumar</div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">Senior Advocate, Mumbai High Court</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-12 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Join thousands of users who trust LegalLink for their legal needs. Start your legal journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/consultation">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 text-lg">
                    Start Free Consultation
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-3 text-lg">
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="container mx-auto">
            <div className="text-center">
              <Link href="/" className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                  <Scale className="text-white dark:text-slate-900 h-5 w-5" />
                </div>
                <span className="font-bold text-xl text-slate-900 dark:text-white">LegalLink</span>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                © 2024 LegalLink. All rights reserved.
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-sm">
                Professional legal services platform • Regulated by Bar Council of India
              </p>
            </div>
          </div>
        </footer>
      </div>{/* Chat Messages Overlay */}
      <AnimatePresence>
        {showChatOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col"
          >
            {/* Chat Header */}
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex-shrink-0 border-b border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
            >
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">                  <div className="flex items-center space-x-3">
                    <Scale className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Legal Assistant</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Ask me anything about Indian laws</p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearChat}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Chat</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-6 py-4 space-y-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={cn(
                        "flex w-full",
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >                      <div className={cn(
                        "max-w-3xl rounded-2xl px-6 py-4 shadow-lg",
                        message.type === 'user' 
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                          : message.type === 'error'
                          ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                          : message.type === 'system'
                          ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                          : 'bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200'
                      )}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">                            {message.type === 'user' ? (
                              <div className="w-6 h-6 bg-white/20 dark:bg-slate-800/20 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold">U</span>
                              </div>
                            ) : (
                              <Scale className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="prose prose-sm max-w-none dark:prose-invert 
  prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white 
  prose-p:text-slate-700 dark:prose-p:text-slate-300 
  prose-a:text-blue-600 dark:prose-a:text-blue-400 
  prose-strong:text-slate-900 dark:prose-strong:text-white 
  prose-code:text-slate-800 dark:prose-code:text-slate-200 
  prose-code:bg-slate-100 dark:prose-code:bg-slate-800/50 
  prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
  prose-p:my-2 prose-li:ml-4 prose-li:pl-1 prose-strong:inline-block prose-strong:mb-1">
                              {message.type === 'assistant' ? (
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              ) : (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                            
                            {/* Sources */}
                            {message.sources && message.sources.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                              >
                                <div className="flex items-center space-x-2 mb-2">                                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sources</span>
                                </div>
                                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                  {message.sources.map((source, idx) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                                      <span>{source}</span>
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}

                            {/* Legal Terms */}
                            {message.legal_terms && Object.keys(message.legal_terms).length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3"
                              >
                                <div className="flex items-center space-x-2 mb-2">                                  <Gavel className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Legal Terms</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  {Object.entries(message.legal_terms).map(([term, definition], idx) => (                                    <div key={idx} className="bg-slate-100 dark:bg-slate-800/50 rounded p-2">
                                      <span className="font-medium text-purple-600 dark:text-purple-300">{term}:</span>
                                      <span className="text-slate-700 dark:text-slate-300 ml-2">{definition}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            {/* Case Law */}
                            {message.case_law && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <Scale className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Case Law Analysis</span>
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 rounded p-2 overflow-x-auto">
                                  {typeof message.case_law === 'object' ? (
                                    <div className="whitespace-pre-wrap prose-headings:mb-2 prose-p:mt-2 prose-p:mb-2 prose-strong:font-bold">
                                      <ReactMarkdown>
                                        {formatCaseLawContent(message.case_law)}
                                      </ReactMarkdown>
                                    </div>
                                  ) : (
                                    <div className="whitespace-pre-wrap prose-headings:mb-2 prose-p:mt-2 prose-p:mb-2 prose-strong:font-bold">
                                      <ReactMarkdown>
                                        {message.case_law}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            {/* Confidence */}
                            {message.confidence && (
                              <div className="flex items-center space-x-2">                                <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${message.confidence * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                                  />
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {(message.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{message.timestamp}</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => copyToClipboard(message.content, message.id)}
                                className="flex items-center space-x-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                              >
                                {copiedId === message.id ? (
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-3xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Scale className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-0 w-6 h-6 border-2 border-transparent border-t-slate-400 dark:border-t-slate-500 rounded-full"
                            />
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-1">
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  delay: 0,
                                  ease: "easeInOut"
                                }}
                                className="w-2.5 h-2.5 bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-300 rounded-full"
                              />
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  delay: 0.3,
                                  ease: "easeInOut"
                                }}
                                className="w-2.5 h-2.5 bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-300 rounded-full"
                              />
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  delay: 0.6,
                                  ease: "easeInOut"
                                }}
                                className="w-2.5 h-2.5 bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-300 rounded-full"
                              />
                            </div>
                            
                            <motion.div
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="text-sm text-slate-600 dark:text-slate-300 font-medium"
                            >
                              AI is analyzing your legal question...
                            </motion.div>
                            
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                              className="h-1 bg-gradient-to-r from-slate-300 via-slate-500 to-slate-300 dark:from-slate-600 dark:via-slate-400 dark:to-slate-600 rounded-full opacity-60"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
              </div>
            </div>            {/* Input Area */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
            >
              <div className="container mx-auto px-6 py-4">
                <div className="relative max-w-4xl mx-auto">
                  <div className="relative bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-slate-400 dark:focus-within:ring-slate-500 focus-within:border-slate-400 dark:focus-within:border-slate-500 transition-all duration-200">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Continue the conversation... (Press Enter to send, Shift+Enter for new line)"
                      disabled={!isSystemReady || isLoading}
                      rows={2}
                      className="w-full px-6 py-4 pr-16 bg-transparent border-0 rounded-2xl text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium min-h-[60px] max-h-[120px]"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    />
                    
                    {/* Send Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessage}
                      disabled={!inputText.trim() || !isSystemReady || isLoading}
                      className="absolute right-3 bottom-3 p-3 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 hover:from-slate-800 hover:to-slate-950 dark:hover:from-slate-500 dark:hover:to-slate-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </motion.button>
                    
                    {/* Status Indicator */}
                    <div className="absolute left-4 bottom-3 flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-colors duration-200",
                        isSystemReady ? "bg-green-500" : "bg-yellow-500"
                      )} />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {isSystemReady ? 'Ready' : 'Loading...'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center justify-between mt-3 px-2">
                    <div className="flex items-center space-x-4">
                      <motion.label 
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer text-sm font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={includeTerms}
                          onChange={(e) => setIncludeTerms(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-2 transition-all"
                        />
                        <BookOpen className="w-4 h-4" />
                        <span>Legal Terms</span>
                      </motion.label>
                      
                      <motion.label 
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer text-sm font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={includeCaseLaw}
                          onChange={(e) => setIncludeCaseLaw(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-2 transition-all"
                        />
                        <Gavel className="w-4 h-4" />
                        <span>Case Law</span>
                      </motion.label>
                    </div>
                    
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      Powered by LegalLink AI
                    </div>                  </div>
                </div>              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
};

export default LegalAssistant;
