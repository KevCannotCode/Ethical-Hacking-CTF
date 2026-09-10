# Forward a Windows LAN port into WSL2 so classroom phones can reach the CTF tracker.
# Run once per boot from an elevated (admin) PowerShell:  .\expose-lan.ps1 [-Port 8000]
param([int]$Port = 8000)

$wslIp = (wsl hostname -I).Trim().Split(' ')[0]
if (-not $wslIp) { Write-Error "WSL is not running — start it first."; exit 1 }

netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$Port listenaddress=0.0.0.0 connectport=$Port connectaddress=$wslIp | Out-Null

$rule = "CTF tracker $Port"
if (-not (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $rule -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
}

$lan = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1).IPv4Address.IPAddress
Write-Host "Forwarding $lan`:$Port -> WSL $wslIp`:$Port"
Write-Host "Students open: http://$lan`:$Port/submit"
