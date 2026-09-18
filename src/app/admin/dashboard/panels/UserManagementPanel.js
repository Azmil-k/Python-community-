"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, adminResetPassword } from "../actions";

export default function UserManagementPanel({ users = [] }) {
  const router = useRouter();
  const [createUserError, setCreateUserError] = useState("");
  const [confirmingUser, setConfirmingUser] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [resetResult, setResetResult] = useState(null); // { userId, userName, userEmail, newPassword } or { error }
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleCreateUser(formData) {
    setCreateUserError("");
    const result = await createUser(formData);
    if (result?.error) {
      setCreateUserError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleConfirmReset(targetUser) {
    setResettingId(targetUser.id);
    setResetResult(null);
    setCopied(false);

    try {
      const res = await adminResetPassword(targetUser.id);
      if (res?.error) {
        setResetResult({ error: res.error });
      } else if (res?.success && res?.newPassword) {
        setResetResult({
          userId: targetUser.id,
          userName: targetUser.name,
          userEmail: targetUser.email,
          newPassword: res.newPassword,
        });
      }
    } catch (err) {
      console.error(err);
      setResetResult({ error: "Failed to reset password." });
    } finally {
      setResettingId(null);
      setConfirmingUser(null);
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-panel flex flex-col gap-6">
      <div>
        <h2>Create User</h2>
        <form action={handleCreateUser} className="flex flex-col gap-4">
          <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px" }}>
              <label htmlFor="name">Name</label>
              <input id="name" type="text" name="name" required placeholder="e.g. Jane Doe" />
            </div>
            <div style={{ flex: "1 1 220px" }}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" required placeholder="e.g. student@example.com" />
            </div>
          </div>
          <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px" }}>
              <label htmlFor="role">Role</label>
              <select id="role" name="role" defaultValue="STUDENT">
                <option value="STUDENT">Student</option>
                <option value="MENTOR">Mentor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ flex: "1 1 220px" }}>
              <label htmlFor="password">Temporary Password</label>
              <input id="password" type="password" name="password" required minLength={8} placeholder="Min 8 characters" />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start" }}>Create User</button>
        </form>
        {createUserError ? <p style={{ color: "var(--danger-color)", marginTop: "0.75rem" }}>{createUserError}</p> : null}
      </div>

      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
        <div className="flex justify-between items-center" style={{ flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <h2>User Accounts ({users.length})</h2>
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "260px", padding: "0.4rem 0.8rem", fontSize: "0.9rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Generated Password Result Banner */}
        {resetResult?.newPassword && (
          <div
            style={{
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid var(--success-color)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <h3 style={{ color: "var(--success-color)", margin: "0 0 0.5rem 0", fontSize: "1.05rem" }}>
              🔑 Password Reset Successful for {resetResult.userName} ({resetResult.userEmail})
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 0.75rem 0" }}>
              Copy this password and send it to the user directly — <strong>it will not be shown again</strong>.
            </p>
            <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
              <input
                type="text"
                readOnly
                value={resetResult.newPassword}
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.1rem",
                  padding: "0.5rem 0.75rem",
                  fontWeight: "bold",
                  background: "var(--bg-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  flex: "1 1 250px",
                }}
              />
              <button
                type="button"
                onClick={() => handleCopy(resetResult.newPassword)}
                className="btn-secondary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                {copied ? "Copied! ✓" : "Copy Password"}
              </button>
              <button
                type="button"
                onClick={() => setResetResult(null)}
                className="btn-secondary"
                style={{ padding: "0.5rem 0.8rem", fontSize: "0.85rem" }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {resetResult?.error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid var(--danger-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--danger-color)",
            }}
          >
            {resetResult.error}
          </div>
        )}

        {/* Confirmation Banner */}
        {confirmingUser && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              background: "rgba(234, 179, 8, 0.1)",
              border: "1px solid #eab308",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p style={{ margin: "0 0 0.75rem 0", fontWeight: 500 }}>
              ⚠️ Confirm Password Reset for <strong>{confirmingUser.name}</strong> ({confirmingUser.email})?
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 0.75rem 0" }}>
              Their current password will be invalidated immediately and replaced with a new generated password.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={resettingId === confirmingUser.id}
                onClick={() => handleConfirmReset(confirmingUser)}
                className="btn-primary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", background: "var(--danger-color)" }}
              >
                {resettingId === confirmingUser.id ? "Resetting..." : "Confirm Reset"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingUser(null)}
                className="btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* User Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                <th style={{ padding: "0.75rem" }}>Name</th>
                <th style={{ padding: "0.75rem" }}>Email</th>
                <th style={{ padding: "0.75rem" }}>Role</th>
                <th style={{ padding: "0.75rem" }}>Pod</th>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "1.5rem", textAlign: "center" }} className="text-muted">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{u.email}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          background: u.role === "ADMIN" ? "rgba(168, 85, 247, 0.2)" : u.role === "MENTOR" ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.1)",
                          color: u.role === "ADMIN" ? "#c084fc" : u.role === "MENTOR" ? "#60a5fa" : "var(--text-secondary)",
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      {u.pod?.name || "-"}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => { setConfirmingUser(u); setResetResult(null); }}
                        className="btn-secondary"
                        style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
