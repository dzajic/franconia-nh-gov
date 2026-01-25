Franconia NH Website Demo (Eleventy + Bootstrap 5.3) — Option B

Goal
- Preserve current "Weebly look"
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

Deploy (free)
- Push to GitHub (main)
- Settings → Pages → Source: Deploy from a branch → gh-pages /(root)

## Live site
👉 https://dzajic.github.io/franconia-nh-gov/
