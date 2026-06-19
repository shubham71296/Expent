# Maps Android SDK to C:\Android\Sdk (junction → real SDK under your user profile).
# Fixes Gradle/NDK failures when the username contains a space (e.g. "Dell 7410").

$ErrorActionPreference = 'Stop'

$targetSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$linkSdk = 'C:\Android\Sdk'

if (-not (Test-Path $targetSdk)) {
  Write-Error "Android SDK not found at: $targetSdk`nInstall Android Studio and the SDK first."
}

if (-not (Test-Path 'C:\Android')) {
  New-Item -ItemType Directory -Path 'C:\Android' | Out-Null
}

if (Test-Path $linkSdk) {
  $item = Get-Item $linkSdk -Force
  if ($item.LinkType -ne 'Junction') {
    Write-Error "$linkSdk exists but is not a junction. Remove it or pick another link path."
  }
} else {
  cmd /c mklink /J "$linkSdk" "$targetSdk" | Out-Null
  Write-Host "Created junction: $linkSdk -> $targetSdk"
}

[Environment]::SetEnvironmentVariable('ANDROID_HOME', $linkSdk, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $linkSdk, 'User')

$env:ANDROID_HOME = $linkSdk
$env:ANDROID_SDK_ROOT = $linkSdk

Write-Host ""
Write-Host "ANDROID_HOME set to: $linkSdk"
Write-Host "Close and reopen your terminal (or IDE) so the new value is picked up."
Write-Host ""
