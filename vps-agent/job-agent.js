/**
 * Opernox VPS Job Agent
 * 
 * Polls Supabase for pending jobs and executes them via the local mission-control server.
 * Run with: node job-agent.js
 * Use PM2 to keep running: pm2 start job-agent.js --name opernox-agent
 * 
 * Environment variables (set in .env or system):
 *   SUPABASE_URL      — e.g. https://ujdegmhsvwymxzezwwna.supabase.co
 *   SUPABASE_SERVICE_KEY — service role key (for writing job results)
 *   VPS_ID            — unique ID for this VPS (e.g. "vps-ethan-1")
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// ============================================
// CONFIG
// ============================================
const CONFIG = {
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  
  // This VPS
  VPS_ID: process.env.VPS_ID || 'vps-primary',
  USER_ID: process.env.USER_ID || '', // Set this for single-user mode, or leave blank for multi-user poll
  
  // Mission Control server
  MC_HOST: process.env.MC_HOST || '127.0.0.1',
  MC_PORT: parseInt(process.env.MC_PORT || '3337'),
  
  // Polling
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || '15000'),
  
  // Logging
  LOG_FILE: path.join(__dirname, 'agent.log'),
};

// ============================================
// LOGGING
// ============================================
function log(type, msg, data) {
  const entry = {
    time: new Date().toISOString(),
    type,
    msg,
    ...(data ? { data } : {})
  };
  const line = JSON.stringify(entry);
  console.log(line);
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, line + '\n');
  } catch(e) {}
}

// ============================================
// SUPABASE FETCH (service role — can write job status)
// ============================================
async function supabaseRequest(method, path, body) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${path}`;
  const bodyStr = body ? JSON.stringify(body) : undefined;
  
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
      'Prefer': method === 'POST' || method === 'PATCH' ? 'return=representation' : ''
    },
    body: bodyStr
  });
  
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { data = text; }
  
  if (!res.ok) {
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return data;
}

// ============================================
// MISSION CONTROL API CALL
// ============================================
function mcRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqOptions = {
      hostname: CONFIG.MC_HOST,
      port: CONFIG.MC_PORT,
      path: endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data }); }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ============================================
// FETCH PENDING JOBS
// ============================================
async function fetchPendingJobs() {
  try {
    // Build query: pending jobs, oldest first, limit 5 at a time
    let query = `jobs?status=eq.pending&order=created_at.asc&limit=5`;
    if (CONFIG.USER_ID) {
      query += `&user_id=eq.${CONFIG.USER_ID}`;
    }
    
    const jobs = await supabaseRequest('GET', query);
    return Array.isArray(jobs) ? jobs : [];
  } catch(e) {
    log('error', 'Failed to fetch pending jobs', { error: e.message });
    return [];
  }
}

// ============================================
// MARK JOB RUNNING
// ============================================
async function markRunning(jobId) {
  try {
    await supabaseRequest('PATCH', `jobs?id=eq.${jobId}`, {
      status: 'running',
      vps_id: CONFIG.VPS_ID,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch(e) {
    log('error', 'Failed to mark job running', { jobId, error: e.message });
  }
}

// ============================================
// MARK JOB COMPLETED
// ============================================
async function markCompleted(jobId, result) {
  try {
    await supabaseRequest('PATCH', `jobs?id=eq.${jobId}`, {
      status: 'completed',
      result,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch(e) {
    log('error', 'Failed to mark job completed', { jobId, error: e.message });
  }
}

// ============================================
// MARK JOB FAILED
// ============================================
async function markFailed(jobId, error) {
  try {
    await supabaseRequest('PATCH', `jobs?id=eq.${jobId}`, {
      status: 'failed',
      error,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch(e) {
    log('error', 'Failed to mark job failed', { jobId, error: e.message });
  }
}

// ============================================
// EXECUTE JOB — delegates to appropriate handler
// ============================================
async function executeJob(job) {
  const { id, platform, job_type, payload } = job;
  
  log('info', `Executing job`, { jobId: id, platform, job_type });
  
  try {
    switch (platform) {
      case 'x':
        await executeXJob(job_type, payload, id);
        break;
      case 'linkedin':
        await executeLinkedInJob(job_type, payload, id);
        break;
      case 'tiktok':
        await executeTikTokJob(job_type, payload, id);
        break;
      case 'instagram':
        await executeInstagramJob(job_type, payload, id);
        break;
      case 'heygen':
      case 'ugc':
        await executeHeyGenJob(job_type, payload, id);
        break;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  } catch(e) {
    log('error', `Job failed`, { jobId: id, error: e.message });
    await markFailed(id, e.message);
  }
}

// ============================================
// X SYSTEM JOBS
// ============================================
async function executeXJob(jobType, payload, jobId) {
  if (jobType === 'post') {
    // Call mission-control X endpoint
    // Payload: { text: "tweet content", addCover: true, coverImagePath: "..." }
    const result = await mcRequest('/api/x/post', 'POST', {
      text: payload.text,
      profileId: payload.profileId || 'k19selk6'
    });
    
    if (result.success) {
      await markCompleted(jobId, { tweetId: result.tweetId, url: result.url });
    } else {
      throw new Error(result.error || 'Post failed');
    }
  } else if (jobType === 'article') {
    // Call mission-control article endpoint
    const result = await mcRequest('/api/x/article', 'POST', {
      title: payload.title,
      text: payload.text,
      coverImagePath: payload.coverImagePath
    });
    
    if (result.success) {
      await markCompleted(jobId, { articleUrl: result.url });
    } else {
      throw new Error(result.error || 'Article post failed');
    }
  } else {
    throw new Error(`Unknown X job type: ${jobType}`);
  }
}

// ============================================
// LINKEDIN JOBS
// ============================================
async function executeLinkedInJob(jobType, payload, jobId) {
  if (jobType === 'post') {
    const result = await mcRequest('/api/linkedin/post', 'POST', {
      text: payload.text
    });
    
    if (result.success) {
      await markCompleted(jobId, { postId: result.postId, url: result.url });
    } else {
      throw new Error(result.error || 'LinkedIn post failed');
    }
  } else {
    throw new Error(`Unknown LinkedIn job type: ${jobType}`);
  }
}

// ============================================
// TIKTOK JOBS
// ============================================
async function executeTikTokJob(jobType, payload, jobId) {
  if (jobType === 'post') {
    const result = await mcRequest('/api/tiktok/post', 'POST', {
      caption: payload.caption,
      videoPath: payload.videoPath
    });
    
    if (result.success) {
      await markCompleted(jobId, { videoId: result.videoId, url: result.url });
    } else {
      throw new Error(result.error || 'TikTok post failed');
    }
  } else {
    throw new Error(`Unknown TikTok job type: ${jobType}`);
  }
}

// ============================================
// INSTAGRAM JOBS
// ============================================
async function executeInstagramJob(jobType, payload, jobId) {
  if (jobType === 'post') {
    const result = await mcRequest('/api/instagram/post', 'POST', {
      caption: payload.caption,
      videoPath: payload.videoPath,
      profileId: payload.profileId
    });
    
    if (result.success) {
      await markCompleted(jobId, { mediaId: result.mediaId });
    } else {
      throw new Error(result.error || 'Instagram post failed');
    }
  } else {
    throw new Error(`Unknown Instagram job type: ${jobType}`);
  }
}

// ============================================
// HEYGEN / UGC JOBS
// ============================================
async function executeHeyGenJob(jobType, payload, jobId) {
  if (jobType === 'generate_video') {
    const result = await mcRequest('/api/heygen/generate', 'POST', {
      script: payload.script,
      avatarId: payload.avatarId
    });
    
    if (result.success) {
      await markCompleted(jobId, { videoId: result.videoId, videoUrl: result.videoUrl });
    } else {
      throw new Error(result.error || 'HeyGen video generation failed');
    }
  } else {
    throw new Error(`Unknown HeyGen job type: ${jobType}`);
  }
}

// ============================================
// MAIN POLL LOOP
// ============================================
let isProcessing = false;

async function poll() {
  if (isProcessing) {
    log('debug', 'Skipping poll — still processing previous job');
    return;
  }
  
  try {
    const jobs = await fetchPendingJobs();
    
    if (jobs.length === 0) {
      log('debug', 'No pending jobs');
      return;
    }
    
    log('info', `Found ${jobs.length} pending job(s)`);
    
    for (const job of jobs) {
      isProcessing = true;
      await markRunning(job.id);
      await executeJob(job);
      isProcessing = false;
    }
  } catch(e) {
    isProcessing = false;
    log('error', 'Poll error', { error: e.message });
  }
}

// ============================================
// PING KEEPALIVE — update last_ping in vps_agents
// ============================================
async function pingVps() {
  try {
    await supabaseRequest('PATCH', `vps_agents?id=eq.${CONFIG.VPS_ID}`, {
      last_ping: new Date().toISOString(),
      status: 'online'
    });
  } catch(e) {
    // Table might not exist yet, ignore
  }
}

// ============================================
// STARTUP
// ============================================
function startup() {
  log('info', 'Opernox VPS Job Agent starting', {
    vpsId: CONFIG.VPS_ID,
    supabaseUrl: CONFIG.SUPABASE_URL,
    mcHost: CONFIG.MC_HOST,
    mcPort: CONFIG.MC_PORT,
    pollIntervalMs: CONFIG.POLL_INTERVAL_MS
  });
  
  // Immediate first poll
  setTimeout(poll, 2000);
  
  // Regular polling
  setInterval(poll, CONFIG.POLL_INTERVAL_MS);
  
  // Keepalive pings
  setInterval(pingVps, CONFIG.POLL_INTERVAL_MS);
  
  log('info', 'Agent started — polling every ' + (CONFIG.POLL_INTERVAL_MS / 1000) + 's');
}

startup();
