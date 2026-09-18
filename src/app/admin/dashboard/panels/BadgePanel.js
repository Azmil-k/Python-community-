"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { awardBadge } from "../actions";

export default function BadgePanel({ students = [] }) {
  const router = useRouter();
  const [awardBadgeError, setAwardBadgeError] = useState("");

  async function handleAwardBadge(formData) {
    setAwardBadgeError("");
    const result = await awardBadge(formData);
    if (result?.error) {
      setAwardBadgeError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="glass-panel">
      <h2>Award Badge</h2>
      <form action={handleAwardBadge} className="flex flex-col gap-4">
        <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label htmlFor="studentId">Student</label>
            <select id="studentId" name="studentId" required>
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <label htmlFor="badgeName">Badge Name</label>
            <input id="badgeName" type="text" name="badgeName" required placeholder="e.g. Weekly Hero" />
          </div>
        </div>
        <button type="submit" className="btn-primary">Award Badge</button>
      </form>
      {awardBadgeError ? <p style={{ color: "var(--danger-color)", marginTop: "0.75rem" }}>{awardBadgeError}</p> : null}
    </div>
  );
}
