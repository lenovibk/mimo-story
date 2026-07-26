# Extracts full-bleed icon art from design/icon.png (a rounded-square mockup on a
# gray backdrop with a drop shadow) by cropping to the tile's outer bounding box and
# squaring off its baked-in rounded corners, so the result can feed the same
# per-platform mask pipeline gen-icons.ps1 already uses for the procedural mark.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $root "..\design\icon.png"
$outPath = Join-Path $root "src\assets\images\icon-art.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $src.Width
$h = $src.Height

function Is-Content($c) {
  $maxc = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
  $minc = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
  $sat = $maxc - $minc
  # Bright-white (border) or saturated (rainbow/blue/yellow) counts as tile content;
  # the gray backdrop and its soft drop shadow are both low-saturation and never this bright.
  return ($c.R -gt 251 -and $c.G -gt 251 -and $c.B -gt 251) -or ($sat -gt 20)
}

# --- 1) Find the tile's outer bbox via center cross-section scans ---
$midY = [int]($h / 2)
$midX = [int]($w / 2)

$xMin = 0
for ($x = 0; $x -lt $w; $x++) { if (Is-Content $src.GetPixel($x, $midY)) { $xMin = $x; break } }
$xMax = $w - 1
for ($x = $w - 1; $x -ge 0; $x--) { if (Is-Content $src.GetPixel($x, $midY)) { $xMax = $x; break } }
$yMin = 0
for ($y = 0; $y -lt $h; $y++) { if (Is-Content $src.GetPixel($midX, $y)) { $yMin = $y; break } }
$yMax = $h - 1
for ($y = $h - 1; $y -ge 0; $y--) { if (Is-Content $src.GetPixel($midX, $y)) { $yMax = $y; break } }

Write-Host "bbox: x[$xMin,$xMax] y[$yMin,$yMax]"

$size = [Math]::Min($xMax - $xMin + 1, $yMax - $yMin + 1)
$cropRect = New-Object System.Drawing.Rectangle($xMin, $yMin, $size, $size)

$tile = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($tile)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$src.Dispose()

# --- 2) Square off the 4 rounded corners: for the top/bottom corner bands, clamp each
#        row's leading/trailing gray-corner pixels to the first real content color found. ---
$band = [int]($size * 0.24)
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

function Fix-Row($bmp, $y, $w) {
  $left = -1
  for ($x = 0; $x -lt $w; $x++) {
    if (Is-Content $bmp.GetPixel($x, $y)) { $left = $x; break }
  }
  if ($left -gt 0) {
    $c = $bmp.GetPixel($left, $y)
    for ($x = 0; $x -lt $left; $x++) { $bmp.SetPixel($x, $y, $c) }
  }
  $right = -1
  for ($x = $w - 1; $x -ge 0; $x--) {
    if (Is-Content $bmp.GetPixel($x, $y)) { $right = $x; break }
  }
  if ($right -ge 0 -and $right -lt $w - 1) {
    $c = $bmp.GetPixel($right, $y)
    for ($x = $right + 1; $x -lt $w; $x++) { $bmp.SetPixel($x, $y, $c) }
  }
}

for ($y = 0; $y -lt $band; $y++) { Fix-Row $tile $y $size }
for ($y = $size - $band; $y -lt $size; $y++) { Fix-Row $tile $y $size }

$dir = Split-Path -Parent $outPath
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$tile.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$tile.Dispose()
Write-Host "wrote $outPath ($size x $size)"
