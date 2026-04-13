# Opernox VPS Agent Setup

## What This Is

The VPS agent is a lightweight polling script that runs on your VPS alongside mission-control (`server.js`). It:
1. Polls Supabase every 15 seconds for new jobs (posts, videos, etc.)
2. Calls the mission-control API to execute them
3. Writes results back to Supabase

## Files

- `job-agent.js` — the main polling agent script
- `ecosystem.config.js` — PM2 process manager config
- `job-agent.env` — environment variables template
- `package-agent.json` — minimal Node.js package manifest

## Setup

### 1. Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Project → Project Settings → API
3. Find **Service Role Key** (not the anon key)
4. Copy it

### 2. Configure Environment Variables

Edit `job-agent.env`:
```
SUPABASE_SERVICE_KEY=your_service_role_key_here
VPS_ID=vps-ethan-primary
USER_ID=your_supabase_user_id_here  ← find this in Supabase → profiles table
```

### 3. Start the Agent

**Option A — Direct Node:**
```bash
node job-agent.js
```

**Option B — PM2 (recommended for production):**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Verify It's Running

```bash
pm2 logs opernox-agent
```

You should see:
```
{"time":"...","type":"info","msg":"Opernox VPS Job Agent starting",...}
{"time":"...","type":"info","msg":"Agent started — polling every 15s"}
```

## How It Works

```
Dashboard (Vercel) → Supabase jobs table → job-agent.js (polls every 15s) → server.js → executes automation
```

The agent polls `jobs` table for `status = 'pending'` jobs belonging to your user, marks them `running`, executes via server.js, then marks them `completed` or `failed`.

## Restarting server.js

If server.js on port 3337 is not running, start it:
```bash
cd mission-control
node server.js
```

The agent expects server.js to be running at `127.0.0.1:3337`.
