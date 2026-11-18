export const WORKSPACE_HOME = "/app/overview";

export const PAGE_PATHS = {
  Overview: WORKSPACE_HOME,
  "All tasks": "/app/tasks",
  Inbox: "/app/inbox",
  Today: "/app/today",
  Upcoming: "/app/upcoming",
  Completed: "/app/completed",
  Projects: "/app/projects",
  Reports: "/app/reports",
  Settings: "/app/settings",
  Help: "/app/help",
  Overdue: "/app/overdue",
  Unscheduled: "/app/unscheduled",
};

export function pagePath(page) {
  return Object.hasOwn(PAGE_PATHS, page)
    ? PAGE_PATHS[page]
    : `/app/projects/${encodeURIComponent(page)}`;
}

export function pageFromPath(pathname) {
  const path = pathname.replace(/\/+$/, "");
  const match = Object.entries(PAGE_PATHS).find(([, value]) => value === path);
  if (match) return match[0];
  const projectMatch = path.match(/^\/app\/projects\/([^/]+)$/);
  if (!projectMatch) return null;
  try {
    const name = decodeURIComponent(projectMatch[1]);
    return name.trim() && !Object.hasOwn(PAGE_PATHS, name) ? name : null;
  } catch {
    return null;
  }
}

export function signInDestination(search) {
  const requested = new URLSearchParams(search).get("returnTo");
  if (!requested || !requested.startsWith("/app/") || requested.includes("\\"))
    return WORKSPACE_HOME;
  try {
    const url = new URL(requested, "https://tasky.local");
    return url.origin === "https://tasky.local" && pageFromPath(url.pathname)
      ? `${url.pathname}${url.search}${url.hash}`
      : WORKSPACE_HOME;
  } catch {
    return WORKSPACE_HOME;
  }
}

export function signInPath(pathname, search = "") {
  return pageFromPath(pathname)
    ? `/sign-in?returnTo=${encodeURIComponent(pathname + search)}`
    : "/sign-in";
}

export function defaultPagePreferences(page) {
  return {
    query: "",
    priority: "All priorities",
    status: page === "Completed" ? "All statuses" : "Active",
    sort: "Due date",
    view: page === "Upcoming" ? "Calendar" : "List",
    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  };
}
