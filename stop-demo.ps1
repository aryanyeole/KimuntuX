$ErrorActionPreference = "Stop"

$targets = @(
    "*KimuX_BlockchainIntegration*hardhat*",
    "*KimuntuX_BlockchainIntegration*hardhat*",
    "*KimuX_BlockchainIntegration*node_modules*hardhat*",
    "*KimuntuX_BlockchainIntegration*node_modules*hardhat*",
    "*uvicorn app.main:app*",
    "*uvicorn main:app*",
    "*react-scripts start*",
    "*node_modules*react-scripts*"
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

if (-not $processes) {
    Write-Host "No KimuX demo processes found."
    exit 0
}

foreach ($process in $processes) {
    Write-Host "Stopping PID $($process.ProcessId): $($process.Name)"
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host "Demo processes stopped."
