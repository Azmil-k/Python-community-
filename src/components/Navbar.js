"use client";

import { logout } from "@/app/actions";
import Link from "next/link";
import { useState } from "react";

export default function Navbar({ user }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error(err);
      setLoggingOut(false);
    }
  }

  return (
    <nav style={{ padding: '1rem 2rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
        <Link href="/">Python Weekly</Link>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-muted">Logged in as {user.name} ({user.role})</span>
          {user.role === "STUDENT" && (
            <Link href="/student/profile" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Profile
            </Link>
          )}
          <Link href="/settings" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            Settings
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn-secondary"
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', opacity: loggingOut ? 0.7 : 1 }}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </nav>
  );
}
