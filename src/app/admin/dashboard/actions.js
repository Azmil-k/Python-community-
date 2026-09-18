"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidRole } from "@/lib/validators";
import { generateRandomPassword } from "@/lib/passwordGeneration";

export async function createUser(formData) {
  await requireRole("ADMIN");

  const email = formData.get("email")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString().toUpperCase() || "STUDENT";
  if (!isValidRole(role)) {
    return { error: "Invalid role specified." };
  }

  if (!email || !name || !password) {
    return { error: "Email, name, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword,
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return { error: "A user with that email already exists." };
    }
    throw error;
  }

  revalidatePath("/admin/dashboard");
}

export async function adminResetPassword(targetUserId) {
  await requireRole("ADMIN");

  if (!targetUserId || typeof targetUserId !== "string") {
    return { error: "Target user ID is required." };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    return { error: "User not found." };
  }

  const newPassword = generateRandomPassword();
  if (newPassword.length < 8) {
    return { error: "Generated password does not meet minimum length requirement." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: targetUserId },
    data: { password: hashedPassword },
  });

  revalidatePath("/admin/dashboard");

  return { success: true, newPassword };
}


export async function createWeek(formData) {
  await requireRole("ADMIN");
  const isActive = formData.get("isActive") === "on";

  if (isActive) {
    await prisma.week.updateMany({ data: { isActive: false } });
  }

  const dayStr = formData.get("deadlineDay");
  const monthStr = formData.get("deadlineMonth");
  const yearStr = formData.get("deadlineYear");
  const hourStr = formData.get("deadlineHour");
  const minuteStr = formData.get("deadlineMinute");

  if (!dayStr || !monthStr || !yearStr || !hourStr || !minuteStr) {
    return { error: "Invalid deadline components." };
  }

  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const year = parseInt(yearStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year) || Number.isNaN(hour) || Number.isNaN(minute)) {
    return { error: "Invalid deadline components." };
  }

  const deadline = new Date(year, month - 1, day, hour, minute);
  const weekNumber = parseInt(formData.get("weekNumber"), 10);
  const targetModule = formData.get("targetModule")?.toString().trim();
  const taskBrief = formData.get("taskBrief")?.toString().trim();

  if (Number.isNaN(weekNumber) || !targetModule || !taskBrief) {
    return { error: "Week number, target module, and task brief are required." };
  }

  try {
    await prisma.week.create({
      data: {
        weekNumber,
        targetModule,
        taskBrief,
        deadline,
        isActive,
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return { error: "A week with that number already exists." };
    }
    throw error;
  }

  revalidatePath("/admin/dashboard");
}

export async function updateWeek(weekId, formData) {
  await requireRole("ADMIN");
  const isActive = formData.get("isActive") === "on";

  if (isActive) {
    await prisma.week.updateMany({ data: { isActive: false } });
  }

  const dayStr = formData.get("deadlineDay");
  const monthStr = formData.get("deadlineMonth");
  const yearStr = formData.get("deadlineYear");
  const hourStr = formData.get("deadlineHour");
  const minuteStr = formData.get("deadlineMinute");

  if (!dayStr || !monthStr || !yearStr || !hourStr || !minuteStr) {
    return { error: "Invalid deadline components." };
  }

  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year) || Number.isNaN(hour) || Number.isNaN(minute)) {
    return { error: "Invalid deadline components." };
  }

  const deadline = new Date(year, month - 1, day, hour, minute);
  const taskBrief = formData.get("taskBrief")?.toString().trim();

  if (!taskBrief) {
    return { error: "Task brief is required." };
  }

  try {
    await prisma.week.update({
      where: { id: weekId },
      data: {
        taskBrief,
        deadline,
        isActive,
      },
    });
  } catch (error) {
    if (error?.code === "P2025") {
      return { error: "The week could not be updated." };
    }
    throw error;
  }

  revalidatePath("/admin/dashboard");
}

export async function createPod(formData) {
  await requireRole("ADMIN");
  const name = formData.get("name")?.toString().trim();
  const mentorId = formData.get("mentorId")?.toString();

  if (!name) {
    return { error: "Pod name is required." };
  }

  await prisma.pod.create({
    data: {
      name,
      mentorId: mentorId || null,
    },
  });
  revalidatePath("/admin/dashboard");
}

export async function assignStudentToPod(formData) {
  await requireRole("ADMIN");
  const studentId = formData.get("studentId")?.toString();
  const podId = formData.get("podId")?.toString();

  if (!studentId) {
    return { error: "Student selection is required." };
  }

  await prisma.user.update({
    where: { id: studentId },
    data: { podId: podId || null },
  });
  revalidatePath("/admin/dashboard");
}

export async function createAnnouncement(formData) {
  await requireRole("ADMIN");
  const text = formData.get("text")?.toString().trim();

  if (!text) {
    return { error: "Announcement text is required." };
  }

  await prisma.announcement.create({ data: { text } });
  revalidatePath("/admin/dashboard");
  revalidatePath("/student/dashboard");
}

export async function awardBadge(formData) {
  await requireRole("ADMIN");
  const studentId = formData.get("studentId")?.toString();
  const badgeName = formData.get("badgeName")?.toString().trim();

  if (!studentId || !badgeName) {
    return { error: "Student and badge name are required." };
  }

  try {
    await prisma.badge.create({
      data: {
        studentId,
        name: badgeName,
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return { error: "This badge has already been awarded to this student." };
    }
    throw error;
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/student/dashboard");
  revalidatePath("/leaderboard");
}
