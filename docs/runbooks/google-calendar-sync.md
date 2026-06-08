# Google Calendar Sync

## What this is

Link the Home workspace to Google Calendar.

## What it does

- Reads events from Google Calendar
- Shows them inside the Home workspace calendar
- Can read from more than one calendar ID at a time
- Turns items without a time into to-dos for that day

## What you need

- A Google OAuth client ID
- Google Calendar API enabled
- Calendar IDs you want to follow, separated by commas or new lines
- A local browser session or a future AWS login flow

## Cloud builds

- In the AWS build, the Google client ID is supplied by the deployment.
- Normal users only click `Link calendar` inside the calendar widget.
- The manual client ID and calendar ID fields stay available for localhost testing and admin setup.

## What to keep private

- Client secrets
- Refresh tokens
- Personal calendar data
