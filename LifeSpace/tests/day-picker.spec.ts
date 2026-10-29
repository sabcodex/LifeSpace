import { test, expect } from "@playwright/test";
import { formatFullDate } from "../src/lib/dates";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

const todayCard = (page: import("@playwright/test").Page) => page.locator("[data-today-card]");

async function openPicker(page: import("@playwright/test").Page, monthTitle: string) {
  await todayCard(page).getByRole("button", { name: "Select a day", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: monthTitle, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("Today has only the jump and picker buttons; selection persists without changing check-ins", async ({ page }) => {
  await page.goto(base);
  const actualToday = await todayCard(page).locator("time").getAttribute("datetime");
  expect(actualToday).toBeTruthy();
  const actualYear = Number(actualToday!.slice(0, 4));
  const targetYear = actualYear + 1;

  await expect(todayCard(page).locator("section").getByRole("button")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Previous month", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next month", exact: true })).toHaveCount(0);

  await page.getByLabel("Calendar year", { exact: true }).selectOption(String(targetYear));
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", new RegExp(`^${targetYear}-`));
  await page.getByLabel("Calendar month", { exact: true }).selectOption("11");
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", new RegExp(`^${targetYear}-11-`));

  const monthTitle = `November ${targetYear}`;
  let picker = await openPicker(page, monthTitle);
  await expect(picker.locator("button[data-selected]")).toHaveCount(30);
  await expect(picker.getByRole("button", { name: /December/ })).toHaveCount(0);
  await picker.getByRole("button", { name: formatFullDate(`${targetYear}-11-15`), exact: true }).click();
  await expect(page.getByRole("dialog", { name: monthTitle, exact: true })).toHaveCount(0);
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", `${targetYear}-11-15`);
  await expect(page).toHaveURL(new RegExp(`year=${targetYear}&month=11&day=15`));
  await expect(page.locator(`[data-selected-date="${targetYear}-11-15"]`)).toHaveCount(1);

  const check = page.getByRole("checkbox", { name: new RegExp(`on ${targetYear}-11-15$`) }).first();
  await check.click();
  await expect(check).toHaveAttribute("aria-checked", "true");
  const before = await page.evaluate(() => localStorage.getItem("organizer-guest-sheet"));
  picker = await openPicker(page, monthTitle);
  await picker.getByRole("button", { name: formatFullDate(`${targetYear}-11-20`), exact: true }).click();
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", `${targetYear}-11-20`);
  expect(await page.evaluate(() => localStorage.getItem("organizer-guest-sheet"))).toBe(before);

  await page.reload();
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", `${targetYear}-11-20`);
  await expect(check).toHaveAttribute("aria-checked", "true");

  await page.getByLabel("Calendar month", { exact: true }).selectOption("12");
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", `${targetYear}-12-20`);
  await expect(page.getByRole("checkbox").first()).toBeVisible();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await page.getByLabel("Calendar month", { exact: true }).selectOption("11");
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", `${targetYear}-11-20`);
  await expect(check).toHaveAttribute("aria-checked", "true");

  await todayCard(page).getByRole("button", { name: "Jump to the current month", exact: true }).click();
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", actualToday!);
  await expect(page.getByLabel("Calendar year", { exact: true })).toHaveValue(String(actualYear));
  await expect(page.getByLabel("Calendar month", { exact: true })).toHaveValue(String(Number(actualToday!.slice(5, 7))));

  // Jump must reset the day even when the month is already the current one.
  const thisMonth = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${actualToday}T12:00:00Z`));
  picker = await openPicker(page, thisMonth);
  const differentDay = actualToday!.endsWith("-01") ? "02" : "01";
  await picker.getByRole("button", { name: formatFullDate(`${actualToday!.slice(0, 8)}${differentDay}`), exact: true }).click();
  await todayCard(page).getByRole("button", { name: "Jump to the current month", exact: true }).click();
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", actualToday!);
});

test("picker is month-bound, supports leap years and keyboard/outside closing", async ({ page }) => {
  await page.goto(`${base}/?year=2024&month=1&day=31`);
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", "2024-01-31");
  await page.getByLabel("Calendar month", { exact: true }).selectOption("2");
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", "2024-02-29");
  let picker = await openPicker(page, "February 2024");
  await expect(picker.locator("button[data-selected]")).toHaveCount(29);
  await expect(picker.getByRole("button", { name: "Thursday 29 February 2024", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(picker.getByRole("button", { name: "Wednesday 28 February 2024", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", "2024-02-28");

  await openPicker(page, "February 2024");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "February 2024", exact: true })).toHaveCount(0);
  await expect(todayCard(page).getByRole("button", { name: "Select a day", exact: true })).toBeFocused();

  await openPicker(page, "February 2024");
  await page.getByRole("heading", { name: "Calendar Settings", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "February 2024", exact: true })).toHaveCount(0);

  await openPicker(page, "February 2024");
  await todayCard(page).getByRole("button", { name: "Select a day", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "February 2024", exact: true })).toHaveCount(0);

  await page.goto(`${base}/?year=2025&month=2&day=31`);
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", "2025-02-28");
  picker = await openPicker(page, "February 2025");
  await expect(picker.locator("button[data-selected]")).toHaveCount(28);
});

test("calendar fits a mobile viewport and follows dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(`${base}/?year=2026&month=11&day=25`);
  await expect(page.locator("html")).toHaveClass(/dark/);
  const picker = await openPicker(page, "November 2026");
  const bounds = await picker.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  expect(await picker.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(23, 33, 32)");
  await page.screenshot({ path: "/tmp/day-picker-mobile-dark.png" });
  await picker.getByRole("button", { name: "Sunday 1 November 2026", exact: true }).click();
  await expect(todayCard(page).locator("time")).toHaveAttribute("datetime", "2026-11-01");
});
