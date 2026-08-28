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

## Code organization

The source follows the Public Marts frontend conventions without copying its UI or business-specific dependencies:

```text
src/app/
  component/
    project/    project overview
    knowledge/  question input, answer sections and source viewer
  shared/
    component/general/   global HTTP loading indicator
    component/business/  reusable workflow diagram and canvas
    layout/              header and sidebar
    service/             language, theme, history and loading state
    service/integration/ project, question, integration and source HTTP services
    schema/request/      Req... API request types
    schema/response/     Dto... API response types
    schema/general/      local-only types
    enums/               language and answer-format types
    interceptor/         global HTTP loading
    utils/workflow/      graph layout, rendering data and export
src/assets/i18n/          en.json and ar.json
src/environments/        getEnv() and the same-origin API base
```

- Components remain Angular 19 standalone components using `inject()`, reactive forms and signals. Each component has separate `.ts`, `.html` and `.scss` files.
- Import shared and feature code with `@shared/*` and `@component/*`; assets/environment use `@assets/*` and `@environment/*`.
- Keep each HTTP service scoped to its backend area. JSON field names and the existing `/api` contract are unchanged.
- Maintain matching translation keys in both JSON files. They are bundled locally, without extra translation HTTP requests.
- Keep UI state and browser-only history separate from API response schemas. No reference-project roles, integrations, configuration or credentials belong here.
- Use `npm run format` / `npm run format:check` for the checked-in formatting conventions. Tests live beside their components/services.

The refactor preserves the interface, language defaults, themes, history, answer modes, cache controls, loading and workflow exports. It does not introduce PrimeNG, SSR, authentication or reference-project features.

## GitHub

Publish this folder as its own repository, not the enclosing workspace. Keep `src`, `public`, configuration, and the npm lockfile; do not commit dependencies, build output, editor settings, or credentials. `.gitignore` excludes those local files.

Keep the backend and any reverse proxy private/local. This UI is an internal tool, not an authenticated public application.
