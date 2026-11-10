$ErrorActionPreference = 'Stop'

$services = @(
  @{
    Name = 'Admission API'
    Directory = Join-Path $PSScriptRoot 'server'
    Port = 5000
  },
  @{
    Name = 'Frontend'
    Directory = Join-Path $PSScriptRoot 'client'
    Port = 5175
  }
)

foreach ($service in $services) {
  if (-not (Test-Path (Join-Path $service.Directory 'package.json'))) {
    throw "Project package file not found for $($service.Name): $($service.Directory)"
  }

  $listener = Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($listener) {
    throw "Port $($service.Port) is already in use (required by $($service.Name)). Stop the existing service and retry."
  }
}

foreach ($service in $services) {
  Start-Process -FilePath 'cmd.exe' `
    -ArgumentList @('/k', 'npm run dev') `
    -WorkingDirectory $service.Directory `
    -WindowStyle Normal
}

Write-Host 'Started the API and frontend development servers.'
Write-Host 'Frontend:        http://localhost:5175'
Write-Host 'API health:      http://localhost:5000/api/health'
