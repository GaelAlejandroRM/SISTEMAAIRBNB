param([string]$Servidor='127.0.0.1',[int]$Puerto=5433,[string]$Base='nomada',[string]$Propietario='nomada_owner',[string]$RolAplicacion='nomada_app')
$ErrorActionPreference='Stop'
$taskPreviousUrl=[Environment]::GetEnvironmentVariable('DATABASE_URL','Process')
$taskPreviousRole=[Environment]::GetEnvironmentVariable('DB_APP_ROLE','Process')
$taskPassword=Read-Host "Contraseña de $Propietario (no se guardará en archivos)" -AsSecureString
$taskPointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskPassword)
try {
 $taskPlain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPointer)
 $env:DATABASE_URL='postgresql://'+[Uri]::EscapeDataString($Propietario)+':'+[Uri]::EscapeDataString($taskPlain)+'@'+$Servidor+':'+$Puerto+'/'+[Uri]::EscapeDataString($Base)
 $env:DB_APP_ROLE=$RolAplicacion
 Push-Location (Split-Path $PSScriptRoot -Parent)
 try {
  & node backend/migrate.js
  if($LASTEXITCODE -ne 0){throw 'Falló la migración; revisa el mensaje anterior.'}
  & node backend/apply-runtime-grants.js
  if($LASTEXITCODE -ne 0){throw 'Falló la actualización de permisos.'}
  Write-Host 'Actualización terminada. Reinicia el servidor; conserva abierto el proxy.'
 } finally {Pop-Location}
} finally {
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPointer)
 $taskPlain=$null
 [Environment]::SetEnvironmentVariable('DATABASE_URL',$taskPreviousUrl,'Process')
 [Environment]::SetEnvironmentVariable('DB_APP_ROLE',$taskPreviousRole,'Process')
}
