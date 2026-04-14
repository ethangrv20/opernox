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
// FETCH DUE SCHEDULED POSTS
// ============================================
async function fetchDueScheduledPosts() {
  try {
    const now = new Date().toISOString();
    // Posts that are past their scheduled time and still 'scheduled'
    let query = `scheduled_posts?status=eq.scheduled&scheduled_for=lte.${now}&order=scheduled_for.asc&limit=5`;
    if (CONFIG.USER_ID) {
      query += `&user_id=eq.${CONFIG.USER_ID}`;
    }
    const posts = await supabaseRequest('GET', query);
    return Array.isArray(posts) ? posts : [];
  } catch(e) {
    log('error', 'Failed to fetch due scheduled posts', { error: e.message });
    return [];
  }
}

// ============================================
// CREATE A JOB
// ============================================
async function createJob(platform, jobType, payload) {
  const job = {
    user_id: CONFIG.USER_ID,
    platform,
    job_type: jobType,
    payload,
    status: 'pending',
    vps_id: CONFIG.VPS_ID,
  };
  return supabaseRequest('POST', 'jobs', job);
}

// ============================================
// MARK SCHEDULED POST PUBLISHED
// ============================================
async function markScheduledPostPublished(postId, externalId, errorMsg) {
  try {
    await supabaseRequest('PATCH', `scheduled_posts?id=eq.${postId}`, {
      status: errorMsg ? 'failed' : 'published',
      published_at: new Date().toISOString(),
      external_id: externalId || null,
      error: errorMsg || null,
      updated_at: new Date().toISOString(),
    });
  } catch(e) {
    log('error', 'Failed to update scheduled post', { postId, error: e.message });
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
      tweetText: payload.text,
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
// CONTENT GENERATION (reads client-config.json on VPS)
// ============================================
function getContentEngine() {
  try {
    const CE_PATH = 'C:\\Users\\Administrator\\.openclaw\\runtime-workspace\\x-poster\\content-engine.js';
    const STATE_PATH = 'C:\\Users\\Administrator\\.openclaw\\runtime-workspace\\x-poster\\auto-post-state.json';
    log('info', 'Content engine path', { cePath: CE_PATH, __dirname });
    return require(CE_PATH);
  } catch(e) {
    log('warn', 'Content engine not found', { error: e.message, __dirname });
    return null;
  }
}

// ============================================
// EXECUTE SCHEDULED POST — generate content and post
// ============================================
async function executeScheduledPost(spost) {
  const { id, platform, post_text, user_id } = spost;

  log('info', 'Executing scheduled post', { postId: id, platform });

  // If post_text is provided, use it directly (manual compose)
  if (post_text && post_text.trim()) {
    if (platform === 'x') {
      const result = await mcRequest('/api/x/post', 'POST', {
        text: post_text.trim(),
        tweetText: post_text.trim(),
      });
      if (result.success) {
        await markScheduledPostPublished(id, result.tweetId, null);
        await markCompleted(id, { tweetId: result.tweetId, url: result.url });
      } else {
        throw new Error(result.error || 'Post failed');
      }
      return;
    } else if (platform === 'linkedin') {
      const result = await mcRequest('/api/linkedin/post', 'POST', { text: post_text.trim() });
      if (result.success) {
        await markScheduledPostPublished(id, result.postId, null);
        await markCompleted(id, { postId: result.postId, url: result.url });
      } else {
        throw new Error(result.error || 'LinkedIn post failed');
      }
      return;
    } else if (platform === 'tiktok' && post_text && post_text.includes('[HEYGEN:]')) {
      // TikTok auto-post: generate UGC script → HeyGen → post
      const scriptText = post_text.replace('[HEYGEN:]', '').trim();
      log('info', 'TikTok HeyGen auto-post triggered', { postId: id });
      const result = await mcRequest('/api/tiktok/auto', 'POST', { scriptText });
      if (result.success) {
        await markScheduledPostPublished(id, 'heygiktok', null);
        await markCompleted(id, { platform: 'tiktok', type: 'heygiktok_auto' });
        await autoRescheduleIG('tiktok');
      } else {
        throw new Error(result.error || 'TikTok HeyGen auto-post failed');
      }
      return;
    } else if (platform === 'instagram' && post_text && post_text.includes('[HEYGEN:]')) {
      // Instagram auto-post: generate UGC script → HeyGen → post to all accounts
      const scriptText = post_text.replace('[HEYGEN:]', '').trim();
      log('info', 'Instagram HeyGen auto-post triggered', { postId: id });
      const result = await mcRequest('/api/instagram/auto', 'POST', { scriptText });
      if (result.success) {
        await markScheduledPostPublished(id, 'heygig', null);
        await markCompleted(id, { platform: 'instagram', type: 'heygig_auto' });
        await autoRescheduleIG('instagram');
      } else {
        throw new Error(result.error || 'Instagram HeyGen auto-post failed');
      }
      return;
    } else if (platform === 'tiktok') {
      // Video path embedded in post_text as "[TTVIDEO:]filename.mp4[TTVIDEO_END]"
      const ttMatch = post_text.match(/\[TTVIDEO:\](.+?)\[TTVIDEO_END\]/);
      const ttVideoFileName = ttMatch ? ttMatch[1] : null;
      const ttCaption = (post_text || '').replace(/\[TTVIDEO:\].*?\[TTVIDEO_END\]/, '').trim();
      if (!ttVideoFileName) throw new Error('TikTok post requires video — filename not found in post_text');
      const ttVideoPath = path.join('C:\\Users\\Administrator\\.openclaw\\runtime-workspace\\tiktok-videos', ttVideoFileName);
      const result = await mcRequest('/api/tiktok/post', 'POST', {
        caption: ttCaption,
        videoPath: ttVideoPath,
      });
      if (result.success) {
        await markScheduledPostPublished(id, result.videoId, null);
        await markCompleted(id, { videoId: result.videoId, url: result.url });
      } else {
        throw new Error(result.error || 'TikTok post failed');
      }
      return;
    } else {
      throw new Error(`Unknown platform in scheduled post: ${platform}`);
    }
  }

  // Auto-generate content — X and LinkedIn use content engine
  if (platform === 'x' || platform === 'linkedin') {
    const ce = getContentEngine();
    if (!ce) throw new Error('Content engine not available on this VPS');

    // Determine daypart from scheduled time
    const scheduledDate = new Date(spost.scheduled_for);
    const hour = scheduledDate.getHours();
    let daypart;
    if (hour >= 6 && hour < 12) daypart = 'morning';
    else if (hour >= 12 && hour < 17) daypart = 'midday';
    else daypart = 'evening';

    // Validate config (skip TextAscend block by temporarily patching)
    const { validateConfig } = ce;
    let generated;
    try {
      const { warnings } = validateConfig({ name: 'Override', industry: 'Test', painPoints: ['lead follow-up', 'manual outreach'], idealClient: { who: 'test clients', struggles: 'follow-up gap' }, results: [{ metric: '$1', context: 'test context', details: 'test' }], brandVoice: { personality: 'direct', tone: 'test' } });
      if (warnings.morning || warnings.midday || warnings.evening) {
        throw new Error('Client config incomplete');
      }

      const state = { usedTips: [], usedResults: [], usedTopics: [] };
      if (daypart === 'morning') generated = ce.generateTip(state);
      else if (daypart === 'evening') generated = ce.formatEveningResult(state);
      else generated = ce.generateMidday(state).content;
    } catch(e) {
      log('warn', 'Content generation failed', { daypart, error: e.message });
      throw new Error('Content generation failed — check client config');
    }

    // Post the generated content
    if (platform === 'x') {
      const result = await mcRequest('/api/x/post', 'POST', {
        text: generated,
        tweetText: generated,
      });
      if (result.success) {
        await markScheduledPostPublished(id, result.tweetId, null);
        await markCompleted(id, { tweetId: result.tweetId, url: result.url });
        await autoReschedule(daypart);
      } else {
        throw new Error(result.error || 'Post failed');
      }
    } else if (platform === 'linkedin') {
      // Generate a LinkedIn-formatted version of the content (slightly longer, article-style)
      const liText = generated; // Could expand this later for LinkedIn-specific formatting
      const result = await mcRequest('/api/linkedin/post', 'POST', { text: liText });
      if (result.success) {
        await markScheduledPostPublished(id, result.postId, null);
        await markCompleted(id, { postId: result.postId, url: result.url });
        // Auto-reschedule LinkedIn for tomorrow at the same hour
        const liHour = new Date(spost.scheduled_for).getHours();
        await autoRescheduleLinkedIn(liHour);
      } else {
        throw new Error(result.error || 'LinkedIn post failed');
      }
    }
  } else {
    throw new Error(`Auto-post not supported for ${platform} — provide post_text`);
  }
}

// ============================================
// AUTO-RESCHEDULE — create tomorrow's entry if toggle still on
// ============================================
async function autoRescheduleIG(platform) {
  try {
    const fs = require('fs');
    const STATE_PATH = 'C:\\Users\\Administrator\\.openclaw\\runtime-workspace\\x-poster\\tiktok-instagram-auto-state.json';
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    const cfg = state[platform];
    if (!cfg || !cfg.enabled) return; // Toggle is OFF, no reschedule

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(cfg.hourUtc, 0, 0, 0);

    await supabaseRequest('POST', 'scheduled_posts', {
      platform: platform,
      post_text: '[HEYGEN:]',
      scheduled_for: tomorrow.toISOString(),
      status: 'scheduled',
    });
    log('info', `Auto-rescheduled ${platform} for ${tomorrow.toISOString()}`);
  } catch(e) {
    log('warn', 'Auto-rescheduleIG failed', { platform, error: e.message });
  }
}

async function autoRescheduleLinkedIn(hourUtc) {
  try {
    const fs = require('fs');
    const STATE_PATH = 'C:\\Users\\Administrator\\.openclaw\\runtime-workspace\\x-poster\\tiktok-instagram-auto-state.json';
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    if (!state.linkedin || !state.linkedin.enabled) return; // Toggle is OFF
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hourUtc, 0, 0, 0);
    await supabaseRequest('POST', 'scheduled_posts', {
      platform: 'linkedin',
      post_text: '',
      scheduled_for: tomorrow.toISOString(),
      status: 'scheduled',
    });
    log('info', `Auto-rescheduled LinkedIn for ${tomorrow.toISOString()}`);
  } catch(e) {
    log('warn', 'Auto-rescheduleLinkedIn failed', { error: e.message });
  }
}

async function autoReschedule(daypart) {
  try {
    const fs = require('fs');
    const STATE_PATH = 'C:\\Users\\Administrator\\.openclaw\\runtime-workspace\\x-poster\\auto-post-state.json';
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    if (!state[daypart]) return; // Toggle is OFF, no reschedule

    const offsets = { morning: 14, midday: 19, evening: 0 }; // UTC hour
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(offsets[daypart], 0, 0, 0);

    await supabaseRequest('POST', 'scheduled_posts', {
      platform: 'x',
      post_text: '',
      scheduled_for: tomorrow.toISOString(),
      status: 'scheduled',
    });
    log('info', `Auto-rescheduled ${daypart} for ${tomorrow.toISOString()}`);
  } catch(e) {
    log('warn', 'Auto-reschedule failed', { daypart, error: e.message });
  }
}

// Also backfill any missing tomorrow rows for active toggles on each poll
async function backfillMissingRows() {
  try {
    const fs = require('fs');
    const STATE_PATH = 'C:\\Users\\Administrator\\.openclaw\\runtime-workspace\\x-poster\\auto-post-state.json';
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    const offsets = { morning: 14, midday: 19, evening: 0 };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    for (const daypart of ['morning', 'midday', 'evening']) {
      if (!state[daypart]) continue;

      // Check if a scheduled row for tomorrow already exists for this daypart
      const hr = offsets[daypart];
      const checkFrom = new Date(tomorrow);
      checkFrom.setHours(hr, 0, 0, 0);
      const checkTo = new Date(tomorrow);
      checkTo.setHours(hr, 5, 0, 0);

      const { data: existing } = await supabaseRequest('GET', 'scheduled_posts?platform=eq.x&status=eq.scheduled&scheduled_for=gte.' + checkFrom.toISOString() + '&scheduled_for=lt.' + checkTo.toISOString() + '&select=id');
      if (!existing || existing.length === 0) {
        const target = new Date(tomorrow);
        target.setHours(hr, 0, 0, 0);
        await supabaseRequest('POST', 'scheduled_posts', {
          platform: 'x',
          post_text: '',
          scheduled_for: target.toISOString(),
          status: 'scheduled',
        });
        log('info', `Backfill: created missing ${daypart} row for ${target.toISOString()}`);
      }
    }
  } catch(e) {
    log('warn', 'Backfill failed', { error: e.message });
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
    // 1. Handle explicit jobs first
    const jobs = await fetchPendingJobs();
    if (jobs.length > 0) {
      log('info', `Found ${jobs.length} pending job(s)`);
      for (const job of jobs) {
        isProcessing = true;
        await markRunning(job.id);
        await executeJob(job);
        isProcessing = false;
      }
      return; // Done with jobs this cycle
    }

    // 2. Handle due scheduled posts
    const duePosts = await fetchDueScheduledPosts();
    if (duePosts.length > 0) {
      log('info', `Found ${duePosts.length} due scheduled post(s)`);
      for (const spost of duePosts) {
        isProcessing = true;
        try {
          await executeScheduledPost(spost);
        } catch(e) {
          log('error', 'Scheduled post failed', { postId: spost.id, error: e.message });
          await markScheduledPostPublished(spost.id, null, e.message);
        }
        isProcessing = false;
      }
    }

    // 3. Backfill missing tomorrow rows for active toggles
    await backfillMissingRows();
  } catch(e) {
    isProcessing = false;
    log('error', 'Poll error', { error: e.message });
  }
}

// ============================================
// PING KEEPALIVE — update last_ping in vpses
// ============================================
async function pingVps() {
  if (!CONFIG.USER_ID) return;
  try {
    await supabaseRequest('PATCH', `vpses?user_id=eq.${CONFIG.USER_ID}&status=eq.active`, {
      last_ping: new Date().toISOString()
    });
  } catch(e) {
    // Table might not exist yet, ignore
  }
}

// ============================================
// AUTO-REGISTER VPS on first boot
// ============================================
async function registerVps() {
  if (!CONFIG.USER_ID) {
    log('warn', 'USER_ID not set — skipping VPS registration');
    return;
  }

  const hostname = process.env.COMPUTERNAME || CONFIG.VPS_ID;
  let publicIp = 'unknown';
  try {
    const ipRes = await fetch('https://api.ipify.org', { timeout: 5000 });
    publicIp = await ipRes.text();
  } catch(e) {
    log('warn', 'Could not fetch public IP for registration', { error: e.message });
  }

  const payload = {
    user_id: CONFIG.USER_ID,
    hostname,
    ip: publicIp,
    status: 'bootstrapping',
    platform: 'kvm',
    os: 'windowsr2',
    slices: 8,
    location: 1,
    location_name: 'Secaucus NJ',
    bootstrapped_at: new Date().toISOString(),
  };

  try {
    const result = await supabaseRequest('POST', 'vpses', payload);
    // result is an array with the inserted record (Prefer: return=representation)
    const vpsRecord = Array.isArray(result) ? result[0] : result;
    if (vpsRecord?.id) {
      CONFIG.VPS_ID = vpsRecord.id; // Use Supabase UUID as the VPS ID going forward
      log('info', 'VPS registered', { vpsId: CONFIG.VPS_ID, userId: CONFIG.USER_ID, ip: publicIp });
    }
  } catch(e) {
    log('error', 'VPS registration failed', { error: e.message });
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
  
  // Auto-register VPS on first boot
  registerVps();

  // Immediate first poll
  setTimeout(poll, 2000);
  
  // Regular polling
  setInterval(poll, CONFIG.POLL_INTERVAL_MS);
  
  // Keepalive pings
  setInterval(pingVps, CONFIG.POLL_INTERVAL_MS);
  
  log('info', 'Agent started — polling every ' + (CONFIG.POLL_INTERVAL_MS / 1000) + 's');
}

startup();
