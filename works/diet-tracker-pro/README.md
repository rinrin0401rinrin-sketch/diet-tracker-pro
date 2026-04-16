# Diet Tracker Pro

A dark-tone meal tracking web app designed for daily calorie, macro, water, and photo-based food logging.

## Run on iPhone

This app is implemented as a PWA. When served over HTTPS, it can be added to the iPhone Home Screen from Safari and launched like an app.

Local preview:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open on Mac:

```text
http://127.0.0.1:8000/
```

For iPhone use, host this folder on an HTTPS service such as GitHub Pages, Netlify, or Vercel. Open the URL in Safari, then use Share > Add to Home Screen.

## Features

- Meal name, meal type, kcal, and PFC macro logging
- Daily food calorie total and calorie limit progress
- Daily Burn Guide input for reference only
- Calorie balance display with red over-limit feedback
- Meal deletion and selected-day reset
- Browser storage with `localStorage`
- PWA manifest, Home Screen icons, and service worker app shell cache
- iPhone safe-area layout, input zoom prevention, and Home Screen install hint
- Full-width Japanese numerals converted automatically in numeric fields
- Meal photo paste, image picker, preview, and detail view
- Photo-based kcal / PFC estimate presets
- Date-based history browsing with a selectable calendar
- Daily water tracking with a bottle icon

## Usage Notes

- `kcal` and PFC fields accept full-width numbers such as `４２０`.
- The Daily Burn Guide also accepts full-width numbers, but it is only a reference value.
- Add a meal photo by pasting an image onto the page or by choosing a file.
- Use the Details button in history to check saved numbers and the meal photo.
- Click a calendar date to switch totals, water intake, and history to that day.
- Use Prev Year, Next Year, Prev Month, and Next Month to move through past and future dates.

## Asset Notes

- Cover photo: Pexels / Foad Shariyati `hero-bodybuilder-back.jpg`

## Stitch Notes

- Project: Diet Tracker Pro
- Project ID: `18390116762672559302`
- Screen: Meal Log Screen
- Screen ID: `aa40044d2ca043949f8d84f7cd753943`

Stitch MCP tools and resources were not exposed in this session, so the Stitch screen `htmlCode.downloadUrl` and `screenshot.downloadUrl` could not be retrieved.
