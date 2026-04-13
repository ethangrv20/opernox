// PM2 ecosystem file for Opernox VPS Agent
// Run: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'opernox-agent',
    script: 'job-agent.js',
    cwd: 'C:\\Users\\Administrator\\.openclaw\\runtime-workspace\\opernox\\vps-agent',
    env: {
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://ujdegmhsvwymxzezwwna.supabase.co',
      SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZGVnbWhzdnd5bXh6ZXp3d25hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxMTgzMSwiZXhwIjoyMDkxNTg3ODMxfQ.67ojMu3XLJ_IR354Kaw9Jk1r_CH6yf3zR-YDt6ZdUv4',
      VPS_ID: 'vps-ethan-primary',
      MC_HOST: '127.0.0.1',
      MC_PORT: '3337',
      POLL_INTERVAL_MS: '15000',
      // Pass workspace root so agent can find files without path guessing
      WORKSPACE_ROOT: 'C:\\Users\\Administrator\\.openclaw\\runtime-workspace'
    },
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: 10000,
    log_file: 'logs/agent.log',
    error_file: 'logs/agent-err.log',
    out_file: 'logs/agent-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '500M',
    restart_delay: 4000
  }]
};