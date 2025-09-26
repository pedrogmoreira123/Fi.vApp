export interface KPIData {
  openConversations: number;
  onlineAgents: number;
  avgWaitingTime: string;
  completedConversations: number;
}

export interface ActivityItem {
  id: string;
  type: 'handled' | 'completed' | 'assigned';
  agentName: string;
  clientName?: string;
  timestamp: string;
  description: string;
}

export interface ConversationData {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  time: string;
  status: 'in_progress' | 'waiting' | 'completed';
  initials: string;
}

export interface MessageData {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
}

export interface UserRole {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'agent' | 'superadmin';
  isOnline: boolean;
  initials: string;
}

export interface QueueData {
  id: string;
  name: string;
  description: string;
  workingHours: string;
  workingDays: string;
  messageInsideHours: string;
  messageOutsideHours: string;
  greetingMessage: string;
  chatbotEnabled: boolean;
  chatbotId: string;
  allowCustomerSelection: boolean;
  activeConversations: number;
  isActive: boolean;
}

export interface ChatbotData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  welcomeMessage: string;
  departmentMessage: string;
  queueMessage: string;
  finalizationMessage: string;
  offlineMessage: string;
  autoReply: boolean;
  workingHours: boolean;
  transferToAgent: boolean;
  maxMessagesBeforeTransfer: number;
  responseDelay: number;
}

export interface ContactHistory {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface AppSettings {
  companyName: string;
  cnpj: string;
  primaryColor: string;
  secondaryColor: string;
  whatsappConnected: boolean;
}

export interface AIAgentSettings {
  isEnabled: boolean;
  welcomeMessage: string;
  responseDelay: number;
}
