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
VITE_GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/XXXX/exec
VITE_SHEETS_SHARED_SECRET=some-long-random-string
```

## Deploy (Vercel)
- The repository includes `vercel.json` for SPA routing.
- Framework: Vite
- Build command: `npm run build`
- Output: `dist`

For Google Calendar API, restrict your API key to your domain (HTTP referrers) in Google Cloud Console.

## Google Sheets registration endpoint (Apps Script)
1. Create a Google Sheet with columns:
   - Car Make & Model, Driver Name, Car Number Plate, Event Name, Timestamp
2. Extensions → Apps Script. Paste:
```
function doPost(e) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Sheet1');
  const data = JSON.parse(e.postData.contents);
  const row = [
    data.carMakeModel,
    data.driverName,
    data.carNumberPlate,
    data.eventName,
    new Date(),
  ];
  sheet.appendRow(row);
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}
```
3. Deploy → New deployment → type “Web app”
   - Execute as: Me
   - Who has access: Anyone
   - Copy the URL and set server env in Vercel (Project → Settings → Environment Variables):
     - SHEETS_WEBAPP_URL = (your web app URL)
     - SHEETS_SHARED_SECRET = same as in Script properties
   - Do NOT expose these with VITE_ in the client. The site calls `/api/register` which forwards securely.

### Add a shared secret (recommended)
- In Apps Script → Project Settings → Script properties, add:
  - SHEETS_SHARED_SECRET = the same value as `VITE_SHEETS_SHARED_SECRET`
- Update your Apps Script `doPost`:
```
function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  const secret = PropertiesService.getScriptProperties().getProperty('SHEETS_SHARED_SECRET');
  if (body.token !== secret) {
    return ContentService.createTextOutput('Forbidden').setMimeType(ContentService.MimeType.TEXT).setResponseCode(403);
  }
  // ... append-only logic shown above ...
}
```

### How it flows
- Client → POST /api/register with { eventName, driverName, carNumberPlate, carMakeModel }
- Vercel Function (api/register.js) adds the secret from server env and forwards to the Apps Script Web App
- Apps Script validates the secret and appends to the correct sheet
