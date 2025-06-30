export interface Message {
  id: number;
  type: 'user' | 'assistant' | 'error' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
  legal_terms?: Record<string, string>;
  case_law?: any;
  confidence?: number;
}

export interface SystemStatus {
  status: string;
  assistant_initialized: boolean;
  documents_loaded?: number | string;
}

export interface ApiResponse {
  success: boolean;
  response?: string;
  sources?: string[];
  legal_terms?: Record<string, string>;
  case_law?: any;
  confidence?: number;
  error?: string;
}

export interface LegalAssistantProps {
  apiUrl?: string;
}
