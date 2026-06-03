# MyAxis

A private-safe, Skylight-inspired dashboard for work, projects, study, and home planning.

## What this is

- Workspace switching for different contexts
- Kanban, calendar, todo, goals, and study widgets
- Widget-specific edit windows instead of one giant settings panel
- Fixed motivation note that changes on each load
- A local-only scratchpad for notes
- Public-safe sample data with private overrides kept out of Git
- Drag-and-drop kanban cards
- Drag-and-drop widget layout with resizable panels
- Local backup export and import
- A reusable config schema for custom workspaces
- A private settings drawer for workspace styling and cloud sync
- Task, calendar, and flashcard editors that persist locally
- Week and month calendar views with per-day add buttons and collapsible month cards
- Study flashcards geared toward project and interview prep
- Optional Home workspace Google Calendar sync using a Google OAuth client ID and calendar ID you provide locally
- Optional motivational-quote endpoint for AI-generated quote text, configured locally in `config.local.js`
- Optional cloud sync settings for the backend API URL, plus Cognito sign-in settings stored locally in the browser or `config.local.js`

## Privacy rules

- Do not commit personal calendars, credentials, API keys, or private notes
- Keep local overrides in `config.local.js`
- Keep personal content in ignored paths only

## Local use

Open the static site with a local web server, then edit `config.example.js` and optionally add a `config.local.js` file for your private setup.

## Repo layout

- `app.js`, `index.html`, and `styles.css` are the public dashboard shell
- `infra/` contains the AWS/Terraform scaffold for the serverless deployment path
- `scripts/build.sh` creates a simple static build output in `dist/`
- `runtime-config.js` is the public-safe runtime config hook that gets populated during build
- `scripts/package-api.sh` installs the Lambda dependencies before a Terraform apply
- `.github/workflows/` contains CI and deployment workflows

## Customization

- `config.example.js` is the public-safe starter config
- `config.local.js` is the private override file and is ignored by Git
- `config.schema.json` documents the expected shape of each workspace
- Imported JSON backups store local dashboard state in your browser
- Local UI overrides are stored in browser storage, not GitHub
- Kanban columns are meant to read like `To-do`, `In progress`, and `Done`
- If you set `aiEndpoint`, the dashboard will POST workspace context to that endpoint and use the returned `quote` field for motivation text or `text`/`message` for assistant replies when available
- If you set `apiBaseUrl`, the dashboard can sync workspace settings and Home calendar connections to the AWS backend
- If you set the Cognito fields, the dashboard can sign in against your AWS user pool and use that session for backend requests
- Home calendar sync settings live locally and are not part of the public repo

## Privacy rules for backups

- Backups may contain private scratchpad text and workspace state
- Keep backup files local
- Do not commit imported backups or private config files

## Current state

The current version is focused on a clean, modular dashboard shell with local-first state management, plus optional Home workspace Google Calendar sync. The repo now includes the first Terraform/AWS scaffold, backend API, and Cognito sign-in path so the project can evolve into a serverless deployment in phases.

## Deployment phase

- Terraform provisions the static site, auth, data tables, API, and deploy role
- GitHub Actions builds the app, syncs `dist/` to S3, and invalidates CloudFront
- GitHub Actions assumes an AWS role through OIDC instead of storing AWS keys in the repo
- Set these GitHub repository variables before enabling the deploy workflow:
  - `AWS_REGION`
  - `AWS_ROLE_ARN`
  - `SITE_BUCKET`
  - `CLOUDFRONT_DISTRIBUTION_ID`
  - `MYAXIS_API_BASE_URL`
  - `MYAXIS_COGNITO_REGION`
  - `MYAXIS_COGNITO_USER_POOL_ID`
  - `MYAXIS_COGNITO_CLIENT_ID`
  - `MYAXIS_COGNITO_HOSTED_UI_DOMAIN`
  - `MYAXIS_COGNITO_REDIRECT_URI`
  - `MYAXIS_COGNITO_LOGOUT_URI`
- Terraform outputs the bucket name, CloudFront domain, API endpoint, Cognito IDs, and deploy role ARN
- Run `./scripts/package-api.sh` before `terraform apply` so the Lambda zip includes its Node dependencies
- Run `./scripts/build.sh` with those `MYAXIS_*` variables set to generate `dist/runtime-config.js` for the deployed site

## Backend API

- `GET /health` for a public health check
- `GET /v1/me` for the signed-in user plus stored workspace state
- `GET`, `PUT`, and `DELETE /v1/workspaces/{workspaceId}/settings`
- `GET`, `PUT`, and `DELETE /v1/workspaces/{workspaceId}/calendar-connection`
- The API expects a Cognito JWT on authenticated routes
- The Settings drawer includes private `Cloud sync` and `Cognito sign-in` sections for backend access
- The Cognito section expects your region, user pool ID, client ID, hosted UI domain, and redirect/logout URIs
