import PropTypes from "prop-types";
import { taskType, tasksType } from "../lib/propTypes";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Plus,
} from "lucide-react";
import { dateKey, dueLabel, projectColor, STATUSES } from "../lib/tasks";

export function TaskItem({ task, board, busy, onToggle, onEdit, onStatus }) {
  const overdue =
    task.status !== "Done" && task.dueDate && task.dueDate < dateKey();
  return (
    <article
      className={`task-item ${board ? "board-card" : ""} ${task.status === "Done" ? "is-done" : ""}`}
    >
      <button
        className={`task-check ${task.status === "Done" ? "checked" : ""} ${task.status === "In progress" ? "in-progress" : ""}`}
        disabled={busy}
        onClick={() => onToggle(task)}
        aria-label={`${task.status === "Done" ? "Reopen" : "Complete"} ${task.title}`}
      >
        {task.status === "Done" ? (
          <Check size={13} />
        ) : task.status === "In progress" ? (
          <span />
        ) : null}
      </button>
      <button className="task-title-button" onClick={() => onEdit(task)}>
        <span className="task-title">{task.title}</span>
        {task.subtasks.length > 0 && (
          <span className="subtask-count">
            <ListTodo size={12} />
            {task.subtasks.filter((item) => item.done).length}/
            {task.subtasks.length}
          </span>
        )}
      </button>
      <span className={`project-tag ${projectColor(task.project)}`}>
        <i />
        {task.project}
      </span>
      <span className={`priority-tag ${task.priority.toLowerCase()}`}>
        <span />
        {task.priority}
      </span>
      <span className={`task-date ${overdue ? "overdue" : ""}`}>
        <CalendarDays size={13} />
        {dueLabel(task.dueDate)}
      </span>
      {board && (
        <select
          className="board-status"
          aria-label={`Status for ${task.title}`}
          value={task.status}
          disabled={busy}
          onChange={(event) => onStatus(task, event.target.value)}
        >
          {STATUSES.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      )}
      <button
        className="icon-button task-open"
        title="Open task details"
        aria-label={`Edit ${task.title}`}
        onClick={() => onEdit(task)}
      >
        <ArrowUpRight size={16} />
      </button>
    </article>
  );
}

export function BoardView({ tasks, busy, onToggle, onEdit, onStatus, onAdd }) {
  return (
    <div className="board-view">
      {STATUSES.map((column) => (
        <section className="board-column" key={column}>
          <h3>
            <span
              className={`status-dot ${column.toLowerCase().replaceAll(" ", "-")}`}
            />
            {column}
            <span>{tasks.filter((task) => task.status === column).length}</span>
            <button
              className="icon-button"
              aria-label={`Add task to ${column}`}
              onClick={() => onAdd({ status: column })}
            >
              <Plus size={15} />
            </button>
          </h3>
          {tasks
            .filter((task) => task.status === column)
            .map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                board
                busy={busy}
                onToggle={onToggle}
                onEdit={onEdit}
                onStatus={onStatus}
              />
            ))}
          <button
            className="board-add"
            onClick={() => onAdd({ status: column })}
          >
            <Plus size={15} /> Add task
          </button>
        </section>
      ))}
    </div>
  );
}

export function CalendarView({ tasks, month, onMonth, onAdd, onEdit }) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(1 - ((firstDay.getDay() + 6) % 7));
  return (
    <section className="calendar-view">
      <div className="calendar-toolbar">
        <h3>
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div>
          <button
            className="button secondary small"
            onClick={() =>
              onMonth(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              )
            }
          >
            Today
          </button>
          <button
            className="icon-button"
            aria-label="Previous month"
            onClick={() =>
              onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Next month"
            onClick={() =>
              onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span className="weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: 42 }, (_, index) => {
          const date = new Date(start);
          date.setDate(start.getDate() + index);
          const key = dateKey(date);
          return (
            <div
              key={key}
              className={`calendar-cell ${date.getMonth() !== month.getMonth() ? "outside" : ""}`}
            >
              <button
                className={`calendar-day ${key === dateKey() ? "current-day" : ""}`}
                aria-label={`Add task on ${key}`}
                onClick={() => onAdd({ dueDate: key })}
              >
                {date.getDate()}
              </button>
              {tasks
                .filter((task) => task.dueDate === key)
                .map((task) => (
                  <button
                    key={task.id}
                    className={`calendar-task ${projectColor(task.project)} ${task.status === "Done" ? "struck" : ""}`}
                    onClick={() => onEdit(task)}
                  >
                    {task.title}
                  </button>
                ))}
            </div>
          );
        })}
      </div>
      <p className="calendar-hint">
        Select a date to plan a task. Tasks without a due date appear in List
        and Board.
      </p>
    </section>
  );
}

TaskItem.propTypes = {
  task: taskType.isRequired,
  board: PropTypes.bool,
  busy: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onStatus: PropTypes.func,
};
BoardView.propTypes = {
  tasks: tasksType.isRequired,
  busy: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onStatus: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};
CalendarView.propTypes = {
  tasks: tasksType.isRequired,
  month: PropTypes.instanceOf(Date).isRequired,
  onMonth: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};
