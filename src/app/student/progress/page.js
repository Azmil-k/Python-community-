import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ProgressPage() {
  const user = await requireRole("STUDENT");

  const weeks = await prisma.week.findMany({ orderBy: { weekNumber: "asc" } });
  const submissions = await prisma.submission.findMany({
    where: { studentId: user.id },
  });

  // Fetch assigned extra tasks for this student's pod
  const assignedAssignments = user.podId
    ? await prisma.assignedExtraTask.findMany({
        where: { podId: user.podId },
        include: { extraTask: true },
      })
    : [];
  const assignedExtraTasks = assignedAssignments.map((a) => a.extraTask);

  const subMap = {};
  submissions.forEach((s) => {
    subMap[s.weekId] = s;
  });

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-fade-in" style={{ padding: "2rem" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "2rem" }}>
          <h1>My Progress</h1>
          <Link href="/student/dashboard" className="btn-secondary">Back to Dashboard</Link>
        </div>

        <div className="glass-panel" style={{ marginBottom: "2rem", display: "flex", gap: "2rem" }}>
          <div>
            <div className="text-muted" style={{ textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>Current Streak</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--accent-color)" }}>{user.streak} <span style={{ fontSize: "1.2rem" }}>🔥</span></div>
          </div>
          <div>
            <div className="text-muted" style={{ textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>Weeks Completed</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--success-color)" }}>
              {submissions.filter((s) => s.status === "COMPLETED").length} / {weeks.length}
            </div>
          </div>
        </div>

        <h2>Week by Week</h2>
        <div className="flex flex-col gap-4">
          {weeks.map((week) => {
            const sub = subMap[week.id];

            let statusClass = "status-incomplete";
            let statusText = "Missed";
            let borderStyle = "4px solid var(--danger-color)";

            if (sub) {
              if (sub.status === "COMPLETED") {
                statusClass = "status-completed";
                statusText = "Completed";
                borderStyle = "4px solid var(--success-color)";
              } else if (sub.status === "PENDING") {
                statusClass = "status-pending";
                statusText = "Pending Review";
                borderStyle = "4px solid #d29922";
              } else {
                statusClass = "status-incomplete";
                statusText = "Incomplete";
                borderStyle = "4px solid var(--danger-color)";
              }
            } else if (new Date(week.deadline) > new Date()) {
              statusClass = "";
              statusText = "Upcoming";
              borderStyle = "4px solid var(--border-color)";
            }

            const weekExtraTasks = assignedExtraTasks.filter((t) => t.weekId === week.id);

            return (
              <div key={week.id} className="glass-panel flex justify-between items-center" style={{ padding: "1rem 1.5rem", borderLeft: borderStyle }}>
                <div>
                  <h3 style={{ margin: 0 }}>Week {week.weekNumber}: {week.targetModule}</h3>
                  {sub && (
                    <div className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                    </div>
                  )}
                  {sub && sub.mentorComment && (
                    <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", borderLeft: "3px solid var(--success-color)", background: "rgba(35, 134, 54, 0.1)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0", fontSize: "0.85rem" }}>
                      <strong>Mentor Feedback:</strong> {sub.mentorComment}
                    </div>
                  )}
                  {weekExtraTasks.length > 0 && (
                    <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {weekExtraTasks.map((task) => (
                        <span key={task.id} className="status-badge" style={{ fontSize: "0.75rem", background: "rgba(210,153,34,0.08)", border: "1px solid var(--accent-color)", color: "var(--accent-color)", textTransform: "none" }}>
                          ⭐ {task.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`status-badge ${statusClass}`}>{statusText}</div>
              </div>
            );
          })}

          {weeks.length === 0 && <p className="text-muted">No weeks have been posted yet.</p>}
        </div>
      </div>
    </div>
  );
}
