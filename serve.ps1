param([int]$Port = 8765)
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"
$mimeMap = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.png'  = 'image/png'
  '.webp' = 'image/webp'
  '.svg'  = 'image/svg+xml'
  '.mp4'  = 'video/mp4'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.json' = 'application/json'
  '.ico'  = 'image/x-icon'
}
while ($listener.IsListening) {
  $ctx  = $listener.GetContext()
  $req  = $ctx.Request
  $resp = $ctx.Response
  try {
    # Strip query string, decode URL
    $localPath = $req.Url.LocalPath
    if ($localPath -eq '/') { $localPath = '/index.html' }
    $rel  = $localPath.TrimStart('/') -replace '/', [System.IO.Path]::DirectorySeparatorChar
    $full = Join-Path $root $rel

    if (Test-Path $full -PathType Leaf) {
      $ext   = [System.IO.Path]::GetExtension($full).ToLower()
      $mime  = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $resp.StatusCode      = 200
      $resp.ContentType     = $mime
      $resp.ContentLength64 = $bytes.LongLength
      $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $resp.StatusCode      = 404
      $resp.ContentLength64 = 0
    }
  } catch {
    # ignore per-request errors; keep serving
  } finally {
    try { $resp.OutputStream.Close() } catch {}
  }
}
