import { getUser } from "@/app/actions";
import Navbar from "@/components/Navbar";
import BadgeShelf from "@/components/ui/BadgeShelf";
import { prisma } from "@/lib/prisma";
import { getCurrentWeek } from "@/lib/weeks";
import Link from "next/link";
import { redirect } from "next/navigation";
import LeaderboardTabs from "./LeaderboardTabs";

export default async function LeaderboardPage({ searchParams }) {
  const user = await getUser();
  if (!user) redirect("/");

  const backUrl = user.role === "STUDENT"
    ? "/student/dashboard"
    : user.role === "MENTOR"
      ? "/mentor/review"
      : user.role === "ADMIN"
        ? "/admin/dashboard"
        : "/";

  const resolvedParams = await searchParams;
  const filter = resolvedParams.filter || "overall";
  const timeframe = resolvedParams.timeframe || "all-time";

  const activeWeek = await getCurrentWeek();

  const submissionFilter = timeframe === "this-week" && activeWeek
    ? { weekId: activeWeek.id, status: "COMPLETED" }
    : { status: "COMPLETED" };

  const whereClause = {
    role: "STUDENT",
    ...(filter === "pod" && user.podId ? { podId: user.podId } : {}),
  };

  const students = await prisma.user.findMany({
    where: whereClause,
    include: {
      pod: true,
      badges: true,
      _count: {
        select: {
          submissions: { where: submissionFilter },
        },
      },
    },
  });

  students.sort((a, b) => {
    if (timeframe === "this-week") {
      if (b._count.submissions !== a._count.submissions) {
        return b._count.submissions - a._count.submissions;
      }
      if (b.streak !== a.streak) return b.streak - a.streak;
      return a.name.localeCompare(b.name);
    } else {
      if (b.streak !== a.streak) return b.streak - a.streak;
      if (b._count.submissions !== a._count.submissions) {
        return b._count.submissions - a._count.submissions;
      }
      return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-slide-up" style={{ padding: "2rem", maxWidth: "900px" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href={backUrl} className="btn-secondary" style={{ whiteSpace: "nowrap" }}>← Back</Link>
            <h1 style={{ margin: 0 }}>Leaderboard</h1>
          </div>
          <LeaderboardTabs
            filter={filter}
            timeframe={timeframe}
            hasPod={Boolean(user.podId)}
          />
        </div>

        <div className="glass-panel">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-secondary)" }}>
                <th style={{ padding: "1rem", width: "50px" }}>Rank</th>
                <th style={{ padding: "1rem" }}>Student</th>
                <th style={{ padding: "1rem" }}>Pod</th>
                <th style={{ padding: "1rem", textAlign: "center" }}>Streak</th>
                <th style={{ padding: "1rem", textAlign: "center" }}>
                  {timeframe === "this-week" ? "This Week" : "Completed"}
                </th>
                <th style={{ padding: "1rem" }}>Badges</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr
                  key={student.id}
                  style={{
                    borderBottom: "1px solid rgba(240, 246, 252, 0.05)",
                    background: idx === 0 ? "rgba(210, 153, 34, 0.1)" : idx === 1 ? "rgba(192, 192, 192, 0.1)" : idx === 2 ? "rgba(205, 127, 50, 0.1)" : "transparent",
                  }}
                >
                  <td style={{ padding: "1rem", fontWeight: "bold", fontSize: "1.2rem", color: idx === 0 ? "#d29922" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : "inherit" }}>
                    #{idx + 1}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {student.name}
                    {user.id === student.id && <span className="status-badge" style={{ marginLeft: "0.5rem", background: "var(--accent-color)", color: "#fff", border: "none" }}>YOU</span>}
                  </td>
                  <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{student.pod?.name || "-"}</td>
                  <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold", color: "var(--accent-color)" }}>
                    {student.streak} 🔥
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>{student._count.submissions}</td>
                  <td style={{ padding: "1rem" }}>
                    <BadgeShelf badges={student.badges || []} />
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
