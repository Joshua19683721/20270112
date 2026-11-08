param(
  [string]$ManifestFile = "manifest3.json",
  [string]$OutFile = "raw3.json"
)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$cfgText = [System.IO.File]::ReadAllText((Join-Path $here $ManifestFile), [System.Text.Encoding]::UTF8)
$cfg = $cfgText | ConvertFrom-Json
$srcRoot = $cfg.'__root'
$outDir = Join-Path $here "data"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
$w.AutomationSecurity = 3
$result = [ordered]@{}

foreach ($p in $cfg.PSObject.Properties) {
  if ($p.Name.StartsWith('__')) { continue }
  $key = $p.Name
  $f = Join-Path $srcRoot ($p.Value -replace '/', '\')
  if (-not (Test-Path $f)) { Write-Host ("MISS " + $key); continue }
  try {
    $d = $w.Documents.Open($f, $false, $true, $false)
    $txt = $d.Content.Text
    $codes = New-Object System.Collections.ArrayList
    foreach ($fd in $d.Fields) {
      $code = ""
      try { $code = $fd.Code.Text } catch { $code = "" }
      $code = $code -replace '[\r\n\a\u0007\u000b\f]', ' '
      [void]$codes.Add($code.Trim())
    }
    $result[$key] = [ordered]@{
      file = $p.Value
      text = $txt
      codes = @($codes)
    }
    Write-Host ($key + " chars=" + $txt.Length + " fields=" + $codes.Count)
    $d.Close(0)
  } catch {
    Write-Host ("ERR " + $key + " : " + $_.Exception.Message)
  }
}
$w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w) | Out-Null

$json = $result | ConvertTo-Json -Depth 6 -Compress
[System.IO.File]::WriteAllText((Join-Path $outDir $OutFile), $json, $utf8)
Write-Host ("WROTE " + $OutFile + " bytes=" + $json.Length + " keys=" + $result.Count)
