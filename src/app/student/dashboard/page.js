import { requireRole } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import AnnouncementBanner from "@/components/ui/AnnouncementBanner";
import BadgeShelf from "@/components/ui/BadgeShelf";
import { prisma } from "@/lib/prisma";
import { getCurrentWeek } from "@/lib/weeks";
import Link from "next/link";

export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");

  // Get current active week with fallback
  const activeWeek = await getCurrentWeek();

  // Get student's submission for active week
  let submission = null;
  if (activeWeek) {
    submission = await prisma.submission.findFirst({
      where: {
        weekId: activeWeek.id,
        studentId: user.id,
      },
    });
  }

  // Fetch all weeks & all student submissions for progress/recommendation calculations
  const allWeeks = await prisma.week.findMany({
    orderBy: { weekNumber: "asc" },
  });

  const allStudentSubmissions = await prisma.submission.findMany({
    where: { studentId: user.id },
  });

  const submittedWeekIds = new Set(allStudentSubmissions.map((s) => s.weekId));
  const completedCount = allStudentSubmissions.filter((s) => s.status === "COMPLETED").length;
  const totalWeeks = allWeeks.length;
  const completionPercentage = totalWeeks > 0 ? Math.round((completedCount / totalWeeks) * 100) : 0;

  // Recommended next task: earliest week not yet submitted by student
  const recommendedNextWeek = allWeeks.find((w) => !submittedWeekIds.has(w.id));

  // Latest announcement preview
  const latestAnnouncement = await prisma.announcement.findFirst({
    orderBy: { createdAt: "desc" },
  });

  // Fetch badges
  const badges = await prisma.badge.findMany({
    where: { studentId: user.id },
    orderBy: { dateAwarded: "desc" },
  });

  // Fetch assigned extra tasks for student's pod
  let assignedExtraTasks = [];
  let extraTaskSubmissions = [];
  if (activeWeek && user.podId) {
    const assignments = await prisma.assignedExtraTask.findMany({
      where: {
        podId: user.podId,
        extraTask: {
          weekId: activeWeek.id,
        },
      },
      include: {
        extraTask: true,
      },
    });
    assignedExtraTasks = assignments.map((a) => a.extraTask);

    if (assignedExtraTasks.length > 0) {
      extraTaskSubmissions = await prisma.extraTaskSubmission.findMany({
        where: {
          studentId: user.id,
          extraTaskId: { in: assignedExtraTasks.map((t) => t.id) },
        },
      });
    }
  }

  const extraSubmissionsMap = new Map(
    extraTaskSubmissions.map((s) => [s.extraTaskId, s])
  );

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <AnnouncementBanner />
      <div className="container animate-fade-in" style={{ padding: "2rem" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "2rem" }}>
          <h1>Student Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/student/profile" className="btn-secondary">My Profile</Link>
            <Link href="/student/progress" className="btn-secondary">My Progress</Link>
            <Link href="/leaderboard" className="btn-secondary">Leaderboard</Link>
          </div>
        </div>

        {/* Dashboard Overview Panel (Completion %, Recommended Next Task, Announcement Preview) */}
        <div className="flex gap-6" style={{ marginBottom: "2rem", flexWrap: "wrap" }}>
          {/* Completion Progress Bar */}
          <div className="glass-panel" style={{ flex: "1 1 260px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)" }}>Module Completion</h3>
            <div style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0", color: "var(--accent-color)" }}>
              {completionPercentage}%
            </div>
            <div style={{ width: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
              <div style={{ width: `${completionPercentage}%`, background: "var(--accent-color)", height: "100%", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
              {completedCount} of {totalWeeks} modules completed
            </div>
          </div>

          {/* Recommended Next Task */}
          <div className="glass-panel" style={{ flex: "1 1 300px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)" }}>Recommended Next Task</h3>
            {recommendedNextWeek ? (
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                  Week {recommendedNextWeek.weekNumber}: {recommendedNextWeek.targetModule}
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <Link href={`/student/submit/${recommendedNextWeek.id}`} className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
                    Start / Submit Week {recommendedNextWeek.weekNumber} →
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "0.75rem", color: "var(--success-color)", fontWeight: 600, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🎉</span> You&apos;re all caught up!
              </div>
            )}
          </div>

          {/* Latest Announcement Preview */}
          {latestAnnouncement && (
            <div className="glass-panel" style={{ flex: "1 1 300px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)" }}>Latest Announcement</h3>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", lineHeight: 1.5, color: "var(--text-primary)" }}>
                {latestAnnouncement.text}
              </p>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Posted {new Date(latestAnnouncement.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {activeWeek ? (
          <div className="glass-panel" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "var(--accent-color)" }}></div>
            <div className="flex justify-between items-center">
              <div>
                <h2 style={{ margin: 0, color: "var(--accent-color)" }}>Week {activeWeek.weekNumber} Target</h2>
                <div className="text-muted" style={{ marginTop: "0.5rem", fontWeight: 500 }}>
                  Due: {new Date(activeWeek.deadline).toLocaleDateString()} at {new Date(activeWeek.deadline).toLocaleTimeString()}
                </div>
              </div>

              {submission ? (
                <div style={{ textAlign: "right" }}>
                  <div className={`status-badge status-${submission.status.toLowerCase()}`} style={{ fontSize: "0.9rem", padding: "0.4rem 0.8rem" }}>
                    {submission.status}
                  </div>
                  <div className="text-muted" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                     Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <Link href={`/student/submit/${activeWeek.id}`} className="btn-primary animate-pulse" style={{ padding: "0.75rem 2rem" }}>Submit Task</Link>
              )}
            </div>

            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-sm)" }}>
              <h3>FreeCodeCamp Module</h3>
              <p style={{ fontSize: "1.1rem" }}>{activeWeek.targetModule}</p>

              <h3 style={{ marginTop: "1.5rem" }}>End of Week Task</h3>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{activeWeek.taskBrief}</p>
            </div>

            {/* Pod-specific Extra/Bonus tasks */}
            {assignedExtraTasks.length > 0 && (
              <div style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(210, 153, 34, 0.08)", borderLeft: "4px solid var(--accent-color)", borderRadius: "var(--radius-sm)" }}>
                <h3 style={{ color: "var(--accent-color)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                  ⭐ Bonus/Pod Question(s)
                </h3>
                <div className="flex flex-col gap-4" style={{ marginTop: "1rem" }}>
                  {assignedExtraTasks.map((task) => {
                    const sub = extraSubmissionsMap.get(task.id);
                    return (
                      <div key={task.id} style={{ background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                        <div className="flex justify-between items-start gap-4">
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0 }}>{task.title}</h4>
                            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{task.description}</p>
                          </div>
                          
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                            {sub ? (
                              <>
                                <div className={`status-badge status-${sub.status.toLowerCase()}`} style={{ fontSize: "0.85rem", padding: "0.3rem 0.6rem" }}>
                                  {sub.status}
                                </div>
                                <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                                  Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                                </div>
                                <Link href={`/student/questions/${task.id}`} className="btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}>
                                  Update Answer
                                </Link>
                              </>
                            ) : (
                              <Link href={`/student/questions/${task.id}`} className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
                                Answer Question
                              </Link>
                            )}
                          </div>
                        </div>

                        {sub && sub.mentorComment && (
                          <div style={{ marginTop: "1rem", padding: "0.75rem", borderLeft: "3px solid var(--success-color)", background: "rgba(35, 134, 54, 0.1)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}>
                            <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Mentor Feedback:</h4>
                            <p style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>{sub.mentorComment}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {submission && submission.mentorComment && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", borderLeft: "3px solid var(--success-color)", background: "rgba(35, 134, 54, 0.1)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}>
                <h4>Mentor Feedback:</h4>
                <p style={{ marginTop: "0.5rem" }}>{submission.mentorComment}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel text-center" style={{ padding: "4rem 2rem" }}>
            <h2>No Active Week</h2>
            <p className="text-muted">Hang tight! The admin hasn&apos;t posted this week&apos;s target yet.</p>
          </div>
        )}

        {/* Badges Section */}
        <div className="glass-panel" style={{ marginTop: "2rem" }}>
          <h3>My Badges</h3>
          <div style={{ marginTop: "0.75rem" }}>
            <BadgeShelf badges={badges} />
          </div>
        </div>
      </div>
    </div>
  );
}
