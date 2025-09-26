import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useT } from '@/hooks/use-translation';
import { useMobile } from '@/hooks/use-mobile';
import { useSound } from '@/hooks/use-sound';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageCircle, 
  Search, 
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  Clock,
  Users,
  Plus,
  Volume2,
  VolumeX,
  Zap,
  X,
  FileImage,
  File,
  CheckCircle2,
  Circle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  User,
  Settings,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Timer,
  Star,
  Archive,
  Trash2,
  Edit,
  Copy,
  Share,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

// Enhanced Conversations Page with 3-column layout
export default function EnhancedConversationsPage() {
  const { t } = useT();
  const isMobile = useMobile();
  const queryClient = useQueryClient();
  
  // WebSocket connection for real-time updates
  const { isConnected, subscribe } = useWebSocket();
  
  // Fetch real conversations data
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/conversations');
      return response.json();
    }
  });

  // State for UI
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // WebSocket event handling
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe((message) => {
      console.log('📡 WebSocket message received:', message);
      
      switch (message.type) {
        case 'new_conversation_waiting':
          console.log('🆕 New conversation waiting:', message.data);
          
          // Refresh conversations data
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          // Show notification
          if (message.data?.conversation) {
            const conversation = message.data.conversation;
            console.log(`📨 New conversation from ${conversation.contactName} (${conversation.contactPhone})`);
            
            // You can add a toast notification here if needed
            // toast({
            //   title: "Nova Conversa",
            //   description: `${conversation.contactName} está aguardando atendimento`,
            // });
          }
          break;
          
        case 'new_message':
          console.log('💬 New message received:', message.data);
          
          // Refresh conversations data to show new messages
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          // If the message is for the currently selected conversation, refresh messages
          if (selectedConversation && message.data?.conversationId === selectedConversation.id) {
            queryClient.invalidateQueries({ 
              queryKey: ['messages', selectedConversation.id] 
            });
          }
          break;
          
        case 'conversation_status_change':
          console.log('🔄 Conversation status changed:', message.data);
          
          // Refresh conversations data
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          break;
          
        case 'system_message':
          console.log('🔔 System message:', message.data);
          break;
      }
    });

    return unsubscribe;
  }, [isConnected, subscribe, queryClient, selectedConversation]);
  const [isMuted, setIsMuted] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  
  const { 
    playNotificationSound, 
    playWaitingSound, 
    stopWaitingSound, 
    soundSettings,
    updateSoundSettings 
  } = useSound();

  // Fetch quick replies
  const { data: quickReplies = [] } = useQuery({
    queryKey: ['/api/quick-replies'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/quick-replies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch quick replies');
      return response.json();
    },
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const response = await apiRequest('GET', `/api/conversations/${selectedConversation.id}/messages`);
      return response.json();
    },
    enabled: !!selectedConversation?.id
  });

  // Fetch client details for selected conversation
  const { data: clientDetails } = useQuery({
    queryKey: ['client', selectedConversation?.clientId],
    queryFn: async () => {
      if (!selectedConversation?.clientId) return null;
      const response = await apiRequest('GET', `/api/clients/${selectedConversation.clientId}`);
      return response.json();
    },
    enabled: !!selectedConversation?.clientId
  });

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowChat(true);
    }
    playNotificationSound('conversation');
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await apiRequest('POST', `/api/conversations/${selectedConversation.id}/send-message`, {
        text: newMessage.trim(),
        to: selectedConversation.contactPhone
      });

      if (response.ok) {
        setNewMessage('');
        setShowQuickReplies(false);
        playNotificationSound('conversation');
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickReply = (message: string) => {
    setNewMessage(message);
    setShowQuickReplies(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileUpload(file);
      console.log('File selected:', file.name);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === '/' && newMessage === '') {
      e.preventDefault();
      setShowQuickReplies(true);
    } else if (e.key === 'Escape') {
      setShowQuickReplies(false);
    }
  };

  // Function to accept a conversation (move from waiting to in_progress)
  const handleAcceptConversation = async (conversationId: string) => {
    try {
      console.log(`🔄 Accepting conversation ${conversationId}`);
      
      const response = await apiRequest('PUT', `/api/conversations/${conversationId}`, {
        status: 'in_progress',
        agentId: 'current-user-id' // This should be the current user's ID
      });
      
      if (response.ok) {
        console.log(`✅ Conversation ${conversationId} accepted successfully`);
        
        // Refresh conversations data
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        // Select the accepted conversation
        const updatedConversations = await queryClient.fetchQuery({
          queryKey: ['conversations']
        });
        const acceptedConversation = updatedConversations.find((c: any) => c.id === conversationId);
        if (acceptedConversation) {
          setSelectedConversation(acceptedConversation);
          if (isMobile) {
            setShowChat(true);
          }
        }
      } else {
        console.error('❌ Failed to accept conversation');
      }
    } catch (error) {
      console.error('❌ Error accepting conversation:', error);
    }
  };

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.contactPhone.includes(searchTerm);
    const matchesTab = activeTab === 'active' ? conv.status === 'in_progress' :
                      activeTab === 'waiting' ? conv.status === 'waiting' :
                      activeTab === 'completed' ? conv.status === 'completed' : true;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-500';
      case 'waiting': return 'bg-amber-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Em Atendimento';
      case 'waiting': return 'Aguardando';
      case 'completed': return 'Finalizada';
      default: return status;
    }
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Column 1: Conversations List */}
      {(!isMobile || !showChat) && (
        <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-background">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-foreground">Conversas</h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant={soundSettings.muteConversations ? "destructive" : "ghost"}
                  size="sm"
                  onClick={() => updateSoundSettings({ muteConversations: !soundSettings.muteConversations })}
                  title={soundSettings.muteConversations ? "Som de conversas mutado" : "Mutar som de conversas"}
                >
                  {soundSettings.muteConversations ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant={soundSettings.muteWaiting ? "destructive" : "ghost"}
                  size="sm"
                  onClick={() => updateSoundSettings({ muteWaiting: !soundSettings.muteWaiting })}
                  title={soundSettings.muteWaiting ? "Som de espera mutado" : "Mutar som de espera"}
                >
                  {soundSettings.muteWaiting ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <Clock className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/20 h-auto">
              <TabsTrigger value="active" className="text-xs font-medium p-2">
                <MessageCircle className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">ATIVAS</span>
                <span className="sm:hidden">ATV</span>
                {conversations.filter(conv => conv.status === 'in_progress').length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {conversations.filter(conv => conv.status === 'in_progress').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="waiting" className="text-xs font-medium p-2">
                <Clock className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">ESPERA</span>
                <span className="sm:hidden">ESP</span>
                {conversations.filter(conv => conv.status === 'waiting').length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {conversations.filter(conv => conv.status === 'waiting').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs font-medium p-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">FINAL</span>
                <span className="sm:hidden">FIN</span>
                {conversations.filter(conv => conv.status === 'completed').length > 0 && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    {conversations.filter(conv => conv.status === 'completed').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Content based on active tab */}
            <TabsContent value="active" className="flex-1 overflow-auto mt-0">
              <ScrollArea className="h-full">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma conversa ativa</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {conversation.contactName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(conversation.status)} rounded-full`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {conversation.contactName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage || 'Sem mensagens'}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <div className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="mt-1">
                            <Badge variant={conversation.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs">
                              {getStatusText(conversation.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="waiting" className="flex-1 overflow-auto mt-0">
              <ScrollArea className="h-full">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma conversa em espera</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback className="bg-amber-500 text-white">
                              {conversation.contactName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                            <Clock className="h-2 w-2 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {conversation.contactName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <div className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-xs font-medium">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                              {getStatusText(conversation.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="completed" className="flex-1 overflow-auto mt-0">
              <ScrollArea className="h-full">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma conversa finalizada</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback className="bg-blue-500 text-white">
                              {conversation.contactName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {conversation.contactName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                              {getStatusText(conversation.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Column 2: Chat Area */}
      {(!isMobile || showChat) && selectedConversation && (
        <div className="flex-1 flex flex-col bg-background h-full">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversation.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedConversation.contactName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {selectedConversation.contactName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.contactPhone}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="relative max-w-[85%] sm:max-w-xs lg:max-w-md">
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md ${
                      message.direction === 'outgoing'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card text-card-foreground border border-border rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-end mt-2 space-x-2">
                      <span className="text-xs opacity-70">{message.timestamp}</span>
                      {message.direction === 'outgoing' && (
                        <div className="flex items-center space-x-1">
                          {message.status === 'read' ? (
                            <CheckCircle2 className="h-3 w-3 opacity-70" />
                          ) : (
                            <Circle className="h-3 w-3 opacity-70" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex-shrink-0 border-t border-border bg-background relative">
            {/* Quick replies dropdown */}
            {showQuickReplies && quickReplies.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 z-10 mb-1">
                <Card className="mx-4 shadow-lg">
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Respostas Rápidas</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowQuickReplies(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <ScrollArea className="max-h-32">
                      <div className="space-y-1">
                        {quickReplies.slice(0, 5).map((reply: any) => (
                          <button
                            key={reply.id}
                            onClick={() => handleQuickReply(reply.message)}
                            className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs font-mono">/{reply.shortcut}</Badge>
                              <span className="text-sm truncate">{reply.message}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Input area */}
            <div className="p-4">
              {/* File preview */}
              {fileUpload && (
                <div className="mb-3 p-3 bg-accent rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {fileUpload.type.startsWith('image/') ? (
                      <FileImage className="h-4 w-4 text-primary" />
                    ) : (
                      <File className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-sm font-medium">{fileUpload.name}</span>
                    <span className="text-xs text-muted-foreground">({(fileUpload.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setFileUpload(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Input row */}
              <div className="flex items-end space-x-2 w-full">
                <div className="flex space-x-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 w-10 p-0"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0"
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Digite uma mensagem ou / para respostas rápidas..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[40px]"
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && !fileUpload}
                  className="h-10 w-10 p-0 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column 3: Contact Details */}
      {!isMobile && selectedConversation && showDetails && (
        <div className="w-80 border-l border-border flex flex-col bg-background">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Detalhes do Contato</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Informações do Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedConversation.contactPhone}</span>
                  </div>
                  {clientDetails?.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{clientDetails.email}</span>
                    </div>
                  )}
                  {clientDetails?.notes && (
                    <div className="flex items-start space-x-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{clientDetails.notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Informações da Conversa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={selectedConversation.status === 'in_progress' ? 'default' : 'secondary'}>
                      {getStatusText(selectedConversation.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Iniciada em</span>
                    <span className="text-sm">
                      {new Date(selectedConversation.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Última mensagem</span>
                    <span className="text-sm">
                      {new Date(selectedConversation.lastMessageAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  {selectedConversation.assignedAgentId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Agente</span>
                      <span className="text-sm">Agente Atribuído</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Contato
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Número
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar Conversa
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Conversa
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Empty State - Desktop */}
      {!isMobile && !showChat && (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tudo Tranquilo!
            </h3>
            <p className="text-muted-foreground">
              Que tal começar um atendimento?<br />
              Selecione um contato para iniciar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
