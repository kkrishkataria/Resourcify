# build-lambda.ps1
# Builds Lambda deployment zip with node_modules bundled inside

$root     = "c:\Users\krish\OneDrive\Desktop\Resourcify"
$dist     = "$root\lambda-dist"
$zipPath  = "$root\terraform\backend_bundle.zip"

Write-Host "[1/5] Cleaning old build..."
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory -Path $dist | Out-Null

Write-Host "[2/5] Copying backend source files..."
Copy-Item "$root\backend\src"          -Destination "$dist\src"          -Recurse
Copy-Item "$root\backend\package.json" -Destination "$dist\package.json"
if (Test-Path "$root\backend\package-lock.json") {
    Copy-Item "$root\backend\package-lock.json" -Destination "$dist\package-lock.json"
}

Write-Host "[3/5] Installing production node_modules (may take 1-2 minutes)..."
Set-Location $dist
cmd.exe /c "npm install --omit=dev --no-workspaces --ignore-scripts"

if (-not (Test-Path "$dist\node_modules\express")) {
    Write-Host "ERROR: express was not found in node_modules! Install failed."
    Set-Location $root
    exit 1
}

Write-Host "[4/5] Zipping to backend_bundle.zip..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($dist, $zipPath)

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "[SUCCESS] Zip created at $zipPath ($sizeMB MB)"

Write-Host "[5/5] Cleaning up temp files..."
Set-Location $root
Remove-Item $dist -Recurse -Force

Write-Host "Done! Now deploy with:"
Write-Host "  cd terraform"
Write-Host "  terraform apply -auto-approve"
