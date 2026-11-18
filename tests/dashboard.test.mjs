import test from "node:test";
import assert from "node:assert/strict";
import { activitySeries } from "../src/lib/dashboard.js";
const now = new Date(2026, 10, 16, 12);
test("weekly activity uses the selected Monday to Sunday range", () => {
  const points = activitySeries([], "This Week", now);
  assert.equal(points.length, 7);
  assert.equal(points[0].key, "2026-11-16");
  assert.equal(points[6].key, "2026-11-22");
});
test("monthly activity covers the entire month and excludes other months", () => {
  const tasks = [
    { createdAt: new Date(2026, 10, 1, 12).getTime() },
    { createdAt: new Date(2026, 9, 31, 12).getTime() },
  ];
  const points = activitySeries(tasks, "This Month", now);
  assert.equal(points.length, 30);
  assert.equal(points[0].created, 1);
  assert.equal(
    points.reduce((total, point) => total + point.created, 0),
    1,
  );
});
test("created and completed counts use their event dates, independent of due dates", () => {
  const tasks = [
    {
      createdAt: new Date(2026, 10, 16, 10).getTime(),
      completedAt: new Date(2026, 10, 17, 10).toISOString(),
      dueDate: "2027-01-01",
    },
  ];
  const points = activitySeries(tasks, "This Week", now);
  assert.equal(points[0].created, 1);
  assert.equal(points[0].completed, 0);
  assert.equal(points[1].completed, 1);
});
test("today includes only today and does not count missing timestamps", () => {
  const points = activitySeries(
    [
      { createdAt: now.getTime() },
      { createdAt: new Date(2026, 10, 15, 12).getTime() },
      {},
    ],
    "Today",
    now,
  );
  assert.equal(points.length, 1);
  assert.equal(points[0].created, 1);
  assert.equal(points[0].completed, 0);
});
