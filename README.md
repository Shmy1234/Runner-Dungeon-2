# Maze Knight

HTML5 canvas maze runner with keyboard and mouse controls.

## Structure
- `web/index.html`: page entry
- `web/style.css`: layout and canvas styling
- `web/game.js`: game logic
- `web/images/`: sprites and backgrounds
- `web/favicon.png`: site icon

## Local run
Serve the folder and open the local URL:
```bash
cd "/Users/shmy/Downloads/fse game"
python -m http.server 8000
```
Open `http://localhost:8000/` (redirects to `/web/`).

## Deploy to Vercel
1) Import the repo in Vercel or run `vercel` from this folder.
2) No build step is required; it deploys as a static site.
