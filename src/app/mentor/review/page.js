import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MentorReviewTable from "./MentorReviewTable";
import Link from "next/link";

export default async function MentorReviewPage({ searchParams }) {
  const user = await requireRole("MENTOR");

  const resolvedSearchParams = await searchParams;
  const weekId = resolvedSearchParams.weekId;
  const podId = resolvedSearchParams.podId;

  const pods = await prisma.pod.findMany({
    where: { mentorId: user.id },
    include: {
      students: {
        where: { role: "STUDENT" },
      },
    },
  });

  const weeks = await prisma.week.findMany({ orderBy: { weekNumber: "desc" } });

  if (pods.length === 0) {
    return (
      <div className="flex-col" style={{ flex: 1 }}>
        <Navbar user={user} />
        <div className="container text-center" style={{ padding: "4rem 2rem" }}>
          <h2>No Pod Assigned</h2>
          <p className="text-muted">Please contact an admin to assign you to a pod.</p>
        </div>
      </div>
    );
  }

  // Calculate mentor-facing stats across all managed pods (Priority 3 Item 6)
  const allManagedStudents = pods.flatMap((p) => p.students);
  const allManagedStudentIds = allManagedStudents.map((s) => s.id);

  const pendingWeeklyCount = await prisma.submission.count({
    where: {
      studentId: { in: allManagedStudentIds },
      status: "PENDING",
    },
  });

  const pendingExtraCount = await prisma.extraTaskSubmission.count({
    where: {
      studentId: { in: allManagedStudentIds },
      status: "PENDING",
    },
  });

  const totalPendingReviews = pendingWeeklyCount + pendingExtraCount;

  /*
   * At-Risk Student Definition:
   * A student is defined as "at risk" if they have not submitted a task for the currently active week
   * (or the most recent week if no week is explicitly set to active).
   */
  const currentTargetWeek = weeks.find((w) => w.isActive) || weeks[0];
  let atRiskCount = 0;
  if (currentTargetWeek && allManagedStudentIds.length > 0) {
    const currentWeekSubmissions = await prisma.submission.findMany({
      where: {
        weekId: currentTargetWeek.id,
        studentId: { in: allManagedStudentIds },
      },
      select: { studentId: true },
    });
    const submittedIds = new Set(currentWeekSubmissions.map((s) => s.studentId));
    atRiskCount = allManagedStudentIds.filter((id) => !submittedIds.has(id)).length;
  }

  const selectedPod = pods.find((p) => p.id === podId) || pods[0];

  let selectedWeek = null;
  if (weekId) {
    selectedWeek = weeks.find((w) => w.id === weekId);
  } else {
    selectedWeek = weeks.find((w) => w.isActive) || weeks[0];
  }

  let submissions = [];
  let extraSubmissions = [];
  let assignedExtraTasks = [];
  if (selectedWeek && selectedPod) {
    submissions = await prisma.submission.findMany({
      where: {
        weekId: selectedWeek.id,
        studentId: { in: selectedPod.students.map((s) => s.id) },
      },
      include: { student: true },
    });

    const assignments = await prisma.assignedExtraTask.findMany({
      where: {
        podId: selectedPod.id,
        extraTask: {
          weekId: selectedWeek.id,
        },
      },
      include: {
        extraTask: true,
      },
    });
    assignedExtraTasks = assignments.map((a) => a.extraTask);

    if (assignedExtraTasks.length > 0) {
      extraSubmissions = await prisma.extraTaskSubmission.findMany({
        where: {
          extraTaskId: { in: assignedExtraTasks.map((t) => t.id) },
          studentId: { in: selectedPod.students.map((s) => s.id) },
        },
        include: {
          student: true,
          extraTask: true,
        },
      });
    }
  }

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <h1>Review: {selectedPod.name}</h1>
          <div className="flex gap-4">
            <Link href="/mentor/questions" className="btn-primary">Manage Pod Questions</Link>
            <Link href="/leaderboard" className="btn-secondary">View Leaderboard</Link>
          </div>
        </div>

        {/* Mentor Overview Stats Bar (Priority 3 Item 6) */}
        <div className="flex gap-6" style={{ marginBottom: "2rem", flexWrap: "wrap" }}>
          <div className="glass-panel" style={{ flex: "1 1 200px" }}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Managed Students</h3>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.4rem" }}>
              {allManagedStudents.length}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Across {pods.length} pod{pods.length > 1 ? "s" : ""}
            </div>
          </div>

          <div className="glass-panel" style={{ flex: "1 1 200px" }}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Pending Reviews</h3>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.4rem", color: totalPendingReviews > 0 ? "var(--accent-color)" : "inherit" }}>
              {totalPendingReviews}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Awaiting evaluation
            </div>
          </div>

          <div className="glass-panel" style={{ flex: "1 1 200px" }}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>At-Risk Students</h3>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.4rem", color: atRiskCount > 0 ? "#f85149" : "var(--success-color)" }}>
              {atRiskCount}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Unsubmitted for current week
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <form className="flex items-center gap-4 flex-wrap">
            {pods.length > 1 && (
              <div className="flex items-center gap-2">
                <label style={{ fontWeight: 600 }}>Switch Pod:</label>
                <select name="podId" defaultValue={selectedPod?.id || ""} style={{ width: "auto", background: "var(--bg-color)" }}>
                  {pods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label style={{ fontWeight: 600 }}>Filter by Week:</label>
              <select name="weekId" defaultValue={selectedWeek?.id || ""} style={{ width: "auto", background: "var(--bg-color)" }}>
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    Week {w.weekNumber}: {w.targetModule} {w.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>
            
            <button type="submit" className="btn-secondary" style={{ padding: "0.4rem 1.5rem" }}>Filter</button>
          </form>
        </div>

        {selectedWeek && selectedPod && (
          <div className="glass-panel" style={{ overflowX: "auto" }}>
            <MentorReviewTable 
              submissions={submissions} 
              students={selectedPod.students} 
              extraSubmissions={extraSubmissions}
              assignedExtraTasks={assignedExtraTasks}
              selectedPod={selectedPod}
              selectedWeek={selectedWeek}
            />
          </div>
        )}
      </div>
    </div>
  );
}
