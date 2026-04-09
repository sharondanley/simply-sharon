Set-Location 'C:\Users\danie\Desktop\temp\sql-crud-connection'

Write-Output '--- SOURCE: AdminPanel comment labels ---'
Select-String -Path 'AdminPanel.tsx' -Pattern 'Top-level comment','Reply to #','Reply to ' | ForEach-Object {
  Write-Output ($_.LineNumber.ToString() + ': ' + $_.Line.Trim())
}

Write-Output '--- SOURCE: Thumbnail preview and YouTube handling ---'
Select-String -Path 'AdminPanel.tsx' -Pattern 'thumbnailPreview','iframe','youtube.com','youtu.be','embed','paste image URL' | ForEach-Object {
  Write-Output ($_.LineNumber.ToString() + ': ' + $_.Line.Trim())
}

Write-Output '--- BUNDLE: admin.bundle.js label strings ---'
if (Test-Path 'public\admin.bundle.js') {
  Select-String -Path 'public\admin.bundle.js' -Pattern 'Top-level comment','Reply to #' | ForEach-Object {
    Write-Output ($_.LineNumber.ToString() + ': ' + $_.Line.Trim())
  }
} else {
  Write-Output 'admin.bundle.js not found'
}
