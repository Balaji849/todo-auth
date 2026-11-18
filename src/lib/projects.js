import { PAGE_PATHS } from "./navigation.js";
import { DEFAULT_PROJECTS } from "./tasks.js";

export function readProjects(storage, scope) {
  const saved = storage.getItem(`tasky-projects-${scope}-v2`);
  const legacy = storage.getItem(`tasky-projects-${scope}-v1`);
  const names = saved !== null
    ? JSON.parse(saved)
    : [...DEFAULT_PROJECTS, ...JSON.parse(legacy || "[]")];
  return Array.isArray(names)
    ? [...new Set(names.filter((name) => typeof name === "string" && name.trim() && !Object.hasOwn(PAGE_PATHS, name)))]
    : [];
}

export function validateProjectName(value, projects, original) {
  const name = value.trim();
  if (!name) throw new Error("Enter a project name.");
  if (name.length > 60) throw new Error("Use 60 characters or fewer.");
  if (Object.keys(PAGE_PATHS).some((page) => page.toLowerCase() === name.toLowerCase()))
    throw new Error("Choose a name different from a workspace section.");
  if (projects.some((project) => project !== original && project.toLowerCase() === name.toLowerCase()))
    throw new Error("A project with this name already exists.");
  return name;
}

export function reassignProjectTasks(data, from, to, queueChanges, timestamp) {
  const pending = { ...data.pending };
  const changed = [];
  const tasks = data.tasks.map((task) => {
    if (task.project !== from) return task;
    const updated = { ...task, project: to, updatedAt: timestamp };
    changed.push(updated);
    if (queueChanges) pending[task.id] = updated;
    return updated;
  });
  return { data: { tasks, pending }, changed };
}
