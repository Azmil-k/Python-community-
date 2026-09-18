"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { updateSubmission, updateExtraTaskSubmission } from "./actions";
import Link from "next/link";

function isPdfUrl(url) {
  return typeof url === "string" && url.toLowerCase().endsWith(".pdf");
}

export default function MentorReviewTable({ 
  submissions, 
  students, 
  extraSubmissions = [], 
  assignedExtraTasks = [], 
  selectedPod, 
  selectedWeek 
}) {
  const tableData = students.map(student => {
    const sub = submissions.find(s => s.studentId === student.id);
    return { student, sub };
  });

  const extraTableData = [];
  assignedExtraTasks.forEach(task => {
    students.forEach(student => {
      const sub = extraSubmissions.find(s => s.studentId === student.id && s.extraTaskId === task.id);
      extraTableData.push({ student, task, sub });
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div>
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>Weekly Task Submissions</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Student</th>
              <th style={{ padding: '1rem' }}>Screenshot</th>
              <th style={{ padding: '1rem' }}>Task / Link</th>
              <th style={{ padding: '1rem', width: '150px' }}>Status</th>
              <th style={{ padding: '1rem' }}>Comment</th>
              <th style={{ padding: '1rem', width: '100px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length > 0 ? (
              tableData.map(row => (
                <ReviewTableRow 
                  key={row.student.id} 
                  row={row} 
                  selectedPod={selectedPod} 
                  selectedWeek={selectedWeek} 
                  updateAction={updateSubmission}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  <span style={{ fontSize: "1.8rem" }}>🎉</span>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>No students in this pod yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {assignedExtraTasks.length > 0 && (
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "2.5rem" }}>
          <h2 style={{ marginBottom: "1rem", color: "var(--accent-color)", fontSize: "1.5rem" }}>⭐ Bonus/Pod Questions Review</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Student</th>
                <th style={{ padding: '1rem' }}>Question</th>
                <th style={{ padding: '1rem' }}>Screenshot</th>
                <th style={{ padding: '1rem' }}>Answer / Link</th>
                <th style={{ padding: '1rem', width: '150px' }}>Status</th>
                <th style={{ padding: '1rem' }}>Comment</th>
                <th style={{ padding: '1rem', width: '100px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {extraTableData.map(row => (
                <ReviewTableRow 
                  key={`${row.student.id}-${row.task.id}`} 
                  row={row} 
                  selectedPod={selectedPod}
                  selectedWeek={selectedWeek}
                  isExtra={true}
                  updateAction={updateExtraTaskSubmission}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReviewTableRow({ row, selectedPod, selectedWeek, isExtra = false, updateAction }) {
  const { student, sub, task } = row;
  const [status, setStatus] = useState(sub?.status || "PENDING");
  const [comment, setComment] = useState(sub?.mentorComment || "");
  const [saving, setSaving] = useState(false);

  if (!sub) {
    return (
      <tr style={{ borderBottom: '1px solid rgba(240, 246, 252, 0.05)' }}>
        <td style={{ padding: '1rem', fontWeight: 600 }}>{student.name}</td>
        {isExtra && <td style={{ padding: '1rem', color: "var(--accent-color)" }}>{task.title}</td>}
        <td colSpan="5" className="text-muted" style={{ padding: '1rem', fontStyle: 'italic' }}>
          No submission yet.
        </td>
      </tr>
    );
  }

  const detailUrl = isExtra
    ? `/mentor/review/questions/${sub.id}?podId=${selectedPod.id}&weekId=${selectedWeek.id}`
    : `/mentor/review/${sub.id}?podId=${selectedPod.id}&weekId=${selectedWeek.id}`;

  const linkOrCode = isExtra ? sub.answerText : sub.taskLinkOrCode;

  async function handleSave() {
    setSaving(true);
    try {
      await updateAction(sub.id, status, comment);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr style={{ borderBottom: '1px solid rgba(240, 246, 252, 0.05)' }}>
      <td style={{ padding: '1rem', fontWeight: 600 }}>
        <Link href={`/student/profile/${student.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
          {student.name}
        </Link>
      </td>
      {isExtra && (
        <td style={{ padding: '1rem', color: "var(--accent-color)" }}>{task.title}</td>
      )}
      <td style={{ padding: '1rem' }}>
        {sub.screenshotUrl ? (
          isPdfUrl(sub.screenshotUrl) ? (
            <a href={sub.screenshotUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'inline-block', padding: '0.5rem 0.75rem' }}>
              Open PDF submission
            </a>
          ) : (
            <Link href={detailUrl} style={{ display: 'block', maxWidth: '100px' }}>
              <img src={sub.screenshotUrl} alt="Screenshot" style={{ width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            </Link>
          )
        ) : (
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>No screenshot</span>
        )}
      </td>
      <td style={{ padding: '1rem' }}>
        {linkOrCode && linkOrCode.startsWith('http') ? (
          <a href={linkOrCode} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>View Link</a>
        ) : (
          <pre style={{ maxWidth: '200px', maxHeight: '100px', overflow: 'auto', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px' }}>
            {linkOrCode}
          </pre>
        )}
      </td>
      <td style={{ padding: '1rem' }}>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '0.4rem', background: 'var(--bg-color)' }}>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="INCOMPLETE">Incomplete</option>
        </select>
      </td>
      <td style={{ padding: '1rem' }}>
        <textarea 
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          placeholder="Feedback..."
          rows="2"
          style={{ padding: '0.4rem', minHeight: '60px' }}
        ></textarea>
      </td>
      <td style={{ padding: '1rem' }}>
        {isExtra ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={handleSave} disabled={saving} className={status === "COMPLETED" ? "btn-primary" : "btn-secondary"} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: '100%' }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <Link href={detailUrl} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', textAlign: 'center', display: 'block', textTransform: 'none' }}>
              Open
            </Link>
          </div>
        ) : (
          <button onClick={handleSave} disabled={saving} className={status === "COMPLETED" ? "btn-primary" : "btn-secondary"} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: '100%' }}>
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </td>
    </tr>
  );
}
