// Chat-related types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  confidence?: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatResponse {
  message: string;
  confidence: number;
  sources?: string[];
  sessionId: string;
}

// Document types
export interface Document {
  id: string;
  filename: string;
  content: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// User types (for future authentication)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

// Rebuild platform types
export interface RebuildProject {
  id: string;
  userId: string;
  name: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  preferences: {
    style: string;
    needs: string[];
    budget?: number;
  };
  status: 'planning' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface DesignMatch {
  id: string;
  name: string;
  style: string;
  images: string[];
  description: string;
  estimatedCost: number;
  matchScore: number;
}

// Utility types
export type APIEndpoint = 
  | '/api/chat'
  | '/api/chat/search'
  | '/api/documents'
  | '/api/auth/login'
  | '/api/auth/register'
  | '/api/rebuild/projects'
  | '/api/rebuild/designs';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';