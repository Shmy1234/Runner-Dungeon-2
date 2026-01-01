# Runner (Web)

HTML5 canvas port of the Swing game. Uses the original assets in `images/` and runs entirely as static files.

## Local run
```bash
cd "/Users/shmy/Downloads/fse game"
python -m http.server 8000
```
Then open `http://localhost:8000/web/`. The canvas scales to your browser while keeping an 800x800 game space.

## Deploy to Vercel
`vercel.json` is configured to serve the `web/` folder as static files.

1. Install CLI (once): `npm i -g vercel`
2. Log in: `vercel login`
3. From repo root, deploy:
   - First time: `vercel` (select “Other” for framework)
   - Production: `vercel --prod`

Vercel will return the preview/prod URLs where the game is served from `web/index.html`.
