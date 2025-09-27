import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Plus, Edit, Trash2, Bot, MessageSquare, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Chatbot {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerWords: string[];
  responses: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ChatbotsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize with empty array to prevent undefined errors
  const { data: chatbots = [], isLoading } = useQuery({
    queryKey: ['chatbots'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/chatbots');
        return response.json();
      } catch (error) {
        console.error('Failed to fetch chatbots:', error);
        return []; // Return empty array on error
      }
    }
  });

  // Create/Update chatbot mutation
  const chatbotMutation = useMutation({
    mutationFn: async (data: Partial<Chatbot>) => {
      if (selectedChatbot) {
        return await apiRequest('PUT', `/api/chatbots/${selectedChatbot.id}`, data);
      } else {
        return await apiRequest('POST', '/api/chatbots', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      setIsModalOpen(false);
      setSelectedChatbot(null);
      toast({
        title: "Sucesso",
        description: selectedChatbot ? "Chatbot atualizado com sucesso!" : "Chatbot criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar chatbot",
        variant: "destructive"
      });
    }
  });

  // Delete chatbot mutation
  const deleteMutation = useMutation({
    mutationFn: async (chatbotId: string) => {
      return await apiRequest('DELETE', `/api/chatbots/${chatbotId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      toast({
        title: "Sucesso",
        description: "Chatbot excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Falha ao excluir chatbot",
        variant: "destructive"
      });
    }
  });

  const filteredChatbots = chatbots.filter(chatbot =>
    chatbot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chatbot.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateChatbot = () => {
    setSelectedChatbot(null);
    setIsModalOpen(true);
  };

  const handleEditChatbot = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot);
    setIsModalOpen(true);
  };

  const handleDeleteChatbot = (chatbotId: string) => {
    if (confirm('Tem certeza que deseja excluir este chatbot?')) {
      deleteMutation.mutate(chatbotId);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Chatbots</h1>
        <Button onClick={handleCreateChatbot}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Chatbot
        </Button>
      </div>

      {/* Search */}
      <div className="w-64">
        <Input
          placeholder="Buscar chatbots..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Chatbots List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredChatbots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum chatbot encontrado</p>
          <p className="text-sm">Clique em "Novo Chatbot" para começar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredChatbots.map((chatbot) => (
            <Card key={chatbot.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-foreground">{chatbot.name}</h3>
                      <Badge variant={chatbot.isActive ? "default" : "secondary"}>
                        {chatbot.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{chatbot.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{chatbot.triggerWords.length} palavras-chave</span>
                      <span>{chatbot.responses.length} respostas</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditChatbot(chatbot)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChatbot(chatbot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chatbot={selectedChatbot}
        onSave={chatbotMutation.mutate}
      />
    </div>
  );
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatbot: Chatbot | null;
  onSave: (data: Partial<Chatbot>) => void;
}

function ChatbotModal({ isOpen, onClose, chatbot, onSave }: ChatbotModalProps) {
  const [name, setName] = useState(chatbot?.name || '');
  const [description, setDescription] = useState(chatbot?.description || '');
  const [isActive, setIsActive] = useState(chatbot?.isActive ?? true);
  const [triggerWords, setTriggerWords] = useState(chatbot?.triggerWords?.join(', ') || '');
  const [responses, setResponses] = useState(chatbot?.responses?.join('\n') || '');

  const handleSave = () => {
    if (!name.trim() || !description.trim()) {
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      isActive,
      triggerWords: triggerWords.split(',').map(w => w.trim()).filter(w => w),
      responses: responses.split('\n').map(r => r.trim()).filter(r => r),
    });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsActive(true);
    setTriggerWords('');
    setResponses('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {chatbot ? 'Editar Chatbot' : 'Novo Chatbot'}
          </DialogTitle>
          <DialogDescription>
            {chatbot ? 'Atualize as informações do chatbot' : 'Crie um novo chatbot para automação'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do chatbot"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do chatbot"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggerWords">Palavras-chave (separadas por vírgula)</Label>
            <Input
              id="triggerWords"
              value={triggerWords}
              onChange={(e) => setTriggerWords(e.target.value)}
              placeholder="exemplo: ajuda, suporte, dúvida"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responses">Respostas (uma por linha)</Label>
            <Textarea
              id="responses"
              value={responses}
              onChange={(e) => setResponses(e.target.value)}
              placeholder="Digite as respostas do chatbot, uma por linha"
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Chatbot ativo</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !description.trim()}>
            {chatbot ? 'Atualizar' : 'Criar'} Chatbot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}