import { getUser } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { verifyMentorOwnsStudent } from "@/lib/podAuthorization";
import { redirect } from "next/navigation";
import StudentProfileView from "../StudentProfileView";

export default async function ViewStudentProfilePage({ params }) {
  const user = await getUser();
  if (!user) redirect("/");

  const resolvedParams = await params;
  const studentId = resolvedParams.studentId;

  if (user.id === studentId && user.role === "STUDENT") {
    redirect("/student/profile");
  }

  if (user.role === "STUDENT") {
    redirect("/student/dashboard");
  }

  if (user.role === "MENTOR") {
    const mentorUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { managedPods: true },
    });
    const isOwner = await verifyMentorOwnsStudent(mentorUser, studentId);
    if (!isOwner) {
      redirect("/mentor/review");
    }
  } else if (user.role !== "ADMIN") {
    redirect("/");
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      pod: { include: { mentor: true } },
      badges: { orderBy: { dateAwarded: "desc" } },
      submissions: { include: { week: true }, orderBy: { submittedAt: "desc" } },
      extraTaskSubmissions: { include: { extraTask: true }, orderBy: { submittedAt: "desc" } },
    },
  });

  if (!student) {
    const back = user.role === "MENTOR" ? "/mentor/review" : "/admin/dashboard";
    redirect(back);
  }

  const weeks = await prisma.week.findMany({
    orderBy: { weekNumber: "asc" },
  });

  const activity = [
    ...student.submissions.map((sub) => ({
      date: sub.submittedAt,
      title: `Submitted Week ${sub.week.weekNumber} (${sub.week.targetModule})`,
    })),
    ...student.extraTaskSubmissions.map((es) => ({
      date: es.submittedAt,
      title: `Answered bonus question: ${es.extraTask.title}`,
    })),
    ...student.badges.map((b) => ({
      date: b.dateAwarded,
      title: `Earned "${b.name}" badge`,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  const backUrl = user.role === "MENTOR" ? "/mentor/review" : "/admin/dashboard";

  return (
    <StudentProfileView
      currentUser={user}
      student={student}
      weeks={weeks}
      submissions={student.submissions}
      activity={activity}
      isEditable={false}
      backUrl={backUrl}
    />
  );
}
