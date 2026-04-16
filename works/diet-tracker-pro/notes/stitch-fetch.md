# Stitch Fetch Notes

## Requested Project

- Title: Diet Tracker Pro
- Project ID: `18390116762672559302`
- Screen: Meal Log Screen
- Screen ID: `aa40044d2ca043949f8d84f7cd753943`

## Current Status

The local MCP resource list was empty in this session, and no Stitch MCP tools were exposed to Codex. Because of that, the hosted Stitch URLs for `htmlCode.downloadUrl` and `screenshot.downloadUrl` could not be retrieved.

## Expected Fetch Flow When Stitch MCP Is Available

1. Call the Stitch MCP `get_screen` tool with:
   - `projectId`: `18390116762672559302`
   - `screenId`: `aa40044d2ca043949f8d84f7cd753943`
2. Read the returned:
   - `htmlCode.downloadUrl`
   - `screenshot.downloadUrl`
3. Download the hosted assets with `curl -L`:

```bash
curl -L "$HTML_CODE_DOWNLOAD_URL" -o .stitch/designs/meal-log.html
curl -L "$SCREENSHOT_DOWNLOAD_URL=w390" -o .stitch/designs/meal-log.png
```

The implemented app in this folder is a local static build based on the requested screen direction: a dark, appetite-suppressing diet tracker.
