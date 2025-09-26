# Arquitetura do Fi.V App

## Visão Geral

O Fi.V App é uma plataforma de integração WhatsApp construída com arquitetura moderna, seguindo princípios de Clean Architecture e Domain-Driven Design (DDD).

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
├─────────────────────────────────────────────────────────────┤
│                        API Gateway                          │
├─────────────────────────────────────────────────────────────┤
│  Backend Services  │  WhatsApp Services  │  File Services  │
├─────────────────────────────────────────────────────────────┤
│                    Message Queue (Redis)                    │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Redis Cache  │  File Storage  │  Evolution   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura Detalhada

### Backend (src/)

```
src/
├── config/                 # Configurações da aplicação
│   ├── database.ts         # Configuração do banco de dados
│   ├── environment.ts      # Validação de variáveis de ambiente
│   └── logger.ts           # Sistema de logging
├── controllers/            # Camada de controle
│   ├── user.controller.ts  # Controle de usuários
│   └── whatsapp.controller.ts # Controle WhatsApp
├── middleware/            # Middlewares personalizados
│   ├── auth.ts            # Autenticação e autorização
│   ├── error.ts           # Tratamento de erros
│   ├── security.ts        # Middlewares de segurança
│   └── validation.ts      # Validação de dados
├── routes/                # Definição de rotas
│   ├── index.ts           # Rotas principais
│   ├── user.routes.ts     # Rotas de usuário
│   └── whatsapp.routes.ts # Rotas WhatsApp
├── services/              # Lógica de negócio
│   ├── base.service.ts    # Serviço base
│   ├── user.service.ts    # Serviço de usuário
│   └── whatsapp.service.ts # Serviço WhatsApp
├── repositories/          # Camada de dados
│   ├── base.repository.ts # Repositório base
│   ├── user.repository.ts # Repositório de usuário
│   └── message.repository.ts # Repositório de mensagens
├── types/                 # Definições de tipos
│   ├── user.types.ts      # Tipos de usuário
│   └── whatsapp.types.ts  # Tipos WhatsApp
├── utils/                 # Utilitários
│   ├── crypto.ts          # Funções de criptografia
│   └── helpers.ts         # Funções auxiliares
├── __tests__/             # Testes
│   ├── setup.ts           # Configuração dos testes
│   ├── controllers/       # Testes de controladores
│   ├── services/          # Testes de serviços
│   └── integration/       # Testes de integração
├── app.ts                 # Configuração da aplicação
└── server.ts              # Servidor principal
```

### Frontend (client/)

```
client/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── ui/            # Componentes base (Button, Input, etc.)
│   │   ├── forms/         # Componentes de formulário
│   │   └── layout/        # Componentes de layout
│   ├── pages/             # Páginas da aplicação
│   │   ├── auth/          # Páginas de autenticação
│   │   ├── dashboard/     # Dashboard principal
│   │   └── whatsapp/      # Páginas WhatsApp
│   ├── hooks/             # Custom hooks
│   │   ├── useAuth.ts     # Hook de autenticação
│   │   └── useWhatsApp.ts # Hook WhatsApp
│   ├── services/          # Serviços do frontend
│   │   ├── api.ts         # Cliente API
│   │   └── websocket.ts   # Cliente WebSocket
│   ├── contexts/          # Contextos React
│   │   ├── AuthContext.tsx # Contexto de autenticação
│   │   └── WhatsAppContext.tsx # Contexto WhatsApp
│   ├── types/             # Tipos TypeScript
│   │   ├── api.types.ts   # Tipos da API
│   │   └── user.types.ts  # Tipos de usuário
│   ├── utils/             # Utilitários
│   │   ├── constants.ts   # Constantes
│   │   └── helpers.ts     # Funções auxiliares
│   ├── styles/            # Estilos globais
│   │   └── globals.css    # CSS global
│   ├── App.tsx            # Componente principal
│   └── main.tsx           # Ponto de entrada
├── public/                # Arquivos estáticos
└── index.html             # HTML principal
```

## 🔄 Fluxo de Dados

### 1. Autenticação

```
Frontend → API Gateway → Auth Middleware → User Service → Database
    ↓
JWT Token ← Response ← User Controller ← User Service ← Database
```

### 2. Envio de Mensagem WhatsApp

```
Frontend → API Gateway → Auth Middleware → WhatsApp Service → Evolution API
    ↓
WebSocket ← Response ← WhatsApp Controller ← WhatsApp Service ← Evolution API
```

### 3. Recebimento de Mensagem

```
Evolution API → Webhook → WhatsApp Service → Database
    ↓
WebSocket → Frontend (Real-time update)
```

## 🗄️ Banco de Dados

### Schema Principal

```sql
-- Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Instâncias WhatsApp
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'disconnected',
  qr_code TEXT,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id),
  message_id VARCHAR(255) NOT NULL,
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  content TEXT,
  message_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  url VARCHAR(500) NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Segurança

### Autenticação

- **JWT Tokens**: Autenticação stateless
- **Refresh Tokens**: Renovação automática
- **Password Hashing**: bcrypt com salt rounds
- **Session Management**: Redis para sessões

### Autorização

- **Role-Based Access**: user, admin
- **Resource-Based**: Acesso por instância
- **API Keys**: Para integrações externas

### Middleware de Segurança

```typescript
// Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
}));

// CORS configurado
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
```

## 📊 Logging e Monitoramento

### Estrutura de Logs

```typescript
// Log estruturado com Pino
logger.info({
  userId: '123',
  action: 'user_login',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  duration: 150,
}, 'User logged in successfully');
```

### Métricas Importantes

- **Performance**: Tempo de resposta, throughput
- **Erros**: Taxa de erro, tipos de erro
- **Segurança**: Tentativas de login, rate limiting
- **Negócio**: Mensagens enviadas, usuários ativos

## 🚀 Escalabilidade

### Horizontal Scaling

- **Load Balancer**: Nginx ou AWS ALB
- **Stateless Backend**: Sem sessões no servidor
- **Database Clustering**: PostgreSQL com replicação
- **Cache Layer**: Redis Cluster

### Vertical Scaling

- **Memory**: Otimização de queries
- **CPU**: Processamento assíncrono
- **Storage**: Compressão de arquivos
- **Network**: CDN para assets

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# 1. Lint & Type Check
lint:
  - ESLint
  - Prettier
  - TypeScript check

# 2. Testes
test:
  - Unit tests (Jest)
  - Integration tests (Supertest)
  - E2E tests (Cypress)

# 3. Build
build:
  - TypeScript compilation
  - Asset optimization
  - Docker image build

# 4. Deploy
deploy:
  - Staging (develop branch)
  - Production (main branch)
```

## 🐳 Containerização

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: fivapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  evolution:
    image: evolution-api/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/evolution
```

## 📈 Performance

### Otimizações

- **Database Indexing**: Índices otimizados
- **Query Optimization**: N+1 problem solved
- **Caching Strategy**: Redis para dados frequentes
- **CDN**: Assets estáticos
- **Compression**: Gzip/Brotli

### Monitoring

- **APM**: New Relic ou DataDog
- **Logs**: ELK Stack
- **Metrics**: Prometheus + Grafana
- **Alerts**: PagerDuty ou Slack

## 🔧 Configuração de Ambientes

### Development

```bash
NODE_ENV=development
LOG_LEVEL=debug
RATE_LIMIT_MAX_REQUESTS=1000
```

### Staging

```bash
NODE_ENV=staging
LOG_LEVEL=info
RATE_LIMIT_MAX_REQUESTS=500
```

### Production

```bash
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMIT_MAX_REQUESTS=100
```

## 🎯 Próximos Passos

### Melhorias Planejadas

1. **Microserviços**: Separar WhatsApp em serviço independente
2. **Event Sourcing**: Para auditoria completa
3. **GraphQL**: API mais flexível
4. **Kubernetes**: Orquestração de containers
5. **Observability**: OpenTelemetry

### Roadmap Técnico

- **Q1 2024**: Microserviços
- **Q2 2024**: Kubernetes
- **Q3 2024**: GraphQL
- **Q4 2024**: Event Sourcing

---

**Esta documentação é mantida atualizada conforme a evolução do projeto.**
