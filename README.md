# Projects Knowledge frontend

Standalone Angular 19 UI for exploring local projects. This repository contains only the frontend; the Spring Boot backend is maintained separately as `projects-knowledge-backend`.

## Features

- English and Arabic, RTL layout, and light/dark themes.
- Dynamic project selection; no project is selected automatically.
- Basic summaries, Advanced technical answers, and Workflow diagrams.
- Diagram zoom, expanded view, and complete PNG/SVG downloads.
- Source evidence, section-by-section copying, and integration details.
- The last five unique questions per project, stored in this browser. Selecting one restores a draft and its answer format without sending a request.

## Requirements

- Node.js compatible with Angular 19.2: `^18.19.1`, `^20.11.1`, or `>=22.0.0`.
- npm. Commit `package-lock.json` with dependency changes.
- The backend running locally on port `8090` for project discovery and answers.
- Chrome or Chromium for headless tests.

## Run

Run these commands from this repository's root, wherever it is cloned:

```powershell
npm ci
npm start
```

Open `http://localhost:4300`. The development server forwards `/api` to `http://localhost:8090` using `proxy.conf.json`. The frontend never connects directly to Codex and does not contain credentials or local repository paths.

To use another backend address, edit the proxy target or create an ignored `proxy.local.conf.json` and run:

```powershell
npm start -- --proxy-config proxy.local.conf.json
```

## Verify and build

```powershell
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

The browser bundle is written to `dist/frontend/browser`. The development proxy is not included in this bundle: a server hosting the built files must also route `/api` to the backend. Neither project has to be checked out next to the other.

## GitHub

Publish this folder as its own repository, not the enclosing workspace. Keep `src`, `public`, configuration, and the npm lockfile; do not commit dependencies, build output, editor settings, or credentials. `.gitignore` excludes those local files.

Keep the backend and any reverse proxy private/local. This UI is an internal tool, not an authenticated public application.
