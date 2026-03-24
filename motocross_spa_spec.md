# Lithuania Motocross Tracks — Static SPA Specification

## 1. Overview

This document defines a proof-of-concept web application for motocross tracks in Lithuania.

Application constraints:
- Static SPA
- Frontend only
- No backend
- Data loaded from local `db.json`
- Built with plain HTML, CSS, and JavaScript

Primary goal:
Provide a very simple map-based experience that works well on both mobile browsers and desktop.

---

## 2. Final Scope

### Included
- Map with all tracks
- Track list visible on desktop
- Collapsible track list on mobile
- Track details panel
- Selection sync between map and list
- External navigation button (`Vykti`)
- Facebook group link when available
- Contact person name and mobile number when available

### Excluded
- Backend
- Authentication
- Comments
- Ratings
- Search
- Filters
- Difficulty and surface metadata
- Images and videos
- Events

---

## 3. Data Source

Data must be loaded only from:

- `db.json`

No additional API or backend service is required.

The SPA must use only fields that already exist in the JSON.

---

## 4. Data Model Used By The UI

The application should use these fields from each track object:

```json
{
  "id": "string",
  "name": "string",
  "address": "string",
  "lat": "number",
  "lng": "number",
  "facebookUrl": "string|null",
  "contact": {
    "name": "string|null",
    "phone": "string|null"
  }
}
```

Notes:
- `locationName` may exist in the dataset but is not required for the UI.
- `contact` may be `null`.
- `facebookUrl` may be `null`.
- `contact.name` and `contact.phone` may be `null`.

---

## 5. UI Language

Language requirements:
- User-facing text must be in Lithuanian
- Source code must remain in English
- Code comments must remain in English

Example Lithuanian labels:
- `Trasų sąrašas`
- `Rodyti trasas`
- `Slėpti trasas`
- `Pasirinkite trasą`
- `Adresas`
- `Kontaktinis asmuo`
- `Telefono numeris`
- `Facebook grupė`
- `Vykti`

---

## 6. Layout Requirements

The application must be mobile-first and simple to use.

### Desktop layout
- Map visible at all times
- Track list visible alongside the map
- Track details visible in the same side area or below the list

### Mobile layout
- Map shown first
- Track list is collapsible to save screen space
- Details shown below the map/list after a track is selected
- Main action button must remain easy to tap

### Responsive breakpoint
- Mobile layout applies below `900px`
- Desktop layout applies at `900px` and above

The page should avoid clutter and keep the primary flow obvious.

---

## 7. Core User Flow

The intended user flow is:

1. Open the page
2. See all tracks on the map
3. Tap a marker or a track in the list
4. See essential track details
5. Tap `Vykti`
6. Choose which map application to open
7. Open navigation to the selected track

The same selected track state must drive:
- marker highlight
- list item highlight
- details panel content
- external navigation button

### Initial state
- No track is selected when the page first loads
- The details panel should show `Pasirinkite trasą`
- The map should still display all available tracks immediately

---

## 8. Map Requirements

The map should be implemented with:
- Leaflet
- OpenStreetMap tiles

Map behavior:
- Default center on Lithuania
- Default zoom should show the full country comfortably
- Render one marker per track
- Clicking a marker selects the track
- Selected marker updates the details panel
- Selected marker syncs with the selected list item
- Selecting a track from the list should center the map on that track
- Selecting a track may increase zoom slightly for clarity, but should not zoom excessively

Suggested default map settings:
- Center: `55.1694, 23.8813`
- Zoom: `7`

### Marker state
- The selected marker must be visually distinct from unselected markers
- The selection style can remain simple as long as it is clearly visible

---

## 9. Track List Requirements

The application must include a track list.

List behavior:
- Show all tracks
- Clicking a list item selects the track
- Selection recenters the map to the selected marker
- Selected item is visually highlighted
- Each list item should show the track name
- Each list item should show a short secondary line using the address when available

### Desktop
- List is always visible

### Mobile
- List is collapsible
- Toggle text should be in Lithuanian

---

## 10. Track Details Requirements

When a track is selected, the details panel must show:
- Track name
- Address
- Contact person name
- Mobile phone number
- Facebook group link
- `Vykti` button

The Facebook group link should remain highly visible because community activity primarily happens there.

Missing data must be handled safely and clearly.

Suggested fallback labels:
- `Facebook nuorodos nėra`
- `Kontaktinio asmens nėra`
- `Telefono numerio nėra`

---

## 11. External Navigation Requirements

The selected track must provide a `Vykti` button.

Behavior:
- Opens a small chooser for the selected track instead of navigating immediately
- Uses track coordinates and/or address
- Allows the user to explicitly choose the map application
- The chooser should prefer the most common installed/available map destinations for the platform
- Must work when a track is selected from either the map or the list

Required navigation choices:
- `Google Maps`
- `Apple Maps` when relevant for the device/platform

Navigation chooser UX:
- The chooser must be simple and fast to dismiss
- It may be implemented as an action sheet, bottom sheet, popover, or compact modal
- On mobile, a bottom sheet is preferred
- On desktop, a small popover or modal is preferred

Expected result:
- User can tap `Vykti`, choose a map application, and open navigation to the selected track

---

## 12. Data Handling Requirements

The frontend should:
- Load `db.json`
- Validate required fields needed for rendering
- Normalize nullable values for UI safety
- Avoid breaking when optional values are missing
- Ignore invalid records that do not contain usable map coordinates
- Continue rendering valid records even if some entries are incomplete

Required for map rendering:
- `id`
- `name`
- `lat`
- `lng`

Required for details:
- `address` may be absent but should still render gracefully
- `facebookUrl` may be absent
- `contact` may be absent

### Loading and error states
- While loading data, the UI should show a simple Lithuanian loading state
- If `db.json` fails to load, the UI should show a simple Lithuanian error message
- If no valid tracks are available after parsing, the UI should show a simple Lithuanian empty state

### Location and distance states
- Distance should only be shown when a valid user location has been obtained
- If distance is not available, the track list should not show placeholder distance text per track
- The location request action must be dismissible
- Location error/status banners must be dismissible
- If location access is denied, the UI must explain in Lithuanian how to enable it in browser settings
- If location lookup fails for another reason, the UI must show a clear Lithuanian retry state
- Mobile browsers must be tested specifically for location-permission behavior because current behavior is unreliable and must be corrected before considering the feature complete

---

## 13. File Structure

```text
/project
  index.html
  db.json
  /assets
    styles.css
    app.js
```

---

## 14. Technical Approach

Implementation should remain lightweight.

Technology choices:
- Plain JavaScript
- Plain CSS
- Leaflet for the map
- Local JSON fetch for data

No framework is required.

### Browser support target
- Latest Chrome on desktop
- Latest Safari on desktop
- Latest Chrome on Android
- Latest Safari on iPhone

### Accessibility baseline
- Interactive elements must be keyboard reachable
- Buttons and links must have clear visible labels
- Tap targets should be large enough for mobile use
- Text contrast should remain readable in daylight/mobile conditions

### Action semantics and visual hierarchy
- Buttons with different meanings should not rely on conflicting or ambiguous color semantics
- Destructive actions are not part of this UI, so strong warning/destructive coloring should be avoided for neutral actions such as collapsing a list
- Primary actions should use one consistent accent treatment
- Secondary utility actions should use quieter styling
- Dismiss controls should use compact close icons rather than full-width button treatments when appropriate

---

## 15. Build Phases

### Phase 1
- Create static app shell
- Load `db.json`
- Render map
- Render track markers

### Phase 2
- Render desktop list
- Render collapsible mobile list
- Sync selection between list and map

### Phase 3
- Build details panel
- Add `Vykti` navigation button
- Add missing-data fallback states

### Phase 4
- Responsive polish
- Accessibility and tap target improvements
- Add local automated UI tests

### Phase 5
- Add map-application chooser for `Vykti`
- Refine action-color semantics and button hierarchy
- Stabilize mobile location-permission flow and error messaging

---

## 16. Local Automated Testing

The initial testing approach should be:
- Automated
- Local only
- No CI in the first phase

Recommended tool:
- Playwright

Test execution model:
- Run the SPA through a local static server
- Run Playwright against the local URL
- Test both desktop and mobile-sized viewports

The app should not rely on opening `index.html` directly from the file system during tests.

### Test coverage for the initial phase

Automated local UI tests should cover:
- Page loads successfully
- Map container renders
- Track list renders data from `db.json`
- Clicking a track in the list updates the details panel
- Clicking a marker updates the details panel
- Selected track stays synchronized between map, list, and details
- `Vykti` opens the map-application chooser for the selected track
- Map-application chooser contains the expected choices for the current platform logic
- Missing contact or Facebook data shows Lithuanian fallback text
- Mobile track list toggle works
- Dismiss controls for status and location actions work
- Distance is shown only after location is granted
- Location error state is shown in Lithuanian when permission is denied or lookup fails

### Testability requirements

To support reliable UI testing, the application should include stable selectors such as `data-testid` for:
- Map container
- Track list
- Track list item
- Details panel
- Contact name
- Phone link
- Facebook link
- Navigation button
- Mobile list toggle

### Local testing workflow

Suggested local workflow:
1. Start a local static server
2. Open the SPA at a local URL
3. Run Playwright tests against that local URL

Expected local command flow after setup:
- Install dependencies
- Start the local server
- Run Playwright tests locally

The goal is to have repeatable local UI checks without introducing CI or deployment automation yet.

---

## 17. Success Criteria

The PoC is successful if:
- All tracks from `db.json` appear on the map
- User can select a track from either the map or the list
- User can see the required track details
- User can tap `Vykti`, choose a map app, and open external navigation
- The experience is simple and usable on both mobile and desktop
- Local automated UI tests cover the main interaction flow
- Action colors and dismiss patterns are visually unambiguous
- Mobile location access works reliably enough to show distance when browser permissions are correctly enabled
