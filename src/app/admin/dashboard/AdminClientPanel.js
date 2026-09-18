"use client";

import UserManagementPanel from "./panels/UserManagementPanel";
import WeekManagementPanel from "./panels/WeekManagementPanel";
import PodManagementPanel from "./panels/PodManagementPanel";
import AnnouncementPanel from "./panels/AnnouncementPanel";
import BadgePanel from "./panels/BadgePanel";
import StatsPanel from "./panels/StatsPanel";

export default function AdminClientPanel({ 
  weeks, 
  pods, 
  mentors, 
  students, 
  allUsers = [],
  overallCompletionRate = 0, 
  assignedTasksSummary = [] 
}) {
  return (
    <div className="flex flex-col gap-6">
      <StatsPanel
        totalStudents={students.length}
        totalMentors={mentors.length}
        totalPods={pods.length}
        overallCompletionRate={overallCompletionRate}
      />

      <WeekManagementPanel weeks={weeks} />
      <UserManagementPanel users={allUsers} />

      <AnnouncementPanel />
      <BadgePanel students={students} />
      <PodManagementPanel pods={pods} mentors={mentors} students={students} />

      <div className="glass-panel" style={{ marginTop: "2rem" }}>
        <h2>Pod Questions Audit (Read-Only)</h2>
        {assignedTasksSummary.length === 0 ? (
          <p className="text-muted" style={{ fontStyle: "italic", marginTop: "1rem" }}>No extra/bonus questions assigned to any pods yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "0.75rem" }}>Week</th>
                  <th style={{ padding: "0.75rem" }}>Pod</th>
                  <th style={{ padding: "0.75rem" }}>Extra Task Title</th>
                  <th style={{ padding: "0.75rem" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {assignedTasksSummary.map((assignment) => (
                  <tr key={assignment.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>Week {assignment.extraTask.week.weekNumber}</td>
                    <td style={{ padding: "0.75rem" }}>{assignment.pod.name}</td>
                    <td style={{ padding: "0.75rem", color: "var(--accent-color)" }}>{assignment.extraTask.title}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{assignment.extraTask.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
