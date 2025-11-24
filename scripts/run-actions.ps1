$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

function Invoke-Section {
  param(
    [string] $Name
  )
  Write-Host ""
  Write-Host "=== $Name ===" -ForegroundColor Cyan
}

function Run-Command {
  param(
    [string] $WorkDir,
    [string] $Command
  )

  Write-Host "[$WorkDir] $Command" -ForegroundColor Yellow
  Push-Location $WorkDir
  try {
    Invoke-Expression $Command
  }
  finally {
    Pop-Location
  }
}

Invoke-Section 'actions/role-sync'
Run-Command (Join-Path $root 'actions/role-sync') 'npm ci'
Run-Command (Join-Path $root 'actions/role-sync') 'npm run format:write'

Invoke-Section 'actions/role-sync (tests)'
Push-Location (Join-Path $root 'actions/role-sync')
try {
  $oldNodeOptions = $env:NODE_OPTIONS
  $oldNodeWarnings = $env:NODE_NO_WARNINGS
  $env:NODE_OPTIONS = '--experimental-vm-modules'
  $env:NODE_NO_WARNINGS = '1'
  Write-Host "[actions/role-sync] npm exec jest" -ForegroundColor Yellow
  npm exec jest
}
finally {
  if ($null -ne $oldNodeOptions) {
    $env:NODE_OPTIONS = $oldNodeOptions
  }
  else {
    Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
  }
  if ($null -ne $oldNodeWarnings) {
    $env:NODE_NO_WARNINGS = $oldNodeWarnings
  }
  else {
    Remove-Item Env:NODE_NO_WARNINGS -ErrorAction SilentlyContinue
  }
  Pop-Location
}

Invoke-Section 'actions/discussion-cleanup'
Run-Command (Join-Path $root 'actions/discussion-cleanup') 'npm ci'
Run-Command (Join-Path $root 'actions/discussion-cleanup') 'npm run format:write'
Run-Command (Join-Path $root 'actions/discussion-cleanup') 'npm run package'
