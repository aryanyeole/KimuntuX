$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$hardhatDir = Join-Path $repoRoot "KimuntuX_BlockchainIntegration"
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = $repoRoot
$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$hardhatLog = Join-Path $hardhatDir "hardhat-node.log"
$backendLog = Join-Path $backendDir "backend-demo.log"
$frontendLog = Join-Path $frontendDir "frontend-demo.log"
$deploymentInfo = Join-Path $hardhatDir "deployment-info.local.json"
$backendEnv = Join-Path $backendDir ".env"

function Test-PortOpen {
    param([int]$Port)

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne(1500, $false)
        $connected = $ok -and $client.Connected
        $client.Close()
        return $connected
    } catch {
        return $false
    }
}

function Wait-ForPort {
    param(
        [int]$Port,
        [System.Diagnostics.Process]$Process,
        [int]$TimeoutSeconds = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if ($Process -and $Process.HasExited) {
            return $false
        }
        if (Test-PortOpen -Port $Port) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Wait-ForHttp {
    param(
        [string]$Url,
        [System.Diagnostics.Process]$Process,
        [int]$TimeoutSeconds = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if ($Process -and $Process.HasExited) {
            return $false
        }
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 | Out-Null
            return $true
        } catch {
            Start-Sleep -Milliseconds 750
        }
    }
    return $false
}

function Start-LoggedProcess {
    param(
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$LogPath
    )

    if (Test-Path $LogPath) {
        Remove-Item -LiteralPath $LogPath -Force
    }

    return Start-Process `
        -FilePath "C:\Windows\System32\cmd.exe" `
        -ArgumentList "/c $Command > `"$LogPath`" 2>&1" `
        -WorkingDirectory $WorkingDirectory `
        -PassThru
}

function Stop-KimuXProcesses {
    $targets = @(
        "*KimuntuX_BlockchainIntegration*hardhat*",
        "*KimuntuX_BlockchainIntegration*node_modules*hardhat*",
        "*uvicorn main:app*",
        "*node_modules*react-scripts*",
        "*react-scripts start*"
    )

    $processes = Get-CimInstance Win32_Process | Where-Object {
        $commandLine = $_.CommandLine
        if (-not $commandLine) {
            return $false
        }

        foreach ($pattern in $targets) {
            if ($commandLine -like $pattern) {
                return $true
            }
        }

        return $false
    }

    foreach ($process in $processes) {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    }

    Start-Sleep -Seconds 2
}

function Update-EnvValue {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )

    $content = Get-Content -Path $FilePath -Raw
    $pattern = "(?m)^" + [Regex]::Escape($Key) + "=.*$"
    $replacement = "$Key=$Value"

    if ($content -match $pattern) {
        $content = [Regex]::Replace($content, $pattern, $replacement)
    } else {
        $content = $content.TrimEnd() + "`r`n$replacement`r`n"
    }

    Set-Content -Path $FilePath -Value $content
}

Write-Host "Starting KimuX demo stack..."

if (-not (Test-Path $backendPython)) {
    throw "Backend virtualenv is missing at $backendPython"
}

Stop-KimuXProcesses

Write-Host "Launching fresh Hardhat node on 127.0.0.1:8545"
$hardhatProcess = Start-LoggedProcess `
    -WorkingDirectory $hardhatDir `
    -Command "npm run node" `
    -LogPath $hardhatLog

if (-not (Wait-ForPort -Port 8545 -Process $hardhatProcess -TimeoutSeconds 30)) {
    throw "Hardhat node failed to start. Check $hardhatLog"
}

Write-Host "Deploying local KimuX contracts"
Push-Location $hardhatDir
try {
    cmd /c "npm run deploy:local"
} finally {
    Pop-Location
}

if (-not (Test-Path $deploymentInfo)) {
    throw "Deployment info was not written. Check deploy output in $hardhatDir"
}

$deployment = Get-Content -Path $deploymentInfo -Raw | ConvertFrom-Json
Update-EnvValue -FilePath $backendEnv -Key "WALLET_CONTRACT_ADDRESS" -Value $deployment.contracts.wallet
Update-EnvValue -FilePath $backendEnv -Key "COMMISSION_CONTRACT_ADDRESS" -Value $deployment.contracts.commission
Update-EnvValue -FilePath $backendEnv -Key "ESCROW_CONTRACT_ADDRESS" -Value $deployment.contracts.escrow
Update-EnvValue -FilePath $backendEnv -Key "EXPECTED_CHAIN_ID" -Value $deployment.chainId

Write-Host "Launching backend on 127.0.0.1:8000"
$backendProcess = Start-LoggedProcess `
    -WorkingDirectory $backendDir `
    -Command ".venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000" `
    -LogPath $backendLog

if (-not (Wait-ForHttp -Url "http://127.0.0.1:8000/health" -Process $backendProcess -TimeoutSeconds 30)) {
    throw "Backend failed to start cleanly. Check $backendLog"
}

Write-Host "Launching frontend on http://127.0.0.1:3000"
$frontendProcess = Start-LoggedProcess `
    -WorkingDirectory $frontendDir `
    -Command "npm start" `
    -LogPath $frontendLog

if (-not (Wait-ForHttp -Url "http://127.0.0.1:3000" -Process $frontendProcess -TimeoutSeconds 60)) {
    throw "Frontend failed to start cleanly. Check $frontendLog"
}

Write-Host ""
Write-Host "KimuX demo stack is ready:"
Write-Host "  Hardhat RPC: http://127.0.0.1:8545"
Write-Host "  Backend API: http://127.0.0.1:8000"
Write-Host "  Frontend UI: http://127.0.0.1:3000"
Write-Host ""
Write-Host "Contracts:"
Write-Host "  Wallet: $($deployment.contracts.wallet)"
Write-Host "  Commission: $($deployment.contracts.commission)"
Write-Host "  Escrow: $($deployment.contracts.escrow)"
Write-Host ""
Write-Host "Logs:"
Write-Host "  $hardhatLog"
Write-Host "  $backendLog"
Write-Host "  $frontendLog"
