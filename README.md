Fi.V App - WhatsApp Integration Platform
Uma plataforma completa para integração com WhatsApp usando Evolution API, construída com Node.js, TypeScript, Express e React.

🚀 Características
Backend Robusto: Node.js + TypeScript + Express com arquitetura escalável

Frontend Moderno: React com TypeScript e componentes reutilizáveis

Integração WhatsApp: Evolution API para comunicação via WhatsApp

Banco de Dados: PostgreSQL com Drizzle ORM

Autenticação: JWT com refresh tokens

Segurança: Helmet, rate limiting, CORS configurado

Logs Estruturados: Pino para logging profissional

Testes: Jest + Supertest + Cypress

CI/CD: GitHub Actions com pipeline completo

Docker: Containerização para Evolution API

📁 Estrutura do Projeto
Fi.VApp-Replit/
├── src/                      # Backend (Node.js + TypeScript)
│   ├── config/               # Configurações
│   │   ├── database.ts       # Configuração do banco
│   │   ├── environment.ts    # Validação de variáveis
│   │   └── logger.ts         # Sistema de logs
│   ├── controllers/          # Controladores
│   │   └── user.controller.ts  # Controle de usuários
│   ├── middleware/           # Middlewares
│   │   ├── auth.ts           # Autenticação JWT
│   │   ├── error.ts          # Tratamento de erros
│   │   ├── security.ts       # Segurança
│   │   └── validation.ts     # Validação de dados
│   ├── routes/               # Rotas da API
│   │   ├── index.ts          # Rotas principais
│   │   └── user.routes.ts    # Rotas de usuário
│   ├── services/             # Lógica de negócio
│   │   ├── base.service.ts   # Serviço base
│   │   └── user.service.ts   # Serviço de usuário
│   ├── __tests__/            # Testes
│   │   ├── setup.ts          # Configuração dos testes
│   │   ├── controllers/      # Testes de controladores
│   │   └── services/         # Testes de serviços
│   ├── app.ts                # Configuração da aplicação
│   └── server.ts             # Servidor principal
├── client/                   # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # Serviços do frontend
│   │   ├── contexts/         # Contextos React
│   │   ├── types/            # Tipos TypeScript
│   │   └── utils/            # Utilitários
│   └── public/               # Arquivos estáticos
├── shared/                   # Código compartilhado
│   └── schema.ts             # Schema do banco (Drizzle)
├── docker/                   # Configuração Docker
├── .github/workflows/        # CI/CD
├── docs/                     # Documentação
└── scripts/                  # Scripts utilitários

🛠️ Tecnologias
Backend
Node.js 20+ - Runtime JavaScript

TypeScript 5+ - Tipagem estática

Express.js - Framework web

Drizzle ORM - ORM para PostgreSQL

JWT - Autenticação

Pino - Logging estruturado

Zod - Validação de dados

Jest - Testes unitários

Supertest - Testes de integração

Frontend
React 18 - Biblioteca de UI

TypeScript - Tipagem estática

Vite - Build tool

Tailwind CSS - Framework CSS

Radix UI - Componentes acessíveis

React Query - Gerenciamento de estado

Cypress - Testes E2E

DevOps
Docker - Containerização

GitHub Actions - CI/CD

ESLint + Prettier - Qualidade de código

Husky - Git hooks

PM2 - Process manager

🚀 Instalação e Configuração
Pré-requisitos
Node.js 20+

PostgreSQL 15+

Docker (para Evolution API)

Git

1. Clone o repositório
git clone [https://github.com/seu-usuario/fivapp.git](https://github.com/seu-usuario/fivapp.git)
cd fivapp

2. Instale as dependências
npm install

3. Configure as variáveis de ambiente
# Copie o arquivo de exemplo
cp env.example .env

# Edite as variáveis conforme necessário
nano .env

4. Configure o banco de dados
# Execute as migrações
npm run db:migrate

# (Opcional) Popule com dados de teste
npm run db:seed

5. Inicie o Evolution API (Docker)
# Na pasta docker/
docker-compose up -d

6. Execute a aplicação
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

🧪 Testes
Testes Unitários e de Integração
# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Com coverage
npm run test:coverage

Testes E2E
# Executar testes E2E
npm run test:e2e

# Abrir Cypress
npm run test:e2e:open

🔧 Scripts Disponíveis
# Desenvolvimento
npm run dev              # Inicia em modo desenvolvimento
npm run build            # Build para produção
npm start              # Inicia em produção

# Qualidade de código
npm run lint             # Executa ESLint
npm run lint:check       # Verifica sem corrigir
npm run format           # Formata código
npm run format:check     # Verifica formatação
npm run check            # Verifica tipos TypeScript

# Testes
npm test               # Testes unitários
npm run test:watch       # Testes em modo watch
npm run test:coverage    # Testes com coverage
npm run test:e2e         # Testes E2E
npm run test:e2e:open    # Abre Cypress

# Banco de dados
npm run db:push          # Aplica mudanças no banco
npm run db:generate      # Gera migrações
npm run db:migrate       # Executa migrações

📚 API Documentation
Endpoints Principais
Autenticação
POST /api/users/register - Registrar usuário

POST /api/users/login - Login

GET /api/users/profile - Perfil do usuário

PUT /api/users/profile - Atualizar perfil

WhatsApp (Evolution API)
POST /api/whatsapp/connect - Conectar instância

GET /api/whatsapp/status - Status da conexão

POST /api/whatsapp/send - Enviar mensagem

GET /api/whatsapp/messages - Listar mensagens

Sistema
GET /api/health - Health check

GET /api/version - Versão da API

GET /api/docs - Documentação da API

Exemplo de Uso
// Registrar usuário
const response = await fetch('/api/users/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'João Silva',
  }),
});

const data = await response.json();
console.log(data); // { success: true, data: { id, email, name } }

🔒 Segurança
Autenticação JWT com refresh tokens

Rate limiting para prevenir abuso

Helmet para headers de segurança

CORS configurado adequadamente

Validação de entrada com Zod

Logs estruturados para auditoria

Sanitização de dados sensíveis

🚀 Deploy
Desenvolvimento
npm run dev

Staging
# Build
npm run build

# Deploy
pm2 start ecosystem.config.js --env staging

Produção
# Build
npm run build

# Deploy
pm2 start ecosystem.config.js --env production

🤝 Contribuição
Fork o projeto

Crie uma branch (git checkout -b feature/nova-funcionalidade)

Commit suas mudanças (git commit -m 'feat: adiciona nova funcionalidade')

Push para a branch (git push origin feature/nova-funcionalidade)

Abra um Pull Request

Padrões de Commit
Usamos Conventional Commits:

feat: - Nova funcionalidade

fix: - Correção de bug

docs: - Documentação

style: - Formatação

refactor: - Refatoração

test: - Testes

chore: - Manutenção

📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

🆘 Suporte
Issues: GitHub Issues

Documentação: Wiki do Projeto

Email: suporte@fivconnect.net

🔗 Links Úteis
Evolution API Documentation

Drizzle ORM Documentation

React Documentation

TypeScript Documentation

Desenvolvido com ❤️ para a comunidade brasileira de desenvolvedores