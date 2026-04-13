// PM2 ecosystem file for Opernox VPS Agent
// Run: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'opernox-agent',
    script: 'job-agent.js',
    env: {
      NODE_ENV: 'production',
      // Override these in your system environment or .env file
      SUPABASE_URL: 'https://ujdegmhsvwymxzezwwna.supabase.co',
      VPS_ID: 'vps-ethan-primary',
      MC_HOST: '127.0.0.1',
      MC_PORT: '3337',
      POLL_INTERVAL_MS: '15000'
    },
    // Restart policy
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: 10000,
    
    // Logging
    log_file: 'logs/agent.log',
    error_file: 'logs/agent-err.log',
    out_file: 'logs/agent-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // Resource limits
    max_memory_restart: '500M',
    
    // Restart on crash delay
    restart_delay: 4000
  }]
};
