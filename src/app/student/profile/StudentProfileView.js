import Navbar from "@/components/Navbar";
import BadgeShelf from "@/components/ui/BadgeShelf";
import Link from "next/link";
import BioForm from "./BioForm";

export default function StudentProfileView({ 
  currentUser, 
  student, 
  weeks = [], 
  submissions = [], 
  activity = [], 
  isEditable = false,
  backUrl 
}) {
  const completedCount = submissions.filter((s) => s.status === "COMPLETED").length;
  const podName = student.pod?.name || "Not assigned";
  const mentorName = student.pod?.mentor?.name || "Unassigned";
  const joinedDate = student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "N/A";

  const defaultBackUrl = currentUser.role === "STUDENT" 
    ? "/student/dashboard" 
    : currentUser.role === "MENTOR" 
      ? "/mentor/review" 
      : "/admin/dashboard";

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={currentUser} />
      <div className="container animate-slide-up" style={{ padding: "2rem", maxWidth: "900px" }}>
        
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href={backUrl || defaultBackUrl} className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            ← Back
          </Link>
        </div>

        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Header & Stats */}
          <div className="flex justify-between items-start" style={{ flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{student.name}</h1>
              <p style={{ color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>{student.email}</p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                <div><strong>Pod:</strong> {podName}</div>
                <div><strong>Mentor:</strong> {mentorName}</div>
                <div><strong>Joined:</strong> {joinedDate}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "100px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--accent-color)" }}>{student.streak} 🔥</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "0.25rem" }}>Streak</div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center", minWidth: "100px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{completedCount}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "0.25rem" }}>Completed</div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>About / Bio</h3>
            {isEditable ? (
              <BioForm initialBio={student.bio} />
            ) : (
              <p style={{ color: student.bio ? "var(--text-primary)" : "var(--text-secondary)", fontStyle: student.bio ? "normal" : "italic", marginTop: "0.75rem" }}>
                {student.bio || "No bio provided."}
              </p>
            )}
          </div>

          {/* Badges Section */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>Earned Badges</h3>
            <BadgeShelf badges={student.badges || []} />
          </div>

          {/* Weekly Progress List */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>Weekly Progress</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {weeks.map((week) => {
                const sub = submissions.find((s) => s.weekId === week.id);
                const status = sub ? sub.status : "NOT_SUBMITTED";
                const statusBg = status === "COMPLETED" 
                  ? "var(--success-color)" 
                  : status === "PENDING" 
                    ? "#d29922" 
                    : status === "INCOMPLETE" 
                      ? "#f85149" 
                      : "rgba(240, 246, 252, 0.1)";

                return (
                  <div 
                    key={week.id} 
                    style={{ 
                      display: "flex", 
                      justify: "space-between", 
                      alignItems: "center", 
                      padding: "0.75rem 1rem", 
                      background: "rgba(255, 255, 255, 0.02)", 
                      border: "1px solid var(--border-color)", 
                      borderRadius: "var(--radius-md)" 
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Week {week.weekNumber}: {week.targetModule}</strong>
                      {sub && (
                        <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                          Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span 
                      style={{ 
                        padding: "0.25rem 0.6rem", 
                        borderRadius: "12px", 
                        fontSize: "0.75rem", 
                        fontWeight: 600, 
                        background: statusBg, 
                        color: "#fff" 
                      }}
                    >
                      {status === "NOT_SUBMITTED" ? "Not Submitted" : status}
                    </span>
                  </div>
                );
              })}
              {weeks.length === 0 && (
                <p className="text-muted" style={{ fontStyle: "italic" }}>No weekly modules created yet.</p>
              )}
            </div>
          </div>

          {/* Recent Activity Timeline (Priority 2 Item 4) */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>Recent Activity</h3>
            {activity.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {activity.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-color)", marginTop: "0.4rem" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{item.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", background: "rgba(0, 0, 0, 0.15)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)" }}>
                <span style={{ fontSize: "1.8rem" }}>📋</span>
                <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
                  No recent activity logged yet. Completed tasks and awarded badges will appear here.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
