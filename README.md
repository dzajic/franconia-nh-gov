Franconia NH Website Demo (Eleventy + Bootstrap 5.3) — Option B

Goal
- Preserve current “Weebly look” (green left nav + beige background)
- Make the site responsive and easy to maintain
- Avoid template syntax in Markdown: editors edit plain pages

Local preview
- Install Node.js 20+
- npm install
- npm run dev
- open http://localhost:8080

Editing
- Each nav item is a Markdown page in src/<slug>/index.md
- Boards have subpages under src/boards/<board>/index.md

Energy Commission PDF migration helper
- macOS/Linux: scripts/fetch_energy_commission_pdfs.sh
- Windows PowerShell: scripts/fetch_energy_commission_pdfs.ps1

Deploy (free)
- Push to GitHub (main)
- Settings → Pages → Source: Deploy from a branch → gh-pages /(root)
