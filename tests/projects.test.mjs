import test from "node:test";
import assert from "node:assert/strict";
import { readProjects, validateProjectName, reassignProjectTasks } from "../src/lib/projects.js";

const storage = (entries) => ({ getItem: (key) => entries[key] ?? null });

test("existing custom projects migrate with the initial project names", () => {
  const names = readProjects(storage({ "tasky-projects-user-v1": '["Study", "Personal"]' }), "user");
  assert.deepEqual(names, ["Website redesign", "Product launch", "Personal", "Study"]);
});

test("an edited empty catalog stays empty after reopening the workspace", () => {
  const names = readProjects(storage({ "tasky-projects-user-v2": "[]" }), "user");
  assert.deepEqual(names, []);
});

test("names reject blank, reserved, oversized, and duplicate options", () => {
  for (const value of [" ", "inbox", "REPORTS", "a".repeat(61), "study"])
    assert.throws(() => validateProjectName(value, ["Study"]));
  assert.equal(validateProjectName("  Reading  ", ["Study"]), "Reading");
  assert.equal(validateProjectName("STUDY", ["Study"], "Study"), "STUDY");
});

test("renaming updates all matching tasks and preserves other queued changes", () => {
  const first = { id: "a", project: "Study", title: "Read", status: "Done", subtasks: [{ id: "s", done: true }] };
  const second = { id: "b", project: "Personal", title: "Walk" };
  const third = { id: "c", project: "Study", title: "Practice" };
  const input = { tasks: [first, second, third], pending: { a: first, deleted: null } };
  const result = reassignProjectTasks(input, "Study", "Learning", true, "now");
  assert.equal(result.changed.length, 2);
  assert.deepEqual(result.data.tasks.map((task) => task.project), ["Learning", "Personal", "Learning"]);
  assert.equal(result.data.tasks[0].status, "Done");
  assert.deepEqual(result.data.tasks[0].subtasks, first.subtasks);
  assert.equal(result.data.tasks[1], second);
  assert.equal(result.data.pending.a.project, "Learning");
  assert.equal(result.data.pending.c.updatedAt, "now");
  assert.equal(result.data.pending.deleted, null);
  assert.equal(input.tasks[0].project, "Study");
  assert.equal(input.pending.a.project, "Study");
});

test("removing a project moves its tasks to Inbox without deleting them", () => {
  const input = { tasks: [{ id: "a", project: "Study", description: "Keep this" }], pending: {} };
  const { data } = reassignProjectTasks(input, "Study", "Inbox", true, "now");
  assert.equal(data.tasks.length, 1);
  assert.equal(data.tasks[0].id, "a");
  assert.equal(data.tasks[0].project, "Inbox");
  assert.equal(data.tasks[0].description, "Keep this");
  assert.equal(data.pending.a.project, "Inbox");
});

test("local project edits do not create a cloud queue", () => {
  const input = { tasks: [{ id: "a", project: "Study" }], pending: {} };
  const { data } = reassignProjectTasks(input, "Study", "Reading", false, "now");
  assert.equal(data.tasks[0].project, "Reading");
  assert.deepEqual(data.pending, {});
});
