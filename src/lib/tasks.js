export const STATUSES = ["To do", "In progress", "Done"];
export const PRIORITIES = ["High", "Medium", "Low"];
export const DEFAULT_PROJECTS = [
  "Website redesign",
  "Product launch",
  "Personal",
];

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function normalizeTask(task) {
  return {
    ...task,
    title: String(task.title || "Untitled task"),
    description: task.description || "",
    status: STATUSES.includes(task.status)
      ? task.status
      : task.completed
        ? "Done"
        : "To do",
    priority: PRIORITIES.includes(task.priority) ? task.priority : "Medium",
    project: task.project || "Inbox",
    dueDate: task.dueDate || "",
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    createdAt: task.createdAt || 0,
  };
}

export function sampleTasks() {
  return [
    {
      title: "Explore visual directions for the homepage",
      project: "Website redesign",
      priority: "High",
      status: "In progress",
      dueDate: offsetDate(0),
      description:
        "Bring together typography, color, and layout references. Pick a direction that feels clear and confident.",
      subtasks: [
        { id: "a", title: "Collect references", done: true },
        { id: "b", title: "Create a moodboard", done: false },
      ],
    },
    {
      title: "Map out the onboarding experience",
      project: "Product launch",
      priority: "High",
      status: "To do",
      dueDate: offsetDate(0),
      description:
        "Define the steps from a new account to the first completed task.",
    },
    {
      title: "Review landing page copy",
      project: "Website redesign",
      priority: "Medium",
      status: "To do",
      dueDate: offsetDate(0),
    },
    {
      title: "A little time for a big idea",
      project: "Personal",
      priority: "Low",
      status: "To do",
      dueDate: offsetDate(1),
      description:
        "Set aside 30 minutes to explore something you have been curious about.",
    },
    {
      title: "Prepare the launch checklist",
      project: "Product launch",
      priority: "High",
      status: "In progress",
      dueDate: offsetDate(2),
    },
    {
      title: "Organize the design files",
      project: "Website redesign",
      priority: "Low",
      status: "Done",
      dueDate: offsetDate(0),
      completedAt: new Date().toISOString(),
    },
    {
      title: "Share the first round of wireframes",
      project: "Website redesign",
      priority: "Medium",
      status: "Done",
      dueDate: offsetDate(-1),
      completedAt: new Date().toISOString(),
    },
    {
      title: "Plan next week’s priorities",
      project: "Personal",
      priority: "Medium",
      status: "To do",
      dueDate: offsetDate(4),
    },
  ].map((task, index) =>
    normalizeTask({
      ...task,
      id: `sample-${index}`,
      createdAt: Date.now() - index * 60000,
    }),
  );
}

export function dueLabel(value) {
  if (!value) return "No due date";
  if (value === dateKey()) return "Today";
  if (value === offsetDate(1)) return "Tomorrow";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function projectColor(project) {
  return ["purple", "blue", "orange", "green", "pink"][
    Array.from(project).reduce((total, char) => total + char.charCodeAt(0), 0) %
      5
  ];
}

export function exportTasks(tasks) {
  const fields = [
    "Title",
    "Description",
    "Status",
    "Priority",
    "Project",
    "Due date",
  ];
  const quote = (value) =>
    `"${String(value ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  const rows = tasks.map((task) => [
    task.title,
    task.description,
    task.status,
    task.priority,
    task.project,
    task.dueDate,
  ]);
  const blob = new Blob(
    [
      "\uFEFF" +
        [fields, ...rows].map((row) => row.map(quote).join(",")).join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tasky-tasks-${dateKey()}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
