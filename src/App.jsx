import { userType } from "./lib/propTypes";
import { useEffect, useRef, useState } from "react";
import { UserButton, useClerk, useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CircleCheck,
  Clock3,
  Folder,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Layers,
  ListTodo,
  Mail,
  Plus,
  Search,
  Settings,
  Target,
  X,
} from "lucide-react";
import useTasks from "./lib/useTasks";
import {
  dateKey,
  DEFAULT_PROJECTS,
  dueLabel,
  exportTasks,
  PRIORITIES,
} from "./lib/tasks";
import TaskEditor from "./components/TaskEditor";
import ProjectOptions from "./components/ProjectOptions";
import { readProjects, validateProjectName } from "./lib/projects";
import ProjectDashboard, {
  ProjectRing,
  TaskActivity,
  TaskOverview,
} from "./components/ProjectDashboard";
import TaskWorkspace from "./components/TaskWorkspace";
import WelcomeScreen from "./components/WelcomeScreen";
import useWorkspaceNavigation from "./lib/useWorkspaceNavigation";
import {
  PAGE_PATHS,
  WORKSPACE_HOME,
  signInDestination,
  signInPath,
} from "./lib/navigation";
import "./App.css";
import "./styles/dashboard.css";
import { trapDialogFocus } from "./lib/dialogFocus";

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function AuthenticatedApp() {
  const { user, isLoaded } = useUser();
  const location = useLocation();
  const [loadFailed, setLoadFailed] = useState(false);
  const [authDestination, setAuthDestination] = useState(() =>
    signInDestination(location.search),
  );
  const hasReturnTo = new URLSearchParams(location.search).has("returnTo");
  const destination = hasReturnTo
    ? signInDestination(location.search)
    : authDestination;
  useEffect(() => {
    if (hasReturnTo || /^\/(sign-in|sign-up)\/?$/.test(location.pathname)) {
      setAuthDestination(signInDestination(location.search));
    }
  }, [location.pathname, location.search, hasReturnTo]);
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setLoadFailed(true), 12000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  if (!isLoaded)
    return (
      <WelcomeScreen
        loading
        loadFailed={loadFailed}
        destination={destination}
      />
    );
  if (!user)
    return (
      <Routes>
        <Route
          path="/sign-in/*"
          element={<WelcomeScreen destination={destination} />}
        />
        <Route
          path="/sign-up/*"
          element={<WelcomeScreen mode="sign-up" destination={destination} />}
        />
        <Route
          path="*"
          element={
            <Navigate
              to={signInPath(location.pathname, location.search)}
              replace
            />
          }
        />
      </Routes>
    );

  return (
    <Routes>
      <Route path="/app/*" element={<Workspace key={user.id} user={user} />} />
      <Route path="*" element={<Navigate to={destination} replace />} />
    </Routes>
  );
}

export default function App() {
  return hasClerk ? <AuthenticatedApp /> : <WelcomeScreen configured={false} />;
}

function Workspace({ user }) {
  const { openUserProfile, signOut } = useClerk();
  const {
    tasks,
    loading,
    busy,
    error,
    warning,
    connection,
    pendingCount,
    save,
    reassignProject,
    reload,
  } = useTasks(user);
  const scope = user.id;
  const {
    page,
    pathname,
    navigate,
    view,
    setView,
    query,
    setQuery,
    priority,
    setPriority,
    status,
    setStatus,
    sort,
    setSort,
    month,
    setMonth,
  } = useWorkspaceNavigation();
  const [searchTerm, setSearchTerm] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(query), 180);
    return () => clearTimeout(timer);
  }, [query]);
  const reducedMotion = useReducedMotion();
  const headingRef = useRef(null);
  const mainRef = useRef(null);
  const previousPath = useRef(pathname);
  const [period, setPeriod] = useState("This Month");
  const [editor, setEditor] = useState(null);
  const [projectDialog, setProjectDialog] = useState(false);
  const [notice, setNotice] = useState(null);
  const [notifications, setNotifications] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const notificationRef = useRef(null);
  const notificationTrigger = useRef(null);
  const profileRef = useRef(null);
  const profileTrigger = useRef(null);
  const [workspaceName, setWorkspaceName] = useState(() =>
    localValue(
      `tasky-name-${scope}`,
      user.fullName || user.username || "My workspace",
    ),
  );
  const [nameDraft, setNameDraft] = useState(workspaceName);
  const [projectNames, setProjectNames] = useState(() => {
    try {
      return readProjects(localStorage, scope);
    } catch {
      return DEFAULT_PROJECTS;
    }
  });
  const searchRef = useRef(null);
  const projectRef = useRef(null);
  const today = dateKey();
  const projects = [
    ...new Set([
      ...projectNames,
      ...tasks
        .map((task) => task.project)
        .filter((project) => project !== "Inbox"),
    ]),
  ];
  const isProject = !!page && !Object.hasOwn(PAGE_PATHS, page);
  const active = tasks.filter((task) => task.status !== "Done");
  const dueToday = active.filter((task) => task.dueDate === today);
  const overdue = active.filter((task) => task.dueDate && task.dueDate < today);

  useEffect(() => {
    const close = (event) => {
      if (notifications && !notificationRef.current?.contains(event.target))
        setNotifications(false);
      if (profileMenu && !profileRef.current?.contains(event.target))
        setProfileMenu(false);
    };
    const escape = (event) => {
      if (event.key !== "Escape") return;
      if (notifications) {
        setNotifications(false);
        notificationTrigger.current?.focus();
      }
      if (profileMenu) {
        setProfileMenu(false);
        profileTrigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [notifications, profileMenu]);

  useEffect(() => {
    function shortcut(event) {
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") setNotifications(false);
      const typing =
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName,
        ) || document.activeElement?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (
        event.key === "n" &&
        !typing &&
        !event.metaKey &&
        !event.ctrlKey &&
        !loading &&
        !error
      ) {
        event.preventDefault();
        setEditor({});
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [loading, error]);
  useEffect(() => {
    if (!notice || notice.task) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (projectDialog) projectRef.current?.showModal();
  }, [projectDialog]);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setNotifications(false);
    headingRef.current?.focus({ preventScroll: true });
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  useEffect(() => {
    document.title = `${page || "Workspace"} · Tasky`;
  }, [page]);
  function newTask(overrides = {}) {
    if (!loading && !error)
      setEditor({ project: isProject ? page : "Inbox", ...overrides });
  }
  async function updateTask(task) {
    try {
      return await save(task);
    } catch (err) {
      setNotice({ message: err.message, error: true });
      throw err;
    }
  }
  async function changeStatus(task, next) {
    try {
      return await updateTask({
        ...task,
        status: next,
        completedAt: next === "Done" ? new Date().toISOString() : null,
      });
    } catch {
      return false;
    }
  }
  async function toggleTask(task) {
    const done = task.status !== "Done";
    if (await changeStatus(task, done ? "Done" : "To do"))
      setNotice({ message: done ? "Task completed." : "Task reopened." });
  }
  async function deleteTask(task) {
    if (await save(task, true)) {
      setEditor(null);
      setNotice({ message: "Task deleted.", task });
    }
  }
  async function undoDelete() {
    try {
      if (await save(notice.task)) setNotice({ message: "Task restored." });
    } catch (err) {
      setNotice({ ...notice, message: err.message, error: true });
    }
  }
  function storeProjects(names) {
    try {
      localStorage.setItem(`tasky-projects-${scope}-v2`, JSON.stringify(names));
    } catch {
      throw new Error(
        "Your projects could not be saved. Check browser storage.",
      );
    }
  }
  function createProject(value) {
    const name = validateProjectName(value, projects);
    const next = [...projects, name];
    storeProjects(next);
    setProjectNames(next);
    return name;
  }
  async function renameProject(original, value) {
    const name = validateProjectName(value, projects, original);
    if (name === original) return name;
    const next = projects.map((project) =>
      project === original ? name : project,
    );
    storeProjects(next);
    try {
      await reassignProject(original, name);
    } catch (err) {
      storeProjects(projects);
      throw err;
    }
    setProjectNames(next);
    if (isProject && page === original) navigate(name);
    return name;
  }
  async function removeProject(name) {
    const next = projects.filter((project) => project !== name);
    storeProjects(next);
    try {
      await reassignProject(name, "Inbox");
    } catch (err) {
      storeProjects(projects);
      throw err;
    }
    setProjectNames(next);
    if (isProject && page === name) navigate("Projects");
  }
  function filterTasks(filter) {
    navigate(
      filter === "Overdue" || filter === "Unscheduled" ? filter : "All tasks",
      {
        priority: filter === "High" ? "High" : "All priorities",
        status: ["To do", "In progress", "Done"].includes(filter)
          ? filter
          : filter === "High"
            ? "Active"
            : "All statuses",
        query: "",
      },
    );
  }

  const filtered = tasks
    .filter((task) => {
      if (page === "Today" && task.dueDate !== today) return false;
      if (page === "Upcoming" && (!task.dueDate || task.dueDate < today))
        return false;
      if (page === "Completed" && task.status !== "Done") return false;
      if (page === "Inbox" && task.project !== "Inbox") return false;
      if (
        page === "Overdue" &&
        (task.status === "Done" || !task.dueDate || task.dueDate >= today)
      )
        return false;
      if (page === "Unscheduled" && task.dueDate) return false;
      if (isProject && task.project !== page) return false;
      if (status === "Active" && task.status === "Done") return false;
      if (
        ["To do", "In progress", "Done"].includes(status) &&
        task.status !== status
      )
        return false;
      if (priority !== "All priorities" && task.priority !== priority)
        return false;
      return `${task.title} ${task.description} ${task.project}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === "Priority")
        return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
      if (sort === "Newest first") return b.createdAt - a.createdAt;
      if (sort === "Task name") return a.title.localeCompare(b.title);
      return (
        (a.dueDate || "9999").localeCompare(b.dueDate || "9999") ||
        b.createdAt - a.createdAt
      );
    });
  const dashboardTasks = tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description} ${task.project}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (!matchesSearch || !task.dueDate) return matchesSearch;
    if (period === "Today") return task.dueDate === today;
    if (period === "This Week") {
      const start = new Date();
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return task.dueDate >= dateKey(start) && task.dueDate <= dateKey(end);
    }
    return task.dueDate.startsWith(today.slice(0, 7));
  });
  const activityTasks = tasks.filter((task) =>
    `${task.title} ${task.description} ${task.project}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );
  const visibleProjects = searchTerm.trim()
    ? projects.filter(
        (project) =>
          project.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activityTasks.some((task) => task.project === project),
      )
    : projects;
  const title =
    page === "Overview"
      ? "Project Dashboard"
      : page === "Reports"
        ? "Task Reports"
        : page === "Projects"
          ? "My Projects"
          : page === "Settings"
            ? "Workspace Settings"
            : page === "Help"
              ? "Workspace Guide"
              : isProject
                ? page
                : page === "All tasks"
                  ? "My Tasks"
                  : `${page} Tasks`;
  const navigation = [
    [LayoutDashboard, "Overview"],
    [ListTodo, "All tasks"],
    [Inbox, "Inbox"],
    [CalendarDays, "Today"],
    [CircleCheck, "Completed"],
    [Layers, "Projects"],
    [Clock3, "Upcoming"],
    [Target, "Reports"],
    [HelpCircle, "Help"],
    [Settings, "Settings"],
  ];
  const isTaskPage = ![
    "Overview",
    "Projects",
    "Reports",
    "Settings",
    "Help",
  ].includes(page);

  if (!page) return <Navigate to={WORKSPACE_HOME} replace />;

  return (
    <div className="workspace">
      <header className="dashboard-header">
        <button
          className="wordmark"
          title="Open project dashboard"
          onClick={() => navigate("Overview")}
        >
          <span>tasky</span>
          <small>workspace.</small>
        </button>
        <nav className="period-tabs" aria-label="Dashboard date range">
          {["Today", "This Week", "This Month", "Reports"].map((value) => (
            <button
              key={value}
              className={
                (
                  value === "Reports"
                    ? page === "Reports"
                    : period === value && page !== "Reports"
                )
                  ? "selected"
                  : ""
              }
              aria-pressed={
                value === "Reports"
                  ? page === "Reports"
                  : period === value && page !== "Reports"
              }
              onClick={() => {
                if (value === "Reports") navigate("Reports");
                else {
                  setPeriod(value);
                  navigate("Overview");
                }
              }}
            >
              {value}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className={`header-icon ${active.some((task) => task.project === "Inbox") ? "has-dot" : ""}`}
            aria-label="Open task inbox"
            title="Task inbox"
            onClick={() => navigate("Inbox")}
          >
            <Mail size={16} />
          </button>
          <div className="notifications-wrap" ref={notificationRef}>
            <button
              ref={notificationTrigger}
              className={`header-icon ${overdue.length || dueToday.length ? "has-dot" : ""}`}
              aria-label="Due date reminders"
              aria-expanded={notifications}
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={16} />
            </button>
            <AnimatePresence>
              {notifications && (
                <motion.div
                  className="notification-panel"
                  initial={reducedMotion ? false : { opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: reducedMotion ? 0 : 0.14 }}
                >
                  <strong>Task reminders</strong>
                  <p>
                    {overdue.length} overdue · {dueToday.length} due today
                  </p>
                  {[...overdue, ...dueToday].slice(0, 5).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setEditor(task);
                        setNotifications(false);
                      }}
                    >
                      {task.title}
                      <small>{dueLabel(task.dueDate)}</small>
                    </button>
                  ))}
                  {!overdue.length && !dueToday.length && (
                    <p>You’re all caught up.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            className="header-icon"
            aria-label="Open workspace guide"
            onClick={() => navigate("Help")}
          >
            <HelpCircle size={16} />
          </button>
          <button
            className="header-icon"
            aria-label="Open settings"
            onClick={() => navigate("Settings")}
          >
            <Settings size={16} />
          </button>
          <div className="profile-block" ref={profileRef}>
            <UserButton />
            <button
              className="profile-text"
              ref={profileTrigger}
              title="Open profile menu"
              aria-expanded={profileMenu}
              aria-controls="workspace-profile-menu"
              onClick={() => setProfileMenu((value) => !value)}
            >
              <strong>{workspaceName}</strong>
              <small>Task manager</small>
            </button>
            {profileMenu && (
              <div
                className="profile-menu"
                id="workspace-profile-menu"
                aria-label="Profile options"
              >
                <button
                  onClick={() => {
                    setProfileMenu(false);
                    openUserProfile();
                  }}
                >
                  Account settings
                </button>
                <button
                  onClick={() => {
                    setProfileMenu(false);
                    navigate("Settings");
                  }}
                >
                  Workspace settings
                </button>
                <button
                  onClick={async () => {
                    try {
                      await signOut({ redirectUrl: "/sign-in" });
                    } catch {
                      setNotice({
                        message: "Sign out failed. Please try again.",
                        error: true,
                      });
                    }
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="workspace-body">
        <LayoutGroup id="workspace-navigation">
          <nav className="icon-rail" aria-label="Workspace navigation">
            {navigation.map(([Icon, label]) => (
              <motion.button
                key={label}
                className={
                  page === label || (label === "All tasks" && isProject)
                    ? "selected"
                    : ""
                }
                aria-label={label}
                aria-current={page === label ? "page" : undefined}
                title={label}
                data-tooltip={label}
                onClick={() => navigate(label)}
                whileHover={reducedMotion ? undefined : { y: -2, scale: 1.04 }}
                whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                transition={{ duration: 0.12 }}
              >
                {(page === label || (label === "All tasks" && isProject)) && (
                  <motion.span
                    className="active-nav-indicator"
                    aria-hidden="true"
                    layoutId={reducedMotion ? undefined : "active-page"}
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon size={17} />
              </motion.button>
            ))}
          </nav>
        </LayoutGroup>
        <main className="main-content" ref={mainRef}>
          <section className="page-heading">
            <div>
              <p>Manage and track your projects</p>
              <h1 ref={headingRef} tabIndex={-1}>
                {title}
              </h1>
            </div>
            <label className="global-search">
              <Search size={24} strokeWidth={1} />
              <input
                ref={!isTaskPage ? searchRef : undefined}
                aria-label="Search workspace tasks"
                placeholder="Search Task, Projects..."
                value={query}
                onChange={(event) => {
                  if (page === "Settings" || page === "Help") {
                    navigate("All tasks", {
                      query: event.target.value,
                      status: "All statuses",
                    });
                    return;
                  }
                  setQuery(event.target.value);
                }}
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X size={15} />
                </button>
              )}
            </label>
          </section>
          <motion.div
            key={pathname}
            className="page-content"
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {page === "Overview" &&
              searchTerm.trim() &&
              !dashboardTasks.length &&
              !loading &&
              !error && (
                <section className="search-empty" role="status">
                  <Search size={22} aria-hidden="true" />
                  <div>
                    <h2>No results found</h2>
                    <p>Try another task or project name.</p>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => setQuery("")}
                  >
                    Clear search
                  </button>
                </section>
              )}
            {page === "Overview" && (
              <ProjectDashboard
                tasks={dashboardTasks}
                activityTasks={activityTasks}
                projects={visibleProjects}
                loading={loading}
                error={error}
                onRetry={reload}
                busy={busy}
                period={period}
                onAdd={newTask}
                onEdit={setEditor}
                onToggle={toggleTask}
                onNavigate={navigate}
                onFilter={filterTasks}
              />
            )}
            {isTaskPage && (
              <TaskWorkspace
                title={isProject ? "Project Tasks" : title}
                tasks={filtered}
                loading={loading}
                busy={busy}
                error={error}
                query={query}
                onQuery={setQuery}
                searchRef={searchRef}
                view={view}
                onView={(next) => {
                  setView(next);
                  if (next === "Board" && status === "Active")
                    setStatus("All statuses");
                }}
                status={status}
                onStatus={setStatus}
                priority={priority}
                onPriority={setPriority}
                sort={sort}
                onSort={setSort}
                month={month}
                onMonth={setMonth}
                onAdd={newTask}
                onEdit={setEditor}
                onToggle={toggleTask}
                onChangeStatus={changeStatus}
                onExport={() => exportTasks(filtered)}
                onReload={reload}
              />
            )}
            {page === "Projects" && (
              <section className="glass-panel projects-page">
                <div className="section-heading">
                  <h2>
                    My Projects <span>{projects.length}</span>
                  </h2>
                  <button
                    className="button primary"
                    onClick={() => setProjectDialog(true)}
                  >
                    <Plus size={16} />
                    Manage projects
                  </button>
                </div>
                <div className="project-grid">
                  {projects
                    .filter((project) =>
                      project.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((project, index) => {
                      const items = tasks.filter(
                        (task) => task.project === project,
                      );
                      const done = items.filter(
                        (task) => task.status === "Done",
                      ).length;
                      const progress = items.length
                        ? Math.round((done / items.length) * 100)
                        : 0;
                      return (
                        <button
                          key={project}
                          className={`project-card pastel-${index % 4}`}
                          onClick={() => navigate(project)}
                        >
                          <div className="project-card-top">
                            <Folder size={21} />
                            <ArrowUpRight size={17} />
                          </div>
                          <h3>{project}</h3>
                          <p>
                            {items.length} tasks · {done} completed
                          </p>
                          <div className="project-progress-label">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <span className="striped-track">
                            <span
                              className={`striped-fill ${["violet", "cyan", "emerald", "amber"][index % 4]}`}
                              style={{ width: `${progress}%` }}
                            />
                          </span>
                        </button>
                      );
                    })}
                </div>
              </section>
            )}
            {page === "Reports" && (
              <div className="reports-page">
                <div className="reports-top">
                  <section className="glass-panel overview-ring-panel">
                    <div className="panel-heading">
                      <h2>Projects Overview</h2>
                      <button
                        className="round-button"
                        aria-label="View projects"
                        onClick={() => navigate("Projects")}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </div>
                    <ProjectRing tasks={dashboardTasks} projects={projects} />
                  </section>
                  <section className="glass-panel activity-panel">
                    <div className="panel-heading">
                      <h2>Task Activity</h2>
                      <button
                        className="round-button"
                        aria-label="Export task report"
                        onClick={() => exportTasks(dashboardTasks)}
                      >
                        <ArrowDownToLine size={16} />
                      </button>
                    </div>
                    <TaskActivity tasks={activityTasks} period={period} />
                  </section>
                  <section className="glass-panel report-summary">
                    <h2>Task Summary</h2>
                    <dl>
                      <div>
                        <dt>Total tasks</dt>
                        <dd>{dashboardTasks.length}</dd>
                      </div>
                      <div>
                        <dt>Due today</dt>
                        <dd>{dueToday.length}</dd>
                      </div>
                      <div>
                        <dt>Overdue</dt>
                        <dd>{overdue.length}</dd>
                      </div>
                      <div>
                        <dt>Projects</dt>
                        <dd>{projects.length}</dd>
                      </div>
                    </dl>
                    <button
                      className="button secondary"
                      onClick={() => exportTasks(dashboardTasks)}
                    >
                      <ArrowDownToLine size={15} />
                      Export report
                    </button>
                  </section>
                </div>
                <TaskOverview tasks={dashboardTasks} onFilter={filterTasks} />
              </div>
            )}
            {page === "Settings" && (
              <section className="glass-panel settings-page">
                <h2>Workspace Profile</h2>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!nameDraft.trim()) return;
                    try {
                      localStorage.setItem(
                        `tasky-name-${scope}`,
                        nameDraft.trim(),
                      );
                      setWorkspaceName(nameDraft.trim());
                      setNotice({ message: "Workspace profile saved." });
                    } catch {
                      setNotice({
                        message:
                          "Profile could not be saved. Check browser storage.",
                        error: true,
                      });
                    }
                  }}
                >
                  <label>
                    Display name
                    <input
                      required
                      maxLength={50}
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                    />
                  </label>
                  <button className="button primary">Save changes</button>
                </form>
                <div className="settings-section">
                  <h2>Workspace Storage</h2>
                  <p>
                    {connection === "cloud"
                      ? "Your tasks are synced with your account."
                      : "Your account tasks are saved on this device while cloud sync is unavailable."}
                  </p>
                  {user && (
                    <button
                      className="button secondary"
                      disabled={loading || busy}
                      onClick={reload}
                    >
                      Retry cloud sync
                    </button>
                  )}
                </div>
                <div className="settings-section">
                  <h2>Export Your Tasks</h2>
                  <p>
                    Download a CSV containing your tasks, descriptions,
                    projects, statuses, priorities, and due dates.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => exportTasks(tasks)}
                  >
                    <ArrowDownToLine size={16} />
                    Export all tasks
                  </button>
                </div>
              </section>
            )}
            {page === "Help" && (
              <section className="glass-panel help-page">
                <h2>Your task management workspace</h2>
                <div className="help-grid">
                  {[
                    [
                      "Create and organize",
                      "Use the + button in My Tasks, or press N. Add a project, priority, due date, description, and subtasks.",
                    ],
                    [
                      "Track your progress",
                      "Complete tasks with the circular check button. Open a task to edit it, change its status, or manage subtasks.",
                    ],
                    [
                      "Plan your schedule",
                      "Open Upcoming from the clock icon. Select a day in Calendar to add a scheduled task.",
                    ],
                    [
                      "Find your tasks",
                      "Press Ctrl K or use search. My Tasks has filters, sorting, List, Board, Calendar, and CSV export.",
                    ],
                    [
                      "Manage projects",
                      "Open Projects from the layers icon. Create a project and add tasks to it. Select a project to see its tasks.",
                    ],
                    [
                      "Keep your work",
                      "Your account changes queue on this device during cloud outages. Use Retry sync when the service is restored.",
                    ],
                  ].map(([heading, text]) => (
                    <article key={heading}>
                      <h3>{heading}</h3>
                      <p>{text}</p>
                    </article>
                  ))}
                </div>
                <button
                  className="button primary"
                  onClick={() => navigate("Overview")}
                >
                  Back to dashboard <ArrowRight size={15} />
                </button>
              </section>
            )}
          </motion.div>
          <footer className="workspace-footer">
            <span>
              <i
                className={connection === "offline" || error ? "offline" : ""}
              />
              {loading
                ? "Opening workspace..."
                : error
                  ? "Browser storage needs attention"
                  : connection === "cloud"
                    ? "Tasks synced"
                    : `Saved on this device${pendingCount ? ` · ${pendingCount} pending sync` : ""}`}
            </span>
            {warning && (
              <button
                title={warning}
                disabled={busy || loading}
                onClick={reload}
              >
                Cloud unavailable · Retry sync <ArrowRight size={12} />
              </button>
            )}
            {!isTaskPage && (
              <button disabled={loading || !!error} onClick={() => newTask()}>
                <Plus size={13} />
                New task
              </button>
            )}
          </footer>
          {warning && (
            <p className="sync-explanation" role="status">
              {warning}
            </p>
          )}
        </main>
      </div>
      {editor && (
        <TaskEditor
          task={editor}
          projects={projects}
          onCreateProject={createProject}
          onRenameProject={renameProject}
          onRemoveProject={removeProject}
          busy={busy}
          onClose={() => setEditor(null)}
          onDelete={deleteTask}
          onSave={async (task) => {
            if (await updateTask(task)) {
              setEditor(null);
              setNotice({
                message: task.id ? "Task updated." : "Task created.",
              });
            }
          }}
        />
      )}
      {projectDialog && (
        <dialog
          ref={projectRef}
          className="task-dialog project-dialog"
          onKeyDown={trapDialogFocus}
          aria-labelledby="project-dialog-title"
          onCancel={(event) => {
            event.preventDefault();
            if (!busy) setProjectDialog(false);
          }}
        >
          <div className="dialog-layout">
            <header className="dialog-header">
              <h2 id="project-dialog-title">Manage projects</h2>
              <button
                className="icon-button"
                type="button"
                aria-label="Close project dialog"
                disabled={busy}
                onClick={() => setProjectDialog(false)}
              >
                <X size={19} />
              </button>
            </header>
            <div className="dialog-content">
              <ProjectOptions
                projects={projects}
                disabled={busy || loading || !!error}
                onCreate={createProject}
                onRename={renameProject}
                onRemove={removeProject}
              />
              <p className="project-help">
                Projects are saved on this device. Projects with synced tasks
                follow your account.
              </p>
            </div>
            <footer className="dialog-footer">
              <button
                className="button primary"
                type="button"
                disabled={busy}
                onClick={() => setProjectDialog(false)}
              >
                Done
              </button>
            </footer>
          </div>
        </dialog>
      )}
      {notice && (
        <div
          className={`toast ${notice.error ? "error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          <span>{notice.message}</span>
          {notice.task && (
            <button onClick={undoDelete} disabled={busy}>
              Undo
            </button>
          )}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function localValue(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

Workspace.propTypes = { user: userType.isRequired };
