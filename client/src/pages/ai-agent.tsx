import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bot, Save, Settings, Zap } from 'lucide-react';

interface AiAgentConfig {
  id: string;
  mode: 'chatbot' | 'ai_agent';
  isEnabled: boolean;
  geminiApiKey?: string;
  agentPrompt?: string;
  welcomeMessage?: string;
  responseDelay: number;
}

export default function AiAgentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState<Partial<AiAgentConfig>>({
    mode: 'ai_agent',
    isEnabled: false,
    responseDelay: 3,
    welcomeMessage: 'Olá! Como posso ajudá-lo hoje?',
    agentPrompt: 'Você é um assistente virtual especializado em atendimento ao cliente. Seja sempre cordial, prestativo e profissional.'
  });

  const { data: aiConfig, isLoading } = useQuery<AiAgentConfig>({
    queryKey: ['ai-agent-config'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai-agent-config');
      return response.json();
    }
  });

  const saveConfig = useMutation({
    mutationFn: async (configData: Partial<AiAgentConfig>) => {
      const response = await apiRequest('POST', '/api/ai-agent-config', configData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-config'] });
      toast({
        title: "Configuração salva!",
        description: "As configurações do Agente de I.A foram atualizadas.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Falha ao salvar configurações",
      });
    }
  });

  const handleSave = () => {
    saveConfig.mutate(config);
  };

  const handleToggleEnabled = (enabled: boolean) => {
    setConfig(prev => ({ ...prev, isEnabled: enabled }));
  };

  const handleModeChange = (mode: 'chatbot' | 'ai_agent') => {
    setConfig(prev => ({ ...prev, mode }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agente de I.A</h1>
          <p className="text-muted-foreground">
            Configure seu assistente virtual inteligente para atendimento automático
          </p>
        </div>
        <Badge variant={config.isEnabled ? "default" : "secondary"}>
          {config.isEnabled ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Principais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status do Agente */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Ativar Agente de I.A</Label>
                <p className="text-sm text-muted-foreground">
                  Habilite o assistente virtual para responder automaticamente
                </p>
              </div>
              <Switch
                id="enabled"
                checked={config.isEnabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>

            {/* Modo de Operação */}
            <div className="space-y-2">
              <Label>Modo de Operação</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={config.mode === 'ai_agent' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('ai_agent')}
                  className="justify-start"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Agente I.A
                </Button>
                <Button
                  variant={config.mode === 'chatbot' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('chatbot')}
                  className="justify-start"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Chatbot
                </Button>
              </div>
            </div>

            {/* Chave da API */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave da API Gemini</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Digite sua chave da API Gemini"
                value={config.geminiApiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                Necessário para funcionalidade de I.A avançada
              </p>
            </div>

            {/* Delay de Resposta */}
            <div className="space-y-2">
              <Label htmlFor="delay">Delay de Resposta (segundos)</Label>
              <Input
                id="delay"
                type="number"
                min="1"
                max="30"
                value={config.responseDelay}
                onChange={(e) => setConfig(prev => ({ ...prev, responseDelay: parseInt(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Mensagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Mensagens e Comportamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mensagem de Boas-vindas */}
            <div className="space-y-2">
              <Label htmlFor="welcome">Mensagem de Boas-vindas</Label>
              <Textarea
                id="welcome"
                placeholder="Digite a mensagem de boas-vindas..."
                value={config.welcomeMessage || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Prompt do Agente */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt do Agente</Label>
              <Textarea
                id="prompt"
                placeholder="Configure como o agente deve se comportar..."
                value={config.agentPrompt || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, agentPrompt: e.target.value }))}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Instruções específicas sobre como o agente deve responder
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveConfig.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}