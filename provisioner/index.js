/**
 * Interserver VPS Provisioner
 * Handles creating Windows VPS instances via Interserver SOAP API
 * 
 * Usage:
 *   const provisioner = require('./provisioner');
 *   const result = await provisioner.createVPS({ user_id, location, hostname });
 */

const https = require('https');

const INTERSERVER_WSDL = 'https://my.interserver.net/api.php?wsdl';
const CREDS = {
  username: process.env.INTERSERVER_USER || 'ethangrv@gmail.com',
  password: process.env.INTERSERVER_PASS || '2dcebtqS!',
};

// KVM Windows config — 8 slices = $40/mo
const DEFAULT_VPS_CONFIG = {
  os: 'windowsr2',
  slices: 8,
  platform: 'kvm',
  location: 1, // 1=Secaucus NJ, 2=LA, 3=Dallas
  version: 1,
  period: 1, // monthly
  coupon: '',
  ipv6only: false,
};

/**
 * Make a SOAP POST request to Interserver API
 */
function soapRequest(method, params) {
  const paramLines = Object.entries(params)
    .map(([k, v]) => `<${k}>${escapeXml(String(v))}</${k}>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<SOAP-ENV:Envelope
  SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
  xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/">
  <SOAP-ENV:Body>
    <ns1:${method} xmlns:ns1="urn:myapi">
${paramLines}
    </ns1:${method}>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  return new Promise((resolve, reject) => {
    const url = new URL(INTERSERVER_WSDL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=ISO-8859-1',
        'Content-Length': Buffer.byteLength(xml),
        'SOAPAction': `urn:myapi#${method}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(xml);
    req.end();
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract value from SOAP response XML
 */
function extractValue(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*xsi:type="[^"]*"[^>]*>([^<]*)</${tagName}>`));
  if (match) return match[1];
  const match2 = xml.match(new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`));
  return match2 ? match2[1] : null;
}

function extractArray(xml, tagName) {
  const results = [];
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'g');
  let m;
  while ((m = regex.exec(xml)) !== null) {
    results.push(m[1]);
  }
  return results;
}

/**
 * Login to Interserver API — returns session ID
 */
async function login() {
  const res = await soapRequest('api_login', {
    username: CREDS.username,
    password: CREDS.password,
  });
  const sid = extractValue(res, 'return');
  if (!sid) throw new Error('Interserver login failed: no session ID returned');
  return sid;
}

/**
 * Get available OS templates
 */
async function getTemplates(sid) {
  const res = await soapRequest('api_get_templates', { sid });
  return extractArray(res, 'template');
}

/**
 * Get available slice types with pricing
 */
async function getSliceTypes(sid) {
  const res = await soapRequest('api_get_slice_types', { sid });
  const xml = res;
  // Returns nested structure — return raw for inspection
  return xml;
}

/**
 * Get available locations
 */
async function getLocations(sid) {
  const res = await soapRequest('api_get_locations', { sid });
  return extractArray(res, 'location');
}

/**
 * Validate a VPS order before placing it
 */
async function validateOrder(sid, config) {
  const res = await soapRequest('api_api_validate_buy_vps', {
    sid,
    os: config.os,
    slices: config.slices,
    platform: config.platform,
    controlpanel: config.controlpanel || '',
    period: config.period,
    location: config.location,
    version: config.version,
    hostname: config.hostname,
    coupon: config.coupon || '',
    ipv6only: config.ipv6only ? 1 : 0,
  });
  return extractValue(res, 'return');
}

/**
 * ORDER a VPS — THIS ACTUALLY CHARGES THE ACCOUNT
 * Only call this when payment has been confirmed
 */
async function orderVPS(sid, config) {
  const res = await soapRequest('api_api_buy_vps', {
    sid,
    os: config.os,
    slices: config.slices,
    platform: config.platform,
    controlpanel: config.controlpanel || '',
    period: config.period,
    location: config.location,
    version: config.version,
    hostname: config.hostname,
    coupon: config.coupon || '',
    ipv6only: config.ipv6only ? 1 : 0,
  });

  // Parse response — on success returns VPS details
  const orderId = extractValue(res, 'return');
  return orderId;
}

/**
 * Get VPS details by order ID
 */
async function getVPSDetails(sid, orderId) {
  const res = await soapRequest('api_get_vps', {
    sid,
    order_id: orderId,
  });
  // Returns: order_id, hostname, ip, status, etc.
  return res;
}

/**
 * Main provisioning function — creates a new Windows VPS for a client
 * Returns: { orderId, hostname, ip, rootpass }
 */
async function createVPS({ user_id, location = 1, location_name = 'Secaucus NJ' } = {}) {
  console.log(`[Provisioner] Starting VPS provisioning for user ${user_id}`);

  // Step 1: Login
  console.log('[Provisioner] Logging into Interserver...');
  const sid = await login();
  console.log(`[Provisioner] Got session: ${sid}`);

  // Step 2: Validate order first (no charge)
  const hostname = `client-vps-${user_id.slice(0, 8)}`;
  const config = {
    ...DEFAULT_VPS_CONFIG,
    location,
    hostname,
  };

  console.log('[Provisioner] Validating order...');
  const validation = await validateOrder(sid, config);
  console.log(`[Provisioner] Validation: ${validation}`);

  if (validation && validation.toLowerCase().includes('error')) {
    throw new Error(`Order validation failed: ${validation}`);
  }

  // Step 3: Generate a secure root password
  const rootpass = generatePassword();

  // Step 4: Place order (THIS CHARGES — but we block before this in webhook)
  // For now we return the config that WOULD be used
  console.log('[Provisioner] Order config ready (not placing yet — awaiting Stripe payment confirmation)');
  
  return {
    sid,
    hostname,
    config: { ...config, rootpass },
    message: 'Order validated. Ready to place. Call placeOrder(sid, config) to execute.',
  };
}

/**
 * Actually place the order — only call after payment confirmed
 */
async function placeOrder(sid, config) {
  console.log('[Provisioner] ⚠️ PLACING ORDER — this charges the account!');
  const res = await soapRequest('api_api_buy_vps', {
    sid,
    os: config.os,
    slices: config.slices,
    platform: config.platform,
    controlpanel: config.controlpanel || '',
    period: config.period,
    location: config.location,
    version: config.version,
    hostname: config.hostname,
    coupon: config.coupon || '',
    ipv6only: config.ipv6only ? 1 : 0,
    rootpass: config.rootpass,
  });

  const orderId = extractValue(res, 'return');
  console.log(`[Provisioner] Order placed! Order ID: ${orderId}`);
  return orderId;
}

/**
 * Wait for VPS to come online after order
 * Polls until SSH/WinRM is reachable
 */
async function waitForVPS(sid, orderId, maxWaitMs = 600000) { // 10 min default
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const details = await getVPSDetails(sid, orderId);
    const ip = extractValue(details, 'ip');
    const status = extractValue(details, 'status');
    
    if (ip && status !== 'pending') {
      console.log(`[Provisioner] VPS online! IP: ${ip}, Status: ${status}`);
      return {
        ip,
        status,
        orderId,
        details,
      };
    }
    
    console.log(`[Provisioner] Waiting for VPS... status=${status}, elapsed=${Math.round((Date.now()-start)/1000)}s`);
    await sleep(30000); // Check every 30s
  }
  
  throw new Error('VPS provisioning timed out after 10 minutes');
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < 14; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Provision a complete VPS for a client
 * 1. Login
 * 2. Validate
 * 3. Place order (after payment confirmed)
 * 4. Wait for boot
 * 5. Return VPS details + WinRM credentials
 */
async function provisionClientVPS({ user_id, location = 1 }) {
  const sid = await login();
  const hostname = `client-vps-${user_id.slice(0, 8)}`;
  const rootpass = generatePassword();
  
  const config = {
    ...DEFAULT_VPS_CONFIG,
    location,
    hostname,
    rootpass,
  };

  // Place the actual order
  const orderId = await placeOrder(sid, config);
  
  // Wait for it to boot
  const vpsInfo = await waitForVPS(sid, orderId);
  
  return {
    orderId,
    hostname,
    ip: vpsInfo.ip,
    rootpass,
    user_id,
    location,
    platform: 'kvm',
    os: DEFAULT_VPS_CONFIG.os,
    slices: DEFAULT_VPS_CONFIG.slices,
  };
}

module.exports = {
  login,
  getTemplates,
  getLocations,
  validateOrder,
  orderVPS,
  getVPSDetails,
  createVPS,
  placeOrder,
  waitForVPS,
  provisionClientVPS,
  DEFAULT_VPS_CONFIG,
};
