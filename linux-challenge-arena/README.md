# StackForge Linux Challenge Arena

A browser-based Linux practice arena designed for the StackForge / Platform Technologies website.

## What this project includes

- Real Linux guest booted in the browser with v86/WebAssembly (not the Render host shell)
- xterm-style interactive terminal
- 200 tasks: 50 Basic, 50 Intermediate, 50 Advanced, 50 Pro
- CTF-style flags and scoring
- 60-minute practice arena timer
- Hints with a points penalty
- Per-task reset/setup and automatic validation
- Script editor that saves directly into `/root/lab`
- File explorer
- Local progress storage and JSON export
- Responsive layout
- External networking intentionally not configured

## Folder structure

```text
linux-challenge-arena/
├── index.html
├── css/
│   └── linux-arena.css
├── js/
│   ├── linux-vm.js
│   └── arena.js
├── data/
│   └── challenges.json
├── generate_challenges.py
└── integration-snippet.html
```

## Run locally

Do not double-click `index.html`; serve it through HTTP.

Python:

```bash
cd linux-challenge-arena
python -m http.server 8080
```

Then open `http://localhost:8080`.

VS Code Live Server also works.

## Add it to your existing Platform Technologies site

1. Copy the entire `linux-challenge-arena` folder into the root of your existing website repository.
2. Commit and deploy normally to Render.
3. Your lab URL will be:

```text
https://platform-technologies.onrender.com/linux-challenge-arena/
```

4. Add a link/button on your existing `index.html` using `integration-snippet.html`.

## Production note

The v86 runtime, BIOS files, and Buildroot Linux kernel are stored in `assets/v86`, so VM boot does not depend on a third-party kernel host. The xterm UI is still loaded from jsDelivr.

## Safety boundary

The Linux guest runs client-side in the browser and the project does not configure an external network backend. Challenges are local/simulated. Do not replace this with a web endpoint that passes arbitrary user commands to your Render server shell.

## Branding note

Call this a “Hack4Gov-inspired practice arena,” not an official DICT Hack4Gov platform, unless you have authorization to use official event branding.
