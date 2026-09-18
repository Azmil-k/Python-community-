"use client";

import { useState } from "react";
import { changePassword } from "@/app/actions";

export default function SettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setSaving(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ maxWidth: "450px" }}>
      <div>
        <label htmlFor="currentPassword" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
          Current Password
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
          style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-primary)" }}
        />
      </div>

      <div>
        <label htmlFor="newPassword" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-primary)" }}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-primary)" }}
        />
      </div>

      {error ? <p style={{ color: "var(--danger-color)", margin: "0.25rem 0 0 0" }}>{error}</p> : null}
      {success ? <p style={{ color: "var(--success-color)", margin: "0.25rem 0 0 0" }}>{success}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary"
        style={{ marginTop: "0.5rem", padding: "0.6rem 1.2rem", alignSelf: "flex-start", opacity: saving ? 0.7 : 1 }}
      >
        {saving ? "Changing Password..." : "Change Password"}
      </button>
    </form>
  );
}
