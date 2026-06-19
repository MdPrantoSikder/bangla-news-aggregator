# bootstrap.ps1
# Runs news bootstrap pipeline

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $ScriptDir

# Set HuggingFace cache (portable)
$env:HF_HOME = "$ScriptDir\.cache\huggingface"

# Create cache folder if missing
New-Item -ItemType Directory -Force -Path $env:HF_HOME | Out-Null

$LogFile = "$ScriptDir\bootstrap.log"

"--- Bootstrap started at $(Get-Date) ---" | Out-File $LogFile

python -m app.scripts.bootstrap_news *>> $LogFile

"--- Bootstrap finished at $(Get-Date) ---" | Out-File -Append $LogFile

Write-Host "Bootstrap complete. Log: $LogFile"