const { test, expect } = require("@playwright/test");
const db = require("../db.json");

const fullTrack = db.find((track) => track.id === "aleksandrijos");
const missingContactTrack = db.find((track) => track.id === "babtai");
const missingFacebookTrack = db.find((track) => track.id === "kalvarija");
const testLocation = { latitude: 54.6872, longitude: 25.2797 };
const nearestTrack = [...db]
  .map((track) => ({
    ...track,
    distanceKm: calculateDistanceKm(testLocation.latitude, testLocation.longitude, track.lat, track.lng),
  }))
  .sort((left, right) => left.distanceKm - right.distanceKm)[0];

test("page loads and shows core sections", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByTestId("map")).toBeVisible();
  await expect(page.getByTestId("location-button")).toHaveText("Rodyti atstumą");

  if (testInfo.project.name === "mobile-chromium") {
    await expect(page.getByTestId("mobile-list-toggle")).toBeVisible();
    await expect(page.getByTestId("track-list-panel")).toBeHidden();
  } else {
    await expect(page.getByRole("heading", { name: "Motokrosų trasų sąrašas" })).toBeVisible();
    await expect(page.getByTestId("mobile-list-toggle")).toBeHidden();
    await expect(page.getByTestId("track-list")).toBeVisible();
  }
});

test("list selection updates details and opens map chooser on desktop and mobile", async ({ page }) => {
  await page.goto("/");

  if (page.viewportSize().width < 900) {
    await page.getByTestId("mobile-list-toggle").click();
  }

  await page.getByTestId(`track-item-${fullTrack.id}`).click();

  await expect(page.getByTestId("track-cover-image")).toHaveAttribute("src", fullTrack.coverImage);
  await expect(page.getByTestId("track-name")).toHaveText(fullTrack.name);
  await expect(page.getByTestId("track-address")).toHaveText(fullTrack.address);
  await expect(page.getByTestId("track-contact-name")).toHaveText(fullTrack.contact.name);
  await expect(page.getByTestId("track-phone")).toHaveText(fullTrack.contact.phone);
  await expect(page.getByTestId("track-phone")).toHaveAttribute("href", `tel:${fullTrack.contact.phone}`);
  await expect(page.getByTestId("track-facebook-link")).toHaveAttribute("href", fullTrack.facebookUrl);
  await page.getByTestId("navigate-button").click();
  await expect(page.getByTestId("map-chooser")).toBeVisible();
  await expect(page.getByTestId("google-maps-option")).toHaveAttribute(
    "href",
    new RegExp(`${fullTrack.lat},${fullTrack.lng}`)
  );
  await expect(page.getByTestId("apple-maps-option")).toBeHidden();
});

test("distance and current location marker are shown when location is available", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"], { origin: "http://127.0.0.1:4173" });
  await context.setGeolocation(testLocation);
  await page.goto("/");

  if (page.viewportSize().width < 900) {
    await page.getByTestId("mobile-list-toggle").click();
  }

  const expectedDistance = formatDistance(
    calculateDistanceKm(testLocation.latitude, testLocation.longitude, fullTrack.lat, fullTrack.lng)
  );

  await expect(page.getByTestId(`track-distance-${fullTrack.id}`)).toHaveCount(0);
  await page.getByTestId("location-button").click();
  await expect(page.getByTestId("current-location-marker")).toBeVisible();
  await expect(page.getByTestId(`track-distance-${fullTrack.id}`)).toHaveText(`Atstumas: ${expectedDistance}`);
  await expect(page.getByTestId("location-button")).toHaveText("Atnaujinti atstumą");
});

test("list is sorted by nearest distance after location is granted", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"], { origin: "http://127.0.0.1:4173" });
  await context.setGeolocation(testLocation);
  await page.goto("/");

  if (page.viewportSize().width < 900) {
    await page.getByTestId("mobile-list-toggle").click();
  }

  await page.getByTestId("location-button").click();

  const firstTrackItem = page.getByTestId("track-list").locator(".track-list-item").first();
  await expect(firstTrackItem).toHaveAttribute("data-track-id", nearestTrack.id);
});

test("facebook link in the list is directly clickable", async ({ page }) => {
  await page.goto("/");

  if (page.viewportSize().width < 900) {
    await page.getByTestId("mobile-list-toggle").click();
  }

  const facebookLink = page.getByTestId(`track-facebook-${fullTrack.id}`);

  await expect(facebookLink).toHaveAttribute("href", fullTrack.facebookUrl);
  await expect(page.getByText("Pasirinkite trasą")).toBeVisible();
});

test("dismiss controls hide their related UI", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("location-action")).toBeVisible();
  await page.getByTestId("location-dismiss").click();
  await expect(page.getByTestId("location-action")).toBeHidden();
});

test("marker selection updates details", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId(`marker-${fullTrack.id}`).dispatchEvent("click");

  await expect(page.getByTestId("track-name")).toHaveText(fullTrack.name);
  await expect(page.getByTestId(`track-item-${fullTrack.id}`)).toHaveClass(/is-selected/);
});

test("fallback text is shown for missing contact and facebook data", async ({ page }) => {
  await page.goto("/");

  if (page.viewportSize().width < 900) {
    await page.getByTestId("mobile-list-toggle").click();
  }

  await page.getByTestId(`track-item-${missingContactTrack.id}`).click();

  await expect(page.getByTestId("track-cover")).toHaveCount(0);
  await expect(page.getByTestId("track-contact-name")).toHaveText("Kontaktinio asmens nėra");
  await expect(page.getByTestId("track-phone")).toHaveText("Telefono numerio nėra");
  await expect(page.getByTestId("track-facebook-link")).toHaveAttribute("href", missingContactTrack.facebookUrl);

  await page.getByTestId(`track-item-${missingFacebookTrack.id}`).click();

  await expect(page.getByTestId("track-cover")).toHaveCount(0);
  await expect(page.getByTestId("track-facebook-link")).toHaveText("Facebook nuorodos nėra");
});

test("status banner can be dismissed", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const banner = document.querySelector("#status-banner");
    const text = document.querySelector("#status-banner-text");
    banner.hidden = false;
    text.textContent = "Bandomasis pranešimas";
  });

  await expect(page.getByTestId("status-banner")).toBeVisible();
  await page.getByTestId("status-banner").getByRole("button").click();
  await expect(page.getByTestId("status-banner")).toBeHidden();
});

test("mobile list toggle expands and collapses list panel", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-only behavior");

  await page.goto("/");

  const toggle = page.getByTestId("mobile-list-toggle");
  const panel = page.getByTestId("track-list-panel");

  await expect(panel).toBeHidden();
  await toggle.click();
  await expect(panel).toBeVisible();
  await expect(toggle).toHaveText("Slėpti trasas");
  await toggle.click();
  await expect(panel).toBeHidden();
  await expect(toggle).toHaveText("Rodyti trasas");
});

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

function formatDistance(distanceKm) {
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }

  return `${Math.round(distanceKm)} km`;
}
