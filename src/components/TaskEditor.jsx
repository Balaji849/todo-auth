import PropTypes from "prop-types";
import { taskType } from "../lib/propTypes";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { PRIORITIES, STATUSES, dateKey } from "../lib/tasks";
import ProjectOptions from "./ProjectOptions";
import { trapDialogFocus } from "../lib/dialogFocus";

export default function TaskEditor({
  task,
  projects,
  busy,
  onSave,
  onClose,
  onDelete,
  onCreateProject,
  onRenameProject,
  onRemoveProject,
}) {
  const [draft, setDraft] = useState(() => ({
    title: "",
    description: "",
    project: "Inbox",
    status: "To do",
    priority: "Medium",
    dueDate: dateKey(),
    subtasks: [],
    ...task,
  }));
  const [subtask, setSubtask] = useState("");
  const [error, setError] = useState("");
  const [managingProjects, setManagingProjects] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  const update = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setError("");
    try {
      await onSave({
        ...draft,
        title: draft.title.trim(),
        createdAt: draft.createdAt || Date.now(),
        completedAt:
          draft.status === "Done"
            ? draft.completedAt || new Date().toISOString()
            : null,
      });
    } catch (err) {
      setError(err.message);
    }
  }
  function addSubtask() {
    if (!subtask.trim()) return;
    update("subtasks", [
      ...draft.subtasks,
      { id: crypto.randomUUID(), title: subtask.trim(), done: false },
    ]);
    setSubtask("");
  }
  return (
    <dialog
      ref={dialog}
      className="task-dialog"
      onKeyDown={trapDialogFocus}
      aria-labelledby="editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !busy) onClose();
      }}
    >
      <form onSubmit={submit}>
        <header className="dialog-header">
          <div>
            <h2 id="editor-title">
              {task?.id ? "Task details" : "Create a task"}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close task editor"
            onClick={onClose}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </header>
        <div className="dialog-content">
          <label>
            Task name
            <input
              autoFocus
              required
              maxLength={200}
              value={draft.title}
              placeholder="What needs to get done?"
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              maxLength={5000}
              value={draft.description}
              placeholder="Add a little context, notes, or a useful link…"
              onChange={(event) => update("description", event.target.value)}
            />
          </label>
          <div className="form-grid">
            <div className="project-field">
              <div className="project-field-heading">
                <label htmlFor="task-project">Project</label>
                <button
                  type="button"
                  className="project-text-button"
                  disabled={busy}
                  aria-expanded={managingProjects}
                  aria-controls="task-project-options"
                  onClick={() => setManagingProjects((value) => !value)}
                >
                  {managingProjects ? "Done" : "Manage projects"}
                </button>
              </div>
              <select
                id="task-project"
                value={draft.project}
                disabled={busy}
                onChange={(event) => update("project", event.target.value)}
              >
                {[...new Set(["Inbox", ...projects, draft.project])].map(
                  (project) => (
                    <option key={project}>{project}</option>
                  ),
                )}
              </select>
            </div>
            <label>
              Due date
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) => update("dueDate", event.target.value)}
              />
            </label>
            <label>
              Priority
              <select
                value={draft.priority}
                onChange={(event) => update("priority", event.target.value)}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={draft.status}
                onChange={(event) => update("status", event.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          {managingProjects && (
            <div id="task-project-options" className="editor-project-options">
              <ProjectOptions
                projects={projects}
                disabled={busy}
                onCreate={async (name) => {
                  const created = await onCreateProject(name);
                  update("project", created);
                }}
                onRename={async (original, name) => {
                  const renamed = await onRenameProject(original, name);
                  if (draft.project === original) update("project", renamed);
                }}
                onRemove={async (name) => {
                  await onRemoveProject(name);
                  if (draft.project === name) update("project", "Inbox");
                }}
              />
            </div>
          )}
          <div className="subtask-header">
            <strong>Subtasks</strong>
            <span>
              {draft.subtasks.filter((item) => item.done).length} /{" "}
              {draft.subtasks.length}
            </span>
          </div>
          <div className="editor-subtasks">
            {draft.subtasks.map((item) => (
              <div key={item.id}>
                <input
                  type="checkbox"
                  aria-label={`Complete ${item.title}`}
                  checked={item.done}
                  onChange={() =>
                    update(
                      "subtasks",
                      draft.subtasks.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, done: !entry.done }
                          : entry,
                      ),
                    )
                  }
                />
                <span className={item.done ? "struck" : ""}>{item.title}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() =>
                    update(
                      "subtasks",
                      draft.subtasks.filter((entry) => entry.id !== item.id),
                    )
                  }
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="add-subtask">
            <input
              aria-label="New subtask"
              value={subtask}
              maxLength={200}
              placeholder="Break it into a smaller step…"
              onChange={(event) => setSubtask(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSubtask();
                }
              }}
            />
            <button
              type="button"
              className="icon-button"
              aria-label="Add subtask"
              onClick={addSubtask}
            >
              <Plus size={18} />
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className="dialog-footer">
          {task?.id && (
            <button
              className="button danger"
              type="button"
              disabled={busy}
              onClick={async () => {
                try {
                  await onDelete(task);
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
          <div className="footer-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="button primary"
              disabled={busy || !draft.title.trim()}
            >
              {busy ? "Saving…" : task?.id ? "Save changes" : "Create task"}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

TaskEditor.propTypes = {
  task: taskType,
  projects: PropTypes.arrayOf(PropTypes.string).isRequired,
  busy: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onCreateProject: PropTypes.func.isRequired,
  onRenameProject: PropTypes.func.isRequired,
  onRemoveProject: PropTypes.func.isRequired,
};
