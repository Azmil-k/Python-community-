"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyMentorOwnsStudent } from "@/lib/podAuthorization";
import { isValidStatus } from "@/lib/validators";

export async function updateSubmission(submissionId, status, comment) {
  const user = await requireRole("MENTOR");

  if (!isValidStatus(status)) {
    return { error: "Invalid status specified." };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true },
  });

  if (!submission) return;

  const isOwner = await verifyMentorOwnsStudent(user, submission.student);
  if (!isOwner) {
    redirect("/");
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status, mentorComment: comment },
  });

  const streakDelta = status === "COMPLETED" && submission.status !== "COMPLETED"
    ? 1
    : status !== "COMPLETED" && submission.status === "COMPLETED"
      ? -1
      : 0;

  if (streakDelta !== 0) {
    const nextStreak = Math.max(0, submission.student.streak + streakDelta);
    await prisma.user.update({
      where: { id: submission.studentId },
      data: { streak: nextStreak },
    });
  }

  revalidatePath("/mentor/review");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/progress");
  revalidatePath("/leaderboard");
}

export async function updateExtraTaskSubmission(submissionId, status, comment) {
  const user = await requireRole("MENTOR");

  if (!isValidStatus(status)) {
    return { error: "Invalid status specified." };
  }

  const submission = await prisma.extraTaskSubmission.findUnique({
    where: { id: submissionId },
    include: { student: true },
  });

  if (!submission) return;

  const isOwner = await verifyMentorOwnsStudent(user, submission.student);
  if (!isOwner) {
    redirect("/");
  }

  await prisma.extraTaskSubmission.update({
    where: { id: submissionId },
    data: { status, mentorComment: comment },
  });

  revalidatePath("/mentor/review");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/progress");
}
