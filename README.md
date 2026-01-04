# Runner (Web)

Lightweight HTML5 canvas build of the runner game. Everything is contained inside `web/` with no standalone JavaScript files, so zipped copies avoid Gmail’s blocked-file rules.

## Structure
- `web/index.html`: page with inlined game script and styles
- `web/images/`: all sprite and background assets
- `web/favicon.png`: site icon

## Local run
Open `web/index.html` directly in a browser, or serve the folder:
```bash
cd "/Users/shmy/Downloads/fse game"
python -m http.server 8000
# then visit http://localhost:8000/web/
```

## Sharing
Zip the `web/` folder (or the whole project) and attach it. There are no `.js`, executables, or other file types that Gmail blocks by default.
