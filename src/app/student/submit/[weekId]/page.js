import { requireRole } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import SubmitForm from "./SubmitForm";
import { redirect } from "next/navigation";

export default async function SubmitPage({ params }) {
  const user = await requireRole("STUDENT");

  const resolvedParams = await params;
  const weekId = resolvedParams.weekId;
  const week = await prisma.week.findUnique({ where: { id: weekId } });

  if (!week) redirect("/student/dashboard");

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-slide-up" style={{ padding: "2rem", maxWidth: "600px" }}>
        <h1 style={{ textAlign: "center" }}>Submit Week {week.weekNumber}</h1>
        <p className="text-muted" style={{ textAlign: "center", marginBottom: "2rem" }}>
          {week.targetModule}
        </p>

        <div className="glass-panel">
          <SubmitForm weekId={weekId} />
        </div>
      </div>
    </div>
  );
}
