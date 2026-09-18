"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWeek, updateWeek } from "../actions";

export default function WeekManagementPanel({ weeks = [] }) {
  const router = useRouter();
  const today = new Date();
  const defaultDay = today.getDate();
  const defaultMonth = today.getMonth() + 1; // 1-12
  const defaultYear = today.getFullYear();

  const [createWeekError, setCreateWeekError] = useState("");
  const [weekErrors, setWeekErrors] = useState({});

  async function handleCreateWeek(formData) {
    setCreateWeekError("");
    const result = await createWeek(formData);
    if (result?.error) {
      setCreateWeekError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleUpdateWeek(weekId, formData) {
    setWeekErrors((current) => ({ ...current, [weekId]: "" }));
    const result = await updateWeek(weekId, formData);
    if (result?.error) {
      setWeekErrors((current) => ({ ...current, [weekId]: result.error }));
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="glass-panel">
        <h2>Post New Week</h2>
        <form action={handleCreateWeek} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label htmlFor="weekNumber">Week Number</label>
              <input id="weekNumber" type="number" name="weekNumber" required min="1" />
            </div>
            <div style={{ flex: 2 }}>
              <label htmlFor="targetModule">Target Module (FreeCodeCamp)</label>
              <input id="targetModule" type="text" name="targetModule" required placeholder="e.g. Basic Python Syntax" />
            </div>
          </div>
          <div>
            <label htmlFor="taskBrief">Task Brief</label>
            <textarea id="taskBrief" name="taskBrief" rows="3" required placeholder="Describe the end-of-week task"></textarea>
          </div>
          <div className="flex gap-4 items-center" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 450px" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Deadline</label>
              <div className="flex gap-2" style={{ flexWrap: "nowrap" }}>
                <select name="deadlineMonth" defaultValue={defaultMonth} style={{ flex: 2, background: "var(--bg-color)" }} required>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <select name="deadlineDay" defaultValue={defaultDay} style={{ flex: 1, background: "var(--bg-color)" }} required>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select name="deadlineYear" defaultValue={defaultYear} style={{ flex: 1.2, background: "var(--bg-color)" }} required>
                  <option value={defaultYear}>{defaultYear}</option>
                  <option value={defaultYear + 1}>{defaultYear + 1}</option>
                  <option value={defaultYear + 2}>{defaultYear + 2}</option>
                </select>
                <select name="deadlineHour" defaultValue="23" style={{ flex: 1, background: "var(--bg-color)" }} required>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                    const pad = h.toString().padStart(2, "0");
                    return <option key={h} value={h}>{pad}</option>;
                  })}
                </select>
                <span style={{ alignSelf: "center", fontWeight: "bold" }}>:</span>
                <select name="deadlineMinute" defaultValue="55" style={{ flex: 1, background: "var(--bg-color)" }} required>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => {
                    const pad = m.toString().padStart(2, "0");
                    return <option key={m} value={m}>{pad}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ flex: "1 1 200px", marginTop: "1.5rem" }}>
              <input type="checkbox" name="isActive" id="isActive" style={{ width: "auto" }} />
              <label htmlFor="isActive" style={{ marginBottom: 0 }}>Set as Active Week</label>
            </div>
            <div style={{ flex: "1 1 150px", marginTop: "1.5rem" }}>
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>Post Week</button>
            </div>
          </div>
          {createWeekError ? <p style={{ color: "var(--danger-color)", marginTop: "0.5rem" }}>{createWeekError}</p> : null}
        </form>
      </div>

      <PastWeeksSection weeks={weeks} onUpdateWeek={handleUpdateWeek} weekErrors={weekErrors} />
    </>
  );
}

function PastWeeksSection({ weeks, onUpdateWeek, weekErrors }) {
  return (
    <div className="glass-panel">
      <h2>Past Weeks</h2>
      <p className="text-muted">Below are all created weeks. Edit task briefs, deadlines, and active status as needed.</p>
      {weeks.length === 0 ? (
        <p className="text-muted" style={{ marginTop: "1rem" }}>No weeks have been created yet.</p>
      ) : (
        <div className="flex flex-col gap-4" style={{ marginTop: "1rem" }}>
          {weeks.map((week) => {
            const deadline = new Date(week.deadline || "");
            const safeDeadline = Number.isNaN(deadline.getTime()) ? new Date() : deadline;

            return (
              <div key={week.id} className="glass-panel" style={{ padding: "1rem" }}>
                <div className="flex justify-between items-center" style={{ flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Week {week.weekNumber}</h3>
                    <p className="text-muted" style={{ margin: "0.5rem 0 0" }}>{week.targetModule}</p>
                  </div>
                  <span style={{ padding: "0.35rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem", background: week.isActive ? "var(--success-color)" : "var(--border-color)", color: week.isActive ? "#fff" : "var(--text-secondary)" }}>
                    {week.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await onUpdateWeek(week.id, new FormData(event.currentTarget));
                  }}
                  className="flex flex-col gap-4"
                  style={{ marginTop: "1.25rem" }}
                >
                  <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor={"weekTaskBrief-" + week.id}>Task Brief</label>
                      <textarea
                        id={"weekTaskBrief-" + week.id}
                        name="taskBrief"
                        rows="3"
                        defaultValue={week.taskBrief}
                        required
                        placeholder="Describe the end-of-week task"
                      />
                    </div>
                    <div style={{ flex: "1 1 320px" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem" }}>Deadline</label>
                      <div className="flex gap-2" style={{ flexWrap: "nowrap" }}>
                        <select name="deadlineMonth" defaultValue={safeDeadline.getMonth() + 1} style={{ flex: 2, background: "var(--bg-color)" }} required>
                          <option value="1">January</option>
                          <option value="2">February</option>
                          <option value="3">March</option>
                          <option value="4">April</option>
                          <option value="5">May</option>
                          <option value="6">June</option>
                          <option value="7">July</option>
                          <option value="8">August</option>
                          <option value="9">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                        <select name="deadlineDay" defaultValue={safeDeadline.getDate()} style={{ flex: 1, background: "var(--bg-color)" }} required>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <select name="deadlineYear" defaultValue={safeDeadline.getFullYear()} style={{ flex: 1.2, background: "var(--bg-color)" }} required>
                          <option value={safeDeadline.getFullYear()}>{safeDeadline.getFullYear()}</option>
                          <option value={safeDeadline.getFullYear() + 1}>{safeDeadline.getFullYear() + 1}</option>
                          <option value={safeDeadline.getFullYear() + 2}>{safeDeadline.getFullYear() + 2}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center" style={{ flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px", marginTop: "1rem" }}>
                      <input type="checkbox" id={"weekIsActive-" + week.id} name="isActive" defaultChecked={week.isActive} style={{ width: "auto" }} />
                      <label htmlFor={"weekIsActive-" + week.id} style={{ marginBottom: 0, marginLeft: "0.5rem" }}>Set as Active Week</label>
                    </div>
                    <div style={{ flex: "1 1 150px", marginTop: "1.25rem" }}>
                      <button type="submit" className="btn-primary" style={{ width: "100%" }}>Update Week</button>
                    </div>
                  </div>
                  {weekErrors[week.id] ? <p style={{ color: "var(--danger-color)", marginTop: "0.5rem" }}>{weekErrors[week.id]}</p> : null}
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
