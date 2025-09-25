import { ChatMessage, ChatResponse } from '@aldeia/shared-types';

export interface ChatWidgetProps {
  onSendMessage: (message: string) => Promise<ChatResponse>;
  sessionId?: string;
  className?: string;
  placeholder?: string;
}

export interface MessageListProps {
  messages: ChatMessage[];
  className?: string;
}

export interface InputBoxProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export interface BiasWarningProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}