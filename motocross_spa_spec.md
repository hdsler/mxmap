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
- `Motokroso trasos Lietuvoje`
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

The page should avoid clutter and keep the primary flow obvious.

---

## 7. Core User Flow

The intended user flow is:

1. Open the page
2. See all tracks on the map
3. Tap a marker or a track in the list
4. See essential track details
5. Tap `Vykti` to open navigation

The same selected track state must drive:
- marker highlight
- list item highlight
- details panel content
- external navigation button

---

## 8. Map Requirements

The map should be implemented with:
- Leaflet
- OpenStreetMap tiles

Map behavior:
- Default center on Lithuania
- Render one marker per track
- Clicking a marker selects the track
- Selected marker updates the details panel
- Selected marker syncs with the selected list item

---

## 9. Track List Requirements

The application must include a track list.

List behavior:
- Show all tracks
- Clicking a list item selects the track
- Selection recenters the map to the selected marker
- Selected item is visually highlighted

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

Missing data must be handled safely and clearly.

Suggested fallback labels:
- `Facebook nuorodos nėra`
- `Kontaktinio asmens nėra`
- `Telefono numerio nėra`

---

## 11. External Navigation Requirements

The selected track must provide a `Vykti` button.

Behavior:
- Opens navigation for the selected track
- Uses track coordinates and/or address
- Opens Apple Maps on Apple devices
- Opens Google Maps on other devices
- Must work when a track is selected from either the map or the list

Expected result:
- User can tap `Vykti` and immediately open navigation to the selected track

---

## 12. Data Handling Requirements

The frontend should:
- Load `db.json`
- Validate required fields needed for rendering
- Normalize nullable values for UI safety
- Avoid breaking when optional values are missing

Required for map rendering:
- `id`
- `name`
- `lat`
- `lng`

Required for details:
- `address` may be absent but should still render gracefully
- `facebookUrl` may be absent
- `contact` may be absent

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
- Final testing on mobile and desktop

---

## 16. Success Criteria

The PoC is successful if:
- All tracks from `db.json` appear on the map
- User can select a track from either the map or the list
- User can see the required track details
- User can tap `Vykti` and open external navigation
- The experience is simple and usable on both mobile and desktop
