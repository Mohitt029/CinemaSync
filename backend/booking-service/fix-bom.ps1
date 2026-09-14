# fix-bom.ps1 - Remove BOM from all Java files
$rootPath = "D:\CinemaSync\backend\booking-service\src\main\java"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$fixedCount = 0
$totalCount = 0

Write-Host "Scanning for Java files with BOM..." -ForegroundColor Cyan

Get-ChildItem -Path $rootPath -Filter "*.java" -Recurse | ForEach-Object {
    $totalCount++
    $filePath = $_.FullName
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    
    # Check for BOM (EF BB BF)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "Fixing: $filePath" -ForegroundColor Yellow
        
        # Read content without BOM
        $content = [System.IO.File]::ReadAllText($filePath)
        
        # Remove BOM character if present
        $content = $content -replace '^\xEF\xBB\xBF', ''
        $content = $content -replace '^\uFEFF', ''
        
        # Write back without BOM
        [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
        $fixedCount++
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Total Java files scanned: $totalCount" -ForegroundColor White
Write-Host "Files fixed: $fixedCount" -ForegroundColor Green
Write-Host "Files already clean: $($totalCount - $fixedCount)" -ForegroundColor Gray
