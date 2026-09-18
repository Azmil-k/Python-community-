"use client";
import { useState } from "react";

export default function ReviewDetailForm({ submissionId, initialStatus, initialComment, updateAction }) {
  const [status, setStatus] = useState(initialStatus);
  const [comment, setComment] = useState(initialComment || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateAction(submissionId, status, comment);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4" style={{ marginTop: "1rem" }}>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Grade/Status</label>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)} 
          style={{ width: "100%", padding: "0.75rem", background: "var(--bg-color)" }}
        >
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="INCOMPLETE">Incomplete</option>
        </select>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Feedback/Comment</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Write feedback for the student..."
          rows="4"
          style={{ width: "100%", padding: "0.75rem" }}
        ></textarea>
      </div>

      <div className="flex items-center justify-between" style={{ gap: "1rem" }}>
        <button 
          type="submit" 
          disabled={saving} 
          className={status === "COMPLETED" ? "btn-primary" : "btn-secondary"} 
          style={{ flex: 1, padding: "0.75rem" }}
        >
          {saving ? "Saving..." : "Save Grade"}
        </button>
      </div>
      {success && (
        <p style={{ color: "var(--success-color)", fontSize: "0.9rem", fontWeight: 600 }}>
          Grade saved successfully!
        </p>
      )}
    </form>
  );
}
