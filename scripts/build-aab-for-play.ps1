$ErrorActionPreference = 'Stop'

$rootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $rootDir

$gradleCmd = $null
if (Get-Command gradle -ErrorAction SilentlyContinue) {
  $gradleCmd = 'gradle'
} elseif (Get-Command gradle.bat -ErrorAction SilentlyContinue) {
  $gradleCmd = 'gradle.bat'
}

if (-not $gradleCmd) {
  Write-Host '❌ gradle is not installed or not in PATH.'
  Write-Host 'Install Gradle, then restart PowerShell.'
  Write-Host 'Examples:'
  Write-Host '  choco install gradle -y'
  Write-Host '  scoop install gradle'
  Write-Host '  winget search gradle  # find a valid package id in your configured sources'
  exit 1
}

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  Write-Host '❌ java is not installed or not in PATH'
  exit 1
}

$javaVersionLine = (& java -version 2>&1 | Select-Object -First 1)
$javaMajor = $null
if ($javaVersionLine -match '"(\d+)') {
  $javaMajor = [int]$Matches[1]
}

if ($javaMajor -and $javaMajor -gt 21) {
  Write-Host "❌ Detected Java $javaMajor. This project builds reliably with Java 17 or 21."
  Write-Host '   Set JAVA_HOME to a JDK 17/21 installation, then try again.'
  exit 1
}

function Test-HasCompleteSigningEnv {
  return -not [string]::IsNullOrWhiteSpace($env:ANDROID_STORE_FILE) `
    -and -not [string]::IsNullOrWhiteSpace($env:ANDROID_STORE_PASSWORD) `
    -and -not [string]::IsNullOrWhiteSpace($env:ANDROID_KEY_ALIAS) `
    -and -not [string]::IsNullOrWhiteSpace($env:ANDROID_KEY_PASSWORD)
}

function Import-SigningFromPropertiesFile {
  $propsPath = Join-Path $rootDir 'keystore.properties'
  if (-not (Test-Path $propsPath)) {
    return
  }

  $props = @{}
  Get-Content $propsPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) {
      return
    }

    $pair = $line -split '=', 2
    if ($pair.Length -eq 2) {
      $props[$pair[0].Trim()] = $pair[1].Trim()
    }
  }

  if ([string]::IsNullOrWhiteSpace($env:ANDROID_STORE_FILE) -and $props.ContainsKey('storeFile')) {
    $env:ANDROID_STORE_FILE = $props['storeFile']
  }
  if ([string]::IsNullOrWhiteSpace($env:ANDROID_STORE_PASSWORD) -and $props.ContainsKey('storePassword')) {
    $env:ANDROID_STORE_PASSWORD = $props['storePassword']
  }
  if ([string]::IsNullOrWhiteSpace($env:ANDROID_KEY_ALIAS) -and $props.ContainsKey('keyAlias')) {
    $env:ANDROID_KEY_ALIAS = $props['keyAlias']
  }
  if ([string]::IsNullOrWhiteSpace($env:ANDROID_KEY_PASSWORD) -and $props.ContainsKey('keyPassword')) {
    $env:ANDROID_KEY_PASSWORD = $props['keyPassword']
  }
}

if (-not (Test-HasCompleteSigningEnv)) {
  Import-SigningFromPropertiesFile
}

if (-not (Test-HasCompleteSigningEnv)) {
  Write-Host '❌ Missing Android signing credentials.'
  Write-Host 'Provide signing credentials with either:'
  Write-Host ''
  Write-Host '1) keystore.properties in repo root:'
  Write-Host '   storeFile=C:\Users\<you>\buysel-upload-key.jks'
  Write-Host '   storePassword=your_store_password'
  Write-Host '   keyAlias=upload'
  Write-Host '   keyPassword=your_key_password'
  Write-Host ''
  Write-Host 'OR'
  Write-Host ''
  Write-Host '2) Environment variables in PowerShell:'
  Write-Host '   $env:ANDROID_STORE_FILE="C:\Users\<you>\buysel-upload-key.jks"'
  Write-Host '   $env:ANDROID_STORE_PASSWORD="your_store_password"'
  Write-Host '   $env:ANDROID_KEY_ALIAS="upload"'
  Write-Host '   $env:ANDROID_KEY_PASSWORD="your_key_password"'
  exit 1
}

Write-Host '▶ Building signed AAB (app bundle)'
& $gradleCmd ':app:bundleRelease'

$aabPath = Join-Path $rootDir 'app/build/outputs/bundle/release/app-release.aab'
if (Test-Path $aabPath) {
  Write-Host "✅ AAB generated: $aabPath"
} else {
  Write-Host "❌ Build finished but $aabPath was not found"
  exit 1
}
