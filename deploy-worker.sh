#!/bin/bash

# Script para deploy do Cloudflare Worker
# Este script instala o Wrangler CLI e faz o deploy do Worker

echo "🚀 Iniciando deploy do Cloudflare Worker..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalar Wrangler CLI globalmente
echo "📦 Instalando Wrangler CLI..."
npm install -g wrangler

# Verificar se o usuário está logado no Cloudflare
echo "🔐 Verificando autenticação do Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Você precisa fazer login no Cloudflare primeiro:"
    echo "   Execute: wrangler login"
    echo "   Depois rode este script novamente."
    exit 1
fi

# Fazer o deploy do Worker
echo "🚀 Fazendo deploy do Worker..."
wrangler deploy

echo "✅ Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o webhook URL no WAHA para: https://waha-webhook-worker.your-subdomain.workers.dev"
echo "2. Teste o webhook enviando uma requisição POST"
echo "3. Verifique os logs no dashboard do Cloudflare Workers"
echo ""
echo "🔗 URLs do Worker:"
echo "   Produção: https://waha-webhook-worker.your-subdomain.workers.dev"
echo "   Staging: https://waha-webhook-worker-staging.your-subdomain.workers.dev"
