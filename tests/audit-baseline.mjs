import { expect } from "@playwright/test";
import fs from "node:fs/promises";
import { openAudit } from "./dashboard-browser.mjs";
const { browser, page, errors } = await openAudit({width:Number(process.env.WIDTH || 1366)});
const results = [];
const phase = process.env.PHASE || "before";
const overview = async () => {
  await page.locator(".wordmark").click();
  await page.getByRole("heading", { name: "My Tasks", exact: true }).waitFor();
};
async function check(feature, action) {
  try {
    await action();
    results.push({ feature, works: true });
  } catch (error) {
    results.push({ feature, works: false, notes: error.message.slice(0, 300) });
    await page.keyboard.press("Escape").catch(() => {});
  }
}
await check("Header date pills and Reports", async () => {
  for (const label of ["Today", "This Week", "This Month", "Reports"]) {
    const button = page
      .getByRole("navigation", { name: "Dashboard date range" })
      .getByRole("button", { name: label, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.locator("h1")).toHaveText("Task Reports");
});
await overview();
await check("My Tasks tabs and status filter", async () => {
  await page
    .locator(".day-tabs")
    .getByRole("button", { name: "Tomorrow" })
    .click();
  await expect(page.locator(".daily-task-list")).toContainText(
    "Prepare the launch checklist",
  );
  await page
    .getByRole("combobox", { name: "Filter daily tasks" })
    .selectOption("Done");
  await expect(page.locator(".daily-task-list")).toContainText("No tasks");
  await page
    .getByRole("combobox", { name: "Filter daily tasks" })
    .selectOption("Active");
  await page
    .locator(".day-tabs")
    .getByRole("button", { name: "Today", exact: true })
    .click();
});
await check("Create, edit, complete, persist and delete a task", async () => {
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Task name", exact: true })
    .fill("Browser audit task");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .locator(".daily-task-content")
    .filter({ hasText: "Browser audit task" })
    .click();
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Updated by isolated browser test");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Complete Browser audit task", exact: true })
    .click();
  await page.reload();
  await page.getByRole("heading", { name: "My Tasks", exact: true }).waitFor();
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("button", { name: "Completed", exact: true })
    .click();
  await page
    .locator(".task-title-button").filter({hasText:"Browser audit task"})
    .click();
  await expect(
    page.getByRole("textbox", { name: "Description", exact: true }),
  ).toHaveValue("Updated by isolated browser test");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
await overview();
await check("Donut project link", async () => {
  await page
    .getByRole("button", { name: "View projects", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("My Projects");
});
await overview();
await check("Upcoming task details and calendar", async () => {
  await page.locator(".upcoming-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Open task calendar", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Upcoming Tasks");
  await expect(page.locator(".calendar-view")).toBeVisible();
});
await overview();
await check("Priority task details and filter", async () => {
  await page
    .getByRole("button", { name: "Check", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Filter high priority tasks", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("My Tasks");
});
await overview();
await check("Task Overview filters", async () => {
  await page
    .getByRole("button", { name: "Open task filters", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("My Tasks");
});
await overview();
await check("Sidebar navigation and browser history", async () => {
  for (const label of [
    "Overview",
    "All tasks",
    "Inbox",
    "Today",
    "Completed",
    "Projects",
    "Reports",
    "Upcoming",
    "Settings",
    "Help",
  ]) {
    await page
      .getByRole("navigation", { name: "Workspace navigation" })
      .getByRole("button", { name: label, exact: true })
      .click();
    await expect(
      page
        .getByRole("navigation", { name: "Workspace navigation" })
        .getByRole("button", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Workspace Settings");
  await page.goForward();
  await expect(page.locator("h1")).toHaveText("Workspace Guide");
});
await overview();
await check("Header inbox, help, settings and notifications", async () => {
  for (const [label, title] of [
    ["Open task inbox", "Inbox Tasks"],
    ["Open workspace guide", "Workspace Guide"],
    ["Open settings", "Workspace Settings"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("h1")).toHaveText(title);
  }
  await overview();
  await page
    .getByRole("button", { name: "Due date reminders", exact: true })
    .click();
  await expect(page.locator(".notification-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".notification-panel")).toHaveCount(0);
});
await overview();
await check("Search and clear", async () => {
  await page
    .getByRole("textbox", { name: "Search workspace tasks" })
    .fill("Review homepage");
  await expect(page.locator(".daily-task-list")).toContainText(
    "Review homepage designs",
  );
  await page
    .locator(".global-search")
    .getByRole("button", { name: "Clear search", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Search workspace tasks" }),
  ).toHaveValue("");
});
await check("Chart filter and hover details", async () => {
  await page
    .getByRole("button", { name: "Filter task activity", exact: true })
    .click({ timeout: 1500 });
  await expect(
    page.getByRole("checkbox", { name: "Created", exact: true }),
  ).toBeVisible();
});
await check("Search no-results message", async () => {
  await page
    .getByRole("textbox", { name: "Search workspace tasks" })
    .fill("no-matching-task-987");
  await expect(
    page.getByRole("heading", { name: "No results found", exact: true }),
  ).toBeVisible({ timeout: 1500 });
});
await page
  .locator(".global-search")
  .getByRole("button", { name: "Clear search", exact: true })
  .click();
await page.screenshot({
  path: `artifacts/dashboard/${phase}-1366.png`,
  fullPage: true,
});
await fs.writeFile(
  `artifacts/dashboard/functionality-${phase}.json`,
  JSON.stringify(
    {
      results,
      errors,
      profile: "Live Clerk profile cannot be checked in isolated session.",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results));
await browser.close();
if (phase !== "before" && results.some((result) => !result.works)) process.exitCode = 1;
