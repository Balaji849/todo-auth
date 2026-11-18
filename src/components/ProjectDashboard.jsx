import PropTypes from "prop-types";
import { tasksType } from "../lib/propTypes";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  Plus,
  Settings2,
  ListTodo,
} from "lucide-react";
import { dateKey, dueLabel, offsetDate } from "../lib/tasks";
import { activitySeries } from "../lib/dashboard";

function CardState({ loading, error, onRetry, children }) {
  if (loading)
    return (
      <div className="card-skeleton" role="status" aria-label="Loading card">
        <span />
        <span />
        <span />
        <span className="sr-only">Loading your tasks…</span>
      </div>
    );
  if (error)
    return (
      <div className="card-empty" role="alert">
        <ListTodo size={24} />
        <p>We could not load your workspace.</p>
        <button className="button secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  return children;
}

function CardEmpty({ message, action, onAction }) {
  return (
    <div className="card-empty">
      <ListTodo size={24} aria-hidden="true" />
      <p>{message}</p>
      {action && (
        <button className="button secondary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

export function ProjectRing({
  tasks,
  projects = [
    ...new Set(
      tasks
        .map((task) => task.project)
        .filter((project) => project !== "Inbox"),
    ),
  ],
}) {
  const groups = projects.map((project) =>
    tasks.filter((task) => task.project === project),
  );
  const done = groups.filter(
    (items) => items.length && items.every((task) => task.status === "Done"),
  ).length;
  const ongoing = groups.filter(
    (items) =>
      items.some(
        (task) => task.status === "In progress" || task.status === "Done",
      ) && !items.every((task) => task.status === "Done"),
  ).length;
  const waiting = groups.length - done - ongoing;
  const first = groups.length ? (waiting / groups.length) * 100 : 100;
  const second = first + (groups.length ? (ongoing / groups.length) * 100 : 0);
  return (
    <div className="project-ring-content">
      <div
        className="project-ring"
        role="img"
        aria-label={`${projects.length} projects: ${waiting} not started, ${ongoing} in progress, ${done} completed`}
        style={{
          background: projects.length
            ? `conic-gradient(from 270deg, var(--project-waiting) 0% ${first}%, var(--project-ongoing) ${first}% ${second}%, var(--project-done) ${second}% 100%)`
            : "var(--chart-grid)",
        }}
      >
        <span className="project-ring-total">
          <strong>{projects.length}</strong>
          <span>{projects.length === 1 ? "Project" : "Projects"}</span>
        </span>
      </div>
      <div className="ring-legend">
        <span>
          <i className="project-ongoing-dot" />
          In Progress <b>{ongoing}</b>
        </span>
        <span>
          <i className="project-done-dot" />
          Completed <b>{done}</b>
        </span>
        <span>
          <i className="project-waiting-dot" />
          Not Started <b>{waiting}</b>
        </span>
      </div>
    </div>
  );
}

export function TaskActivity({
  tasks,
  period = "This Week",
  showSettings = false,
}) {
  const [visible, setVisible] = useState({ created: true, completed: true });
  const [hovered, setHovered] = useState(null);
  const data = activitySeries(tasks, period);
  const active =
    hovered === null ? null : data[Math.min(hovered, data.length - 1)];
  const max = Math.max(
    2,
    ...data.flatMap((day) => [
      visible.created ? day.created : 0,
      visible.completed ? day.completed : 0,
    ]),
  );
  const x = (index) =>
    data.length === 1 ? 280 : 28 + (index / (data.length - 1)) * 504;
  const y = (value) => 182 - (value / max) * 146;
  const line = (key) =>
    data.length === 1
      ? `M 28 ${y(data[0][key])} L 532 ${y(data[0][key])}`
      : data
          .map(
            (day, index) => `${index ? "L" : "M"} ${x(index)} ${y(day[key])}`,
          )
          .join(" ");
  const created = data.reduce((sum, day) => sum + day.created, 0);
  const completed = data.reduce((sum, day) => sum + day.completed, 0);
  return (
    <div className="activity-chart">
      {showSettings && (
        <fieldset className="activity-settings">
          <legend>Show activity</legend>
          {["created", "completed"].map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={visible[key]}
                onChange={(event) =>
                  setVisible((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
              />
              {key === "created" ? "Created" : "Completed"}
            </label>
          ))}
        </fieldset>
      )}
      <div className="activity-legend">
        <span>
          <i className="blue-dot" />
          Created: <b>{created}</b>
        </span>
        <span>
          <i className="orange-dot" />
          Completed: <b>{completed}</b>
        </span>
      </div>
      <div
        className="activity-plot"
        tabIndex={0}
        role="group"
        aria-label={`Task activity for ${period.toLowerCase()}. Use left and right arrow keys to inspect each day.`}
        onFocus={() => setHovered(0)}
        onBlur={() => setHovered(null)}
        onPointerLeave={() => setHovered(null)}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setHovered(
            Math.max(
              0,
              Math.min(
                data.length - 1,
                Math.round(
                  ((event.clientX - rect.left) / rect.width) *
                    (data.length - 1),
                ),
              ),
            ),
          );
        }}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            setHovered((value) =>
              Math.max(
                0,
                Math.min(
                  data.length - 1,
                  (value ?? 0) + (event.key === "ArrowRight" ? 1 : -1),
                ),
              ),
            );
          }
          if (event.key === "Escape") setHovered(null);
        }}
      >
        <svg
          viewBox="0 0 560 196"
          role="img"
          aria-label={`${created} tasks created and ${completed} completed in ${period.toLowerCase()}`}
        >
          {[0, 1, 2, 3].map((index) => (
            <line
              key={index}
              x1="24"
              x2="536"
              y1={36 + index * 49}
              y2={36 + index * 49}
              className="chart-gridline"
            />
          ))}
          {visible.created && (
            <path d={line("created")} className="chart-line chart-created" />
          )}
          {visible.completed && (
            <path
              d={line("completed")}
              className="chart-line chart-completed"
              strokeDasharray="6 5"
            />
          )}
          {active && (
            <g>
              <line
                x1={x(Math.min(hovered, data.length - 1))}
                x2={x(Math.min(hovered, data.length - 1))}
                y1="30"
                y2="184"
                className="chart-guide"
              />
              {visible.created && (
                <circle
                  cx={x(Math.min(hovered, data.length - 1))}
                  cy={y(active.created)}
                  r="4"
                  className="chart-created-point"
                />
              )}
              {visible.completed && (
                <circle
                  cx={x(Math.min(hovered, data.length - 1))}
                  cy={y(active.completed)}
                  r="4"
                  className="chart-completed-point"
                />
              )}
            </g>
          )}
        </svg>
        <div className="activity-axis" aria-hidden="true">
          {data
            .filter(
              (_, index) =>
                data.length <= 7 ||
                index % 6 === 0 ||
                index === data.length - 1,
            )
            .map((day) => (
              <span key={day.key}>{day.label}</span>
            ))}
        </div>
        {active && (
          <div className="activity-tooltip" role="status">
            <strong>{active.label}</strong>
            <span>Created: {active.created}</span>
            <span>Completed: {active.completed}</span>
          </div>
        )}
      </div>
      {!created && !completed && (
        <p className="chart-empty-note">No activity recorded in this range.</p>
      )}
    </div>
  );
}

export function TaskOverview({
  tasks,
  onFilter,
  loading = false,
  error = "",
  onRetry,
}) {
  const today = dateKey();
  const rows = [
    [
      "Overdue",
      tasks.filter(
        (task) =>
          task.status !== "Done" && task.dueDate && task.dueDate < today,
      ).length,
      "violet",
      "Overdue",
    ],
    [
      "To do",
      tasks.filter((task) => task.status === "To do").length,
      "red",
      "To do",
    ],
    [
      "In Progress",
      tasks.filter((task) => task.status === "In progress").length,
      "cyan",
      "In progress",
    ],
    [
      "Completed",
      tasks.filter((task) => task.status === "Done").length,
      "emerald",
      "Done",
    ],
    [
      "Unscheduled",
      tasks.filter((task) => !task.dueDate && task.status !== "Done").length,
      "amber",
      "Unscheduled",
    ],
  ];
  return (
    <section
      className="glass-panel task-overview-panel"
      aria-labelledby="task-overview-title"
    >
      <div className="panel-heading">
        <h2 id="task-overview-title">Task Overview</h2>
        <button
          className="round-button"
          aria-label="Open task filters"
          onClick={() => onFilter("All")}
        >
          <Settings2 size={18} />
        </button>
      </div>
      <CardState loading={loading} error={error} onRetry={onRetry}>
        <div className="status-bars">
          {rows.map(([label, count, color, filter]) => {
            const percentage = tasks.length
              ? Math.round((count / tasks.length) * 100)
              : 0;
            return (
              <button
                className="status-row"
                key={label}
                onClick={() => onFilter(filter)}
              >
                <span className="status-row-label">
                  <span>{label}</span>
                  <span>
                    {count}
                    <i />
                    {percentage}% of tasks
                  </span>
                </span>
                <span className="task-progress-track" aria-hidden="true">
                  <span
                    className={`task-progress-fill ${color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </CardState>
    </section>
  );
}

export default function ProjectDashboard({
  tasks,
  activityTasks = tasks,
  projects,
  busy,
  period,
  onAdd,
  onEdit,
  onToggle,
  onNavigate,
  onFilter,
  loading = false,
  error = "",
  onRetry,
}) {
  const [day, setDay] = useState("Today");
  const [status, setStatus] = useState("Active");
  const [activitySettings, setActivitySettings] = useState(false);
  const activityFilter = useRef(null);
  useEffect(() => {
    if (!activitySettings) return;
    const close = (event) => {
      if (!event.target.closest(".activity-panel")) setActivitySettings(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activitySettings]);
  const dayKey = day === "Today" ? dateKey() : offsetDate(1);
  const daily = tasks.filter(
    (task) =>
      task.dueDate === dayKey &&
      (status === "All" ||
        (status === "Active"
          ? task.status !== "Done"
          : task.status === status)),
  );
  const upcoming = tasks
    .filter(
      (task) =>
        task.status !== "Done" && task.dueDate && task.dueDate >= dateKey(),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 2);
  const priority = tasks
    .filter((task) => task.status !== "Done" && task.priority === "High")
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
    .slice(0, 3);
  const state = { loading, error, onRetry };
  return (
    <div className="dashboard-grid" aria-busy={loading}>
      <section
        className="glass-panel daily-panel"
        aria-labelledby="daily-tasks-title"
      >
        <div className="panel-heading">
          <h2 id="daily-tasks-title">My Tasks</h2>
          <button
            className="round-button"
            aria-label="Create task"
            disabled={loading || !!error}
            onClick={() => onAdd({ dueDate: dayKey })}
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="day-tabs">
          {["Today", "Tomorrow"].map((value) => (
            <button
              key={value}
              className={day === value ? "selected" : ""}
              aria-pressed={day === value}
              onClick={() => setDay(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="daily-filter">
          <span>{daily.length}</span>
          <select
            value={status}
            aria-label="Filter daily tasks"
            onChange={(event) => setStatus(event.target.value)}
          >
            {[
              ["Active", "On Going Tasks"],
              ["All", "All Tasks"],
              ["To do", "To Do Tasks"],
              ["In progress", "In Progress"],
              ["Done", "Completed"],
            ].map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
        <CardState {...state}>
          <div className="daily-task-list">
            {daily.length ? (
              daily.map((task) => (
                <article className="daily-task" key={task.id}>
                  <div className="daily-card-top">
                    <span className="task-emblem">
                      <Folder size={18} />
                    </span>
                    <button
                      className={`small-check ${task.status === "Done" ? "is-checked" : ""}`}
                      disabled={busy}
                      aria-label={`${task.status === "Done" ? "Reopen" : "Complete"} ${task.title}`}
                      onClick={() => onToggle(task)}
                    >
                      <Check size={16} />
                    </button>
                  </div>
                  <button
                    className="daily-task-content"
                    onClick={() => onEdit(task)}
                  >
                    <strong>{task.title}</strong>
                    <p>{task.description || task.project}</p>
                  </button>
                </article>
              ))
            ) : (
              <CardEmpty message={`No tasks for ${day.toLowerCase()}.`} />
            )}
          </div>
        </CardState>
        <button
          className="button secondary daily-add"
          disabled={loading || !!error}
          onClick={() => onAdd({ dueDate: dayKey })}
        >
          <Plus size={16} />
          Add a task
        </button>
      </section>
      <section
        className="glass-panel overview-ring-panel"
        aria-labelledby="projects-overview-title"
      >
        <div className="panel-heading">
          <h2 id="projects-overview-title">Projects Overview</h2>
          <button
            className="round-button"
            aria-label="View projects"
            onClick={() => onNavigate("Projects")}
          >
            <ArrowUpRight size={18} />
          </button>
        </div>
        <CardState {...state}>
          {projects.length ? (
            <ProjectRing tasks={tasks} projects={projects} />
          ) : (
            <CardEmpty
              message="No projects in this view."
              action="View projects"
              onAction={() => onNavigate("Projects")}
            />
          )}
        </CardState>
      </section>
      <section
        className="glass-panel activity-panel"
        aria-labelledby="task-activity-title"
        onKeyDown={(event) => {
          if (event.key === "Escape" && activitySettings) {
            setActivitySettings(false);
            activityFilter.current?.focus();
          }
        }}
      >
        <div className="panel-heading">
          <h2 id="task-activity-title">Task Activity</h2>
          <div>
            <button
              ref={activityFilter}
              className="round-button"
              aria-label="Filter task activity"
              aria-expanded={activitySettings}
              onClick={() => setActivitySettings((value) => !value)}
            >
              <Settings2 size={18} />
            </button>
            <button
              className="round-button"
              aria-label="Expand task activity"
              onClick={() => onNavigate("Reports")}
            >
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
        <CardState {...state}>
          <TaskActivity
            tasks={activityTasks}
            period={period}
            showSettings={activitySettings}
          />
          {!activityTasks.length && (
            <button
              className="button secondary chart-add"
              onClick={() => onAdd()}
            >
              Create a task
            </button>
          )}
        </CardState>
      </section>
      <TaskOverview tasks={tasks} onFilter={onFilter} {...state} />
      <aside
        className="deadlines-stack"
        aria-label="Upcoming and priority tasks"
      >
        <section
          className="glass-panel upcoming-panel"
          aria-labelledby="upcoming-title"
        >
          <div className="panel-heading">
            <h2 id="upcoming-title">Upcoming Tasks</h2>
            <button
              className="round-button"
              aria-label="Open task calendar"
              onClick={() => onNavigate("Upcoming")}
            >
              <CalendarDays size={18} />
            </button>
          </div>
          <CardState {...state}>
            <div className="upcoming-list">
              {upcoming.map((task) => (
                <button
                  className="upcoming-card"
                  key={task.id}
                  onClick={() => onEdit(task)}
                >
                  <span>
                    <small>{task.project}</small>
                    <ArrowUpRight size={17} />
                  </span>
                  <strong>{task.title}</strong>
                  <span>
                    <b>{dueLabel(task.dueDate)}</b>
                    <span
                      className={`priority-tag ${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </span>
                </button>
              ))}
              {!upcoming.length && (
                <CardEmpty
                  message="No upcoming deadlines."
                  action="Plan a task"
                  onAction={() => onAdd()}
                />
              )}
            </div>
            <button className="see-all" onClick={() => onNavigate("Upcoming")}>
              See All Tasks
              <ChevronRight size={17} />
            </button>
          </CardState>
        </section>
        <section
          className="glass-panel priority-panel"
          aria-labelledby="priority-title"
        >
          <div className="panel-heading">
            <h2 id="priority-title">Priority Tasks</h2>
            <button
              className="round-button"
              aria-label="Filter high priority tasks"
              onClick={() => onFilter("High")}
            >
              <Settings2 size={18} />
            </button>
          </div>
          <CardState {...state}>
            <div className="priority-list">
              {priority.map((task) => (
                <article className="priority-card" key={task.id}>
                  <span className="priority-avatar">
                    <Folder size={18} />
                  </span>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.description || task.project}</p>
                    <span
                      className={`priority-tag ${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                    <button className="check-link" onClick={() => onEdit(task)}>
                      Check
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
              {!priority.length && (
                <CardEmpty
                  message="No high-priority tasks."
                  action="View all tasks"
                  onAction={() => onNavigate("All tasks")}
                />
              )}
            </div>
          </CardState>
        </section>
      </aside>
    </div>
  );
}

CardState.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  children: PropTypes.node,
};
CardEmpty.propTypes = {
  message: PropTypes.string.isRequired,
  action: PropTypes.string,
  onAction: PropTypes.func,
};
ProjectRing.propTypes = {
  tasks: tasksType.isRequired,
  projects: PropTypes.arrayOf(PropTypes.string),
};
TaskActivity.propTypes = {
  tasks: tasksType.isRequired,
  period: PropTypes.string,
  showSettings: PropTypes.bool,
};
TaskOverview.propTypes = {
  tasks: tasksType.isRequired,
  onFilter: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};
ProjectDashboard.propTypes = {
  tasks: tasksType.isRequired,
  activityTasks: tasksType,
  projects: PropTypes.arrayOf(PropTypes.string).isRequired,
  busy: PropTypes.bool,
  period: PropTypes.string,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onFilter: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};
