/**
 * Cloudflare Worker para Webhook WhatsApp
 * 
 * Este Worker atua como um endpoint público e estável para receber
 * webhooks do WAHA e repassar para o backend principal.
 */

// URL do endpoint principal de webhook
const WEBHOOK_URL = 'https://fivconnect.net/api/webhooks/whatsapp';

// Headers padrão para as requisições
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'WAHA-Webhook-Worker/1.0'
};

/**
 * Handler principal do Worker
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Processa a requisição recebida
 */
async function handleRequest(request) {
  try {
    // Verificar se é uma requisição POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { 'Allow': 'POST' }
      });
    }

    // Obter o corpo da requisição
    const body = await request.text();
    
    // Log da requisição recebida (para debug)
    console.log('Webhook recebido:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: body.substring(0, 500) + (body.length > 500 ? '...' : '')
    });

    // Validar se o corpo não está vazio
    if (!body || body.trim() === '') {
      return new Response('Empty body', { status: 400 });
    }

    // Repassar a requisição para o backend principal
    const response = await forwardToBackend(body, request.headers);

    // Retornar a resposta do backend
    return response;

  } catch (error) {
    console.error('Erro no Worker:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Repassa a requisição para o backend principal
 */
async function forwardToBackend(body, originalHeaders) {
  try {
    // Preparar headers para o backend
    const forwardHeaders = {
      ...DEFAULT_HEADERS,
      // Preservar alguns headers importantes do original
      'X-Forwarded-For': originalHeaders.get('CF-Connecting-IP') || originalHeaders.get('X-Forwarded-For') || 'unknown',
      'X-Real-IP': originalHeaders.get('CF-Connecting-IP') || 'unknown',
      'X-Forwarded-Proto': 'https',
      'X-Worker-Source': 'waha-webhook-worker'
    };

    // Fazer a requisição para o backend
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: forwardHeaders,
      body: body
    });

    // Log da resposta do backend
    console.log('Resposta do backend:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Retornar a resposta do backend
    return new Response(await response.text(), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Processed': 'true'
      }
    });

  } catch (error) {
    console.error('Erro ao repassar para o backend:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Backend connection failed',
      message: error.message
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handler para requisições OPTIONS (CORS)
 */
addEventListener('fetch', event => {
  if (event.request.method === 'OPTIONS') {
    event.respondWith(handleCORS(event.request));
  }
});

function handleCORS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400'
    }
  });
}
