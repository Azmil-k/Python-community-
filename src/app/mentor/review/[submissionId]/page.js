/* eslint-disable @next/next/no-img-element */
import { requireRole } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReviewDetailForm from "@/app/mentor/review/ReviewDetailForm";
import { updateSubmission } from "../actions";
import { verifyMentorOwnsStudent } from "@/lib/podAuthorization";

export default async function SubmissionDetailPage({ params, searchParams }) {
  const user = await requireRole("MENTOR");

  const resolvedParams = await params;
  const submissionId = resolvedParams.submissionId;

  const resolvedSearchParams = await searchParams;
  const podId = resolvedSearchParams.podId;
  const weekId = resolvedSearchParams.weekId;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
      week: true,
    },
  });

  if (!submission) {
    redirect("/mentor/review");
  }

  // Verify ownership
  const student = submission.student;
  const isOwner = await verifyMentorOwnsStudent(user, student);
  if (!isOwner) {
    redirect("/mentor/review");
  }

  // Back link URL
  let backUrl = "/mentor/review";
  if (podId && weekId) {
    backUrl = `/mentor/review?podId=${podId}&weekId=${weekId}`;
  }

  const isPdfSubmission = submission.screenshotUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-slide-up" style={{ padding: "2rem", maxWidth: "800px" }}>
        
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href={backUrl} className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            ← Back to Review
          </Link>
        </div>

        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="flex justify-between items-start" style={{ flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0 }}>Review Submission</h2>
              <div className="text-muted" style={{ marginTop: "0.5rem" }}>
                Student: <strong>{student.name}</strong> ({student.email})
              </div>
              <div className="text-muted" style={{ marginTop: "0.25rem" }}>
                Module: <strong>Week {submission.week.weekNumber} - {submission.week.targetModule}</strong>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                Submitted: {new Date(submission.submittedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <h3>Task Details</h3>
            <div style={{ marginTop: "0.5rem" }}>
              {submission.taskLinkOrCode.startsWith("http") ? (
                <a href={submission.taskLinkOrCode} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: "inline-block", padding: "0.5rem 1rem" }}>
                  Open Link
                </a>
              ) : (
                <pre style={{ whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "4px", fontSize: "0.9rem" }}>
                  {submission.taskLinkOrCode}
                </pre>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <h3>Screenshot</h3>
            <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
            {isPdfSubmission ? (
              <div>
                <a href={submission.screenshotUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: "inline-block", marginBottom: "1rem" }}>
                  Open PDF submission
                </a>
                <iframe
                  src={submission.screenshotUrl}
                  style={{ width: "100%", minHeight: "600px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}
                />
              </div>
            ) : (
              <img 
                src={submission.screenshotUrl} 
                alt="Student Submission Screenshot" 
                style={{ 
                  maxWidth: "100%", 
                  height: "auto", 
                  borderRadius: "var(--radius-md)", 
                  border: "1px solid var(--border-color)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)"
                }} 
              />
            )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <h3>Mentor Evaluation</h3>
            <ReviewDetailForm 
              submissionId={submission.id} 
              initialStatus={submission.status} 
              initialComment={submission.mentorComment} 
              updateAction={updateSubmission}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
