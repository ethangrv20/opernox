/**
 * POST /api/admin/vpses/provision
 * Provision a VPS for a user — orders from Interserver, then WinRM bootstraps it.
 *
 * ⚠️ This places a real ~$40 charge on Interserver — only call after wire confirmed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const INTERSERVER_CREDS = {
  username: 'ethangrv@gmail.com',
  password: '2dcebtqS!',
};
const SOAP_URL = 'https://my.interserver.net/api.php?wsdl';
const DEFAULT_CONFIG = {
  os: 'windowsr2',
  slices: 8,
  platform: 'kvm',
  location: 1,
  version: 1,
  period: 1,
  coupon: '',
  ipv6only: false,
};

// ── SOAP Helpers ──────────────────────────────────────────────────────────────

function soapRequest(method: string, params: Record<string, string | number | boolean>) {
  const paramLines = Object.entries(params)
    .map(([k, v]) => `<${k}>${String(v)}</${k}>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<SOAP-ENV:Envelope SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
  xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/">
  <SOAP-ENV:Body><ns1:${method} xmlns:ns1="urn:myapi">\n${paramLines}\n</ns1:${method}></SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  return new Promise<string>((resolve, reject) => {
    const url = new URL(SOAP_URL);
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
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(xml);
    req.end();
  });
}

function extractValue(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return m ? m[1] : null;
}

async function interServerLogin(): Promise<string> {
  const res = await soapRequest('api_login', {
    username: INTERSERVER_CREDS.username,
    password: INTERSERVER_CREDS.password,
  });
  const sid = extractValue(res, 'return');
  if (!sid) throw new Error('Interserver login failed');
  return sid;
}

async function validateOrder(sid: string, config: Record<string, unknown>): Promise<string | null> {
  const res = await soapRequest('api_api_validate_buy_vps', {
    sid,
    os: config.os as string,
    slices: config.slices as number,
    platform: config.platform as string,
    controlpanel: '',
    period: config.period as number,
    location: config.location as number,
    version: config.version as number,
    hostname: config.hostname as string,
    coupon: '',
    ipv6only: config.ipv6only ? 1 : 0,
  });
  return extractValue(res, 'return');
}

async function placeOrder(sid: string, config: Record<string, unknown>): Promise<string> {
  const res = await soapRequest('api_api_buy_vps', {
    sid,
    os: config.os as string,
    slices: config.slices as number,
    platform: config.platform as string,
    controlpanel: '',
    period: config.period as number,
    location: config.location as number,
    version: config.version as number,
    hostname: config.hostname as string,
    coupon: '',
    ipv6only: config.ipv6only ? 1 : 0,
    rootpass: config.rootpass as string,
  });
  const orderId = extractValue(res, 'return');
  if (!orderId) throw new Error('No order ID returned from Interserver');
  return orderId;
}

function genPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── WinRM Bootstrapper (writes a separate .ps1 file to avoid escaping issues) ─

function spawnBootstrap(
  vpsIp: string,
  rootpass: string,
  userId: string,
  vpsRecordId: string,
  hostname: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  bootstrapScriptPath: string
) {
  // Write the WinRM runner script to C:\temp
  // This script waits for VPS to be reachable then runs bootstrap.ps1 via WinRM
  const runnerContent = [
    '$ErrorActionPreference = "Continue"',
    '$vpsIp = "' + vpsIp + '"',
    '$rootpass = "' + rootpass + '"',
    '$userId = "' + userId + '"',
    '$vpsRecordId = "' + vpsRecordId + '"',
    '$hostname = "' + hostname + '"',
    '$SupabaseUrl = "' + supabaseUrl + '"',
    '$ServiceRoleKey = "' + serviceRoleKey + '"',
    '$BootstrapScript = "' + bootstrapScriptPath.replace(/\\/g, '\\\\') + '"',
    '$LOG = "C:\\temp\\bootstrap-log-' + vpsRecordId + '.txt"',
    '',
    'function Write-Log { param($Msg) $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"; "[$ts] $Msg" | Out-File -FilePath $LOG -Append -Encoding UTF8; Write-Host "[$ts] $Msg" }',
    '',
    'Write-Log "=== WinRM Bootstrapper Started for ${hostname} (${vpsIp}) ==="',
    '',
    '# Create credential',
    '$secPass = ConvertTo-SecureString "$rootpass" -AsPlainText -Force',
    '$cred = New-Object System.Management.Automation.PSCredential("Administrator", $secPass)',
    '',
    '# Wait for VPS to be reachable via WinRM (Interserver takes ~10-15 min to boot)',
    '$maxWait = 20',
    '$waited = 0',
    '$reachable = $false',
    '',
    'Write-Log "Waiting for VPS to be reachable via WinRM..."',
    'while ($waited -lt $maxWait) {',
    '  try {',
    '    $test = Invoke-Command -ComputerName $vpsIp -Credential $cred -Port 5985 -TimeoutSec 10 -ScriptBlock { $env:COMPUTERNAME }',
    '    if ($test) { Write-Log "VPS is online! (waited $($waited * 30)s)"; $reachable = $true; break }',
    '  } catch {',
    '    Write-Log "Not reachable yet (attempt $($waited+1)/$maxWait): $($_.Exception.Message -split \'\\n\')[0]"',
    '  }',
    '  Start-Sleep 30',
    '  $waited++',
    '}',
    '',
    'if (-not $reachable) { Write-Log "ERROR: VPS never became reachable."; exit 1 }',
    '',
    '# Copy bootstrap script to VPS via WinRM',
    'Write-Log "Copying bootstrap script to VPS..."',
    'try {',
    '  $session = New-PSSession -ComputerName $vpsIp -Credential $cred -Port 5985',
    '  Copy-Item -Path $BootstrapScript -Destination "C:\\temp\\bootstrap-run.ps1" -ToSession $session -Force',
    '  Write-Log "Bootstrap script copied."',
    '} catch {',
    '  Write-Log "ERROR: Failed to copy bootstrap script: $($_.Exception.Message -split \'\\n\')[0]"; exit 1',
    '}',
    '',
    '# Run bootstrap.ps1 via WinRM',
    'Write-Log "Executing bootstrap.ps1 on VPS..."',
    'try {',
    '  Invoke-Command -ComputerName $vpsIp -Credential $cred -Port 5985 ',
    '    -SessionOption (New-PSSessionOption -SkipCACheck -SkipCNCheck) ',
    '    -ScriptBlock {',
    '      Set-ExecutionPolicy Bypass -Scope Process -Force',
    '      & "C:\\temp\\bootstrap-run.ps1" -SupabaseUrl $using:SupabaseUrl -ServiceRoleKey $using:ServiceRoleKey -UserId $using:userId -VpsHostname $using:hostname',
    '  } 2>&1 | ForEach-Object { Write-Log "[VPS] $_" }',
    '  Write-Log "Bootstrap completed."',
    '} catch {',
    '  Write-Log "ERROR: Bootstrap failed: $($_.Exception.Message -split \'\\n\')[0]"; exit 1',
    '}',
    '',
    'Remove-PSSession $session -ErrorAction SilentlyContinue',
    'Remove-Item $BootstrapScript -Force -ErrorAction SilentlyContinue',
    'Write-Log "Done."',
  ].join('\r\n');

  const runnerPath = path.join('C:\\temp', `winrm-bootstrap-${vpsRecordId}.ps1`);
  fs.writeFileSync(runnerPath, '\ufeff' + runnerContent, 'utf8');

  const ps = spawn('powershell.exe', [
    '-ExecutionPolicy', 'Bypass',
    '-File', runnerPath,
  ], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });

  ps.unref();
  console.log(`[Provision] Bootstrapper spawned as PID ${ps.pid} for VPS ${vpsRecordId}`);
}

// ── Main Handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { user_id } = await request.json();

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  // 1. Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user_id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (profile.payment_status === 'pending_wire') {
    return NextResponse.json({ error: 'Wire not yet received.' }, { status: 400 });
  }

  if (profile.payment_status === 'vps_active' || profile.payment_status === 'vps_approved') {
    return NextResponse.json({ error: 'User already has an active or pending VPS.' }, { status: 400 });
  }

  // 2. Check for existing VPS
  const { data: existingVPS } = await supabase
    .from('vpses')
    .select('id')
    .eq('user_id', user_id)
    .not('status', 'eq', 'terminated')
    .single();

  if (existingVPS) {
    return NextResponse.json({ error: 'User already has a VPS record.' }, { status: 400 });
  }

  // 3. Update payment_status → vps_approved
  await supabase
    .from('profiles')
    .update({ payment_status: 'vps_approved' })
    .eq('id', user_id);

  // 4. Provision via Interserver
  let orderId: string;
  let hostname: string;
  let rootpass: string;

  try {
    const sid = await interServerLogin();
    hostname = `client-vps-${user_id.replace(/-/g, '').slice(0, 8)}`;
    rootpass = genPassword();

    const config = { ...DEFAULT_CONFIG, hostname, rootpass };

    console.log(`[Provision] Validating order for ${hostname}...`);
    const validation = await validateOrder(sid, config);
    if (validation && validation.toLowerCase().includes('error')) {
      throw new Error(`Validation failed: ${validation}`);
    }

    console.log(`[Provision] ⚠️ Placing order for ${hostname}...`);
    orderId = await placeOrder(sid, config);
    console.log(`[Provision] Order placed! Order ID: ${orderId}`);

  } catch (err: any) {
    await supabase.from('profiles').update({ payment_status: 'paid' }).eq('id', user_id);
    console.error('[Provision] Interserver error:', err);
    return NextResponse.json({ error: `Interserver error: ${err.message}` }, { status: 500 });
  }

  // 5. Insert vpses record with status=provisioning
  const { data: vpsRecord, error: vpsError } = await supabase
    .from('vpses')
    .insert({
      user_id,
      interserver_order_id: orderId,
      hostname,
      status: 'provisioning',
      platform: 'kvm',
      os: 'windowsr2',
      slices: 8,
      location: 1,
      location_name: 'Secaucus NJ',
      rootpass_encrypted: Buffer.from(rootpass).toString('base64'),
      provisioned_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (vpsError) {
    console.error('[Provision] DB insert failed:', vpsError);
    return NextResponse.json({ error: `DB insert failed: ${vpsError.message}` }, { status: 500 });
  }

  // 6. Spawn background WinRM bootstrapper
  // Copy bootstrap.ps1 to C:\temp so the runner can send it to the VPS
  const bootstrapScriptSrc = path.join(process.cwd(), 'vps-agent', 'bootstrap.ps1');
  const bootstrapScriptDest = path.join('C:\\temp', `bootstrap-${vpsRecord.id}.ps1`);

  try {
    fs.copyFileSync(bootstrapScriptSrc, bootstrapScriptDest);
  } catch (err: any) {
    console.error('[Provision] Could not copy bootstrap script:', err);
    return NextResponse.json({
      success: true,
      vpsId: vpsRecord.id,
      orderId,
      hostname,
      warning: `VPS ordered but bootstrap script copy failed: ${err.message}`,
    });
  }

  try {
    spawnBootstrap(hostname, rootpass, user_id, vpsRecord.id, hostname, supabaseUrl, serviceRoleKey, bootstrapScriptDest);
  } catch (err: any) {
    console.error('[Provision] Failed to spawn bootstrapper:', err);
    return NextResponse.json({
      success: true,
      vpsId: vpsRecord.id,
      orderId,
      hostname,
      warning: `VPS ordered but bootstrapper failed to spawn: ${err.message}. Bootstrap can be retried.`,
    });
  }

  return NextResponse.json({
    success: true,
    vpsId: vpsRecord.id,
    orderId,
    hostname,
    message: `VPS ordered! Bootstrapping now — takes ~15-20 min total. WinRM bootstrapper running in background.`,
  });
}
