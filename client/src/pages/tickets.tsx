import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import { useT } from '@/hooks/use-translation';
import { useMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Phone,
  UserPlus,
  Users as UsersIcon,
  X,
  CalendarDays
} from 'lucide-react';

type TicketStatus = 'open' | 'in_progress' | 'closed' | 'canceled' | 'all';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  clientPhone: string;
  tags: string[];
}

interface FilterOptions {
  assignedTo: string;
  priority: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

// Fetch real data from API
const useTicketsData = () => {
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/conversations');
      return response.json();
    }
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    }
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/clients');
      return response.json();
    }
  });

  return {
    conversations,
    users,
    clients,
    isLoading: isLoadingConversations || isLoadingUsers || isLoadingClients
  };
};

const statusLabels = {
  all: 'Todos',
  open: 'Aberto',
  in_progress: 'Em Andamento', 
  closed: 'Fechado',
  canceled: 'Cancelado'
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusColors = {
  all: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  canceled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export default function TicketsPage() {
  const { user } = useAuth();
  const { t } = useT();
  const isMobile = useMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { conversations, users, clients, isLoading } = useTicketsData();
  
  const [activeTab, setActiveTab] = useState<TicketStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketType, setNewTicketType] = useState<'agent' | 'client'>('agent');
  
  const [filters, setFilters] = useState<FilterOptions>({
    assignedTo: '',
    priority: '',
    dateFrom: undefined,
    dateTo: undefined
  });

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    clientName: '',
    clientPhone: '',
    selectedClient: ''
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const response = await apiRequest('POST', '/api/conversations', ticketData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: "Atendimento criado!",
        description: "O atendimento foi criado com sucesso.",
      });
      setShowNewTicketModal(false);
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        clientName: '',
        clientPhone: '',
        selectedClient: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar atendimento",
        description: error.message || "Falha ao criar atendimento",
        variant: "destructive"
      });
    }
  });

  // RBAC: Filter tickets based on user role
  const getFilteredTickets = () => {
    let filteredTickets = conversations;

    // Role-based filtering
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      filteredTickets = filteredTickets.filter(conversation => 
        conversation.assignedAgentId === user?.id
      );
    }

    // Status filtering
    if (activeTab !== 'all') {
      const statusMap = {
        'open': 'waiting',
        'in_progress': 'in_progress',
        'closed': 'completed',
        'canceled': 'closed'
      };
      filteredTickets = filteredTickets.filter(conversation => 
        conversation.status === statusMap[activeTab as keyof typeof statusMap]
      );
    }

    // Search filtering (conversation ID, client name, agent, phone)
    if (searchQuery) {
      filteredTickets = filteredTickets.filter(conversation =>
        conversation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.contactPhone.includes(searchQuery)
      );
    }

    // Advanced filters
    if (filters.assignedTo) {
      filteredTickets = filteredTickets.filter(conversation => 
        conversation.assignedAgentId === filters.assignedTo
      );
    }

    if (filters.priority) {
      filteredTickets = filteredTickets.filter(conversation => 
        conversation.priority === filters.priority
      );
    }

    // Date filtering
    if (filters.dateFrom || filters.dateTo) {
      filteredTickets = filteredTickets.filter(conversation => {
        const conversationDate = new Date(conversation.createdAt);
        
        if (filters.dateFrom && conversationDate < filters.dateFrom) return false;
        if (filters.dateTo && conversationDate > filters.dateTo) return false;
        
        return true;
      });
    }

    return filteredTickets;
  };

  const filteredTickets = getFilteredTickets();

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      case 'canceled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTicketCounts = () => {
    const userTickets = user?.role === 'admin' || user?.role === 'superadmin' ? conversations : 
      conversations.filter(conversation => conversation.assignedAgentId === user?.id);
      
    return {
      all: userTickets.length,
      open: userTickets.filter(t => t.status === 'waiting').length,
      in_progress: userTickets.filter(t => t.status === 'in_progress').length,
      closed: userTickets.filter(t => t.status === 'completed').length,
      canceled: userTickets.filter(t => t.status === 'closed').length,
    };
  };

  const counts = getTicketCounts();

  const handleCreateTicket = () => {
    if (!newTicket.title || !newTicket.assignedTo || (!newTicket.clientName && !newTicket.selectedClient)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    const clientInfo = newTicketType === 'client' 
      ? clients.find(c => c.id === newTicket.selectedClient)
      : { name: newTicket.clientName, phone: newTicket.clientPhone };

    const ticketData = {
      contactName: clientInfo?.name || newTicket.clientName,
      contactPhone: clientInfo?.phone || newTicket.clientPhone,
      assignedAgentId: newTicket.assignedTo,
      status: 'waiting',
      priority: newTicket.priority,
      tags: [newTicket.title]
    };

    createTicketMutation.mutate(ticketData);
  };

  const clearFilters = () => {
    setFilters({
      assignedTo: '',
      priority: '',
      dateFrom: undefined,
      dateTo: undefined
    });
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando atendimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Atendimentos</h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' 
              ? 'Gerencie todos os tickets do sistema'
              : 'Visualize seus tickets atribuídos'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros {showFilters && '(Ativo)'}
          </Button>
          
          <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-new-ticket">
                <Plus className="h-4 w-4 mr-2" />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Novo Atendimento</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Tipo de criação */}
                <div className="space-y-2">
                  <Label>Tipo de Atendimento</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={newTicketType === 'agent' ? 'default' : 'outline'}
                      onClick={() => setNewTicketType('agent')}
                      className="justify-start"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Por Atendente
                    </Button>
                    <Button
                      variant={newTicketType === 'client' ? 'default' : 'outline'}
                      onClick={() => setNewTicketType('client')}
                      className="justify-start"
                    >
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Por Cliente
                    </Button>
                  </div>
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Descreva o motivo do atendimento"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {/* Cliente */}
                {newTicketType === 'client' ? (
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente *</Label>
                    <Select 
                      value={newTicket.selectedClient} 
                      onValueChange={(value) => setNewTicket(prev => ({ ...prev, selectedClient: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Nome do Cliente *</Label>
                      <Input
                        id="clientName"
                        placeholder="Nome completo"
                        value={newTicket.clientName}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, clientName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Telefone</Label>
                      <Input
                        id="clientPhone"
                        placeholder="(11) 99999-9999"
                        value={newTicket.clientPhone}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, clientPhone: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Atendente */}
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Atendente Responsável *</Label>
                  <Select 
                    value={newTicket.assignedTo} 
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridade */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select 
                    value={newTicket.priority} 
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalhes adicionais sobre o atendimento"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateTicket}>
                    Criar Atendimento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Advanced Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar por ticket, cliente, atendente ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-tickets"
            />
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Filtros Avançados</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Atendente</Label>
                  <Select 
                    value={filters.assignedTo} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {users.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select 
                    value={filters.priority} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {Object.entries(priorityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-0 overflow-x-auto">
          {Object.entries(statusLabels).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setActiveTab(status as TicketStatus)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === status
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
              data-testid={`tab-${status}`}
            >
              <div className="flex items-center space-x-2">
                {status !== 'all' && getStatusIcon(status as TicketStatus)}
                <span>{label}</span>
                <Badge variant="secondary" className="ml-1">
                  {counts[status as keyof typeof counts]}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum Registro Encontrado
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Nenhum ticket corresponde aos critérios de pesquisa'
                : `Nenhum ticket ${activeTab !== 'all' ? statusLabels[activeTab].toLowerCase() : ''} encontrado`
              }
            </p>
          </div>
        ) : (
          filteredTickets.map((conversation) => {
            const assignedUser = users.find(u => u.id === conversation.assignedAgentId);
            const statusMap = {
              'waiting': 'open',
              'in_progress': 'in_progress', 
              'completed': 'closed',
              'closed': 'canceled'
            };
            const mappedStatus = statusMap[conversation.status as keyof typeof statusMap] || 'open';
            
            return (
              <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-foreground">#{conversation.id.slice(-6)}</h3>
                        <Badge 
                          variant="secondary" 
                          className={statusColors[mappedStatus as keyof typeof statusColors]}
                        >
                          {statusLabels[mappedStatus as keyof typeof statusLabels]}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={priorityColors[conversation.priority as keyof typeof priorityColors]}
                        >
                          {priorityLabels[conversation.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-foreground mb-1">
                        {conversation.contactName}
                      </h4>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        Cliente: {conversation.contactName}
                      </p>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        Telefone: {conversation.contactPhone}
                      </p>

                      {conversation.tags && conversation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {conversation.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>Atendente: {assignedUser?.name || 'Não atribuído'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>Criado: {format(new Date(conversation.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" data-testid={`button-more-${conversation.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Results Summary */}
      {filteredTickets.length > 0 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredTickets.length} de {conversations.length} atendimentos
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}