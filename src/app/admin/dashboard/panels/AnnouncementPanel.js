"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncement } from "../actions";

export default function AnnouncementPanel() {
  const router = useRouter();
  const [announcementError, setAnnouncementError] = useState("");

  async function handleCreateAnnouncement(formData) {
    setAnnouncementError("");
    const result = await createAnnouncement(formData);
    if (result?.error) {
      setAnnouncementError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="glass-panel">
      <h2>Post Announcement</h2>
      <form action={handleCreateAnnouncement} className="flex flex-col gap-4">
        <div>
          <label htmlFor="announcementText">Announcement</label>
          <textarea id="announcementText" name="text" rows="3" required placeholder="Share a message for the dashboard banner"></textarea>
        </div>
        <button type="submit" className="btn-secondary">Publish Announcement</button>
      </form>
      {announcementError ? <p style={{ color: "var(--danger-color)", marginTop: "0.75rem" }}>{announcementError}</p> : null}
    </div>
  );
}
