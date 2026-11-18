import PropTypes from "prop-types";
import { tasksType } from "../lib/propTypes";
import {
  ArrowDownToLine,
  CheckCheck,
  Folder,
  LayoutGrid,
  List,
  CalendarDays,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { PRIORITIES, STATUSES } from "../lib/tasks";
import { BoardView, CalendarView, TaskItem } from "./TaskViews";
import { motion, useReducedMotion } from "motion/react";

export default function TaskWorkspace({
  title,
  tasks,
  loading,
  error,
  busy,
  query,
  onQuery,
  searchRef,
  view,
  onView,
  status,
  onStatus,
  priority,
  onPriority,
  sort,
  onSort,
  month,
  onMonth,
  onAdd,
  onEdit,
  onToggle,
  onChangeStatus,
  onExport,
  onReload,
}) {
  const reducedMotion = useReducedMotion();
  return (
    <section className="task-workspace glass-panel">
      <div className="section-heading">
        <h2>
          {title}
          <span>{tasks.length}</span>
        </h2>
        <div className="view-switch">
          {[
            [List, "List"],
            [LayoutGrid, "Board"],
            [CalendarDays, "Calendar"],
          ].map(([Icon, label]) => (
            <button
              key={label}
              aria-label={`${label} view`}
              aria-pressed={view === label}
              className={view === label ? "selected" : ""}
              onClick={() => onView(label)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="task-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            ref={searchRef}
            aria-label="Search tasks"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search tasks or projects..."
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => onQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </label>
        <div className="filters">
          <label className="filter-select">
            <Settings2 size={14} />
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => onStatus(event.target.value)}
            >
              <option>Active</option>
              <option>All statuses</option>
              {STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <select
              aria-label="Filter by priority"
              value={priority}
              onChange={(event) => onPriority(event.target.value)}
            >
              <option>All priorities</option>
              {PRIORITIES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <select
              aria-label="Sort tasks"
              value={sort}
              onChange={(event) => onSort(event.target.value)}
            >
              {["Due date", "Priority", "Newest first", "Task name"].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
          <button
            className="round-button"
            title="Export tasks"
            aria-label="Export tasks as CSV"
            disabled={!tasks.length}
            onClick={onExport}
          >
            <ArrowDownToLine size={16} />
          </button>
          <button
            className="button primary"
            disabled={loading || !!error}
            onClick={() => onAdd()}
          >
            <Plus size={16} />
            New task
          </button>
        </div>
      </div>
      <motion.div
        key={view}
        className="task-view-content"
        initial={reducedMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.15 }}
      >
        {loading ? (
          <div className="loading-state">
            <span className="loading-spinner" />
            Loading your tasks...
          </div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <Folder size={28} />
            <h3>Your workspace needs attention</h3>
            <p>{error}</p>
            <button className="button primary" onClick={onReload}>
              Try again
            </button>
          </div>
        ) : view === "Calendar" ? (
          <CalendarView
            tasks={tasks}
            month={month}
            onMonth={onMonth}
            onAdd={onAdd}
            onEdit={onEdit}
          />
        ) : !tasks.length ? (
          <div className="empty-state">
            <CheckCheck size={28} />
            <h3>No tasks in this view</h3>
            <p>Adjust your filters or add your next task.</p>
            <button className="button primary" onClick={() => onAdd()}>
              <Plus size={15} />
              Create task
            </button>
          </div>
        ) : view === "Board" ? (
          <BoardView
            tasks={tasks}
            busy={busy}
            onToggle={onToggle}
            onEdit={onEdit}
            onStatus={onChangeStatus}
            onAdd={onAdd}
          />
        ) : (
          <div className="task-list">
            <div className="table-header">
              <span>Task name</span>
              <span>Project</span>
              <span>Priority</span>
              <span>Due date</span>
              <span />
            </div>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                busy={busy}
                onToggle={onToggle}
                onEdit={onEdit}
              />
            ))}
            <button className="list-add" onClick={() => onAdd()}>
              <Plus size={16} />
              Add a new task
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}

TaskWorkspace.propTypes = {
  title: PropTypes.string.isRequired,
  tasks: tasksType.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  busy: PropTypes.bool,
  query: PropTypes.string,
  onQuery: PropTypes.func.isRequired,
  searchRef: PropTypes.shape({ current: PropTypes.object }),
  view: PropTypes.string,
  onView: PropTypes.func.isRequired,
  status: PropTypes.string,
  onStatus: PropTypes.func.isRequired,
  priority: PropTypes.string,
  onPriority: PropTypes.func.isRequired,
  sort: PropTypes.string,
  onSort: PropTypes.func.isRequired,
  month: PropTypes.instanceOf(Date),
  onMonth: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired,
};
