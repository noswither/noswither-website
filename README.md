# NOSWITHER

Vite + React site for NOSWITHER.

## Dev
```bash
npm i
npm run dev
```

## Env
Create a `.env` in the project root with (optional if using ICS only):
```
VITE_GOOGLE_API_KEY=your_api_key
VITE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
VITE_CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/XXXX/public/basic.ics
```

## Deploy (Vercel)
- The repository includes `vercel.json` for SPA routing.
- Framework: Vite
- Build command: `npm run build`
- Output: `dist`

For Google Calendar API, restrict your API key to your domain (HTTP referrers) in Google Cloud Console.
