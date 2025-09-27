import React, { useState } from 'react';
import { useWhatsapp } from '../../hooks/useWhatsapp';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Phone,
  User,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';

const WhatsappSettings: React.FC = () => {
  const { 
    instance, 
    qrcode, 
    loading, 
    error, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    refreshInstance 
  } = useWhatsapp();
  
  const [showQRModal, setShowQRModal] = useState(false);

  const handleConnect = async () => {
    if (instance?.id) {
      await connect(instance.id);
      if (qrcode) {
        setShowQRModal(true);
      }
    }
  };

  const handleDisconnect = async () => {
    if (instance?.id) {
      await disconnect(instance.id);
    }
  };

  const handleRefresh = async () => {
    await refreshInstance();
  };

  const formatPhoneNumber = (jid?: string) => {
    if (!jid) return 'N/A';
    const phoneNumber = jid.split('@')[0];
    return phoneNumber.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  };

  const getStatusIcon = (status?: string) => {
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

  const getStatusText = (status?: string) => {
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

  const getStatusColor = (status?: string) => {
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

  if (loading && !instance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando configurações do WhatsApp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações do WhatsApp</h1>
          <p className="text-gray-600">Gerencie sua conexão com o WhatsApp Business</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Connection Status Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Wifi className="w-6 h-6 text-gray-500" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Status da Conexão</h2>
                  <p className="text-sm text-gray-600">Gerencie sua conexão com o WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(instance?.connectionStatus)}
                <span className={`font-medium ${getStatusColor(instance?.connectionStatus)}`}>
                  {getStatusText(instance?.connectionStatus)}
                </span>
              </div>
            </div>

            {/* Connection Content */}
            {!isConnected && !isConnecting && (
              <div className="text-center py-12">
                <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Desconectado</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Conecte seu WhatsApp para começar a receber e enviar mensagens automaticamente
                </p>
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Conectar ao WhatsApp</span>
                </button>
              </div>
            )}

            {isConnecting && (
              <div className="text-center py-12">
                <RefreshCw className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Conectando...</h3>
                <p className="text-gray-600 mb-6">
                  Aguarde enquanto estabelecemos a conexão com o WhatsApp
                </p>
                {qrcode && (
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Ver QR Code</span>
                  </button>
                )}
              </div>
            )}

            {isConnected && instance && (
              <div className="space-y-6">
                {/* Instance Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">Número de Telefone</span>
                    </div>
                    <p className="text-gray-600">
                      {formatPhoneNumber(instance.phoneNumber || instance.profileName)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">Nome do WhatsApp</span>
                    </div>
                    <p className="text-gray-600">
                      {instance.profileName || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">Última Atualização</span>
                    </div>
                    <p className="text-gray-600">
                      {instance.lastUpdate ? new Date(instance.lastUpdate).toLocaleString('pt-BR') : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-900">Status de Conexão</span>
                    </div>
                    <p className="text-green-600 font-medium">
                      {getStatusText(instance.connectionStatus)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Atualizar</span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
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
      </div>

      {/* QR Code Modal */}
      {showQRModal && qrcode && (
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
                  src={`data:image/png;base64,${qrcode}`}
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
                    handleRefresh();
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

export default WhatsappSettings;
