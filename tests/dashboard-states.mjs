import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import { openAudit } from "./dashboard-browser.mjs";
const results = [];
const loading = await openAudit({ delay: 2200 });
await expect(loading.page.locator(".card-skeleton")).toHaveCount(6);
await loading.page.evaluate(() => document.fonts.ready);
const sizes = () =>
  loading.page
    .locator(".dashboard-grid > section,.deadlines-stack > section")
    .evaluateAll((nodes) =>
      nodes.map((el) => ({
        name: el.className,
        top: el.getBoundingClientRect().top,
        height: el.getBoundingClientRect().height,
      })),
    );
const before = await sizes();
await expect(loading.page.locator(".card-skeleton")).toHaveCount(0);
const after = await sizes();
results.push({
  feature: "Loading layout reservation",
  cards: before.map((card, index) => ({
    name: card.name,
    heightShift: Math.abs(card.height - after[index].height),
    topShift: Math.abs(card.top - after[index].top),
  })),
});
await loading.browser.close();
const broken = await openAudit({ storageFailure: true });
await expect(
  broken.page
    .getByRole("alert")
    .filter({ hasText: "We could not load your workspace." }),
).toHaveCount(6);
await broken.page.screenshot({ path: "artifacts/dashboard/error.png" });
await broken.page.evaluate(() => (window.__failTaskStorage = false));
await broken.page
  .getByRole("button", { name: "Try again", exact: true })
  .first()
  .click();
await expect(broken.page.getByRole("alert")).toHaveCount(0);
results.push({ feature: "Per-card error messages and retry", works: true });
await broken.browser.close();
const s = await openAudit();
await expect(s.page.locator(".project-ring")).toBeVisible();
for (const width of [1366, 390]) {
  await s.page.setViewportSize({ width, height: 1000 });
  for (const label of [
    "All tasks",
    "Projects",
    "Reports",
    "Settings",
    "Help",
  ]) {
    await s.page
      .getByRole("navigation", { name: "Workspace navigation" })
      .getByRole("button", { name: label, exact: true })
      .click();
    await expect(s.page.locator(".page-content")).toHaveCSS("opacity", "1");
  await s.page.evaluate(async () => { await Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation=>animation.finished.catch(()=>{}))); });
  const axe = await new AxeBuilder({ page: s.page })
      .include(".workspace")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    results.push({
      feature: `${label} accessibility`,
      width,
      violations: axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
  }
}
await s.page
  .getByRole("navigation", { name: "Workspace navigation" })
  .getByRole("button", { name: "Reports", exact: true })
  .click();
const download = s.page.waitForEvent("download");
await s.page
  .getByRole("button", { name: "Export report", exact: true })
  .click();
const file = await download;
results.push({ feature: "Report export", filename: file.suggestedFilename() });
await s.page
  .getByRole("navigation", { name: "Workspace navigation" })
  .getByRole("button", { name: "Overview", exact: true })
  .click();
await s.page.getByRole("button", { name: "Create task", exact: true }).click();
await s.page.getByRole("dialog").evaluate(async element => { await Promise.all(element.getAnimations().map(animation=>animation.finished.catch(()=>{}))); });
const dialog = await new AxeBuilder({ page: s.page })
  .include("dialog")
  .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  .analyze();
results.push({
  feature: "Task dialog accessibility",
  violations: dialog.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
    })),
  })),
});
await s.browser.close();
await fs.writeFile(
  "artifacts/dashboard/state-checks.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results));
if (
  results.some(
    (result) =>
      result.violations?.length ||
      result.cards?.some((card) => card.heightShift > 2 || card.topShift > 2),
  )
)
  process.exitCode = 1;
