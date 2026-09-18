import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { assignExtraTask, unassignExtraTask, createAndAssignExtraTask } from "./actions";

export default async function MentorQuestionsPage({ searchParams }) {
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

  const selectedPod = pods.find((p) => p.id === podId) || pods[0];

  let selectedWeek = null;
  if (weekId) {
    selectedWeek = weeks.find((w) => w.id === weekId);
  } else {
    selectedWeek = weeks.find((w) => w.isActive) || weeks[0];
  }

  let assignedTasks = [];
  let availableTasks = [];

  if (selectedWeek && selectedPod) {
    const assignedAssignments = await prisma.assignedExtraTask.findMany({
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
    assignedTasks = assignedAssignments.map((a) => a.extraTask);

    const allExtraTasks = await prisma.extraTask.findMany({
      where: {
        weekId: selectedWeek.id,
      },
    });

    const assignedIds = new Set(assignedTasks.map((t) => t.id));
    availableTasks = allExtraTasks.filter((t) => !assignedIds.has(t.id));
  }

  async function handleCreate(formData) {
    "use server";
    const title = formData.get("title");
    const description = formData.get("description");
    await createAndAssignExtraTask(selectedPod.id, selectedWeek.id, title, description);
  }

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>Pod Questions</h1>
            <p className="text-muted">Assign custom questions to {selectedPod.name} for Week {selectedWeek?.weekNumber}</p>
          </div>
          <Link href="/mentor/review" className="btn-secondary">Back to Review</Link>
        </div>

        {/* Pod and Week Filter Switchers */}
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
          <div className="grid gap-6" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))" }}>
            
            {/* Column 1: Currently Assigned Tasks */}
            <div className="flex flex-col gap-6">
              <div className="glass-panel" style={{ flex: 1 }}>
                <h2>Assigned Questions ({assignedTasks.length})</h2>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  These questions are visible to students in {selectedPod.name} for this week.
                </p>

                {assignedTasks.length === 0 ? (
                  <div className="text-center text-muted" style={{ padding: "2rem 0", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-sm)" }}>
                    No extra questions assigned to this pod yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {assignedTasks.map((task) => (
                      <div key={task.id} style={{ padding: "1rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                        <div className="flex justify-between items-start gap-4" style={{ display: "flex", justifyContent: "space-between" }}>
                          <div>
                            <strong style={{ display: "block", color: "var(--accent-color)" }}>{task.title}</strong>
                            <p style={{ fontSize: "0.9rem", margin: "0.5rem 0 0 0", whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{task.description}</p>
                          </div>
                          <form action={unassignExtraTask.bind(null, selectedPod.id, task.id)}>
                            <button type="submit" className="btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "var(--danger-color)" }}>
                              Unassign
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Available existing questions and Create form */}
            <div className="flex flex-col gap-6">
              {/* Existing Tasks */}
              <div className="glass-panel">
                <h2>Assign Existing Questions</h2>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  Reuse questions created by other mentors or pods for Week {selectedWeek.weekNumber}.
                </p>

                {availableTasks.length === 0 ? (
                  <div className="text-center text-muted" style={{ padding: "1.5rem 0", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}>
                    No other questions available for this week.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4" style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem" }}>
                    {availableTasks.map((task) => (
                      <div key={task.id} style={{ padding: "1rem", background: "rgba(0, 0, 0, 0.2)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="flex justify-between items-start gap-4" style={{ display: "flex", justifyContent: "space-between" }}>
                          <div>
                            <strong style={{ display: "block" }}>{task.title}</strong>
                            <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0", color: "var(--text-secondary)" }}>{task.description}</p>
                          </div>
                          <form action={assignExtraTask.bind(null, selectedPod.id, task.id)}>
                            <button type="submit" className="btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}>
                              Assign
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create and auto-assign Form */}
              <div className="glass-panel">
                <h2>Create & Assign Question</h2>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  Create a new question specific to this week, which will be auto-assigned to {selectedPod.name}.
                </p>

                <form action={handleCreate} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="title" style={{ display: "block", marginBottom: "0.25rem" }}>Question Title</label>
                    <input id="title" type="text" name="title" required placeholder="e.g. Reverse a Linked List" style={{ width: "100%" }} />
                  </div>

                  <div>
                    <label htmlFor="description" style={{ display: "block", marginBottom: "0.25rem" }}>Description</label>
                    <textarea id="description" name="description" rows="3" placeholder="Explain the problem and instructions..." style={{ width: "100%" }}></textarea>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: "100%" }}>Create & Assign</button>
                </form>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
