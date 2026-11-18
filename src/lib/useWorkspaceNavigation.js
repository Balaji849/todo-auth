import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { defaultPagePreferences, pageFromPath, pagePath } from "./navigation";

export default function useWorkspaceNavigation() {
  const { pathname } = useLocation();
  const routerNavigate = useNavigate();
  const page = pageFromPath(pathname);
  const [preferences, setPreferences] = useState({});
  const current = { ...defaultPagePreferences(page), ...preferences[pathname] };

  function setPreference(key, value) {
    setPreferences((previous) => {
      const saved = { ...defaultPagePreferences(page), ...previous[pathname] };
      return {
        ...previous,
        [pathname]: {
          ...saved,
          [key]: typeof value === "function" ? value(saved[key]) : value,
        },
      };
    });
  }

  function navigate(next, overrides) {
    const path = pagePath(next);
    if (overrides) {
      setPreferences((previous) => ({
        ...previous,
        [path]: {
          ...defaultPagePreferences(next),
          ...previous[path],
          ...overrides,
        },
      }));
    }
    routerNavigate(path);
  }

  return {
    page,
    pathname,
    navigate,
    ...current,
    setQuery: (value) => setPreference("query", value),
    setPriority: (value) => setPreference("priority", value),
    setStatus: (value) => setPreference("status", value),
    setSort: (value) => setPreference("sort", value),
    setView: (value) => setPreference("view", value),
    setMonth: (value) => setPreference("month", value),
  };
}
