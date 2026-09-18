import { getLatestAnnouncement } from "@/app/actions";

export default async function AnnouncementBanner() {
  const announcement = await getLatestAnnouncement();

  return (
    <div className="glass-panel mb-4 p-4 text-center">
      <h2 className="text-lg font-semibold">📢 Announcement</h2>
      <p className="text-muted">
        {announcement?.text || "Welcome to the Python Community! Stay tuned for updates."}
      </p>
    </div>
  );
}
