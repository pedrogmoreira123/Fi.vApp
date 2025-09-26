import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QueueData, ChatbotData } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue?: QueueData;
  onSave?: (data: QueueData) => void;
}

export default function QueueModal({ isOpen, onClose, queue, onSave }: QueueModalProps) {
  const [queueName, setQueueName] = useState('');
  const [description, setDescription] = useState('');
  const [workingDays, setWorkingDays] = useState('monday');
  const [workingHours, setWorkingHours] = useState('09:00-18:00');
  const [messageInsideHours, setMessageInsideHours] = useState('');
  const [messageOutsideHours, setMessageOutsideHours] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [chatbotId, setChatbotId] = useState('');
  const [allowCustomerSelection, setAllowCustomerSelection] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Fetch chatbots data
  const { data: chatbots = [] } = useQuery({
    queryKey: ['chatbots'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chatbots');
      return response.json();
    }
  });

  useEffect(() => {
    if (queue) {
      setQueueName(queue.name);
      setDescription(queue.description || '');
      setWorkingDays('monday');
      setWorkingHours('09:00-18:00');
      setMessageInsideHours(queue.messageInsideHours || '');
      setMessageOutsideHours(queue.messageOutsideHours || '');
      setGreetingMessage(queue.greetingMessage || '');
      setChatbotEnabled(queue.chatbotEnabled || false);
      setChatbotId(queue.chatbotId || '');
      setAllowCustomerSelection(queue.allowCustomerSelection !== false);
      setIsActive(queue.isActive !== false);
    } else {
      setQueueName('');
      setDescription('');
      setWorkingDays('monday');
      setWorkingHours('09:00-18:00');
      setMessageInsideHours('');
      setMessageOutsideHours('');
      setGreetingMessage('');
      setChatbotEnabled(false);
      setChatbotId('');
      setAllowCustomerSelection(true);
      setIsActive(true);
    }
  }, [queue, isOpen]);

  const handleSave = () => {
    const queueData = {
      id: queue?.id,
      name: queueName,
      description,
      workingDays,
      workingHours,
      messageInsideHours,
      messageOutsideHours,
      greetingMessage,
      chatbotEnabled,
      chatbotId,
      allowCustomerSelection,
      isActive
    };
    
    if (onSave) {
      onSave(queueData);
    } else {
      console.log(queue ? 'Atualizando fila:' : 'Criando fila:', queueData);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]" data-testid="modal-queue">
        <DialogHeader>
          <DialogTitle>{queue ? 'Editar Fila' : 'Adicionar Fila'}</DialogTitle>
          <DialogDescription>
            Configure as configurações da fila incluindo horários de funcionamento e mensagens.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="queueName">Nome da Fila</Label>
            <Input
              id="queueName"
              placeholder="Digite o nome da fila"
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              data-testid="input-queue-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição da fila/setor"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="textarea-queue-description"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Horário de Funcionamento</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={workingDays} onValueChange={setWorkingDays}>
                <SelectTrigger data-testid="select-working-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Segunda-feira</SelectItem>
                  <SelectItem value="tuesday">Terça-feira</SelectItem>
                  <SelectItem value="wednesday">Quarta-feira</SelectItem>
                  <SelectItem value="thursday">Quinta-feira</SelectItem>
                  <SelectItem value="friday">Sexta-feira</SelectItem>
                  <SelectItem value="saturday">Sábado</SelectItem>
                  <SelectItem value="sunday">Domingo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={workingHours} onValueChange={setWorkingHours}>
                <SelectTrigger data-testid="select-working-hours">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00-18:00">09:00 - 18:00</SelectItem>
                  <SelectItem value="08:00-17:00">08:00 - 17:00</SelectItem>
                  <SelectItem value="24-hours">24 Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="messageInsideHours">Mensagem (Dentro do Horário)</Label>
            <Textarea
              id="messageInsideHours"
              className="h-20 resize-none"
              placeholder="Mensagem para dentro do horário de funcionamento"
              value={messageInsideHours}
              onChange={(e) => setMessageInsideHours(e.target.value)}
              data-testid="textarea-message-inside-hours"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="messageOutsideHours">Mensagem (Fora do Horário)</Label>
            <Textarea
              id="messageOutsideHours"
              className="h-20 resize-none"
              placeholder="Mensagem para fora do horário de funcionamento"
              value={messageOutsideHours}
              onChange={(e) => setMessageOutsideHours(e.target.value)}
              data-testid="textarea-message-outside-hours"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="greetingMessage">Mensagem de Saudação</Label>
            <Textarea
              id="greetingMessage"
              className="h-20 resize-none"
              placeholder="Mensagem de boas-vindas para novos clientes"
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              data-testid="textarea-greeting-message"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chatbot-enabled">Chatbot Associado</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar chatbot para esta fila
                </p>
              </div>
              <Switch
                id="chatbot-enabled"
                checked={chatbotEnabled}
                onCheckedChange={setChatbotEnabled}
                data-testid="switch-chatbot-enabled"
              />
            </div>
            
            {chatbotEnabled && (
              <div className="space-y-2">
                <Label htmlFor="chatbotId">Selecionar Chatbot</Label>
                <Select value={chatbotId} onValueChange={setChatbotId}>
                  <SelectTrigger data-testid="select-chatbot">
                    <SelectValue placeholder="Selecione um chatbot" />
                  </SelectTrigger>
                  <SelectContent>
                    {chatbots.length === 0 ? (
                      <SelectItem value="" disabled>Nenhum chatbot disponível</SelectItem>
                    ) : (
                      chatbots.map((chatbot: ChatbotData) => (
                        <SelectItem key={chatbot.id} value={chatbot.id}>
                          {chatbot.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-selection">Permitir Seleção pelo Cliente</Label>
                <p className="text-sm text-muted-foreground">
                  Cliente pode escolher esta fila no menu
                </p>
              </div>
              <Switch
                id="allow-selection"
                checked={allowCustomerSelection}
                onCheckedChange={setAllowCustomerSelection}
                data-testid="switch-allow-selection"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-active">Fila Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Fila está ativa e recebendo conversas
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                data-testid="switch-is-active"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel-queue">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!queueName}
            data-testid="button-save-queue"
          >
            Salvar Fila
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
