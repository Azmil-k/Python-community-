"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to verify that the mentor manages the given pod
async function verifyPodOwnership(user, podId) {
  const managedPodIds = user.managedPods.map((p) => p.id);
  if (!podId || !managedPodIds.includes(podId)) {
    redirect("/");
  }
}

export async function assignExtraTask(podId, extraTaskId) {
  const user = await requireRole("MENTOR");
  await verifyPodOwnership(user, podId);

  if (!extraTaskId) {
    throw new Error("Missing extraTaskId");
  }

  // Verify extraTask exists
  const extraTask = await prisma.extraTask.findUnique({
    where: { id: extraTaskId },
  });
  if (!extraTask) {
    throw new Error("Extra task not found");
  }

  try {
    await prisma.assignedExtraTask.upsert({
      where: {
        podId_extraTaskId: {
          podId,
          extraTaskId,
        },
      },
      update: {},
      create: {
        podId,
        extraTaskId,
      },
    });
  } catch (error) {
    console.error("Failed to assign extra task:", error);
  }

  revalidatePath("/mentor/questions");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/progress");
}

export async function unassignExtraTask(podId, extraTaskId) {
  const user = await requireRole("MENTOR");
  await verifyPodOwnership(user, podId);

  if (!extraTaskId) {
    throw new Error("Missing extraTaskId");
  }

  try {
    await prisma.assignedExtraTask.delete({
      where: {
        podId_extraTaskId: {
          podId,
          extraTaskId,
        },
      },
    });
  } catch (error) {
    console.error("Failed to unassign extra task:", error);
  }

  revalidatePath("/mentor/questions");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/progress");
}

export async function createAndAssignExtraTask(podId, weekId, title, description) {
  const user = await requireRole("MENTOR");
  await verifyPodOwnership(user, podId);

  const titleClean = (title || "").toString().trim();
  const descClean = (description || "").toString().trim();

  if (!titleClean || !weekId) {
    throw new Error("Title and Week ID are required.");
  }

  if (titleClean.length > 100) {
    throw new Error("Title must be 100 characters or less.");
  }

  // Verify week exists
  const week = await prisma.week.findUnique({
    where: { id: weekId },
  });
  if (!week) {
    throw new Error("Week not found");
  }

  await prisma.$transaction(async (tx) => {
    const newTask = await tx.extraTask.create({
      data: {
        title: titleClean,
        description: descClean,
        weekId,
      },
    });

    await tx.assignedExtraTask.create({
      data: {
        podId,
        extraTaskId: newTask.id,
      },
    });
  });

  revalidatePath("/mentor/questions");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/progress");
}
