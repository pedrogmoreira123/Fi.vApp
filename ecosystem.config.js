module.exports = {
  apps: [
    {
      name: 'fivapp-production',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Advanced features
      min_uptime: '10s',
      max_restarts: 10,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_interval: 30000,
      
      // Environment specific settings
      node_args: '--max-old-space-size=1024',
      
      // Source map support
      source_map_support: true,
      
      // Kill timeout
      kill_timeout: 5000,
      
      // Wait ready
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['fivconnect.net'],
      ref: 'origin/main',
      repo: 'https://github.com/seu-usuario/fivapp.git',
      path: '/srv/apps/Fi.VApp-Replit',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
    staging: {
      user: 'deploy',
      host: ['staging.fivconnect.net'],
      ref: 'origin/develop',
      repo: 'https://github.com/seu-usuario/fivapp.git',
      path: '/srv/apps/Fi.VApp-Replit-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
    },
  },
};