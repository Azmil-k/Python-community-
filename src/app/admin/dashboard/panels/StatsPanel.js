"use client";

export default function StatsPanel({ totalStudents, totalMentors, totalPods, overallCompletionRate }) {
  return (
    <div className="flex gap-6" style={{ flexWrap: "wrap", marginBottom: "1rem" }}>
      <div className="glass-panel" style={{ flex: "1 1 200px" }}>
        <h3 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Total Students</h3>
        <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.4rem", color: "var(--accent-color)" }}>
          {totalStudents}
        </div>
      </div>

      <div className="glass-panel" style={{ flex: "1 1 200px" }}>
        <h3 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Total Mentors</h3>
        <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.4rem" }}>
          {totalMentors}
        </div>
      </div>

      <div className="glass-panel" style={{ flex: "1 1 200px" }}>
        <h3 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Total Pods</h3>
        <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.4rem" }}>
          {totalPods}
        </div>
      </div>

      <div className="glass-panel" style={{ flex: "1 1 200px" }}>
        <h3 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Overall Completion Rate</h3>
        <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.4rem", color: "var(--success-color)" }}>
          {overallCompletionRate}%
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Completed / (students × weeks)
        </div>
      </div>
    </div>
  );
}
