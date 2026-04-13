<#
  install.ps1 — Installs AdsPower + browser automation deps on a new VPS
  Run AFTER bootstrap.ps1 has completed
  
  Purpose:
  - Install AdsPower browser (Chrome-based, antidetect browser for social automation)
  - Configure AdsPower API access
  - Create browser profile for the client
  - Set up proxy rotation (using client's configured proxy or default)
  
  Usage:
    Invoke-Command -ComputerName "VPS_IP" -Credential $cred -ScriptBlock {
      & "C:\opernox-agent\install.ps1" -AdsPowerApiKey "KEY" -BrowserProfileId "PROFILE_ID"
    }
#>

param(
  [Parameter(Mandatory=$false)]
  [string]$AdsPowerApiKey = "6f3289b60f2199b232b1ee4051106e6000835ba1e7ba23d1",

  [Parameter(Mandatory=$false)]
  [string]$AdsPowerUrl = "http://local.adspower.net:50325",

  [Parameter(Mandatory=$false)]
  [string]$ProxyHost = "",

  [Parameter(Mandatory=$false)]
  [string]$ProxyPort = "",

  [Parameter(Mandatory=$false)]
  [string]$ProxyUser = "",

  [Parameter(Mandatory=$false)]
  [string]$ProxyPass = ""
)

$ErrorActionPreference = "Stop"
$DownloadDir = "C:\adsautomation"
$AdsPowerExe = "$DownloadDir\AdsPower Browser\AdsPower Browser.exe"

function Write-Log {
  param([string]$Msg, [string]$Level = "INFO")
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[$ts][$Level] $Msg"
}

Write-Log "=== AdsPower Installation Started ==="

# ── Step 1: Create download directory ────────────────────────────────────────
New-Item -ItemType Directory -Force -Path $DownloadDir | Out-Null

# ── Step 2: Download AdsPower ────────────────────────────────────────────────
$adsPowerZip = "$DownloadDir\AdsPower.zip"
$adsPowerDownloadUrl = "https://www.adspower.net/download/windows/AdsPower_Browser-6.3.4.zip"

if (-not (Test-Path $AdsPowerExe)) {
  Write-Log "Downloading AdsPower Browser..."
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  try {
    Invoke-WebRequest -Uri $adsPowerDownloadUrl -OutFile $adsPowerZip -UseBasicParsing -TimeoutSec 120
    Write-Log "Extracting AdsPower..."
    Expand-Archive -Path $adsPowerZip -DestinationPath $DownloadDir -Force
    Remove-Item $adsPowerZip -Force
    Write-Log "AdsPower extracted."
  } catch {
    Write-Log "Failed to download AdsPower: $_" -Level "ERROR"
    Write-Log "You may need to manually install AdsPower from https://www.adspower.net"
  }
} else {
  Write-Log "AdsPower already installed at $AdsPowerExe"
}

# ── Step 3: Verify AdsPower API is accessible ────────────────────────────────
Write-Log "Checking AdsPower API at $AdsPowerUrl..."
$apiAccessible = $false
try {
  $response = Invoke-RestMethod -Uri "$AdsPowerUrl/api/v1/browser/online" -Method GET -Headers @{"Authorization" = "Bearer $AdsPowerApiKey"} -TimeoutSec 10
  if ($response.code -eq 0) {
    Write-Log "AdsPower API accessible. Browsers online: $($response.data.online)"
    $apiAccessible = $true
  }
} catch {
  Write-Log "AdsPower API not reachable: $_ — browser may not be running yet" -Level "WARN"
}

# ── Step 4: Install Chrome (if not present) ─────────────────────────────────
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
  Write-Log "Google Chrome not found — downloading..."
  $chromeInstaller = "$DownloadDir\chrome-installer.exe"
  Invoke-WebRequest -Uri "https://dl.google.com/chrome/install/latest/chrome_installer.exe" -OutFile $chromeInstaller -UseBasicParsing -TimeoutSec 120
  Start-Process -FilePath $chromeInstaller -ArgumentList "/silent", "/install" -Wait -NoNewWindow
  Remove-Item $chromeInstaller -Force
  Write-Log "Chrome installed."
} else {
  Write-Log "Chrome already installed."
}

# ── Step 5: Create default browser profile via AdsPower API ──────────────────
Write-Log "Creating default browser profile in AdsPower..."

$createProfileBody = @{
  name = "default-client"
  group_id = 0
  fingerprint_config = @{
    language = "en-US"
    UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    screen_width = 1920
    screen_height = 1080
  }
} | ConvertTo-Json

if ($ProxyHost -and $ProxyPort) {
  $proxyConfig = @{
    proxy_type = "dedicated"
    proxy_host = $ProxyHost
    proxy_port = [int]$ProxyPort
  }
  if ($ProxyUser -and $ProxyPass) {
    $proxyConfig.proxy_user = $ProxyUser
    $proxyConfig.proxy_pass = $ProxyPass
  }
  $createProfileBody.proxy = $proxyConfig
}

try {
  $createResponse = Invoke-RestMethod -Uri "$AdsPowerUrl/api/v1/browser/create" `
    -Method POST `
    -Headers @{"Authorization" = "Bearer $AdsPowerApiKey"; "Content-Type" = "application/json"} `
    -Body $createProfileBody `
    -TimeoutSec 30
  
  if ($createResponse.code -eq 0) {
    $profileId = $createResponse.data.id
    Write-Log "Browser profile created. ID: $profileId"
    
    # Save profile ID to config
    @{ profile_id = $profileId; created_at = (Get-Date -Format "o") } | ConvertTo-Json | Out-File "C:\opernox-agent\browser-profile.json" -Encoding UTF8
  } else {
    Write-Log "Profile creation failed: $($createResponse.msg)" -Level "WARN"
  }
} catch {
  Write-Log "Failed to create browser profile: $_" -Level "WARN"
}

# ── Step 6: Configure AdsPower to auto-start on VPS boot ────────────────────
Write-Log "Setting up AdsPower auto-start..."

$adsPowerStartupLnk = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\AdsPower.lnk"
if (Test-Path $AdsPowerExe) {
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($adsPowerStartupLnk)
  $shortcut.TargetPath = $AdsPowerExe
  $shortcut.WorkingDirectory = (Split-Path $AdsPowerExe)
  $shortcut.Description = "AdsPower Browser Automation"
  $shortcut.Save()
  Write-Log "AdsPower shortcut created in Startup folder."
} else {
  Write-Log "AdsPower executable not found at $AdsPowerExe — skipping startup shortcut" -Level "WARN"
}

# ── Step 7: Save AdsPower config ─────────────────────────────────────────────
$adsPowerConfig = @{
  api_key = $AdsPowerApiKey
  api_url = $AdsPowerUrl
  download_dir = $DownloadDir
  proxy_host = $ProxyHost
  proxy_port = $ProxyPort
  installed_at = (Get-Date -Format "o")
} | ConvertTo-Json

Set-Content -Path "C:\opernox-agent\ads-power-config.json" -Value $adsPowerConfig -Encoding UTF8
Write-Log "AdsPower config saved."

Write-Log "=== Installation Complete ==="
Write-Log "IMPORTANT: Start AdsPower Browser manually on first run to complete setup."
Write-Log "After first run, AdsPower will auto-start on VPS boot."
exit 0
