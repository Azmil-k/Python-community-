"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPod, assignStudentToPod } from "../actions";

export default function PodManagementPanel({ pods = [], mentors = [], students = [] }) {
  const router = useRouter();
  const [createPodError, setCreatePodError] = useState("");
  const [assignPodError, setAssignPodError] = useState("");

  async function handleCreatePod(formData) {
    setCreatePodError("");
    const result = await createPod(formData);
    if (result?.error) {
      setCreatePodError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleAssignStudentToPod(formData) {
    setAssignPodError("");
    const result = await assignStudentToPod(formData);
    if (result?.error) {
      setAssignPodError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-6" style={{ flexWrap: "wrap" }}>
      <div className="glass-panel" style={{ flex: "1 1 300px" }}>
        <h2>Manage Pods</h2>
        <form action={handleCreatePod} className="flex flex-col gap-4">
          <div>
            <label htmlFor="podName">Pod Name</label>
            <input id="podName" type="text" name="name" required placeholder="e.g. Alpha Pod" />
          </div>
          <div>
            <label htmlFor="mentorId">Assign Mentor</label>
            <select id="mentorId" name="mentorId">
              <option value="">-- No Mentor --</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">Create Pod</button>
        </form>
        {createPodError ? <p style={{ color: "var(--danger-color)", marginTop: "0.75rem" }}>{createPodError}</p> : null}

        <div style={{ marginTop: "2rem" }}>
          <h3>Existing Pods</h3>
          {pods.length === 0 ? <p className="text-muted">No pods yet.</p> : (
            <ul className="flex flex-col gap-2">
              {pods.map((pod) => (
                <li key={pod.id} style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-sm)" }}>
                  <strong>{pod.name}</strong> - Mentor: {pod.mentor?.name || "None"}
                  <div className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    {pod.students.length} Students
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ flex: "1 1 300px" }}>
        <h2>Assign Students</h2>
        <form action={handleAssignStudentToPod} className="flex flex-col gap-4">
          <div>
            <label htmlFor="studentSelect">Student</label>
            <select id="studentSelect" name="studentId" required>
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="podSelect">Assign to Pod</label>
            <select id="podSelect" name="podId">
              <option value="">-- No Pod --</option>
              {pods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary">Update Assignment</button>
        </form>
        {assignPodError ? <p style={{ color: "var(--danger-color)", marginTop: "0.75rem" }}>{assignPodError}</p> : null}

        <div style={{ marginTop: "2rem" }}>
          <h3>Student List</h3>
          <ul className="flex flex-col gap-2">
            {students.map((s) => (
              <li key={s.id} style={{ padding: "0.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between" }}>
                <Link href={`/student/profile/${s.id}`} style={{ color: "var(--text-primary)", fontWeight: 500 }}>{s.name}</Link>
                <span className="text-muted">{s.pod?.name || "Unassigned"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
