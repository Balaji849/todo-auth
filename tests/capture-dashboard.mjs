import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import { openAudit } from "./dashboard-browser.mjs";
const { browser, page, errors, network, warnings } = await openAudit();
const report = [];

await expect(page.locator(".project-ring")).toBeVisible();
await page.evaluate(() => document.fonts.ready);
for (const width of [1920, 1366, 768, 390]) {
  await page.setViewportSize({ width, height: 1080 });
  await page.locator(".main-content").evaluate((el) => (el.scrollTop = 0));
  await page.screenshot({
    path: `artifacts/dashboard/after-${width}-top.png`,
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page })
    .include(".workspace")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const overflow = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        ".workspace,.main-content,.dashboard-grid,.glass-panel",
      ),
    )
      .filter((el) => el.scrollWidth > el.clientWidth + 2)
      .map((el) => ({
        className: el.className,
        client: el.clientWidth,
        scroll: el.scrollWidth,
      })),
  );
  const smallText = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        ".dashboard-grid p,.dashboard-grid small,.dashboard-grid button,.dashboard-grid h2,.activity-axis span,.activity-legend span",
      ),
    )
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12)
      .map((el) => ({
        text: el.textContent.slice(0, 60),
        size: getComputedStyle(el).fontSize,
      })),
  );
  await page
    .locator(".main-content")
    .evaluate((el) => (el.scrollTop = el.scrollHeight));
  await page.screenshot({
    path: `artifacts/dashboard/after-${width}-bottom.png`,
    fullPage: true,
  });
  const fullHeight=await page.locator('.main-content').evaluate(el=>el.scrollHeight + el.getBoundingClientRect().top + 100);
  await page.setViewportSize({width,height:Math.max(1080,Math.ceil(fullHeight))});
  await page.locator('.main-content').evaluate(el=>el.scrollTop=0);
  await page.screenshot({path:`artifacts/dashboard/after-${width}-full.png`,fullPage:true});
  report.push({
    width,
    overflow,
    smallText,
    violations: axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
}
await fs.writeFile(
  "artifacts/dashboard/accessibility.json",
  JSON.stringify({ report, errors, network, warnings }, null, 2),
);
console.log(JSON.stringify({ report, errors, network, warnings }));
await browser.close();

if (report.some(result => result.overflow.length || result.smallText.length || result.violations.length) || errors.length || network.length || warnings.length) process.exitCode=1;
