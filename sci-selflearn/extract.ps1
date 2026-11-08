param([string]$ListFile, [string]$OutFile)
$ErrorActionPreference = 'Stop'
$list = [System.IO.File]::ReadAllLines($ListFile, [System.Text.Encoding]::UTF8) | Where-Object { $_.Trim() -ne '' }
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$sb = New-Object System.Text.StringBuilder
foreach ($p in $list) {
  $p = $p.Trim()
  if (-not (Test-Path -LiteralPath $p)) { [void]$sb.AppendLine("@@FILE`t$p`tMISSING"); continue }
  $name = [System.IO.Path]::GetFileNameWithoutExtension($p)
  try {
    $doc = $word.Documents.Open($p, $false, $true, $false)
    [void]$sb.AppendLine("@@FILE`t$name")
    $txt = $doc.Content.Text
    $txt = $txt -replace "`r", "`n"
    $txt = $txt -replace "[\x07\x0b\x0c\x01\x02]", ""
    [void]$sb.AppendLine($txt)
    $codes = New-Object System.Collections.ArrayList
    foreach ($fd in $doc.Fields) {
      $c = $fd.Code.Text -replace '[\r\n\a\u0007\u000b\f]', ' '
      [void]$codes.Add($c.Trim())
    }
    [void]$sb.AppendLine("@@CODES`t" + ($codes -join ' ||| '))
    $doc.Close($false)
  } catch {
    [void]$sb.AppendLine("@@FILE`t$name`tERROR: $($_.Exception.Message)")
  }
}
$word.Quit()
[System.IO.File]::WriteAllText($OutFile, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "DONE"
