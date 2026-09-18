import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminClientPanel from "./AdminClientPanel";

export default async function AdminDashboard() {
  const user = await requireRole("ADMIN");

  const [weeks, pods, mentors, students, allUsers, completedSubmissionsCount, assignedTasksSummary] = await Promise.all([
    prisma.week.findMany({ orderBy: { weekNumber: "desc" } }),
    prisma.pod.findMany({ include: { mentor: true, students: true } }),
    prisma.user.findMany({ where: { role: "MENTOR" } }),
    prisma.user.findMany({ where: { role: "STUDENT" }, include: { pod: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, include: { pod: true } }),
    prisma.submission.count({ where: { status: "COMPLETED" } }),
    prisma.assignedExtraTask.findMany({
      include: {
        pod: true,
        extraTask: {
          include: {
            week: true,
          },
        },
      },
      orderBy: [
        {
          extraTask: {
            week: {
              weekNumber: "desc",
            },
          },
        },
        {
          pod: {
            name: "asc",
          },
        },
      ],
    }),
  ]);

  const denominator = students.length * weeks.length;
  const overallCompletionRate = denominator > 0 ? Math.round((completedSubmissionsCount / denominator) * 100) : 0;

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-fade-in" style={{ padding: "2rem" }}>
        <h1>Admin Dashboard</h1>
        <AdminClientPanel
          weeks={weeks}
          pods={pods}
          mentors={mentors}
          students={students}
          allUsers={allUsers}
          overallCompletionRate={overallCompletionRate}
          assignedTasksSummary={assignedTasksSummary}
        />
      </div>
    </div>
  );

}
