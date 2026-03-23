(function () {
  const DEFAULT_CENTER = [55.1694, 23.8813];
  const DEFAULT_ZOOM = 7;
  const FOCUS_ZOOM = 10;
  const APPLE_DEVICE_PATTERN = /iPhone|iPad|iPod|Macintosh/i;

  const elements = {
    map: document.querySelector("#map"),
    list: document.querySelector("#track-list"),
    listPanel: document.querySelector("#track-list-panel"),
    details: document.querySelector("#track-details-content"),
    listToggle: document.querySelector("#list-toggle"),
    locationButton: document.querySelector("#location-button"),
    statusBanner: document.querySelector("#status-banner"),
    statusBannerText: document.querySelector("#status-banner-text"),
    statusClose: document.querySelector("#status-close"),
  };

  const state = {
    map: null,
    tracks: [],
    selectedTrackId: null,
    userLocation: null,
    markersById: new Map(),
    iconsById: new Map(),
  };

  init().catch((error) => {
    console.error(error);
    showStatus("Nepavyko įkelti trasų duomenų.");
    renderEmptyList("Trasų parodyti nepavyko.");
    renderInitialDetails("Nepavyko įkelti trasų duomenų.");
  });

  async function init() {
    setupListToggle();
    setupLocationButton();
    setupStatusBanner();
    renderInitialDetails("Pasirinkite trasą");
    showStatus("Kraunami trasų duomenys...");
    initMap();

    const tracks = await loadTracks();

    if (!tracks.length) {
      showStatus("Trasų nerasta.");
      renderEmptyList("Trasų nėra.");
      return;
    }

    state.tracks = tracks;
    hideStatus();
    renderTrackList();
    renderMarkers();
  }

  function setupListToggle() {
    const mediaQuery = window.matchMedia("(min-width: 900px)");

    const sync = () => {
      if (mediaQuery.matches) {
        elements.listPanel.hidden = false;
        elements.listToggle.setAttribute("aria-expanded", "true");
        elements.listToggle.textContent = "Rodyti trasas";
        return;
      }

      elements.listPanel.hidden = true;
      elements.listToggle.setAttribute("aria-expanded", "false");
      elements.listToggle.textContent = "Rodyti trasas";
    };

    mediaQuery.addEventListener("change", sync);
    sync();

    elements.listToggle.addEventListener("click", () => {
      const isExpanded = elements.listToggle.getAttribute("aria-expanded") === "true";
      const nextExpanded = !isExpanded;

      elements.listPanel.hidden = !nextExpanded;
      elements.listToggle.setAttribute("aria-expanded", String(nextExpanded));
      elements.listToggle.textContent = nextExpanded ? "Slėpti trasas" : "Rodyti trasas";
    });
  }

  function setupLocationButton() {
    elements.locationButton.addEventListener("click", () => {
      requestUserLocation().catch((error) => {
        console.error(error);
        handleLocationFailure();
      });
    });
  }

  function setupStatusBanner() {
    elements.statusClose.addEventListener("click", () => {
      hideStatus();
    });
  }

  function initMap() {
    state.map = L.map(elements.map, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(state.map);
  }

  async function loadTracks() {
    const response = await fetch("./db.json");

    if (!response.ok) {
      throw new Error("Failed to load db.json");
    }

    const rawTracks = await response.json();

    return rawTracks
      .map(normalizeTrack)
      .filter(Boolean)
      .sort((left, right) => left.name.localeCompare(right.name, "lt"));
  }

  function normalizeTrack(track) {
    if (
      !track ||
      typeof track.id !== "string" ||
      typeof track.name !== "string" ||
      typeof track.lat !== "number" ||
      typeof track.lng !== "number"
    ) {
      return null;
    }

    return {
      id: track.id,
      name: track.name,
      address: typeof track.address === "string" && track.address.trim() ? track.address.trim() : "Adreso nėra",
      lat: track.lat,
      lng: track.lng,
      distanceKm: null,
      facebookUrl: typeof track.facebookUrl === "string" && track.facebookUrl.trim() ? track.facebookUrl.trim() : null,
      contactName:
        track.contact && typeof track.contact.name === "string" && track.contact.name.trim()
          ? track.contact.name.trim()
          : null,
      contactPhone:
        track.contact && typeof track.contact.phone === "string" && track.contact.phone.trim()
          ? track.contact.phone.trim()
          : null,
    };
  }

  function renderTrackList() {
    elements.list.innerHTML = "";

    state.tracks.forEach((track) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "track-list-item";
      button.dataset.trackId = track.id;
      button.dataset.testid = `track-item-${track.id}`;
      button.setAttribute("data-testid", `track-item-${track.id}`);

      const name = document.createElement("span");
      name.className = "track-list-name";
      name.textContent = track.name;

      const address = document.createElement("span");
      address.className = "track-list-address";
      address.textContent = track.address;

      const meta = document.createElement("div");
      meta.className = "track-list-meta";

      const distance = document.createElement("span");
      distance.className = "track-list-distance";
      distance.setAttribute("data-testid", `track-distance-${track.id}`);
      distance.textContent = getDistanceLabel(track);

      if (distance.textContent) {
        meta.appendChild(distance);
      }

      if (track.facebookUrl) {
        const facebookBadge = document.createElement("a");
        facebookBadge.className = "track-list-facebook";
        facebookBadge.href = track.facebookUrl;
        facebookBadge.target = "_blank";
        facebookBadge.rel = "noreferrer";
        facebookBadge.textContent = "Facebook grupė";
        facebookBadge.setAttribute("data-testid", `track-facebook-${track.id}`);
        facebookBadge.addEventListener("click", (event) => {
          event.stopPropagation();
        });
        meta.appendChild(facebookBadge);
      }

      button.append(name, address, meta);
      button.addEventListener("click", () => selectTrack(track.id, { source: "list" }));
      elements.list.appendChild(button);
    });
  }

  async function requestUserLocation() {
    if (!navigator.geolocation) {
      elements.locationButton.textContent = "Vieta nepasiekiama";
      elements.locationButton.disabled = true;
      showStatus("Ši naršyklė nepalaiko vietos nustatymo.");
      renderTrackList();
      return;
    }

    const permissionState = await getLocationPermissionState();

    if (permissionState === "denied") {
      elements.locationButton.disabled = false;
      elements.locationButton.textContent = "Bandyti dar kartą";
      showStatus("Vietos prieiga užblokuota. Leiskite ją naršyklės nustatymuose.");
      return;
    }

    elements.locationButton.disabled = true;
    elements.locationButton.textContent = "Nustatoma vieta...";
    showStatus("Leiskite prieigą prie vietos, kad būtų parodytas atstumas.");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        state.tracks = state.tracks.map((track) => ({
          ...track,
          distanceKm: calculateDistanceKm(state.userLocation.lat, state.userLocation.lng, track.lat, track.lng),
        }));

        renderTrackList();
        updateListSelection();
        elements.locationButton.disabled = false;
        elements.locationButton.textContent = "Atnaujinti atstumą";
        hideStatus();
      },
      (error) => {
        handleLocationFailure(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  }

  function renderMarkers() {
    state.tracks.forEach((track) => {
      const iconHtml = createMarkerHtml(track, false);
      const icon = L.divIcon({
        className: "track-marker-wrapper",
        html: iconHtml,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([track.lat, track.lng], { icon }).addTo(state.map);
      marker.on("click", () => selectTrack(track.id, { source: "marker" }));
      marker.bindPopup(track.name);

      state.markersById.set(track.id, marker);
      state.iconsById.set(track.id, icon);
    });
  }

  function createMarkerHtml(track, selected) {
    const className = selected ? "track-marker is-selected" : "track-marker";
    return `<button class="${className}" type="button" aria-label="${escapeHtml(
      track.name
    )}" data-testid="marker-${escapeHtml(track.id)}"></button>`;
  }

  function selectTrack(trackId, options = {}) {
    const track = state.tracks.find((entry) => entry.id === trackId);

    if (!track) {
      return;
    }

    state.selectedTrackId = trackId;
    updateListSelection();
    updateMarkerSelection();
    renderTrackDetails(track);
    scrollSelectedTrackIntoView(options.source);

    const marker = state.markersById.get(trackId);
    if (marker) {
      marker.openPopup();
    }

    if (state.map) {
      state.map.setView([track.lat, track.lng], Math.max(state.map.getZoom(), FOCUS_ZOOM), {
        animate: true,
      });
    }

    if (options.source === "marker" && window.innerWidth < 900) {
      elements.listPanel.hidden = true;
      elements.listToggle.setAttribute("aria-expanded", "false");
      elements.listToggle.textContent = "Rodyti trasas";
    }
  }

  function updateListSelection() {
    const items = elements.list.querySelectorAll(".track-list-item");

    items.forEach((item) => {
      const selected = item.dataset.trackId === state.selectedTrackId;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
  }

  function scrollSelectedTrackIntoView(source) {
    const selectedItem = elements.list.querySelector(`[data-track-id="${state.selectedTrackId}"]`);

    if (!selectedItem) {
      return;
    }

    window.requestAnimationFrame(() => {
      selectedItem.scrollIntoView({
        behavior: source === "list" ? "smooth" : "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });
  }

  function updateMarkerSelection() {
    state.tracks.forEach((track) => {
      const marker = state.markersById.get(track.id);

      if (!marker) {
        return;
      }

      const selected = track.id === state.selectedTrackId;
      marker.setIcon(
        L.divIcon({
          className: "track-marker-wrapper",
          html: createMarkerHtml(track, selected),
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        })
      );
    });
  }

  function renderTrackDetails(track) {
    const navigateUrl = buildNavigationUrl(track);
    const facebookMarkup = track.facebookUrl
      ? `<a class="facebook-button" data-testid="track-facebook-link" href="${escapeAttribute(
          track.facebookUrl
        )}" target="_blank" rel="noreferrer">Atidaryti grupę</a>`
      : `<p class="detail-value" data-testid="track-facebook-link">Facebook nuorodos nėra</p>`;

    const phoneMarkup = track.contactPhone
      ? `<a class="detail-link" data-testid="track-phone" href="tel:${escapeAttribute(track.contactPhone)}">${escapeHtml(
          track.contactPhone
        )}</a>`
      : `<p class="detail-value" data-testid="track-phone">Telefono numerio nėra</p>`;

    const contactNameMarkup = track.contactName
      ? `<p class="detail-value" data-testid="track-contact-name">${escapeHtml(track.contactName)}</p>`
      : `<p class="detail-value" data-testid="track-contact-name">Kontaktinio asmens nėra</p>`;

    elements.details.innerHTML = `
      <div class="detail-group">
        <span class="detail-label">Trasa</span>
        <p class="detail-value" data-testid="track-name">${escapeHtml(track.name)}</p>
      </div>
      <div class="detail-group">
        <span class="detail-label">Adresas</span>
        <p class="detail-value" data-testid="track-address">${escapeHtml(track.address)}</p>
      </div>
      <div class="detail-group">
        <span class="detail-label">Kontaktinis asmuo</span>
        ${contactNameMarkup}
      </div>
      <div class="detail-group">
        <span class="detail-label">Telefono numeris</span>
        ${phoneMarkup}
      </div>
      <div class="detail-group">
        <span class="detail-label">Facebook grupė</span>
        ${facebookMarkup}
      </div>
      <div class="actions-row">
        <a
          class="navigate-button"
          data-testid="navigate-button"
          href="${escapeAttribute(navigateUrl)}"
          target="_blank"
          rel="noreferrer"
        >
          Vykti
        </a>
      </div>
    `;
  }

  function renderInitialDetails(message) {
    elements.details.innerHTML = `<p class="placeholder">${escapeHtml(message)}</p>`;
  }

  function renderEmptyList(message) {
    elements.list.innerHTML = `<p class="placeholder">${escapeHtml(message)}</p>`;
  }

  function showStatus(message) {
    elements.statusBanner.hidden = false;
    elements.statusBannerText.textContent = message;
  }

  function hideStatus() {
    elements.statusBanner.hidden = true;
    elements.statusBannerText.textContent = "";
  }

  function buildNavigationUrl(track) {
    const encodedAddress = encodeURIComponent(track.address);

    if (isAppleDevice()) {
      return `https://maps.apple.com/?ll=${track.lat},${track.lng}&q=${encodedAddress}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${track.lat},${track.lng}`;
  }

  function getDistanceLabel(track) {
    if (typeof track.distanceKm === "number") {
      return `Atstumas: ${formatDistance(track.distanceKm)}`;
    }

    return "";
  }

  async function getLocationPermissionState() {
    if (!navigator.permissions || !navigator.permissions.query) {
      return "unknown";
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state;
    } catch (error) {
      return "unknown";
    }
  }

  function handleLocationFailure(error) {
    renderTrackList();
    updateListSelection();
    elements.locationButton.disabled = false;
    elements.locationButton.textContent = "Bandyti dar kartą";

    if (error && error.code === 1) {
      showStatus("Vietos prieiga užblokuota. Leiskite ją naršyklės nustatymuose.");
      return;
    }

    if (error && error.code === 3) {
      showStatus("Nepavyko nustatyti vietos. Bandykite dar kartą.");
      return;
    }

    showStatus("Nepavyko nustatyti vietos. Bandykite dar kartą.");
  }

  function formatDistance(distanceKm) {
    if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`;
    }

    return `${Math.round(distanceKm)} km`;
  }

  function calculateDistanceKm(lat1, lng1, lat2, lng2) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function isAppleDevice() {
    const userAgent = navigator.userAgent || "";
    return APPLE_DEVICE_PATTERN.test(userAgent);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
