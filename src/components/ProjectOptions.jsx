import PropTypes from "prop-types";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

export default function ProjectOptions({
  projects,
  disabled,
  onCreate,
  onRename,
  onRemove,
}) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [removing, setRemoving] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const locked = disabled || working;

  async function perform(action) {
    if (locked) return;
    setWorking(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  function addProject() {
    perform(async () => {
      await onCreate(newName);
      setNewName("");
    });
  }

  function renameProject(project) {
    perform(async () => {
      await onRename(project, name);
      setEditing(null);
    });
  }

  return (
    <section className="project-options" aria-label="Manage project options">
      <div className="project-options-add">
        <input
          aria-label="New project name"
          autoFocus
          maxLength={60}
          value={newName}
          placeholder="New project name"
          disabled={locked}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              addProject();
            }
          }}
        />
        <button
          className="button secondary"
          type="button"
          disabled={locked || !newName.trim()}
          onClick={addProject}
        >
          <Plus size={15} /> Add
        </button>
      </div>
      <div className="project-options-list">
        {projects.map((project) => (
          <div className="project-option-row" key={project}>
            {editing === project ? (
              <>
                <input
                  aria-label={`Rename ${project}`}
                  autoFocus
                  maxLength={60}
                  value={name}
                  disabled={locked}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.stopPropagation();
                      renameProject(project);
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      setEditing(null);
                    }
                  }}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Save project name for ${project}`}
                  disabled={locked || !name.trim()}
                  onClick={() => renameProject(project)}
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Cancel rename"
                  disabled={locked}
                  onClick={() => setEditing(null)}
                >
                  <X size={16} />
                </button>
              </>
            ) : removing === project ? (
              <>
                <span className="project-remove-message">
                  Remove {project}? Tasks move to Inbox.
                </span>
                <button
                  type="button"
                  className="project-text-button danger"
                  disabled={locked}
                  onClick={() =>
                    perform(async () => {
                      await onRemove(project);
                      setRemoving(null);
                    })
                  }
                >
                  Remove
                </button>
                <button
                  type="button"
                  className="project-text-button"
                  disabled={locked}
                  onClick={() => setRemoving(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="project-option-name">{project}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Rename ${project}`}
                  disabled={locked}
                  onClick={() => {
                    setEditing(project);
                    setName(project);
                    setRemoving(null);
                    setError("");
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${project}`}
                  disabled={locked}
                  onClick={() => {
                    setRemoving(project);
                    setEditing(null);
                    setError("");
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
        {!projects.length && (
          <p className="project-help">No projects yet. Add one above.</p>
        )}
      </div>
      <p className="project-help">
        Renaming updates its tasks. Removing a project keeps its tasks in Inbox.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

ProjectOptions.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.string).isRequired,
  disabled: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
