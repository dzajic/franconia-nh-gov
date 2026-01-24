#!/usr/bin/env bash
set -euo pipefail

DEST="src/assets/docs/energy-commission"
mkdir -p "$DEST"

PDFS=(
  "energy-commission-01_21_2025_minutes.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/energy-commission-01_21_2025_minutes.pdf"
  "energy-commission-02_18_2025_minutes.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/energy-commission-02_18_2025_minutes.pdf"
  "energy-commission-05_27_2025_minutes.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/energy-commission-05_27_2025_minutes.pdf"
  "energy-commission-minutes-june-2025.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/energy-commission-minutes-june-2025.pdf"
  "energy_commission_minutes-july_2025.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/energy_commission_minutes-july_2025.pdf"
  "energy_commission_minutes_2025-09-16.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/energy_commission_minutes_2025-09-16.pdf"
  "fec_minutes_-_4_23_2024.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/fec_minutes_-_4_23_2024.pdf"
  "energycommissionminutes-2024-may.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/energycommissionminutes-2024-may.pdf"
  "08_20_2024_minutes.pdf|https://www.franconianh.org/uploads/1/1/6/8/11680191/08_20_2024_minutes.pdf"
)

echo "Downloading Energy Commission PDFs to $DEST"
for entry in "${PDFS[@]}"; do
  fname="${entry%%|*}"
  url="${entry#*|}"
  echo " - $fname"
  curl -L --fail --silent --show-error "$url" -o "$DEST/$fname"
done

PAGE="src/boards/energy-commission/index.md"
echo "Rewriting links in $PAGE to local /assets/docs/energy-commission/..."
for entry in "${PDFS[@]}"; do
  fname="${entry%%|*}"
  url="${entry#*|}"
  url_esc=$(printf '%s
' "$url" | sed 's/[\/&]/\\&/g')
  local_esc=$(printf '%s
' "/assets/docs/energy-commission/$fname" | sed 's/[\/&]/\\&/g')
  sed -i.bak "s/$url_esc/$local_esc/g" "$PAGE"
done
rm -f "$PAGE.bak"
echo "Done."
