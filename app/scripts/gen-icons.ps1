# Regenerates all app icon assets (favicon / PWA icons / Android / iOS launcher icons)
# from the MimoKids brand art extracted from design/icon.png by extract-icon-art.ps1.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$artPath = Join-Path $root "src/assets/images/icon-art.png"
$art = [System.Drawing.Bitmap]::FromFile($artPath)

function Fill-RoundedRect($g, $rect, $radius, $brush) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
  $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
  $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.FillPath($brush, $path)
  return $path
}

# $mode: "rounded" (rounded-square, pre-clipped), "bleed" (full-bleed square, OS clips it),
#        "round-crop" (full-bleed then circular clip), "transparent" (inset, for adaptive-icon foreground)
function New-Icon($size, $mode) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $bmp.SetResolution(96, 96)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)

  if ($mode -eq "rounded") {
    $radius = [int]($size * 0.176)
    $clipPath = Fill-RoundedRect $g $rect $radius ([System.Drawing.Brushes]::White)
    $g.SetClip($clipPath)
    $g.DrawImage($art, $rect)
    $g.ResetClip()
    $clipPath.Dispose()
  }
  elseif ($mode -eq "bleed") {
    $g.DrawImage($art, $rect)
  }
  elseif ($mode -eq "round-crop") {
    $g.DrawImage($art, $rect)
    $mask = New-Object System.Drawing.Bitmap($size, $size)
    $mg = [System.Drawing.Graphics]::FromImage($mask)
    $mg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $mg.Clear([System.Drawing.Color]::Transparent)
    $mg.FillEllipse([System.Drawing.Brushes]::White, $rect)
    $mg.Dispose()
    for ($y = 0; $y -lt $size; $y++) {
      for ($x = 0; $x -lt $size; $x++) {
        if ($mask.GetPixel($x, $y).A -eq 0) { $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent) }
      }
    }
    $mask.Dispose()
  }
  else {
    # transparent: inset content on a transparent canvas so Android's adaptive-icon
    # shape masks (circle/squircle/teardrop) don't clip the logo's corners/edges.
    $inset = [int]($size * 0.18)
    $innerSize = $size - 2 * $inset
    $innerRect = New-Object System.Drawing.Rectangle($inset, $inset, $innerSize, $innerSize)
    $g.DrawImage($art, $innerRect)
  }

  $g.Dispose()
  return $bmp
}

function Save-Png($bmp, $path) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "wrote $path"
}

# ---- PWA icons ----
$pwaDir = Join-Path $root "public/icons"
$b = New-Icon 512 "rounded"; Save-Png $b (Join-Path $pwaDir "icon-512.png"); $b.Dispose()
$b = New-Icon 192 "rounded"; Save-Png $b (Join-Path $pwaDir "icon-192.png"); $b.Dispose()
$b = New-Icon 512 "bleed"; Save-Png $b (Join-Path $pwaDir "icon-maskable-512.png"); $b.Dispose()
$b = New-Icon 180 "bleed"; Save-Png $b (Join-Path $pwaDir "apple-touch-icon.png"); $b.Dispose()

# ---- Android legacy + adaptive icons ----
$androidRes = Join-Path $root "android/app/src/main/res"
$densities = @{ mdpi = 48; hdpi = 72; xhdpi = 96; xxhdpi = 144; xxxhdpi = 192 }
$fgDensities = @{ mdpi = 108; hdpi = 162; xhdpi = 216; xxhdpi = 324; xxxhdpi = 432 }
foreach ($d in $densities.Keys) {
  $size = $densities[$d]
  $b = New-Icon $size "bleed"; Save-Png $b (Join-Path $androidRes "mipmap-$d/ic_launcher.png"); $b.Dispose()
  $b = New-Icon $size "round-crop"; Save-Png $b (Join-Path $androidRes "mipmap-$d/ic_launcher_round.png"); $b.Dispose()
}
foreach ($d in $fgDensities.Keys) {
  $size = $fgDensities[$d]
  $b = New-Icon $size "transparent"; Save-Png $b (Join-Path $androidRes "mipmap-$d/ic_launcher_foreground.png"); $b.Dispose()
}

# ---- iOS icon ----
$iosPath = Join-Path $root "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
$b = New-Icon 1024 "bleed"; Save-Png $b $iosPath; $b.Dispose()

$art.Dispose()
Write-Host "Done."
