# Our Cozy Bubble

A shared memories website for Noor and Safa.

## Page files

Each page is a self-contained HTML file. Its page markup, styling, and JavaScript are included directly in that file.

- `index.html` — Home
- `calendar.html` — Calendar and events
- `photobooth.html` — Photo wall
- `gifts.html` — Gifts
- `music.html` — Spotify links and player
- `diary.html` — Diary entries, photo editor, stickers, and page flipping
- `places.html` — Places to visit
- `reels.html` — Reels to recreate

There are no separate CSS or JavaScript files. Shared visual styles and interaction helpers are embedded in each page so the pages can be edited independently.

## Storage

The site continues to use browser `localStorage` with the existing `ocb_*` keys, so saved entries on the same browser remain compatible with the previous version. Data is still stored per browser/device; cross-device sync has not been configured yet.
