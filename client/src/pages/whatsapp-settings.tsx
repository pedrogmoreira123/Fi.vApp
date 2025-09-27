import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Phone,
  RefreshCw,
  Settings,
  Bell,
  Clock as ClockIcon
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface WhatsAppInstance {
  id: string;
  name: string;
  connectionStatus: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  lastUpdate?: string;
  phoneNumber?: string;
}

interface QRCodeData {
  qrCode: string;
  status: string;
  message: string;
}

const WhatsAppSettings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'connection' | 'notifications' | 'schedule'>('connection');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);

  // Fetch WhatsApp instance data
  const { data: instanceData, isLoading, error } = useQuery({
    queryKey: ['whatsapp-instance'],
    queryFn: async () => {
      return await apiClient.get('/whatsapp/instance');
    },
    refetchInterval: 5000, // Poll every 5 seconds
    retry: 3
  });

  // Connect WhatsApp mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/whatsapp/instance/connect');
    },
    onSuccess: (data) => {
      if (data.success && data.qrCode) {
        setQrCodeData({
          qrCode: data.qrCode,
          status: data.status,
          message: data.message
        });
        setShowQRModal(true);
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
    onError: (error) => {
      console.error('Failed to connect WhatsApp:', error);
    }
  });

  // Disconnect WhatsApp mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.delete('/whatsapp/instance/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    }
  });

  const instance: WhatsAppInstance | null = instanceData?.data || null;
  const isConnected = instance?.connectionStatus === 'open' || instance?.connectionStatus === 'connected';
  const isConnecting = instance?.connectionStatus === 'connecting';

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const formatPhoneNumber = (jid: string) => {
    if (!jid) return 'N/A';
    const phoneNumber = jid.split('@')[0];
    return phoneNumber.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Desconectado';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações do WhatsApp</h1>
          <p className="text-gray-600">Gerencie sua conexão com o WhatsApp Business</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('connection')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'connection'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4" />
                  <span>Conexão</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span>Notificações</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>Horário de Funcionamento</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'connection' && (
              <div className="space-y-6">
                {/* Connection Status */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Status da Conexão</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(instance?.connectionStatus || 'disconnected')}
                      <span className={`font-medium ${getStatusColor(instance?.connectionStatus || 'disconnected')}`}>
                        {getStatusText(instance?.connectionStatus || 'disconnected')}
                      </span>
                    </div>
                  </div>

                  {!isConnected && !isConnecting && (
                    <div className="text-center py-8">
                      <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Desconectado</h4>
                      <p className="text-gray-600 mb-6">
                        Conecte seu WhatsApp para começar a receber e enviar mensagens
                      </p>
                      <button
                        onClick={handleConnect}
                        disabled={connectMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                      >
                        <Smartphone className="w-5 h-5" />
                        <span>Conectar ao WhatsApp</span>
                      </button>
                    </div>
                  )}

                  {isConnecting && (
                    <div className="text-center py-8">
                      <RefreshCw className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Conectando...</h4>
                      <p className="text-gray-600">
                        Aguarde enquanto estabelecemos a conexão com o WhatsApp
                      </p>
                    </div>
                  )}

                  {isConnected && instance && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <Phone className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-900">Número de Telefone</span>
                          </div>
                          <p className="text-gray-600">
                            {formatPhoneNumber(instance.ownerJid || '')}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <User className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-900">Nome do WhatsApp</span>
                          </div>
                          <p className="text-gray-600">
                            {instance.profileName || 'N/A'}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <Clock className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-900">Última Atualização</span>
                          </div>
                          <p className="text-gray-600">
                            {instance.lastUpdate ? new Date(instance.lastUpdate).toLocaleString('pt-BR') : 'N/A'}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center space-x-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="font-medium text-gray-900">Status de Conexão</span>
                          </div>
                          <p className="text-green-600 font-medium">
                            {getStatusText(instance.connectionStatus)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={handleConnect}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <RefreshCw className="w-5 h-5" />
                          <span>Reconectar</span>
                        </button>
                        <button
                          onClick={handleDisconnect}
                          disabled={disconnectMutation.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <WifiOff className="w-5 h-5" />
                          <span>Desconectar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <Bell className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Central de Notificações WhatsApp</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Notificações Persistentes</h4>
                          <p className="text-sm text-gray-500">
                            Alertas contínuos para mensagens do WhatsApp
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
                          <h4 className="font-medium text-gray-900">Notificações Pop-up</h4>
                          <p className="text-sm text-gray-500">
                            Suporte para notificações push no Android
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
                          <h4 className="font-medium text-gray-900">Notificações do Navegador</h4>
                          <p className="text-sm text-gray-500">
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
                          <h4 className="font-medium text-gray-900">Sons de Notificação</h4>
                          <p className="text-sm text-gray-500">
                            Alertas sonoros para novas mensagens do WhatsApp
                          </p>
                        </div>
                        <Switch
                          checked={true}
                          onCheckedChange={() => {}}
                          data-testid="switch-sound-notifications"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Alerta WhatsApp</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="alert-frequency" className="text-sm font-medium text-gray-700">Frequência de Alertas</Label>
                        <Select>
                          <SelectTrigger className="w-full">
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
                        <Label htmlFor="quiet-hours" className="text-sm font-medium text-gray-700">Horário Silencioso</Label>
                        <Input
                          id="quiet-hours"
                          placeholder="22:00 - 08:00"
                          data-testid="input-quiet-hours"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Horário de Funcionamento</h3>
                <p className="text-gray-600">Configure os horários de funcionamento do seu WhatsApp Business</p>
                {/* Schedule content will be implemented here */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Conectar WhatsApp</h3>
              <p className="text-gray-600 mb-6">
                Escaneie o QR Code abaixo com seu WhatsApp para conectar
              </p>
              
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
                <img 
                  src={qrCodeData.qrCode} 
                  alt="QR Code para conectar WhatsApp"
                  className="w-full h-auto max-w-xs mx-auto"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Aguardando conexão...</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Toque em Menu ou Configurações</p>
                  <p>3. Toque em "Dispositivos conectados"</p>
                  <p>4. Toque em "Conectar um dispositivo"</p>
                  <p>5. Escaneie este QR Code</p>
                </div>
              </div>

              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Verificar Conexão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSettings;
