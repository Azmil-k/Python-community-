import { getUser } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentProfileView from "./StudentProfileView";

export default async function StudentProfilePage() {
  const user = await getUser();
  if (!user) redirect("/");

  if (user.role !== "STUDENT") {
    if (user.role === "MENTOR") redirect("/mentor/review");
    if (user.role === "ADMIN") redirect("/admin/dashboard");
    redirect("/");
  }

  const student = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      pod: { include: { mentor: true } },
      badges: { orderBy: { dateAwarded: "desc" } },
      submissions: { include: { week: true }, orderBy: { submittedAt: "desc" } },
      extraTaskSubmissions: { include: { extraTask: true }, orderBy: { submittedAt: "desc" } },
    },
  });

  if (!student) redirect("/");

  const weeks = await prisma.week.findMany({
    orderBy: { weekNumber: "asc" },
  });

  // Derived Activity Timeline (Priority 2 Item 4)
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

  return (
    <StudentProfileView
      currentUser={user}
      student={student}
      weeks={weeks}
      submissions={student.submissions}
      activity={activity}
      isEditable={true}
    />
  );
}
