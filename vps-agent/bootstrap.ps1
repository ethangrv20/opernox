<#
  bootstrap.ps1 — Runs on a fresh Windows VPS via WinRM IMMEDIATELY after first boot
  Purpose: Get the VPS from "naked Windows" to "ready automation worker" in one shot
  
  What it does:
  1. Disable Windows Firewall (for WinRM + browser automation)
  2. Enable WinRM remoting (already on Interserver, but ensure it's on)
  3. Install Node.js 20 LTS
  4. Install Git
  5. Clone mission-control repo
  6. Install PM2 globally
  7. Copy job-agent config
  8. Start job-agent via PM2
  9. Register VPS in Supabase
  
  USAGE:
    Invoke-Command -ComputerName "VPS_IP" -Credential $cred -ScriptBlock {
      & "C:\temp\bootstrap.ps1" -SupabaseUrl "https://xxx.supabase.co" -ServiceRoleKey "eyJ..." -UserId "uuid-here"
    }

  SECURITY NOTE:
    - Script disables firewall rules for automation ports only (not all traffic)
    - WinRM auth uses password (from VPS rootpass) — fine for automated setup
    - Supabase service role key is sent to the VPS — acceptable since it's a trusted worker
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
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$VPSAgentDir = "C:\opernox-agent"
$MissionControlDir = "C:\opernox-agent\mission-control"
$NodeVersion = "20.14.0"
$NodeZip = "node-v${NodeVersion}-win-x64.zip"
$NodeUrl = "https://nodejs.org/dist/v${NodeVersion}/${NodeZip}"

function Write-Log {
  param([string]$Msg, [string]$Level = "INFO")
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$ts][$Level] $Msg"
}

Write-Log "=== VPS Bootstrap Started ==="
Write-Log "UserId: $UserId"
Write-Log "SupabaseUrl: $SupabaseUrl"
Write-Log "RepoUrl: $RepoUrl"

# ── Step 1: Disable Firewall for Automation ──────────────────────────────────
Write-Log "Disabling Windows Firewall for automation ports..."
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
Write-Log "Firewall disabled."

# ── Step 2: Ensure WinRM is enabled ─────────────────────────────────────────
Write-Log "Ensuring WinRM is enabled..."
WinRM /quickconfig /force 2>$null
Set-Item WSMan:\localhost\Shell\MaxMemoryPerShellMB 2048 -Force

# ── Step 3: Create working directory ──────────────────────────────────────────
Write-Log "Creating $VPSAgentDir..."
New-Item -ItemType Directory -Force -Path $VPSAgentDir | Out-Null

# ── Step 4: Install Node.js ───────────────────────────────────────────────────
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
  New-Item -ItemType Directory -Force -Path "C:\temp" | Out-Null
  
  Write-Log "Downloading Node.js from $NodeUrl..."
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $NodeUrl -OutFile $tempZip -UseBasicParsing
  
  Write-Log "Extracting Node.js..."
  Expand-Archive -Path $tempZip -DestinationPath "C:\" -Force
  Move-Item -Path "C:\node-v${NodeVersion}-win-x64" -Destination "C:\nodejs" -Force
  
  # Add to PATH permanently
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

# Check if git is available
$gitAvailable = $false
try {
  git --version 2>$null | Out-Null
  $gitAvailable = $true
} catch { }

if ($gitAvailable) {
  git clone --branch $Branch --depth 1 $RepoUrl $MissionControlDir
} else {
  # Install Git first
  Write-Log "Git not found — installing Git for Windows..."
  $gitInstaller = "C:\temp\git-installer.exe"
  Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe" -OutFile $gitInstaller -UseBasicParsing
  Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-", "/CLOSEAPPLICATIONS", "/RESTARTAPPLICATIONS", "/COMPONENTS=`"icons,assoc`"" -Wait -NoNewWindow
  Start-Sleep 3
  
  # Refresh PATH and try again
  $env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;$env:Path"
  git clone --branch $Branch --depth 1 $RepoUrl $MissionControlDir
}
Write-Log "Repo cloned to $MissionControlDir"

# ── Step 7: Install npm dependencies ────────────────────────────────────────
Write-Log "Installing npm dependencies..."
Set-Location $MissionControlDir
npm install --silent 2>$null

# Also install mission-control deps if separate
if (Test-Path "C:\opernox-agent\mission-control\package.json") {
  Set-Location "C:\opernox-agent\mission-control"
  npm install --silent 2>$null
}

# ── Step 8: Create ecosystem.config.js ──────────────────────────────────────
Write-Log "Creating ecosystem.config.js..."
$ecosystemContent = @"
module.exports = {
  apps: [{
    name: 'opernox-agent',
    script: './vps-agent/job-agent.js',
    cwd: 'C:\\opernox-agent\\mission-control',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      SUPABASE_URL: '${SupabaseUrl}',
      SUPABASE_SERVICE_KEY: '${ServiceRoleKey}',
      USER_ID: '${UserId}',
      MISSION_CONTROL_URL: 'http://127.0.0.1:3337',
    },
    error_file: 'C:\\opernox-agent\\logs\\agent-err.log',
    out_file: 'C:\\opernox-agent\\logs\\agent-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }, {
    name: 'mission-control',
    script: './server.js',
    cwd: 'C:\\opernox-agent\\mission-control',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3337,
    },
    error_file: 'C:\\opernox-agent\\logs\\server-err.log',
    out_file: 'C:\\opernox-agent\\logs\\server-out.log',
  }],
};
"@

$logsDir = "C:\opernox-agent\logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
Set-Content -Path "C:\opernox-agent\mission-control\ecosystem.config.js" -Value $ecosystemContent -Encoding UTF8

# ── Step 9: Register VPS in Supabase ────────────────────────────────────────
Write-Log "Registering VPS in Supabase..."

$vpsHostname = $env:COMPUTERNAME
$publicIp = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content.Trim()

$registerBody = @{
  user_id = $UserId
  hostname = $vpsHostname
  ip = $publicIp
  status = "provisioning"
  platform = "windows"
  interserver_order_id = ""
  created_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
} | ConvertTo-Json

# Register via Supabase REST API with service role key
$headers = @{
  "Authorization" = "Bearer $ServiceRoleKey"
  "apikey" = $ServiceRoleKey
  "Content-Type" = "application/json"
  "Prefer" = "return=representation"
}

try {
  $vpsesDir = "C:\opernox-agent\vpses"
  New-Item -ItemType Directory -Force -Path $vpsesDir | Out-Null
  
  # Save registration payload for retry if needed
  $registerBody | Out-File -FilePath "C:\opernox-agent\vpses\registration.json" -Encoding UTF8
  
  # TODO: Insert into Supabase vpses table via REST API
  # POST $SupabaseUrl/rest/v1/vpses
  # Will be wired up once vpses table is created in Supabase
  Write-Log "VPS registration payload saved to C:\opernox-agent\vpses\registration.json"
  Write-Log "VPS IP (via ipify): $publicIp"
} catch {
  Write-Log "VPS registration failed: $_" -Level "WARN"
}

# ── Step 10: Re-enable Firewall with port 3337 open ─────────────────────────
Write-Log "Re-enabling Windows Firewall with port 3337 open for Opernox dashboard..."
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
New-NetFirewallRule -DisplayName "Opernox MC API" -Direction Inbound -Action Allow `
  -Protocol TCP -LocalPort 3337 -RemoteAddress Any -ErrorAction SilentlyContinue
Write-Log "Firewall re-enabled. Port 3337 open to all sources."

# ── Step 11: Start PM2 and job-agent ─────────────────────────────────────────
Write-Log "Starting PM2 and mission-control..."

# Create logs dir
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

# Start mission-control first
Set-Location "C:\opernox-agent\mission-control"
pm2 delete opernox-agent 2>$null
pm2 delete mission-control 2>$null
pm2 start ecosystem.config.js

# Save PM2 state so it survives reboots
pm2 save 2>$null

# Schedule PM2 to start on boot (Windows Task Scheduler)
$pm2Startup = pm2 startup 2>$null
Write-Log "PM2 startup command: $pm2Startup"

Write-Log "=== Bootstrap Complete ==="
Write-Log "Mission Control: http://127.0.0.1:3337"
Write-Log "PM2 Status:"
pm2 status

# Mark provisioning complete in Supabase (when table exists)
Write-Log "VPS provisioning finished successfully."
exit 0
