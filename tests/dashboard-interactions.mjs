import { expect } from "@playwright/test";
import fs from "node:fs/promises";
import { openAudit } from "./dashboard-browser.mjs";
import { activitySeries } from "../src/lib/dashboard.js";
const results = [];
const session = await openAudit();
const { browser, page, tasks } = session;
const overview = async () => {
  await page.locator(".wordmark").click();
  await page.getByRole("heading", { name: "My Tasks", exact: true }).waitFor();
};
async function check(feature, action) {
  try {
    await action();
    results.push({ feature, works: true });
  } catch (error) {
    results.push({ feature, works: false, notes: error.message.slice(0, 500) });
    await page.keyboard.press("Escape").catch(() => {});
  }
}
await expect(page.locator(".project-ring")).toBeVisible();
await check("Each date range updates real chart counts", async () => {
  for (const label of ["Today", "This Week", "This Month"]) {
    await page
      .getByRole("navigation", { name: "Dashboard date range" })
      .getByRole("button", { name: label, exact: true })
      .click();
    const points = activitySeries(Object.values(tasks), label);
    await expect(page.locator(".activity-legend")).toContainText(
      `Created: ${points.reduce((n, p) => n + p.created, 0)}`,
    );
    await expect(page.locator(".activity-legend")).toContainText(
      `Completed: ${points.reduce((n, p) => n + p.completed, 0)}`,
    );
  }
});
await check(
  "Chart filters, hover tooltip, keyboard inspection, and Escape",
  async () => {
    const button = page.getByRole("button", {
      name: "Filter task activity",
      exact: true,
    });
    await button.click();
    await page
      .getByRole("checkbox", { name: "Created", exact: true })
      .uncheck();
    await expect(page.locator(".chart-created")).toHaveCount(0);
    await page.getByRole("checkbox", { name: "Created", exact: true }).check();
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
    await expect(page.locator(".activity-settings")).toHaveCount(0);
    await page.locator(".activity-plot").hover();
    await expect(page.locator(".activity-tooltip")).toBeVisible();
    await page.locator(".activity-plot").focus();
    const first = await page.locator(".activity-tooltip strong").innerText();
    await page.keyboard.press("ArrowRight");
    expect(await page.locator(".activity-tooltip strong").innerText()).not.toBe(
      first,
    );
  },
);
await check("Profile menu options and Clerk callback wiring", async () => {
  await page.locator(".profile-text").click();
  await expect(page.locator(".profile-menu")).toBeVisible();
  await page
    .getByRole("button", { name: "Workspace settings", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Workspace Settings");
  await page.locator(".profile-text").click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".profile-text")).toBeFocused();
  await page.locator(".profile-text").click();
  await page
    .getByRole("button", { name: "Account settings", exact: true })
    .click();
  expect(await page.evaluate(() => window.__profileOpened)).toBe(true);
  await page.locator(".profile-text").click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  expect(await page.evaluate(() => window.__signOutCalled)).toBe(true);
  await page.keyboard.press("Escape");
});
await overview();
await check("Completing a task updates all cards immediately", async () => {
  await expect(page.locator(".daily-task-list")).toContainText(
    "Review homepage designs",
  );
  await expect(page.locator(".upcoming-list")).toContainText(
    "Review homepage designs",
  );
  await expect(page.locator(".priority-list")).toContainText(
    "Review homepage designs",
  );
  await page
    .getByRole("button", {
      name: "Complete Review homepage designs",
      exact: true,
    })
    .click();
  await expect(page.locator(".daily-task-list")).not.toContainText(
    "Review homepage designs",
  );
  await expect(page.locator(".upcoming-list")).not.toContainText(
    "Review homepage designs",
  );
  await expect(page.locator(".priority-list")).not.toContainText(
    "Review homepage designs",
  );
  await expect(page.locator(".activity-legend")).toContainText("Completed: 2");
  await expect(page.locator(".ring-legend")).toContainText("Completed 1");
});
await check("Task form validation, focus trap and focus return", async () => {
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Create task", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Task name", exact: true })
    .fill("   ");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Create task", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Task name", exact: true })
    .fill("Keyboard test");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create task", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      document.querySelector("dialog").contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create task", exact: true }),
  ).toBeFocused();
});
await check(
  "Projects can be created, renamed, removed, and persisted",
  async () => {
    await page
      .getByRole("button", { name: "Create task", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Manage projects", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "New project name", exact: true })
      .fill("Audit project");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByRole("combobox", { name: "Project", exact: true }),
    ).toHaveValue("Audit project");
    await page
      .getByRole("button", { name: "Rename Audit project", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Rename Audit project", exact: true })
      .fill("Renamed audit project");
    await page
      .getByRole("button", {
        name: "Save project name for Audit project",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("combobox", { name: "Project", exact: true }),
    ).toHaveValue("Renamed audit project");
    await page
      .getByRole("button", {
        name: "Remove Renamed audit project",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(
      page.getByRole("combobox", { name: "Project", exact: true }),
    ).toHaveValue("Inbox");
    await page.keyboard.press("Escape");
    await page.reload();
    await page
      .getByRole("heading", { name: "My Tasks", exact: true })
      .waitFor();
    expect(
      await page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("tasky-projects-tasky-ui-audit-v2"),
        ).includes("Renamed audit project"),
      ),
    ).toBe(false);
  },
);
await check("Search debounce, clear, no results, and slash focus", async () => {
  await page.keyboard.press("/");
  await expect(
    page.getByRole("textbox", { name: "Search workspace tasks" }),
  ).toBeFocused();
  await page
    .getByRole("textbox", { name: "Search workspace tasks" })
    .fill("no-matching-ui-task");
  await expect(
    page.getByRole("heading", { name: "No results found" }),
  ).toBeVisible();
  await page
    .locator(".global-search")
    .getByRole("button", { name: "Clear search" })
    .click();
  await expect(
    page.getByRole("heading", { name: "No results found" }),
  ).toHaveCount(0);
});
await check("Mobile navigation, controls, and task form", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await nav.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Workspace Settings");
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Dashboard date range" })
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Task Reports");
});
await browser.close();
await check("Every card has a loading skeleton", async () => {
  const s = await openAudit({ delay: 2500 });
  await expect(s.page.locator(".card-skeleton")).toHaveCount(6);
  await s.page.screenshot({ path: "artifacts/dashboard/loading.png" });
  await expect(s.page.locator(".card-skeleton")).toHaveCount(0);
  await s.browser.close();
});
await check(
  "Empty dashboard cards provide useful calls to action",
  async () => {
    const s = await openAudit({ tasks: {} });
    await expect(s.page.locator(".card-skeleton")).toHaveCount(0);
    await expect(s.page.locator(".daily-panel .card-empty")).toContainText(
      "No tasks",
    );
    await expect(s.page.locator(".upcoming-panel .card-empty")).toContainText(
      "No upcoming",
    );
    await expect(s.page.locator(".priority-panel .card-empty")).toContainText(
      "No high-priority",
    );
    await s.page.screenshot({ path: "artifacts/dashboard/empty.png" });
    await s.browser.close();
  },
);
await check(
  "Offline sync shows a warning and preserves the usable workspace",
  async () => {
    const s = await openAudit({ failure: true });
    await expect(s.page.locator(".sync-explanation")).toContainText(
      "Firebase database is deactivated",
    );
    await expect(
      s.page.getByRole("button", { name: "Create task", exact: true }),
    ).toBeEnabled();
    await s.browser.close();
  },
);
await fs.writeFile(
  "artifacts/dashboard/advanced-checks.json",
  JSON.stringify(
    {
      results,
      errors: session.errors,
      notes:
        "Clerk account UI and sign-out callbacks are stubbed, not live-authenticated.",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results));
if (results.some((r) => !r.works) || session.errors.length)
  process.exitCode = 1;
