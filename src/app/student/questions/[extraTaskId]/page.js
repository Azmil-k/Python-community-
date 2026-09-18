import { requireRole } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import AnswerForm from "./AnswerForm";
import { redirect } from "next/navigation";

export default async function ExtraTaskAnswerPage({ params }) {
  const user = await requireRole("STUDENT");

  const resolvedParams = await params;
  const extraTaskId = resolvedParams.extraTaskId;

  const extraTask = await prisma.extraTask.findUnique({
    where: { id: extraTaskId },
    include: {
      week: true,
      assignments: true,
    },
  });

  if (!extraTask) {
    redirect("/student/dashboard");
  }

  // Verify the task is assigned to the student's pod
  const isAssigned = extraTask.assignments.some(
    (assignment) => assignment.podId === user.podId
  );
  if (!isAssigned) {
    redirect("/student/dashboard");
  }

  // Load existing submission if any
  const submission = await prisma.extraTaskSubmission.findUnique({
    where: {
      studentId_extraTaskId: {
        studentId: user.id,
        extraTaskId,
      },
    },
  });

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-slide-up" style={{ padding: "2rem", maxWidth: "600px" }}>
        <h1 style={{ textAlign: "center" }}>Week {extraTask.week.weekNumber} Bonus Question</h1>
        <p className="text-muted" style={{ textAlign: "center", marginBottom: "2rem" }}>
          Module: {extraTask.week.targetModule}
        </p>

        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "var(--accent-color)", marginTop: 0 }}>{extraTask.title}</h3>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: "0.5rem", color: "var(--text-primary)" }}>
            {extraTask.description}
          </p>
        </div>

        <div className="glass-panel">
          <AnswerForm extraTaskId={extraTaskId} initialSubmission={submission} />
        </div>
      </div>
    </div>
  );
}
