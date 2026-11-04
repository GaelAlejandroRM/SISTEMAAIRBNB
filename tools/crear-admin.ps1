$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
$previousName = $env:ADMIN_NAME
$previousEmail = $env:ADMIN_EMAIL
$previousPassword = $env:ADMIN_PASSWORD
$secret = $null
$pointer = [IntPtr]::Zero
try {
    $env:ADMIN_NAME = Read-Host 'Nombre del administrador'
    $env:ADMIN_EMAIL = Read-Host 'Correo del administrador'
    $secret = Read-Host 'Contraseña de 12 a 128 caracteres' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    npm.cmd run admin
    if ($LASTEXITCODE -ne 0) { throw 'No se creó la cuenta. Revisa el mensaje anterior.' }
} finally {
    $env:ADMIN_NAME = $previousName
    $env:ADMIN_EMAIL = $previousEmail
    $env:ADMIN_PASSWORD = $previousPassword
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($secret) { $secret.Dispose() }
    Pop-Location
}
