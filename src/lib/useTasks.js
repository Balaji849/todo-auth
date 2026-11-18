import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { normalizeTask, sampleTasks } from "./tasks";
import { reassignProjectTasks } from "./projects";

const firebaseUrl =
  import.meta.env.VITE_FIREBASE_DATABASE_URL ||
  "https://todos-app-5e27d-default-rtdb.asia-southeast1.firebasedatabase.app/";
const database = firebaseUrl.replace(/\/$/, "");

function cloudRecord(task, userId, username) {
  const record = { ...task, ownerId: userId, createdBy: username || userId };
  delete record.id;
  return record;
}

function writeCloud(id, task, userId, username, signal) {
  return axios({
    method: task ? "put" : "delete",
    url: `${database}/todos/${encodeURIComponent(id)}.json`,
    data: task ? cloudRecord(task, userId, username) : undefined,
    signal,
    timeout: 12000,
  });
}

export default function useTasks(user) {
  const userId = user?.id;
  const username = user?.username;
  const scope = userId || "guest";
  const storageKey = userId
    ? `tasky-account-${userId}-v1`
    : "tasky-guest-workspace-v1";
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [connection, setConnection] = useState(userId ? "connecting" : "local");
  const [pendingCount, setPendingCount] = useState(0);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const cache = useRef({ tasks: [], pending: {} });
  const activeScope = useRef(scope);

  useEffect(() => {
    const controller = new AbortController();
    activeScope.current = scope;
    setLoading(true);
    setError("");
    setWarning("");

    function display(data) {
      cache.current = data;
      setTasks(data.tasks);
      setPendingCount(Object.keys(data.pending).length);
    }

    async function load() {
      let stored;
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        stored = Array.isArray(parsed)
          ? { tasks: parsed, pending: {} }
          : parsed;
        stored ||= { tasks: userId ? [] : sampleTasks(), pending: {} };
        if (
          !Array.isArray(stored.tasks) ||
          !stored.pending ||
          typeof stored.pending !== "object"
        )
          throw new Error("Invalid workspace");
        stored.tasks = stored.tasks.map(normalizeTask);
        localStorage.setItem(storageKey, JSON.stringify(stored));
        display(stored);
      } catch {
        setError(
          "Your saved workspace could not be read. Check that browser storage is enabled and try again.",
        );
        setLoading(false);
        return;
      }

      if (!userId) {
        setLoading(false);
        return;
      }
      setConnection("connecting");
      try {
        const queries = [
          {
            orderBy: JSON.stringify("ownerId"),
            equalTo: JSON.stringify(userId),
          },
        ];
        if (username)
          queries.push({
            orderBy: JSON.stringify("createdBy"),
            equalTo: JSON.stringify(username),
          });
        const results = await Promise.all(
          queries.map((params) =>
            axios.get(`${database}/todos.json`, {
              params,
              signal: controller.signal,
              timeout: 12000,
            }),
          ),
        );
        const records = Object.assign(
          {},
          ...results.map((result) => result.data || {}),
        );
        const remote = Object.entries(records)
          .filter(
            ([, task]) =>
              task &&
              (task.ownerId === userId ||
                (!task.ownerId && username && task.createdBy === username)),
          )
          .map(([id, task]) => normalizeTask({ ...task, id }));

        // Stable task IDs make partially completed sync attempts safe to replay.
        for (const [id, task] of Object.entries(stored.pending)) {
          await writeCloud(id, task, userId, username, controller.signal);
        }
        if (controller.signal.aborted) return;
        const merged = new Map(remote.map((task) => [task.id, task]));
        for (const [id, task] of Object.entries(stored.pending)) {
          if (task) merged.set(id, normalizeTask(task));
          else merged.delete(id);
        }
        const synced = { tasks: [...merged.values()], pending: {} };
        localStorage.setItem(storageKey, JSON.stringify(synced));
        display(synced);
        setConnection("cloud");
      } catch (err) {
        if (!controller.signal.aborted) {
          setConnection("offline");
          setWarning(
            err.response?.status === 423
              ? "The Firebase database is deactivated. Your account workspace is saved on this device. Restore Firebase to sync your changes."
              : "Cloud sync is unavailable. Your account workspace and changes are saved on this device. Retry when your connection is ready.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => {
      controller.abort();
      activeScope.current = null;
    };
  }, [userId, username, scope, storageKey, revision]);

  const save = useCallback(
    async (task, remove = false) => {
      if (lock.current || loading || error) return false;
      lock.current = true;
      setBusy(true);
      const id = task.id || crypto.randomUUID();
      const saved = normalizeTask({
        ...task,
        id,
        updatedAt: new Date().toISOString(),
      });
      const nextTasks = remove
        ? cache.current.tasks.filter((item) => item.id !== id)
        : [saved, ...cache.current.tasks.filter((item) => item.id !== id)];
      const pending = userId
        ? { ...cache.current.pending, [id]: remove ? null : saved }
        : {};
      const next = { tasks: nextTasks, pending };
      try {
        // Persist the queue before attempting the network so changes survive a closed tab.
        localStorage.setItem(storageKey, JSON.stringify(next));
        cache.current = next;
        setTasks(nextTasks);
        setPendingCount(Object.keys(pending).length);
        if (userId && connection === "cloud") {
          try {
            await writeCloud(id, remove ? null : saved, userId, username);
            if (activeScope.current !== scope) return saved;
            delete pending[id];
            localStorage.setItem(storageKey, JSON.stringify(next));
            setPendingCount(Object.keys(pending).length);
          } catch {
            if (activeScope.current !== scope) return saved;
            setConnection("offline");
            setWarning(
              "Your change is saved on this device. Cloud sync is unavailable. Retry to sync your pending changes.",
            );
          }
        }
        return saved;
      } catch {
        throw new Error(
          "Your change could not be saved to this browser. Check available storage and try again.",
        );
      } finally {
        lock.current = false;
        if (activeScope.current === scope) setBusy(false);
      }
    },
    [userId, username, scope, storageKey, connection, loading, error],
  );

  const reassignProject = useCallback(async (from, to) => {
    if (lock.current || loading || error) throw new Error("Wait for your workspace to finish saving.");
    lock.current = true;
    setBusy(true);
    try {
      const { data, changed } = reassignProjectTasks(
        cache.current, from, to, Boolean(userId), new Date().toISOString(),
      );
      localStorage.setItem(storageKey, JSON.stringify(data));
      cache.current = data;
      setTasks(data.tasks);
      setPendingCount(Object.keys(data.pending).length);
      if (userId && connection === "cloud") {
        try {
          for (const task of changed) {
            await writeCloud(task.id, task, userId, username);
            if (activeScope.current !== scope) return;
            delete data.pending[task.id];
            localStorage.setItem(storageKey, JSON.stringify(data));
            setPendingCount(Object.keys(data.pending).length);
          }
        } catch {
          if (activeScope.current === scope) {
            setConnection("offline");
            setWarning("Your project changes are saved on this device. Retry cloud sync to upload them.");
          }
        }
      }
    } finally {
      lock.current = false;
      if (activeScope.current === scope) setBusy(false);
    }
  }, [userId, username, scope, storageKey, connection, loading, error]);

  return {
    tasks,
    loading,
    busy,
    error,
    warning,
    connection,
    pendingCount,
    save,
    reassignProject,
    reload: () => {
      if (!lock.current) setRevision((value) => value + 1);
    },
  };
}
