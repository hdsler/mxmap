const { test, expect } = require("@playwright/test");
const db = require("../db.json");

const fullTrack = db.find((track) => track.id === "aleksandrijos");
const missingTrack = db.find((track) => track.id === "babtai");

test("page loads and shows core sections", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Motokroso trasos Lietuvoje" })).toBeVisible();
  await expect(page.getByTestId("map")).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") {
    await expect(page.getByTestId("mobile-list-toggle")).toBeVisible();
    await expect(page.getByTestId("track-list-panel")).toBeHidden();
  } else {
    await expect(page.getByTestId("mobile-list-toggle")).toBeHidden();
    await expect(page.getByTestId("track-list")).toBeVisible();
  }
});

test("list selection updates details and navigation on desktop and mobile", async ({ page }) => {
  await page.goto("/");

  if (page.viewportSize().width < 900) {
    await page.getByTestId("mobile-list-toggle").click();
  }

  await page.getByTestId(`track-item-${fullTrack.id}`).click();

  await expect(page.getByTestId("track-name")).toHaveText(fullTrack.name);
  await expect(page.getByTestId("track-address")).toHaveText(fullTrack.address);
  await expect(page.getByTestId("track-contact-name")).toHaveText(fullTrack.contact.name);
  await expect(page.getByTestId("track-phone")).toHaveText(fullTrack.contact.phone);
  await expect(page.getByTestId("track-phone")).toHaveAttribute("href", `tel:${fullTrack.contact.phone}`);
  await expect(page.getByTestId("track-facebook-link")).toHaveAttribute("href", fullTrack.facebookUrl);
  await expect(page.getByTestId("navigate-button")).toHaveAttribute(
    "href",
    new RegExp(`${fullTrack.lat},${fullTrack.lng}`)
  );
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

  await page.getByTestId(`track-item-${missingTrack.id}`).click();

  await expect(page.getByTestId("track-contact-name")).toHaveText("Kontaktinio asmens nėra");
  await expect(page.getByTestId("track-phone")).toHaveText("Telefono numerio nėra");
  await expect(page.getByTestId("track-facebook-link")).toHaveText("Facebook nuorodos nėra");
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
