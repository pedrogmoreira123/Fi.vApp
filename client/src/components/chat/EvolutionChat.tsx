import React, { useState, useEffect, useRef } from 'react';
import { useEvolutionMessages } from '../../hooks/useEvolutionMessages';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Send, 
  Paperclip, 
  Image, 
  Mic, 
  Phone, 
  Video, 
  MoreVertical,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

interface EvolutionChatProps {
  conversationId?: string;
  className?: string;
}

export const EvolutionChat: React.FC<EvolutionChatProps> = ({ 
  conversationId, 
  className = '' 
}) => {
  const {
    messages,
    conversations,
    activeConversation,
    isLoading,
    error,
    sendMessage,
    sendMediaMessage,
    markAsRead,
    setActiveConversation,
    isConnected,
    reconnect
  } = useEvolutionMessages();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set active conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setActiveConversation(conversation);
      }
    }
  }, [conversationId, conversations, setActiveConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark as read when conversation is active
  useEffect(() => {
    if (activeConversation) {
      markAsRead(activeConversation.id);
    }
  }, [activeConversation, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation || isLoading) return;

    try {
      setIsTyping(true);
      await sendMessage(activeConversation.id, messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMediaUpload = async (type: 'image' | 'video' | 'audio' | 'document') => {
    if (!activeConversation) return;

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 
                  type === 'video' ? 'video/*' : 
                  type === 'audio' ? 'audio/*' : '*/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // Upload file and get URL
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const { url } = await response.json();
        
        // Send media message
        await sendMediaMessage(activeConversation.id, {
          type,
          url,
          caption: file.name
        });
      } catch (error) {
        console.error('Failed to upload media:', error);
      }
    };

    input.click();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!activeConversation) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Phone className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Selecione uma conversa
            </h3>
            <p className="text-gray-400">
              Escolha uma conversa para começar a conversar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {activeConversation.contactName.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{activeConversation.contactName}</CardTitle>
              <p className="text-sm text-gray-500">{activeConversation.contactPhone}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(activeConversation.status)}>
              {activeConversation.status}
            </Badge>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={reconnect}
              disabled={isConnected}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {isLoading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.direction === 'outgoing'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.mediaUrl && (
                      <div className="mb-2">
                        {message.messageType === 'image' && (
                          <img
                            src={message.mediaUrl}
                            alt="Media"
                            className="max-w-full h-auto rounded"
                          />
                        )}
                        {message.messageType === 'video' && (
                          <video
                            src={message.mediaUrl}
                            controls
                            className="max-w-full h-auto rounded"
                          />
                        )}
                        {message.messageType === 'audio' && (
                          <audio
                            src={message.mediaUrl}
                            controls
                            className="w-full"
                          />
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t">
        {error && (
          <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMediaUpload('image')}
              disabled={isLoading}
            >
              <Image className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMediaUpload('video')}
              disabled={isLoading}
            >
              <Video className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMediaUpload('audio')}
              disabled={isLoading}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMediaUpload('document')}
              disabled={isLoading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
          
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
