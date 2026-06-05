# Spotify Player

## What this is

Use the Spotify widget as a small browser player inside MyAxis.

## What you need

1. A Spotify developer app.
2. A Spotify Premium account for playback.
3. A client ID from the Spotify dashboard.
4. A redirect URI that matches the local app or deployed site.
5. For local testing, use `http://127.0.0.1:PORT/` instead of `localhost`.

## How to set it up

1. Open the Widgets drawer.
2. Pick the Spotify section.
3. Enter your client ID.
4. Enter your redirect URI.
5. Save the settings.
6. Click Login to Spotify.
7. Come back to MyAxis after Spotify redirects you back.
8. Click Connect player if the player does not connect on its own.
9. Use the search box in the player to find songs and play them directly.

## What to expect

- The widget should show track info, controls, and player status.
- The browser player uses Spotify login, not a pasted link.
- The Spotify sign-in and player are shared across all workspaces in the browser.
- The widget can be hidden or shown like the other widgets.
- The widget stays open and shows the same player everywhere when it is visible.
- The logged-out Spotify button now says `Login to Spotify`.
- Save is a plain click action, not a hidden submit. If it feels stuck, refresh and try again with the exact loopback redirect URI.
- After sign-in, the widget shows playback controls and song search.
- Playing a search result clears the search box back down so the widget returns to normal size.
- MyAxis builds a local play queue from Spotify recommendations, and if Spotify comes back empty it falls back to other tracks by the current artist or the song title.
- Repeat is forced off so the same song does not loop on its own.
- Next and previous move through songs in that queue.
- Access tokens stay local for the demo build and should not be committed.

## What to watch for

- The player will not work without Spotify Premium.
- The redirect URI must match exactly.
- If the player does not connect, sign out and sign in again.
