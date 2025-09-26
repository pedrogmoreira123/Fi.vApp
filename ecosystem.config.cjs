module.exports = {
    apps: [
      {
        name: "fiv-backend",
        script: "dist/index.js",            // Arquivo principal do backend compilado
        cwd: "/srv/apps/Fi.VApp-Replit",     // Caminho absoluto do projeto
        env: {
          NODE_ENV: "production",
          PORT: 3000,

          // Banco de dados (Postgres local)
          DATABASE_URL: "postgresql://fivuser:FiVApp@localhost:5432/fivapp",

          // Sessões
          SESSION_SECRET: "ea7701b52c7453ea56662473c69aad2b",

          // JWT
          JWT_SECRET: "a45d21e802e31bb98d119b77938bbfa3",

          // Redis (se você ativar)
          REDIS_URL: "redis://localhost:6379",

          //WEBSOCKET
          WEBSOCKET_URL: "wss://fivconnect.net/v2",
	  WSS_URL: "wss://fivconnect.net/v2",
          VITE_WEBSOCKET_URL: "wss://fivconnect.net/v2",
	  NODE_TLS_REJECT_UNAUTHORIZED: 0,

          // WhatsApp Connection Service
          CONNECTION_SERVICE_URL: "http://localhost:3333",
          CONNECTION_SERVICE_API_KEY: "UgWu8Vt2qmedeoPcH43RctooFMOaDt7GXXMhXfN4gUo3vrPyPmuPwyBYCa2CCMieEbI4rf5boKX9V3FpzrxPcOrTb9AAgDoCAeNmxn8B7sLuMFwBebQoKRYYvXcJD2Bx4JZTDk88aLgTqRG0mxInMzzid3eCD5OQEoCMxSxAHkTQGlgWzaqqF0OBemLsbdxwwzyDrvl6AsDt2fhdj9zk0flItysCM3fPIbHiaTavIIGE8alIzQNP9CH2nWFUi2Bq"
        }
      }
    ]
  }
