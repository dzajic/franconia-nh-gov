\
$ErrorActionPreference = "Stop"

$dest = "src/assets/docs/energy-commission"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$pdfs = @(
  @{ name="energy-commission-01_21_2025_minutes.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/energy-commission-01_21_2025_minutes.pdf" },
  @{ name="energy-commission-02_18_2025_minutes.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/energy-commission-02_18_2025_minutes.pdf" },
  @{ name="energy-commission-05_27_2025_minutes.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/energy-commission-05_27_2025_minutes.pdf" },
  @{ name="energy-commission-minutes-june-2025.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/energy-commission-minutes-june-2025.pdf" },
  @{ name="energy_commission_minutes-july_2025.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/energy_commission_minutes-july_2025.pdf" },
  @{ name="energy_commission_minutes_2025-09-16.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/energy_commission_minutes_2025-09-16.pdf" },
  @{ name="fec_minutes_-_4_23_2024.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/fec_minutes_-_4_23_2024.pdf" },
  @{ name="energycommissionminutes-2024-may.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/energycommissionminutes-2024-may.pdf" },
  @{ name="08_20_2024_minutes.pdf"; url="https://www.franconianh.org/uploads/1/1/6/8/11680191/08_20_2024_minutes.pdf" }
)

Write-Host "Downloading PDFs..."
foreach ($p in $pdfs) {
  $outPath = Join-Path $dest $p.name
  Write-Host (" - " + $p.name)
  Invoke-WebRequest -Uri $p.url -OutFile $outPath
}

$page = "src/boards/energy-commission/index.md"
$content = Get-Content $page -Raw
foreach ($p in $pdfs) {
  $local = "/assets/docs/energy-commission/" + $p.name
  $content = $content.Replace($p.url, $local)
}
Set-Content -Path $page -Value $content -NoNewline
Write-Host "Done. Links rewritten to local paths."
