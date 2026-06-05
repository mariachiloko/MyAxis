# Backend Sync

## What this is

Save workspace data to the backend so it follows the user across browsers and devices.

## What syncs

- Workspace settings
- Workspace state
- Calendar connections
- Home calendar cache
- Hidden calendar items
- Capture notes and assistant history
- Motivation quotes stay cached locally for the day so the AI is not called over and over
- Spotify settings stay local for the browser player session; tokens should not be stored in the public repo

## When it runs

- When the user saves settings
- When workspace state changes
- When the app loads from the signed-in account

## What to watch for

- Sync should not run while importing backups.
- Sync should not run while loading backend data.
- Private tokens must stay out of the public repo.
- Spotify access tokens and refresh tokens should stay local or in a future account-backed secret store.
