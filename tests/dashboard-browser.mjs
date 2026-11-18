import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = "http://127.0.0.1:5173";
const appSource = await (await fetch(`${base}/src/App.jsx`)).text();
const mainSource = await (await fetch(`${base}/src/main.jsx`)).text();
const reactPath = appSource.match(/from "([^"]*\/react\.js[^\"]*)"/)[1];
const routerPath = appSource.match(
  /from "([^"]*react-router-dom.js[^\"]*)"/,
)[1];
const rootPath = mainSource.match(/from "([^"]*react-dom_client.js[^\"]*)"/)[1];
export const user = {
  id: "tasky-ui-audit",
  username: "ui-audit",
  fullName: "Balaji M",
};
const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function seedTasks() {
  return {
    audit1: {
      title: "Review homepage designs",
      description: "Compare the layout options and share feedback.",
      project: "Website redesign",
      priority: "High",
      status: "In progress",
      dueDate: day(),
      createdAt: Date.now(),
      ownerId: user.id,
      createdBy: user.username,
      subtasks: [],
    },
    audit2: {
      title: "Prepare the launch checklist",
      description: "Check the details before we publish.",
      project: "Product launch",
      priority: "Medium",
      status: "To do",
      dueDate: day(1),
      createdAt: Date.now() - 86400000,
      ownerId: user.id,
      createdBy: user.username,
      subtasks: [],
    },
    audit3: {
      title: "Read the project brief",
      description: "All set for the next step.",
      project: "Website redesign",
      priority: "Low",
      status: "Done",
      dueDate: day(-1),
      createdAt: Date.now() - 86400000 * 2,
      completedAt: new Date().toISOString(),
      ownerId: user.id,
      createdBy: user.username,
      subtasks: [],
    },
    audit4: {
      title: "Plan a focused work session",
      description: "Make time for the important things.",
      project: "Inbox",
      priority: "High",
      status: "To do",
      dueDate: "",
      createdAt: Date.now(),
      ownerId: user.id,
      createdBy: user.username,
      subtasks: [],
    },
  };
}
export async function openAudit({
  width = 1366,
  tasks = seedTasks(),
  delay = 0,
  failure = false,
  storageFailure = false,
  reducedMotion = "no-preference",
} = {}) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    reducedMotion,
  });
  const page = await context.newPage();
  const errors = [];
  const network = [];
  const warnings = [];
  page.on("response", (response) => { if (response.status() >= 400) network.push({url:response.url(),status:response.status()}); });
  page.on("console", (message) => { if (["warning","error"].includes(message.type())) warnings.push(message.text()); });
  if (storageFailure) await page.addInitScript(() => { window.__failTaskStorage = true; const getItem = Storage.prototype.getItem; Storage.prototype.getItem = function(key) { if (window.__failTaskStorage && key === "tasky-account-tasky-ui-audit-v1") throw new Error("Test storage failure"); return getItem.call(this,key); }; });
  page.on("pageerror", (e) => errors.push(e.stack));
  await page.route("**/src/main.jsx", async (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `import '/src/index.css'; import React from '${reactPath}'; import ReactDOM from '${rootPath}'; import {BrowserRouter} from '${routerPath}'; import {Workspace} from '/src/App.jsx'; ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Workspace,{user:${JSON.stringify(user)}})));`,
    }),
  );
  await page.route("**/src/App.jsx", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        "function Workspace(",
        "export function Workspace(",
      ),
    });
  });
  await page.route("**/@clerk_clerk-react.js*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `import React from '${reactPath}'; export const useClerk=()=>({openUserProfile:()=>{window.__profileOpened=true;},signOut:async()=>{window.__signOutCalled=true;}}); export const useUser=()=>({isLoaded:true,user:${JSON.stringify(user)}}); export const UserButton=()=>React.createElement('button',{type:'button','aria-label':'BM Clerk profile (requires live session)',disabled:true},'BM'); export const SignIn=()=>null; export const SignUp=()=>null; export const ClerkProvider=({children})=>children;`,
    }),
  );
  await page.route("**/*.firebasedatabase.app/**", async (route) => {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    if (failure) {
      await route.fulfill({
        status: 423,
        json: { error: "Test database deactivated" },
      });
      return;
    }
    const request = route.request();
    const url = new URL(request.url());
    const id = url.pathname.match(/\/todos\/([^/]+)\.json/)?.[1];
    if (request.method() === "PUT")
      tasks[decodeURIComponent(id)] = request.postDataJSON();
    if (request.method() === "DELETE") delete tasks[decodeURIComponent(id)];
    await route.fulfill({ json: request.method() === "GET" ? tasks : null });
  });
  await page.goto(`${base}/app/overview`);
  await page
    .getByRole("heading", { name: "Project Dashboard", exact: true })
    .waitFor({ timeout: 10000 })
    .catch(async (error) => {
      console.log(
        JSON.stringify({
          errors,
          body: await page.locator("body").innerText(),
        }),
      );
      await page.screenshot({ path: "artifacts/dashboard/audit-debug.png" });
      await browser.close();
      throw error;
    });
  await expect(page.locator(".page-content")).toHaveCSS("opacity", "1");
  return { browser, page, errors, tasks, network, warnings };
}
if (process.argv.includes("--before")) {
  const { browser, page, errors } = await openAudit();
  await page.getByRole("heading", { name: "My Tasks", exact: true }).waitFor();
  await page.screenshot({
    path: "artifacts/dashboard/before-1366.png",
    fullPage: true,
  });
  const audit = [];
  for (const label of ["Today", "This Week", "This Month", "Reports"]) {
    await page
      .getByRole("navigation", { name: "Dashboard date range" })
      .getByRole("button", { name: label, exact: true })
      .click();
    audit.push([label, await page.locator("h1").innerText()]);
  }
  await page.locator(".wordmark").click();
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  audit.push(["Task modal", await page.getByRole("dialog").isVisible()]);
  await page.keyboard.press("Escape");
  for (const label of [
    "Open task inbox",
    "Due date reminders",
    "Open workspace guide",
    "Open settings",
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    audit.push([label, await page.locator("h1").innerText()]);
  }
  await fs.writeFile(
    "artifacts/dashboard/baseline-audit.json",
    JSON.stringify(
      {
        audit,
        errors,
        notes: [
          "Chart tooltips absent in source. Chart filter opens Reports instead of filtering. Search is immediate, not debounced. Donut has no center total. Auth profile requires real session.",
        ],
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ audit, errors }));
  await browser.close();
}
