import { dateKey } from "./tasks.js";

export function activitySeries(tasks, period = "This Week", now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let length = 1;
  if (period === "This Week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    length = 7;
  } else if (period === "This Month") {
    start.setDate(1);
    length = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  }
  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      label: date.toLocaleDateString(
        undefined,
        period === "This Week"
          ? { weekday: "short" }
          : { month: "short", day: "numeric" },
      ),
      created: tasks.filter(
        (task) => task.createdAt && dateKey(new Date(task.createdAt)) === key,
      ).length,
      completed: tasks.filter(
        (task) =>
          task.completedAt && dateKey(new Date(task.completedAt)) === key,
      ).length,
    };
  });
}
