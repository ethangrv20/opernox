<#
  bootstrap.ps1 — Runs on a fresh Windows VPS via WinRM IMMEDIATELY after first boot
  Purpose: Get the VPS from "naked Windows" to "ready automation worker" in one shot

  What it does:
  1. Disable Windows Firewall (for WinRM + browser automation)
  2. Enable WinRM remoting (already on Interserver, but ensure it's on)
  3. Install Node.js 20 LTS
  4. Install Git
  5. Clone opernox repo + ops repo
  6. Install PM2 globally
  7. Install npm dependencies
  8. Create ecosystem.config.js with USER_ID
  9. Start PM2 services (mission-control + warmup-scheduler)
  10. Set up cloudflared tunnel and write tunnel_url to Supabase
  11. Register VPS in Supabase

  USAGE:
    Invoke-Command -ComputerName "VPS_IP" -Credential $cred -Port 5985 -ScriptBlock {
      & "C:\temp\bootstrap.ps1" -SupabaseUrl "https://xxx.supabase.co" -ServiceRoleKey "eyJ..." -UserId "uuid-here"
    }
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$SupabaseUrl,

  [Parameter(Mandatory=$true)]
  [string]$ServiceRoleKey,

  [Parameter(Mandatory=$true)]
  [string]$UserId,

  [Parameter(Mandatory=$false)]
  [string]$RepoUrl = "https://github.com/ethangrv20/opernox.git",

  [Parameter(Mandatory=$false)]
  [string]$Branch = "main",

  [Parameter(Mandatory=$false)]
  [string]$OpsRepoUrl = "https://github.com/ethangrv20/textascend-ops.git",

  [Parameter(Mandatory=$false)]
  [string]$VpsHostname = "",

  [Parameter(Mandatory=$false)]
  [string]$VpsRecordId = "",

  [Parameter(Mandatory=$false)]
  [string]$CFAccountId = "26476d8594c544120bdc9cc80511c670",

  [Parameter(Mandatory=$false)]
  [string]$CFZoneId = "a9a96b06e25dc3e511df4682acc45590",

  [Parameter(Mandatory=$false)]
  [string]$CFApiToken = ""

)

$ErrorActionPreference = "Stop"
$VPSAgentDir = "C:\opernox-agent"
$MissionControlDir = "C:\opernox-agent\mission-control"
$NodeVersion = "20.14.0"
$NodeZip = "node-v${NodeVersion}-win-x64.zip"
$NodeUrl = "https://nodejs.org/dist/v${NodeVersion}/${NodeZip}"
$CloudflaredUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
$CLOUDFLARED = "C:\temp\cloudflared.exe"
$TUNNEL_LOG = "C:\temp\cloudflared-tunnel.log"

function Write-Log {
  param([string]$Msg, [string]$Level = "INFO")
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$ts][$Level] $Msg"
}

if (-not $CFApiToken) {
  Write-Log "ERROR: CFApiToken parameter not provided." -Level "ERROR"
  exit 1
}

if (-not $VpsRecordId) {
  Write-Log "ERROR: VpsRecordId parameter not provided." -Level "ERROR"
  exit 1
}

Write-Log "=== VPS Bootstrap Started ==="
Write-Log "UserId: $UserId"
Write-Log "SupabaseUrl: $SupabaseUrl"
Write-Log "VpsRecordId: $VpsRecordId"

# ── Step 1: Disable Firewall ─────────────────────────────────────────────────
Write-Log "Disabling Windows Firewall..."
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
Write-Log "Firewall disabled."

# ── Step 2: Ensure WinRM is enabled ─────────────────────────────────────────
Write-Log "Ensuring WinRM is enabled..."
WinRM /quickconfig /force 2>$null
Set-Item WSMan:\localhost\Shell\MaxMemoryPerShellMB 2048 -Force
Write-Log "WinRM ready."

# ── Step 3: Create working directory ─────────────────────────────────────────
Write-Log "Creating $VPSAgentDir..."
New-Item -ItemType Directory -Force -Path $VPSAgentDir | Out-Null
New-Item -ItemType Directory -Force -Path "C:\temp" | Out-Null

# ── Step 4: Install Node.js ─────────────────────────────────────────────────
$nodeInstalled = $false
try {
  $nodeVersionCheck = node --version 2>$null
  if ($nodeVersionCheck) {
    Write-Log "Node.js already installed: $nodeVersionCheck"
    $nodeInstalled = $true
  }
} catch { }

if (-not $nodeInstalled) {
  Write-Log "Installing Node.js ${NodeVersion}..."
  $tempZip = "C:\temp\node.zip"
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $NodeUrl -OutFile $tempZip -UseBasicParsing
  Expand-Archive -Path $tempZip -DestinationPath "C:\" -Force
  Move-Item -Path "C:\node-v${NodeVersion}-win-x64" -Destination "C:\nodejs" -Force
  $env:Path = "C:\nodejs;$env:Path"
  [Environment]::SetEnvironmentVariable("Path", "C:\nodejs;$([Environment]::GetEnvironmentVariable('Path','Machine'))", "Machine")
  Remove-Item $tempZip -Force
  Write-Log "Node.js installed: $(node --version)"
}

# ── Step 5: Install PM2 globally ────────────────────────────────────────────
Write-Log "Installing PM2..."
npm install -g pm2 --silent 2>$null
Write-Log "PM2 installed: $(pm2 --version)"

# ── Step 6: Clone opernox repo ───────────────────────────────────────────────
Write-Log "Cloning opernox repo: $RepoUrl (branch: $Branch)..."
Set-Location $VPSAgentDir

$gitAvailable = $false
try { git --version 2>$null | Out-Null; $gitAvailable = $true } catch { }

if (-not $gitAvailable) {
  Write-Log "Git not found — installing Git for Windows..."
  $gitInstaller = "C:\temp\git-installer.exe"
  Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe" -OutFile $gitInstaller -UseBasicParsing
  Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT","/NORESTART","/NOCANCEL","/SP-","/CLOSEAPPLICATIONS","/RESTARTAPPLICATIONS" -Wait -NoNewWindow
  Start-Sleep 3
  $env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;$env:Path"
}

git clone --branch $Branch --depth 1 $RepoUrl $MissionControlDir 2>$null
if ($LASTEXITCODE -ne 0) { git clone --branch $Branch --depth 1 $RepoUrl $MissionControlDir }
Write-Log "Repo cloned to $MissionControlDir"

# ── Step 6b: Clone ops repo ─────────────────────────────────────────────────
$OpsDir = "C:\opernox-agent\ops"
if (-not (Test-Path $OpsDir)) {
  git clone --branch master --depth 1 $OpsRepoUrl $OpsDir 2>$null
  if ($LASTEXITCODE -ne 0) { git clone --branch master --depth 1 $OpsRepoUrl $OpsDir }
  Write-Log "Ops repo cloned to $OpsDir"
} else {
  Write-Log "Ops repo already exists — skipping"
}

# ── Step 7: Install npm dependencies ────────────────────────────────────────
Write-Log "Installing npm dependencies..."
Set-Location $MissionControlDir
npm install --silent 2>$null

if (Test-Path "C:\opernox-agent\ops\ig-automation\package.json") {
  Set-Location "C:\opernox-agent\ops\ig-automation"
  npm install --silent 2>$null
}

# ── Step 8: Create ecosystem.config.js ──────────────────────────────────────
Write-Log "Creating ecosystem.config.js..."
$logsDir = "C:\opernox-agent\logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$ecosystemContent = @"
module.exports = {
  apps: [{
    name: 'mission-control',
    script: './server.js',
    cwd: 'C:\\opernox-agent\\mission-control',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3337,
      USER_ID: '${UserId}',
    },
    error_file: 'C:\\opernox-agent\\logs\\server-err.log',
    out_file: 'C:\\opernox-agent\\logs\\server-out.log',
  }, {
    name: 'warmup-scheduler',
    script: './ig-automation/warmup-scheduler.cjs',
    cwd: 'C:\\opernox-agent\\ops',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      USER_ID: '${UserId}',
    },
    error_file: 'C:\\opernox-agent\\logs\\scheduler-err.log',
    out_file: 'C:\\opernox-agent\\logs\\scheduler-out.log',
  }],
};
"@

Set-Content -Path "C:\opernox-agent\mission-control\ecosystem.config.js" -Value $ecosystemContent -Encoding UTF8

# ── Step 9: Start PM2 services ────────────────────────────────────────────────
Write-Log "Starting PM2 services..."
Set-Location "C:\opernox-agent\mission-control"
pm2 delete mission-control 2>`$null
pm2 delete warmup-scheduler 2>`$null
pm2 start ecosystem.config.js
pm2 save 2>`$null
$pm2Startup = pm2 startup 2>`$null
Write-Log "PM2 started."

# ── Step 10: Set up per-client Cloudflare named tunnel ────────────────────────
Write-Log "Setting up Cloudflare named tunnel..."

# Cloudflare credentials from parameters (passed from provision/route.ts)
$CF_ACCOUNT_ID = $CFAccountId
$CF_ZONE_ID = $CFZoneId
$CF_API_TOKEN = $CFApiToken
$CF_API_BASE = "https://api.cloudflare.com/client/v4"

if (-not $CF_ACCOUNT_ID -or -not $CF_ZONE_ID -or -not $CF_API_TOKEN) {
  Write-Log "ERROR: Cloudflare credentials not provided (CFAccountId, CFZoneId, CFApiToken)." -Level "ERROR"
  exit 1
}

if (-not $VpsRecordId) {
  Write-Log "ERROR: VpsRecordId not provided." -Level "ERROR"
  exit 1
}

# Download cloudflared if not present
if (-not (Test-Path $CLOUDFLARED)) {
  Write-Log "Downloading cloudflared..."
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $CloudflaredUrl -OutFile $CLOUDFLARED -UseBasicParsing -TimeoutSec 60
  Write-Log "cloudflared downloaded."
} else {
  Write-Log "cloudflared already present."
}

# Kill any existing cloudflared processes
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 1

# Generate stable per-VPS tunnel name and subdomain
$TUNNEL_NAME = "client-vps-$($VpsRecordId -replace '-', '')"
$SUBDOMAIN = "mc-$($VpsRecordId -replace '-', '')"
$DOMAIN_NAME = "$SUBDOMAIN.opernox.com"

Write-Log "Creating Cloudflare tunnel: $TUNNEL_NAME"

# 1. Create tunnel via Cloudflare API
$createBody = @{ name = $TUNNEL_NAME } | ConvertTo-Json
$createHeaders = @{
  "Authorization" = "Bearer $CF_API_TOKEN"
  "Content-Type" = "application/json"
}

try {
  $createResp = Invoke-RestMethod -Uri "$CF_API_BASE/accounts/$CF_ACCOUNT_ID/tunnels" `
    -Method POST -Headers $createHeaders -Body $createBody -TimeoutSec 20
  if ($createResp.success) {
    $tunnelId = $createResp.result.id
    $tunnelToken = $createResp.result.token
    $tunnelSecret = $createResp.result.credentials_file.TunnelSecret
    Write-Log "Tunnel created: $tunnelId"
  } else {
    throw "Cloudflare tunnel creation failed: $($createResp.errors)"
  }
} catch {
  Write-Log "ERROR: Could not create Cloudflare tunnel: $_" -Level "ERROR"
  exit 1
}

# 2. Save credentials file locally for the tunnel service
$CRED_DIR = "C:\Users\Administrator\.cloudflared"
if (-not (Test-Path $CRED_DIR)) { New-Item -ItemType Directory -Force -Path $CRED_DIR | Out-Null }
$CRED_FILE = Join-Path $CRED_DIR "credentials-$TUNNEL_NAME.json"
$credContent = @{
  AccountTag = $CF_ACCOUNT_ID
  TunnelID = $tunnelId
  TunnelName = $TUNNEL_NAME
  TunnelSecret = $tunnelSecret
} | ConvertTo-Json
Set-Content -Path $CRED_FILE -Value $credContent -Encoding UTF8
Write-Log "Credentials saved to $CRED_FILE"

# 3. Create DNS CNAME record: mc-{vpsId}.opernox.com → {tunnelId}.cfargotunnel.com
$dnsBody = @{
  type = "CNAME"
  name = $SUBDOMAIN
  content = "$tunnelId.cfargotunnel.com"
  proxied = $true
} | ConvertTo-Json

$dnsHeaders = @{
  "Authorization" = "Bearer $CF_API_TOKEN"
  "Content-Type" = "application/json"
}

try {
  $dnsGetResp = Invoke-RestMethod -Uri "$CF_API_BASE/zones/$CF_ZONE_ID/dns_records?name=$DOMAIN_NAME" `
    -Method GET -Headers $dnsHeaders -TimeoutSec 15
  $existingRecord = $dnsGetResp.result | Where-Object { $_.name -eq $DOMAIN_NAME }

  if ($existingRecord) {
    $updateDnsResp = Invoke-RestMethod -Uri "$CF_API_BASE/zones/$CF_ZONE_ID/dns_records/$($existingRecord.id)" `
      -Method PUT -Headers $dnsHeaders -Body $dnsBody -TimeoutSec 15
    Write-Log "DNS record updated: $DOMAIN_NAME -> $tunnelId.cfargotunnel.com"
  } else {
    $createDnsResp = Invoke-RestMethod -Uri "$CF_API_BASE/zones/$CF_ZONE_ID/dns_records" `
      -Method POST -Headers $dnsHeaders -Body $dnsBody -TimeoutSec 15
    Write-Log "DNS record created: $DOMAIN_NAME -> $tunnelId.cfargotunnel.com"
  }
} catch {
  Write-Log "WARNING: Could not set DNS record: $_" -Level "WARN"
}

# 4. Run cloudflared with --token (no cert.pem needed when using tunnel token by UUID)
Write-Log "Starting cloudflared tunnel..."
$logFile = "C:\temp\cloudflared-$TUNNEL_NAME.log"

$runCmd = [System.Diagnostics.ProcessStartInfo]::new()
$runCmd.FileName = "cmd.exe"
$runCmd.Arguments = "/c `"$CLOUDFLARED tunnel --token $tunnelToken run >> `"'$logFile`'" 2>&1`""
$runCmd.UseShellExecute = $false
$runCmd.CreateNoWindow = $true
$runProcess = [System.Diagnostics.Process]::Start($runCmd)
Write-Log "cloudflared started (PID: $($runProcess.Id)). Log: $logFile"

# 5. Wait for tunnel to connect to Cloudflare edge
Start-Sleep 5
$maxWait = 30
$elapsed = 5
$connected = $false
while ($elapsed -lt $maxWait) {
  if (Test-Path $logFile) {
    $logContent = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
    if ($logContent -match 'Registered tunnel connection') {
      $connected = $true
      break
    }
  }
  Start-Sleep 2
  $elapsed += 2
}

if ($connected) {
  Write-Log "Tunnel connected to Cloudflare edge."
  $tunnelUrl = "https://$DOMAIN_NAME"
} else {
  Write-Log "WARNING: Tunnel may not have connected yet. Check $logFile" -Level "WARN"
  $tunnelUrl = "https://$DOMAIN_NAME"
}

# 6. Register cloudflared as a Windows service (survives reboot)
Write-Log "Registering cloudflared as Windows service..."
$scDelete = Start-Process -FilePath "cmd.exe" -ArgumentList "/c sc delete cloudflared 2>`$nul" -Wait -NoNewWindow -PassThru
Start-Sleep 1
$scCreate = Start-Process -FilePath "cmd.exe" -ArgumentList "/c sc create cloudflared binPath= `"$CLOUDFLARED tunnel --token $tunnelToken run`" start= auto DisplayName= `"Cloudflared Tunnel`" " -Wait -NoNewWindow -PassThru
Start-Sleep 1
Start-Process -FilePath "cmd.exe" -ArgumentList "/c sc start cloudflared" -NoNewWindow -PassThru | Out-Null
Write-Log "cloudflared Windows service registered."

# ── Step 11: Register VPS in Supabase and update tunnel_url ───────────────────
Write-Log "Registering VPS in Supabase..."

if (-not $VpsHostname) { $VpsHostname = $env:COMPUTERNAME }
$publicIp = "unknown"
try {
  $publicIp = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content.Trim()
} catch { }

$headers = @{
  "Authorization" = "Bearer $ServiceRoleKey"
  "apikey" = $ServiceRoleKey
  "Content-Type" = "application/json"
  "Prefer" = "return=representation"
}

# Upsert VPS record — update if exists (handles re-runs), insert if not
$vpsBody = @{
  user_id = $UserId
  hostname = $VpsHostname
  ip = $publicIp
  status = "active"
  platform = "kvm"
  os = "windowsr2"
  slices = 8
  location = 1
  location_name = "Secaucus NJ"
  provisioned_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
  updated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
  tunnel_url = $tunnelUrl
} | ConvertTo-Json

$patchOptions = @{
  Uri = "${SupabaseUrl}/rest/v1/vpses?id=eq.${VpsRecordId}"
  Method = "PATCH"
  Headers = $headers
  ContentType = "application/json"
  Body = $vpsBody
}

try {
  $patchResult = Invoke-RestMethod @patchOptions -TimeoutSec 15
  Write-Log "VPS record updated in Supabase (status=active, tunnel=$tunnelUrl)."
} catch {
  Write-Log "Failed to update VPS in Supabase: $_" -Level "WARN"
}

# ── Step 12: Mark profile vps_active ─────────────────────────────────────────
Write-Log "Updating profile payment_status..."
$profileBody = @{ payment_status = "vps_active" } | ConvertTo-Json
$profilePatch = @{
  Uri = "${SupabaseUrl}/rest/v1/profiles?user_id=eq.${UserId}"
  Method = "PATCH"
  Headers = $headers
  ContentType = "application/json"
  Body = $profileBody
}
try { Invoke-RestMethod @profilePatch -TimeoutSec 15 | Out-Null } catch { }

Write-Log "=== Bootstrap Complete ==="
Write-Log "Mission Control: http://127.0.0.1:3337"
Write-Log "Tunnel URL: $tunnelUrl"
pm2 status
exit 0
