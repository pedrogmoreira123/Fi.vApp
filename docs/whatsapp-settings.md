# WhatsApp Settings - Documentação do Fluxo

## Visão Geral

A página WhatsApp Settings foi completamente reescrita para consumir apenas os novos endpoints seguros do backend e usar WebSocket para atualizações em tempo real, eliminando o polling e melhorando a experiência do usuário.

## Arquitetura

### Fluxo de Dados
```
Frontend (React) → useWhatsapp Hook → whatsapp.api.ts → Backend API → Evolution Service → Evolution API
     ↓                    ↓                ↓
WebSocket ← Backend ← Webhook Handler ← Evolution API Events
```

### Componentes Principais

1. **`src/pages/WhatsappSettings/index.tsx`** - Página principal com UI limpa
2. **`src/hooks/useWhatsapp.ts`** - Hook centralizado para estado e WebSocket
3. **`src/services/whatsapp.api.ts`** - API service com fetch autenticado
4. **`src/services/websocket.service.ts`** - Serviço WebSocket existente

## Funcionalidades

### ✅ Conexão WhatsApp
- **Conectar**: Gera QR Code para escaneamento
- **Desconectar**: Remove conexão ativa
- **Status**: Exibe status em tempo real (Conectado/Desconectado/Conectando)

### ✅ Interface de Usuário
- **Status Visual**: Ícones e cores indicando estado da conexão
- **QR Code Modal**: Modal para exibir QR Code de conexão
- **Informações da Instância**: Número, nome, última atualização
- **Botões de Ação**: Conectar, Desconectar, Atualizar

### ✅ Tempo Real
- **WebSocket**: Atualizações instantâneas via WebSocket
- **Sem Polling**: Eliminado polling de 5 segundos
- **Eventos**: `whatsapp:status`, `whatsapp:qr`, `whatsapp:connected`, `whatsapp:disconnected`

## Endpoints Utilizados

### Backend API (Autenticados)
- `GET /api/whatsapp/instance` - Obter instância
- `GET /api/whatsapp/instance/:id/qrcode` - Obter QR Code
- `GET /api/whatsapp/instance/:id/status` - Status da instância
- `POST /api/whatsapp/instance/:id/connect` - Conectar instância
- `DELETE /api/whatsapp/instance/:id` - Desconectar instância
- `GET /api/whatsapp/health` - Saúde do serviço

### WebSocket Events
- `whatsapp:status` - Atualização de status
- `whatsapp:qr` - Novo QR Code
- `whatsapp:connected` - Instância conectada
- `whatsapp:disconnected` - Instância desconectada

## Configuração

### Variáveis de Ambiente
```env
VITE_API_URL=https://app.fivconnect.net/api
VITE_WS_URL=https://app.fivconnect.net
```

### Autenticação
- Todas as chamadas API incluem `Authorization: Bearer <JWT>`
- Token obtido do localStorage
- Frontend nunca acessa Evolution API diretamente

## Fluxo de Uso

### 1. Acesso à Página
```
Usuário → /whatsapp-settings → useWhatsapp Hook → getInstance() → Backend API
```

### 2. Conectar WhatsApp
```
Usuário clica "Conectar" → connect(instanceId) → Backend → Evolution API → QR Code → Modal
```

### 3. Escaneamento QR Code
```
Usuário escaneia QR → Evolution API → Webhook → Backend → WebSocket → Frontend atualiza
```

### 4. Status em Tempo Real
```
Evolution API → Webhook → Backend → WebSocket → useWhatsapp → UI atualizada
```

## Estados da Interface

### Desconectado
- Ícone: ❌ (XCircle vermelho)
- Texto: "Desconectado"
- Botão: "Conectar ao WhatsApp"
- Cor: `text-red-500`

### Conectando
- Ícone: 🔄 (RefreshCw amarelo animado)
- Texto: "Conectando..."
- Botão: "Ver QR Code" (se disponível)
- Cor: `text-yellow-500`

### Conectado
- Ícone: ✅ (CheckCircle verde)
- Texto: "Conectado"
- Botões: "Atualizar", "Desconectar"
- Cor: `text-green-500`
- Informações: Número, nome, última atualização

## Tratamento de Erros

### Erros de API
- Exibidos em alerta vermelho no topo da página
- Mensagem clara do erro
- Botão para tentar novamente

### Erros de WebSocket
- Reconexão automática (até 5 tentativas)
- Fallback para polling se WebSocket falhar
- Logs de erro no console

## Melhorias Implementadas

### ✅ Eliminação de Polling
- Removido `refetchInterval: 5000` do React Query
- Atualizações via WebSocket em tempo real
- Melhor performance e experiência do usuário

### ✅ Autenticação Segura
- Frontend nunca acessa Evolution API diretamente
- Todas as chamadas passam pelo backend autenticado
- Evolution API Key protegida no backend

### ✅ Interface Limpa
- UI moderna com Tailwind CSS
- Estados visuais claros
- Modal para QR Code
- Responsivo e acessível

### ✅ Tempo Real
- WebSocket para atualizações instantâneas
- Eventos específicos para cada ação
- Reconexão automática

## Testes E2E

### Fluxo Completo
1. **Login** → Acessar `/whatsapp-settings`
2. **Conectar** → Clicar "Conectar ao WhatsApp"
3. **QR Code** → Modal exibe QR Code
4. **Escanear** → Usar WhatsApp para escanear
5. **Status** → Interface atualiza para "Conectado"
6. **Enviar Mensagem** → Testar envio de mensagem
7. **Receber** → Verificar recebimento em tempo real

### Validações
- ✅ Status atualiza automaticamente
- ✅ QR Code exibido corretamente
- ✅ Botões funcionam conforme estado
- ✅ WebSocket conecta e recebe eventos
- ✅ Erros exibidos adequadamente

## Troubleshooting

### WebSocket não conecta
- Verificar `VITE_WS_URL` nas variáveis de ambiente
- Verificar se backend está rodando na porta 3001
- Verificar logs do navegador

### API retorna 401
- Verificar se token JWT está válido
- Verificar se usuário está logado
- Verificar se backend está configurado corretamente

### QR Code não aparece
- Verificar se Evolution API está rodando
- Verificar se instância foi criada
- Verificar logs do backend

## Conclusão

A reescrita do WhatsApp Settings foi bem-sucedida, implementando:

- ✅ **Arquitetura limpa** com separação clara de responsabilidades
- ✅ **Segurança** com autenticação adequada
- ✅ **Tempo real** com WebSocket
- ✅ **Performance** sem polling desnecessário
- ✅ **UX moderna** com interface limpa e responsiva

O sistema agora está pronto para produção com uma experiência de usuário muito melhor e arquitetura mais robusta.

---
*Documentação gerada em 27/09/2025*
