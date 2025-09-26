import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { mapContextualError } from '@/lib/error-mapper';
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  Smartphone,
  Loader2,
  Users,
  MessageCircle,
  BarChart3,
  Bell,
  Clock,
  Settings
} from 'lucide-react';

interface WhatsAppInstance {
  id: string;
  name: string;
  connectionStatus: string;
  profileName?: string;
  profilePicUrl?: string;
  number?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    Message: number;
    Contact: number;
    Chat: number;
  };
}

type ConnectionState = 'disconnected' | 'generating_qr' | 'qr_ready' | 'connected';

export default function WhatsAppSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [qrCode, setQrCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'connection' | 'notifications' | 'schedule'>('connection');

  // Get tenant ID from user's company
  const tenantId = (user as any)?.company?.id || user?.id;

  // Fetch WhatsApp instance details
  const { data: instanceData, isLoading } = useQuery({
    queryKey: ['whatsapp-instance', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const response = await apiRequest('GET', `/api/whatsapp/instance`);
      return response.json();
    },
    enabled: !!tenantId,
    refetchInterval: (data) => {
      // Poll every 3 seconds if connecting or QR ready
      const status = data?.data?.connectionStatus || data?.data?.status;
      return status === 'connecting' || status === 'SCAN_QR_CODE' ? 3000 : false;
    }
  });

  // Update connection state based on API response
  useEffect(() => {
    if (instanceData?.data) {
      const instance = instanceData.data;
      const status = instance.connectionStatus || instance.status;
      
      switch (status) {
        case 'open':
        case 'connected':
          setConnectionState('connected');
          break;
        case 'connecting':
          setConnectionState('generating_qr');
          break;
        case 'SCAN_QR_CODE':
          setConnectionState('qr_ready');
          // Se há QR code disponível, atualizar
          if (instance.qrcode?.base64) {
            setQrCode(instance.qrcode.base64);
          }
          break;
        default:
          setConnectionState('disconnected');
      }
    } else {
      setConnectionState('disconnected');
    }
  }, [instanceData]);

  // Connect WhatsApp mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/whatsapp/instance/connect', {
        instanceName: tenantId,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });
    },
    onSuccess: async (response) => {
      const result = await response.json();
      
      if (result.success) {
        if (result.qrCode) {
          setQrCode(result.qrCode);
          setConnectionState('qr_ready');
          toast({
            title: "QR Code Gerado",
            description: "Escaneie o código com seu WhatsApp",
          });
        } else {
          setConnectionState('generating_qr');
          toast({
            title: "Conexão Iniciada",
            description: "QR Code sendo gerado. Aguarde...",
          });
        }
      } else {
        setConnectionState('disconnected');
        toast({
          title: "Erro na Conexão",
          description: result.message || "Falha ao conectar",
          variant: "destructive"
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance', tenantId] });
    },
    onError: (error: any) => {
      setConnectionState('disconnected');
      toast({
        title: "Erro na Conexão",
        description: mapContextualError(error, 'whatsapp-connection'),
        variant: "destructive"
      });
    }
  });

  // Restart WhatsApp mutation
  const restartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/whatsapp/instance/restart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance', tenantId] });
      toast({
        title: "Reiniciado",
        description: "WhatsApp foi reiniciado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Reiniciar",
        description: mapContextualError(error, 'whatsapp-restart'),
        variant: "destructive"
      });
    }
  });

  // Disconnect WhatsApp mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/whatsapp/instance/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance', tenantId] });
      setConnectionState('disconnected');
      setQrCode('');
      toast({
        title: "Desconectado",
        description: "WhatsApp foi desconectado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Desconectar",
        description: mapContextualError(error, 'whatsapp-disconnection'),
        variant: "destructive"
      });
    }
  });

  const handleConnect = () => {
    if (!tenantId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado",
        variant: "destructive"
      });
      return;
    }

    setConnectionState('generating_qr');
    connectMutation.mutate();
  };

  const handleRestart = () => {
    if (window.confirm('Tem certeza que deseja reiniciar a conexão WhatsApp?')) {
      restartMutation.mutate();
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
      disconnectMutation.mutate();
    }
  };

  const renderConnectionStatus = () => {
    switch (connectionState) {
      case 'disconnected':
        return (
          <div className="text-center space-y-4">
            <div className="p-8 rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                WhatsApp Desconectado
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Conecte seu WhatsApp para começar a receber e enviar mensagens
              </p>
              <Button 
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {connectMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5 mr-2" />
                    Conectar Novo Dispositivo
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'generating_qr':
        return (
          <div className="text-center space-y-4">
            <div className="p-8 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-3">
                Gerando QR Code...
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Aguarde enquanto preparamos o código de conexão
              </p>
            </div>
          </div>
        );

      case 'qr_ready':
        return (
          <div className="text-center space-y-6">
            <div className="p-6 rounded-lg bg-white border-2 border-dashed border-gray-300">
              <img 
                src={qrCode} 
                alt="WhatsApp QR Code" 
                className="mx-auto max-w-full h-auto max-h-80"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                Escaneie o QR Code
              </h3>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                  📱 Abra o WhatsApp no seu celular, vá para Aparelhos Conectados e escaneie o código
                </p>
                <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                  <p><strong>1.</strong> Abra o WhatsApp no seu celular</p>
                  <p><strong>2.</strong> Toque em Menu (⋮) ou Configurações</p>
                  <p><strong>3.</strong> Toque em "Dispositivos conectados"</p>
                  <p><strong>4.</strong> Toque em "Conectar um dispositivo"</p>
                  <p><strong>5.</strong> Escaneie este QR Code</p>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Aguardando conexão...</span>
              </div>
            </div>
          </div>
        );

      case 'connected':
        const instance = instanceData?.data as WhatsAppInstance;
        return (
          <div className="space-y-6">
            {/* Status Header */}
            <div className="text-center">
              <div className="p-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">
                  WhatsApp Conectado
                </h3>
                {instance?.profileName && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      <span className="text-lg font-medium text-green-800 dark:text-green-200">
                        {instance.profileName}
                      </span>
                    </div>
                    {instance?.number && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {instance.number}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{instance?._count?.Contact || 0}</p>
                      <p className="text-sm text-muted-foreground">Contatos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{instance?._count?.Chat || 0}</p>
                      <p className="text-sm text-muted-foreground">Conversas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{instance?._count?.Message || 0}</p>
                      <p className="text-sm text-muted-foreground">Mensagens</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleRestart}
                disabled={restartMutation.isPending}
                className="flex items-center space-x-2"
              >
                {restartMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Reiniciando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Reiniciar</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="flex items-center space-x-2"
              >
                {disconnectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Desconectando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Desconectar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Conexão WhatsApp</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Gerencie sua conexão WhatsApp Business e monitore suas estatísticas
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('connection')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'connection'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Conexão</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'notifications'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notificações</span>
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'schedule'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Horário de Funcionamento</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'connection' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status - Main Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Status da Conexão</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              renderConnectionStatus()
            )}
          </CardContent>
        </Card>

        {/* Connection Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conexão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ID da Empresa:</span>
              <Badge variant="outline">{tenantId}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={
                connectionState === 'connected' ? 'default' : 
                connectionState === 'qr_ready' ? 'secondary' : 
                'outline'
              }>
                {connectionState === 'disconnected' ? 'Desconectado' :
                 connectionState === 'generating_qr' ? 'Gerando QR...' :
                 connectionState === 'qr_ready' ? 'Aguardando Scan' :
                 'Conectado'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Última Atualização:</span>
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Importante:</p>
                  <p>Mantenha seu celular conectado à internet para receber mensagens em tempo real.</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>1.</strong> Conecte seu WhatsApp usando o QR Code</p>
              <p><strong>2.</strong> Monitore suas estatísticas em tempo real</p>
              <p><strong>3.</strong> Gerencie a conexão conforme necessário</p>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Central de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Central de Notificações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações Persistentes</h4>
                    <p className="text-sm text-muted-foreground">
                      Alertas contínuos para conversas pendentes
                    </p>
                  </div>
                  <Switch
                    checked={true}
                    onCheckedChange={() => {}}
                    data-testid="switch-persistent-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações Pop-up</h4>
                    <p className="text-sm text-muted-foreground">
                      Suporte para notificações push no navegador
                    </p>
                  </div>
                  <Switch
                    checked={true}
                    onCheckedChange={() => {}}
                    data-testid="switch-popup-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações do Navegador</h4>
                    <p className="text-sm text-muted-foreground">
                      Ativação através do navegador
                    </p>
                  </div>
                  <Switch
                    checked={false}
                    onCheckedChange={() => {}}
                    data-testid="switch-browser-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Sons de Notificação</h4>
                    <p className="text-sm text-muted-foreground">
                      Alertas sonoros para novas mensagens
                    </p>
                  </div>
                  <Switch
                    checked={true}
                    onCheckedChange={() => {}}
                    data-testid="switch-sound-notifications"
                  />
                </div>

                {/* Configurações Específicas de Som */}
                <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Som de Conversas</h4>
                      <p className="text-sm text-muted-foreground">
                        Som de notificação para novas conversas (BIP)
                      </p>
                    </div>
                    <Switch
                      checked={true}
                      onCheckedChange={() => {}}
                      data-testid="switch-conversation-sound"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Som de Espera</h4>
                      <p className="text-sm text-muted-foreground">
                        Som para conversas em fila de espera
                      </p>
                    </div>
                    <Switch
                      checked={true}
                      onCheckedChange={() => {}}
                      data-testid="switch-waiting-sound"
                    />
                  </div>

                  <div className="ml-6">
                    <Label className="text-sm font-medium">Tipo de Som para Espera</Label>
                    <Select defaultValue="short">
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Som Curto (Padrão)</SelectItem>
                        <SelectItem value="constant">Som Constante (Alerta)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Som Curto:</strong> Um som de notificação único para cada nova mensagem (como o do WhatsApp)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Som Constante:</strong> Um som que se repete continuamente enquanto houver uma conversa na fila de espera que não foi atendida
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Alerta */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Alerta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-frequency">Frequência de Alertas</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Imediato</SelectItem>
                      <SelectItem value="1min">A cada minuto</SelectItem>
                      <SelectItem value="5min">A cada 5 minutos</SelectItem>
                      <SelectItem value="15min">A cada 15 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-hours">Horário Silencioso</Label>
                  <Input
                    id="quiet-hours"
                    placeholder="22:00 - 08:00"
                    data-testid="input-quiet-hours"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Horário de Funcionamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Dias da Semana</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <input type="checkbox" id={day} className="rounded" />
                        <label htmlFor={day} className="text-sm">{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Horário de Início</label>
                    <input type="time" className="w-full mt-1 p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Horário de Fim</label>
                    <input type="time" className="w-full mt-1 p-2 border rounded-md" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Mensagem Automática Fora do Horário</h4>
                  <textarea 
                    placeholder="Digite a mensagem que será enviada automaticamente fora do horário de funcionamento..."
                    className="w-full p-3 border rounded-md h-20 resize-none"
                  />
                </div>
                <Button className="w-full">Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}